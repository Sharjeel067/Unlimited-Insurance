import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";

export interface PolicyFormData {
  policy_holder_name: string;
  ghl_name: string;
  stage_id: string;
  creation_date: string;
  policy_number: string;
  carrier: string;
  deal_value: string;
  cc_value: string;
  notes: string;
  status: string;
  sales_agent_id: string;
  writing_number: string;
  commission_type: string;
  effective_date: string;
  phone_no_of_lead: string;
  ccpmtws: string;
  cccbws: string;
  carrier_status: string;
  deal_creation_date: string;
}

export function usePolicyForm(lead: any) {
  const [formData, setFormData] = useState<PolicyFormData>({
    policy_holder_name: "",
    ghl_name: "",
    stage_id: "",
    creation_date: "",
    policy_number: "",
    carrier: "",
    deal_value: "",
    cc_value: "",
    notes: "",
    status: "",
    sales_agent_id: "",
    writing_number: "",
    commission_type: "",
    effective_date: "",
    phone_no_of_lead: "",
    ccpmtws: "",
    cccbws: "",
    carrier_status: "",
    deal_creation_date: new Date().toISOString().split("T")[0],
  });

  const [pipelines, setPipelines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pipelinesRes, agentsRes] = await Promise.all([
        supabase.from("pipelines").select("id, name").order("created_at"),
        supabase
          .from("profiles")
          .select("id, full_name")
          .in("role", ["sales_agent_licensed", "sales_agent_unlicensed", "sales_manager"])
          .order("full_name"),
      ]);

      if (pipelinesRes.data) setPipelines(pipelinesRes.data);
      if (agentsRes.data) setAgents(agentsRes.data);

      if (lead?.pipeline_id) {
        fetchStagesForPipeline(lead.pipeline_id);
        setSelectedPipelineId(lead.pipeline_id);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchStagesForPipeline = async (pipelineId: string) => {
    try {
      const { data } = await supabase
        .from("stages")
        .select("id, name")
        .eq("pipeline_id", pipelineId)
        .order("order_index");

      if (data) setStages(data);
    } catch (error) {
      console.error("Error fetching stages:", error);
    }
  };

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setFormData({ ...formData, stage_id: "" });
    if (pipelineId) {
      fetchStagesForPipeline(pipelineId);
    } else {
      setStages([]);
    }
  };

  const handleSubmit = async (lead: any): Promise<boolean> => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return false;
      }

      const policyData: any = {
        lead_id: lead.id,
        policy_holder_name: formData.policy_holder_name || null,
        ghl_name: formData.ghl_name || null,
        stage_id: formData.stage_id || null,
        creation_date: formData.creation_date || null,
        policy_number: formData.policy_number || null,
        carrier_name: formData.carrier || null,
        deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
        cc_value: formData.cc_value ? parseFloat(formData.cc_value) : null,
        status: formData.status || null,
        sales_agent_id: formData.sales_agent_id || null,
        writing_number: formData.writing_number || null,
        commission_type: formData.commission_type || null,
        effective_date: formData.effective_date || null,
        call_center_of_lead: lead.call_center_id || null,
        phone_no_of_lead: formData.phone_no_of_lead || null,
        ccpmtws: formData.ccpmtws || null,
        cccbws: formData.cccbws || null,
        carrier_status: formData.carrier_status || null,
        deal_creation_date: formData.deal_creation_date || null,
      };

      const { error: policyError } = await supabase
        .from("policies")
        .insert(policyData)
        .select()
        .single();

      if (policyError) throw policyError;

      if (formData.notes && formData.notes.trim()) {
        const noteContent = `Policy attached: ${formData.policy_number || "N/A"} - ${formData.carrier || "N/A"}\n\n${formData.notes.trim()}`;
        
        await (supabase.from("lead_notes") as any).insert({
          lead_id: lead.id,
          user_id: session.user.id,
          content: noteContent,
        });
      }

      toast.success("Policy attached successfully");
      return true;
    } catch (error: any) {
      console.error("Error attaching policy:", error);
      toast.error("Failed to attach policy: " + (error.message || "Unknown error"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    pipelines,
    stages,
    agents,
    selectedPipelineId,
    loading,
    setFormData,
    setSelectedPipelineId,
    setStages,
    handlePipelineChange,
    handleSubmit,
  };
}

