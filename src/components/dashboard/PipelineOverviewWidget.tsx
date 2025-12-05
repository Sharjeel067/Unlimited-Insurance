import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, TrendingUp } from "lucide-react";
import { getContrastTextColor } from "@/lib/utils";

interface PipelineOverviewWidgetProps {
  userId: string;
}

interface StageData {
  id: string;
  name: string;
  color_code: string;
  count: number;
}

export function PipelineOverviewWidget({ userId }: PipelineOverviewWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<StageData[]>([]);
  const [pipelineVelocity, setPipelineVelocity] = useState(0);
  const [stageConversionRates, setStageConversionRates] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPipelineData();
  }, [userId]);

  const fetchPipelineData = async () => {
    setLoading(true);
    try {
      const { data: leads } = await supabase
        .from("leads")
        .select(`
          stage_id,
          stages:stage_id ( id, name, color_code, pipeline_id )
        `)
        .eq("assigned_agent_id", userId);

      if (leads) {
        const stageCounts: Record<string, { name: string; color_code: string; count: number }> = {};

        leads.forEach((lead: any) => {
          if (lead.stages) {
            const stageId = lead.stages.id;
            if (!stageCounts[stageId]) {
              stageCounts[stageId] = {
                name: lead.stages.name,
                color_code: lead.stages.color_code,
                count: 0
              };
            }
            stageCounts[stageId].count++;
          }
        });

        const stagesData = Object.entries(stageCounts).map(([id, data]) => ({
          id,
          ...data
        }));

        setStages(stagesData);

        const totalLeads = leads.length;
        const { data: policies } = await supabase
          .from("policies")
          .select("lead_id")
          .in("lead_id", leads.map((l: any) => l.id).filter(Boolean));

        const convertedLeads = policies?.length || 0;
        const velocity = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
        setPipelineVelocity(Number(velocity.toFixed(1)));

        const conversionRates: Record<string, number> = {};
        stagesData.forEach((stage) => {
          const stageLeads = leads.filter((l: any) => l.stage_id === stage.id);
          const stagePolicies = policies?.filter((p: any) =>
            stageLeads.some((l: any) => l.id === p.lead_id)
          ).length || 0;
          const rate = stageLeads.length > 0
            ? (stagePolicies / stageLeads.length) * 100
            : 0;
          conversionRates[stage.id] = Number(rate.toFixed(1));
        });

        setStageConversionRates(conversionRates);
      }
    } catch (error: any) {
      console.error("Error fetching pipeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Pipeline Overview</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Pipeline Velocity</p>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{pipelineVelocity}%</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Leads by Stage</h3>
            <div className="space-y-2">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2 flex-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color_code }}
                    />
                    <span className="text-sm text-foreground">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground">{stage.count}</span>
                    {stageConversionRates[stage.id] !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {stageConversionRates[stage.id]}% conversion
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

