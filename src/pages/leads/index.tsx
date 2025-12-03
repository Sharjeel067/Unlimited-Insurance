import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, User, Calendar, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  state: string;
  created_at: string;
  assigned_agent_id: string | null;
  profiles?: { full_name: string }; // joined assigned_agent data
}

interface Agent {
  id: string;
  full_name: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Leads
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select(`
        *,
        profiles:assigned_agent_id ( full_name )
      `)
      .order("created_at", { ascending: false });

    if (leadsError) console.error("Error fetching leads:", leadsError);
    else setLeads(leadsData as any || []);

    // Fetch Agents for assignment dropdown
    const { data: agentsData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["sales_agent_licensed", "sales_agent_unlicensed"]);
    
    if (agentsData) setAgents(agentsData as any || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleLeadCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAssignAgent = async (leadId: string, agentId: string) => {
    // Optimistic update
    setLeads(prev => prev.map(lead => 
        lead.id === leadId 
            ? { ...lead, assigned_agent_id: agentId, profiles: { full_name: agents.find(a => a.id === agentId)?.full_name || "" } } 
            : lead
    ));

    const { error } = await (supabase
      .from("leads") as any)
      .update({ assigned_agent_id: agentId })
      .eq("id", leadId);

    if (error) {
        console.error("Error assigning agent:", error);
        // Revert on error (could refine this)
        fetchData();
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Leads - CRM</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your leads pipeline.
          </p>
        </div>
        <LeadFormModal onLeadCreated={handleLeadCreated} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-card rounded-lg border border-border border-dashed py-16 text-center">
          <h3 className="text-lg font-medium text-foreground">No leads yet</h3>
          <p className="text-muted-foreground mt-1">
            Submissions from call centers will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium">
                <tr>
                  <th className="px-6 py-4">Lead Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {lead.first_name} {lead.last_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {lead.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {lead.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <select 
                            className="bg-transparent border border-border rounded px-2 py-1 text-xs"
                            value={lead.assigned_agent_id || ""}
                            onChange={(e) => handleAssignAgent(lead.id, e.target.value)}
                        >
                            <option value="">Unassigned</option>
                            {agents.map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                            ))}
                        </select>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(lead.created_at), "MMM d, yyyy")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
