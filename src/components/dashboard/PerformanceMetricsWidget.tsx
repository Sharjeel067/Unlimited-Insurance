import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, TrendingUp, Phone, DollarSign, Clock } from "lucide-react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface PerformanceMetricsWidgetProps {
  userId: string;
}

export function PerformanceMetricsWidget({ userId }: PerformanceMetricsWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    leadsAssignedWeek: 0,
    leadsAssignedMonth: 0,
    leadsContacted: 0,
    conversionRate: 0,
    averageResponseTime: 0,
    revenueGenerated: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, [userId]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { count: assignedWeek } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("assigned_agent_id", userId)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      const { count: assignedMonth } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("assigned_agent_id", userId)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      const { count: contacted } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("assigned_agent_id", userId)
        .not("last_contacted_at", "is", null);

      const { data: allLeads } = await supabase
        .from("leads")
        .select("id")
        .eq("assigned_agent_id", userId);

      const leadIds = (allLeads as any)?.map((l: any) => l.id) || [];
      let policies: any[] = [];
      if (leadIds.length > 0) {
        const { data: policiesData } = await supabase
          .from("policies")
          .select("commission_amount")
          .in("lead_id", leadIds);
        policies = policiesData || [];
      }


      const { data: leadsForResponse } = await supabase
        .from("leads")
        .select("id, created_at, last_contacted_at")
        .eq("assigned_agent_id", userId);

      let totalResponseTime = 0;
      let responseCount = 0;

      if (leadsForResponse) {
        leadsForResponse.forEach((lead: any) => {
          if (lead.last_contacted_at && lead.created_at) {
            const created = new Date(lead.created_at);
            const contacted = new Date(lead.last_contacted_at);
            const diffHours = (contacted.getTime() - created.getTime()) / (1000 * 60 * 60);
            totalResponseTime += diffHours;
            responseCount++;
          }
        });
      }

      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

      const revenue = policies.reduce((sum, p) => sum + (Number(p.commission_amount) || 0), 0);

      const conversionRate = assignedMonth && assignedMonth > 0
        ? (policies.length / assignedMonth * 100)
        : 0;

      setMetrics({
        leadsAssignedWeek: assignedWeek || 0,
        leadsAssignedMonth: assignedMonth || 0,
        leadsContacted: contacted || 0,
        conversionRate: Number(conversionRate.toFixed(1)),
        averageResponseTime: Number(avgResponseTime.toFixed(1)),
        revenueGenerated: revenue
      });
    } catch (error: any) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    {
      label: "Leads Assigned (This Week)",
      value: metrics.leadsAssignedWeek,
      icon: TrendingUp,
      color: "text-blue-600"
    },
    {
      label: "Leads Assigned (This Month)",
      value: metrics.leadsAssignedMonth,
      icon: TrendingUp,
      color: "text-blue-600"
    },
    {
      label: "Leads Contacted",
      value: metrics.leadsContacted,
      icon: Phone,
      color: "text-green-600"
    },
    {
      label: "Conversion Rate",
      value: `${metrics.conversionRate}%`,
      icon: TrendingUp,
      color: "text-emerald-600"
    },
    {
      label: "Avg Response Time",
      value: `${metrics.averageResponseTime}h`,
      icon: Clock,
      color: "text-orange-600"
    },
    {
      label: "Revenue Generated",
      value: `$${metrics.revenueGenerated.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {metricCards.map((metric) => (
            <div key={metric.label} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
              <p className="text-xl font-bold text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

