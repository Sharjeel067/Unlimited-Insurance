import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PolicyBasicInfoSection } from "@/components/policyAttachment/PolicyBasicInfoSection";
import { PolicyDetailsSection } from "@/components/policyAttachment/PolicyDetailsSection";
import { PolicyFinancialSection } from "@/components/policyAttachment/PolicyFinancialSection";
import { PolicyAssignmentSection } from "@/components/policyAttachment/PolicyAssignmentSection";
import { PolicyContactSection } from "@/components/policyAttachment/PolicyContactSection";
import { PolicyOptionalSection } from "@/components/policyAttachment/PolicyOptionalSection";
import { PolicyNotesSection } from "@/components/policyAttachment/PolicyNotesSection";
import { usePolicyForm } from "@/hooks/usePolicyForm";
import { isValidRole, type UserRole } from "@/lib/permissions";
import { toast } from "react-toastify";
import type { Database } from "@/types/supabase";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function AttachPolicyPage() {
  const router = useRouter();
  const { leadId } = router.query;
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const {
    formData,
    pipelines,
    stages,
    agents,
    selectedPipelineId,
    loading: formLoading,
    setFormData,
    setSelectedPipelineId,
    setStages,
    handlePipelineChange,
    handleSubmit,
  } = usePolicyForm(lead);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (profile) {
        const role = (profile as any).role;
        if (isValidRole(role)) {
          setUserRole(role);
          if (role !== "sales_manager" && role !== "system_admin") {
            router.push("/policyAttachment");
          }
        }
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId || typeof leadId !== "string") return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .eq("id", leadId)
          .single<Lead>();

        if (error) throw error;
        if (data) {
          setLead(data);
          setFormData({
            policy_holder_name: "",
            ghl_name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            stage_id: data.stage_id || "",
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
            phone_no_of_lead: data.phone_number || "",
            ccpmtws: "",
            cccbws: "",
            carrier_status: "",
            deal_creation_date: new Date().toISOString().split("T")[0],
          });
          setSelectedPipelineId(data.pipeline_id || "");
        }
      } catch (error: any) {
        console.error("Error fetching lead:", error);
        toast.error("Failed to load lead");
        router.push("/policyAttachment");
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      fetchLead();
    }
  }, [leadId, router, setFormData, setSelectedPipelineId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleSubmit(lead);
    if (success) {
      router.push("/policyAttachment");
    }
  };

  if (!userRole || (userRole !== "sales_manager" && userRole !== "system_admin")) return null;
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  if (!lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lead not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Attach Policy - CRM</title>
      </Head>

      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/policyAttachment")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Policy Attachment
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Attach Policy</h1>
        <p className="text-muted-foreground mt-2">
          Create and attach a new policy for {lead.first_name} {lead.last_name}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <PolicyBasicInfoSection
            formData={formData}
            setFormData={setFormData}
            pipelines={pipelines}
            stages={stages}
            selectedPipelineId={selectedPipelineId}
            onPipelineChange={handlePipelineChange}
          />
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <PolicyDetailsSection
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <PolicyFinancialSection
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <PolicyAssignmentSection
            formData={formData}
            setFormData={setFormData}
            agents={agents}
          />
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <PolicyContactSection
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <PolicyOptionalSection
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <PolicyNotesSection
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/policyAttachment")}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={formLoading}>
            {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Attach Policy
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

