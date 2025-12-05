import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface ConvertToCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
}

export function ConvertToCustomerModal({ isOpen, onClose, lead, onSuccess }: ConvertToCustomerModalProps) {
  const [formData, setFormData] = useState({
    policy_number: "",
    carrier_name: "",
    product_type: "",
    coverage_amount: "",
    monthly_premium: "",
    policy_start_date: "",
    commission_amount: ""
  });
  const [customerPipeline, setCustomerPipeline] = useState<any>(null);
  const [customerStage, setCustomerStage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCustomerPipeline();
    }
  }, [isOpen]);

  const fetchCustomerPipeline = async () => {
    setFetching(true);
    try {
      const { data: pipelines } = await supabase
        .from("pipelines")
        .select("*")
        .ilike("name", "%customer%")
        .limit(1);

      if (pipelines && pipelines.length > 0) {
        setCustomerPipeline(pipelines[0]);
        const { data: stages } = await supabase
          .from("stages")
          .select("*")
          .eq("pipeline_id", (pipelines[0] as any).id)
          .order("order_index", { ascending: true })
          .limit(1);

        if (stages && stages.length > 0) {
          setCustomerStage(stages[0]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching customer pipeline:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policy_number || !formData.carrier_name) {
      toast.error("Policy number and carrier name are required");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      if (!customerPipeline || !customerStage) {
        toast.error("Customer pipeline not found. Please contact administrator.");
        return;
      }

      const { error: policyError } = await supabase
        .from("policies")
        .insert({
          lead_id: lead.id,
          policy_number: formData.policy_number.trim(),
          carrier_name: formData.carrier_name.trim(),
          status: "active",
          premium_amount: formData.monthly_premium ? parseFloat(formData.monthly_premium) : null,
          commission_amount: formData.commission_amount ? parseFloat(formData.commission_amount) : null,
          effective_date: formData.policy_start_date || null,
          application_date: new Date().toISOString().split('T')[0]
        } as any);

      if (policyError) throw policyError;

      const { error: leadError } = await (supabase
        .from("leads") as any)
        .update({
          pipeline_id: customerPipeline.id,
          stage_id: customerStage.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      const { error: dealFlowError } = await supabase
        .from("daily_deal_flow")
        .insert({
          submission_id: lead.submission_id || `SUB-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          client_phone_number: lead.phone_number,
          insured_name: `${lead.first_name} ${lead.last_name}`,
          agent: session.user.email || null,
          status: "Converted",
          call_result: "Converted to Customer",
          carrier: formData.carrier_name,
          product_type: formData.product_type || null,
          monthly_premium: formData.monthly_premium ? parseFloat(formData.monthly_premium) : null,
          face_amount: formData.coverage_amount ? parseFloat(formData.coverage_amount) : null,
          policy_number: formData.policy_number,
          draft_date: formData.policy_start_date || null
        } as any);

      if (dealFlowError) {
        console.error("Error creating deal flow entry:", dealFlowError);
      }

      toast.success("Lead converted to customer successfully");
      setFormData({
        policy_number: "",
        carrier_name: "",
        product_type: "",
        coverage_amount: "",
        monthly_premium: "",
        policy_start_date: "",
        commission_amount: ""
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error converting lead:", error);
      toast.error("Failed to convert lead: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert to Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Policy Number *
              </label>
              <Input
                value={formData.policy_number}
                onChange={(e) => handleInputChange("policy_number", e.target.value)}
                placeholder="Enter policy number"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Carrier Name *
              </label>
              <Input
                value={formData.carrier_name}
                onChange={(e) => handleInputChange("carrier_name", e.target.value)}
                placeholder="Enter carrier name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Product Type
              </label>
              <Input
                value={formData.product_type}
                onChange={(e) => handleInputChange("product_type", e.target.value)}
                placeholder="Enter product type"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Coverage Amount
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.coverage_amount}
                onChange={(e) => handleInputChange("coverage_amount", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Monthly Premium
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.monthly_premium}
                onChange={(e) => handleInputChange("monthly_premium", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Commission Amount
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.commission_amount}
                onChange={(e) => handleInputChange("commission_amount", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Policy Start Date
              </label>
              <Input
                type="date"
                value={formData.policy_start_date}
                onChange={(e) => handleInputChange("policy_start_date", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetching}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Convert to Customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

