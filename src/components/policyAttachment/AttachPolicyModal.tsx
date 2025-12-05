import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  call_center_id: string | null;
  stage_id: string | null;
  pipeline_id: string | null;
}

interface AttachPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess: () => void;
}

export function AttachPolicyModal({ isOpen, onClose, lead, onSuccess }: AttachPolicyModalProps) {
  const [loading, setLoading] = useState(false);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      setFormData({
        policy_holder_name: "",
        ghl_name: `${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
        stage_id: lead.stage_id || "",
        creation_date: new Date().toISOString().split("T")[0],
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
        phone_no_of_lead: lead.phone_number || "",
        ccpmtws: "",
        cccbws: "",
        carrier_status: "",
        deal_creation_date: new Date().toISOString().split("T")[0],
      });
      setSelectedPipelineId(lead.pipeline_id || "");
    }
  }, [isOpen, lead]);

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

      if (lead.pipeline_id) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
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

      const { data: policy, error: policyError } = await supabase
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
      onSuccess();
    } catch (error: any) {
      console.error("Error attaching policy:", error);
      toast.error("Failed to attach policy: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attach Policy</DialogTitle>
          <DialogDescription>
            Create and attach a new policy for {lead.first_name} {lead.last_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Policy Holder Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.policy_holder_name}
                onChange={(e) => setFormData({ ...formData, policy_holder_name: e.target.value })}
                placeholder="Enter policy holder name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                GHL Name
              </label>
              <Input
                value={formData.ghl_name}
                onChange={(e) => setFormData({ ...formData, ghl_name: e.target.value })}
                placeholder="Lead name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Pipeline
              </label>
              <select
                value={selectedPipelineId}
                onChange={(e) => handlePipelineChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select pipeline</option>
                {pipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Stage
              </label>
              <select
                value={formData.stage_id}
                onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={!selectedPipelineId}
              >
                <option value="">Select stage</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Creation Date
              </label>
              <Input
                type="date"
                value={formData.creation_date}
                onChange={(e) => setFormData({ ...formData, creation_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Policy Number <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.policy_number}
                onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                placeholder="Enter policy number"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Carrier <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                placeholder="Enter carrier name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Deal Value
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.deal_value}
                onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                CC Value
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.cc_value}
                onChange={(e) => setFormData({ ...formData, cc_value: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="lapsed">Lapsed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Sales Agent
              </label>
              <select
                value={formData.sales_agent_id}
                onChange={(e) => setFormData({ ...formData, sales_agent_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select sales agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Writing Number
              </label>
              <Input
                value={formData.writing_number}
                onChange={(e) => setFormData({ ...formData, writing_number: e.target.value })}
                placeholder="Enter writing number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Commission Type
              </label>
              <Input
                value={formData.commission_type}
                onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                placeholder="Enter commission type"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Effective Date
              </label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Phone No of Lead
              </label>
              <Input
                value={formData.phone_no_of_lead}
                onChange={(e) => setFormData({ ...formData, phone_no_of_lead: e.target.value })}
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                CCPMTWS (Optional)
              </label>
              <Input
                value={formData.ccpmtws}
                onChange={(e) => setFormData({ ...formData, ccpmtws: e.target.value })}
                placeholder="Enter CCPMTWS"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                CCCBWS (Optional)
              </label>
              <Input
                value={formData.cccbws}
                onChange={(e) => setFormData({ ...formData, cccbws: e.target.value })}
                placeholder="Enter CCCBWS"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Carrier Status
              </label>
              <Input
                value={formData.carrier_status}
                onChange={(e) => setFormData({ ...formData, carrier_status: e.target.value })}
                placeholder="Enter carrier status"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Deal Creation Date
              </label>
              <Input
                type="date"
                value={formData.deal_creation_date}
                onChange={(e) => setFormData({ ...formData, deal_creation_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter notes (will be added to lead notes)"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Attach Policy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

