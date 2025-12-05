import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { canSeeAssignmentSection, type UserRole } from "@/lib/permissions";

interface Stage {
  id: string;
  name: string;
  color_code: string;
  pipeline_id: string;
  order_index: number;
}

export function useLeadData(leadId: string | string[] | undefined, userRole: UserRole | null) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineStages, setPipelineStages] = useState<Stage[]>([]);
  const [callCenters, setCallCenters] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [assignedAgentCallCenter, setAssignedAgentCallCenter] = useState<any>(null);

  const fetchPipelineStages = async (pipelineId: string) => {
    const { data } = await supabase
      .from("stages")
      .select("*")
      .eq("pipeline_id", pipelineId)
      .order("order_index", { ascending: true });
    
    if (data) {
      setPipelineStages(data as any);
    }
  };

  const fetchCallCenters = async () => {
    const { data } = await supabase
      .from("call_centers")
      .select("*")
      .order("name", { ascending: true });
    
    if (data) {
      setCallCenters(data as any);
    }
  };

  const fetchAgentsForCallCenter = async (callCenterId: string) => {
    if (!callCenterId) {
      await fetchSalesAgents();
      return [];
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("call_center_id", callCenterId)
      .in("role", ["call_center_agent", "call_center_manager"])
      .order("full_name", { ascending: true });

    if (data) {
      setAgents(data as any);
      return data as any;
    } else {
      setAgents([]);
      return [];
    }
  };

  const fetchSalesAgents = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["sales_agent_licensed", "sales_agent_unlicensed", "sales_manager"])
      .order("full_name", { ascending: true });

    if (data) {
      setAgents(data as any);
      return data as any;
    } else {
      setAgents([]);
      return [];
    }
  };

  const fetchLeadData = async () => {
    if (!leadId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          profiles:assigned_agent_id ( full_name, call_center_id ),
          call_centers:call_center_id ( name ),
          pipelines:pipeline_id ( name, type ),
          stages:stage_id ( name, color_code )
        `)
        .eq("id", leadId)
        .single();

      if (error) throw error;

      if (data) {
        const leadData = data as any;
        setLead(leadData);

        if (leadData.call_center_id) {
          const { data: leadCallCenter } = await supabase
            .from("call_centers")
            .select("id, name")
            .eq("id", leadData.call_center_id)
            .single();
          
          if (leadCallCenter) {
            setAssignedAgentCallCenter(leadCallCenter);
          }
        } else if (leadData.assigned_agent_id && leadData.profiles?.call_center_id) {
          const { data: agentCallCenter } = await supabase
            .from("call_centers")
            .select("id, name")
            .eq("id", leadData.profiles.call_center_id)
            .single();
          
          if (agentCallCenter) {
            setAssignedAgentCallCenter(agentCallCenter);
          }
        } else {
          setAssignedAgentCallCenter(null);
        }

        if (canSeeAssignmentSection(userRole)) {
          await fetchCallCenters();
          if (leadData.call_center_id) {
            await fetchAgentsForCallCenter(leadData.call_center_id);
          } else {
            await fetchSalesAgents();
          }
        }

        if (leadData.pipeline_id) {
          fetchPipelineStages(leadData.pipeline_id);
        }
      }
    } catch (error: any) {
      console.error("Error fetching lead:", error);
      toast.error("Failed to load lead details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadData();
    }
  }, [leadId]);

  return {
    lead,
    loading,
    pipelineStages,
    callCenters,
    agents,
    assignedAgentCallCenter,
    fetchLeadData,
    fetchAgentsForCallCenter,
    fetchSalesAgents,
    setAgents,
  };
}

