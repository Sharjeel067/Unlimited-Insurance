import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Phone, Clock, AlertCircle, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { format, isToday, isAfter, subDays } from "date-fns";
import { useRouter } from "next/router";
import { getContrastTextColor } from "@/lib/utils";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  state: string;
  created_at: string;
  last_contacted_at: string | null;
  stage_id: string | null;
  stages?: { name: string; color_code: string };
  lead_value: number;
}

interface MyLeadsWidgetProps {
  userId: string;
}

export function MyLeadsWidget({ userId }: MyLeadsWidgetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [categorizedLeads, setCategorizedLeads] = useState({
    new: [] as Lead[],
    followUpsToday: [] as Lead[],
    callbacks: [] as Lead[],
    hot: [] as Lead[],
    stale: [] as Lead[]
  });

  useEffect(() => {
    fetchLeads();
  }, [userId]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          stages:stage_id ( name, color_code )
        `)
        .eq("assigned_agent_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const leadsData = data as any;
        setLeads(leadsData);

        const today = new Date();
        const sevenDaysAgo = subDays(today, 7);

        const newLeads = leadsData.filter((lead: Lead) => !lead.last_contacted_at);
        const followUpsToday = leadsData.filter((lead: Lead) => {
          if (!lead.last_contacted_at) return false;
          const lastContact = new Date(lead.last_contacted_at);
          return isToday(lastContact);
        });
        const leadIds = leadsData.map((l: Lead) => l.id);
        const { data: callbackResults } = leadIds.length > 0
          ? await supabase
              .from("call_results")
              .select("lead_id")
              .in("lead_id", leadIds)
              .eq("is_callback", true)
          : { data: [] };
        
        const callbackLeadIds = callbackResults?.map((r: any) => r.lead_id) || [];
        const callbacks = leadsData.filter((lead: Lead) => callbackLeadIds.includes(lead.id));
        const hotLeads = leadsData.filter((lead: Lead) => lead.lead_value > 0);
        const staleLeads = leadsData.filter((lead: Lead) => {
          if (!lead.last_contacted_at) {
            const created = new Date(lead.created_at);
            return created < sevenDaysAgo;
          }
          const lastContact = new Date(lead.last_contacted_at);
          return lastContact < sevenDaysAgo;
        });

        setCategorizedLeads({
          new: newLeads,
          followUpsToday,
          callbacks,
          hot: hotLeads,
          stale: staleLeads
        });
      }
    } catch (error: any) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderLeadCard = (lead: Lead) => (
    <div
      key={lead.id}
      onClick={() => router.push(`/leadDetail?id=${lead.id}`)}
      className="p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {lead.first_name} {lead.last_name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{lead.phone_number}</span>
          </div>
          {lead.stages && (
            <span
              className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: lead.stages.color_code,
                color: getContrastTextColor(lead.stages.color_code)
              }}
            >
              {lead.stages.name}
            </span>
          )}
        </div>
        {lead.lead_value > 0 && (
          <div className="ml-2 text-right">
            <p className="text-xs font-semibold text-emerald-600">
              ${lead.lead_value.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const categories = [
    {
      title: "New Leads",
      icon: TrendingUp,
      leads: categorizedLeads.new,
      color: "text-blue-600"
    },
    {
      title: "Follow-ups Due Today",
      icon: Clock,
      leads: categorizedLeads.followUpsToday,
      color: "text-orange-600"
    },
    {
      title: "Callbacks Scheduled",
      icon: Calendar,
      leads: categorizedLeads.callbacks,
      color: "text-purple-600"
    },
    {
      title: "Hot Leads",
      icon: AlertCircle,
      leads: categorizedLeads.hot,
      color: "text-red-600"
    },
    {
      title: "Stale Leads",
      icon: AlertCircle,
      leads: categorizedLeads.stale,
      color: "text-gray-600"
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">My Leads</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.title}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <category.icon className={`w-4 h-4 ${category.color}`} />
                  <h3 className="text-sm font-medium text-foreground">{category.title}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {category.leads.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {category.leads.length > 0 ? (
                  category.leads.slice(0, 5).map(renderLeadCard)
                ) : (
                  <p className="text-xs text-muted-foreground py-2">No leads in this category</p>
                )}
              </div>
              {category.leads.length > 5 && (
                <button
                  onClick={() => router.push(`/leads?filter=${category.title.toLowerCase().replace(/\s+/g, '-')}`)}
                  className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                >
                  View all {category.leads.length} leads
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

