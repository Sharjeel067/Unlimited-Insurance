import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { isValidRole, type UserRole } from "@/lib/permissions";
import { ConvertToCustomerModal } from "@/components/leads/ConvertToCustomerModal";
import { useRouter } from "next/router";
import { LeadDetailHeader } from "@/components/leads/LeadDetailHeader";
import { LeadDetailTabs } from "@/components/leads/LeadDetailTabs";
import { EditActionsBar } from "@/components/leads/EditActionsBar";
import { PersonalInfoTab } from "@/components/leads/tabs/PersonalInfoTab";
import { MedicalInfoTab } from "@/components/leads/tabs/MedicalInfoTab";
import { InsuranceInfoTab } from "@/components/leads/tabs/InsuranceInfoTab";
import { BankingInfoTab } from "@/components/leads/tabs/BankingInfoTab";
import { SystemInfoTab } from "@/components/leads/tabs/SystemInfoTab";
import { NotesTab } from "@/components/leads/tabs/NotesTab";
import { PoliciesTab } from "@/components/leads/tabs/PoliciesTab";
import { CallHistoryTab } from "@/components/leads/tabs/CallHistoryTab";
import { useLeadData } from "@/hooks/useLeadData";
import { useLeadForm } from "@/hooks/useLeadForm";
import { useLeadTabData } from "@/hooks/useLeadTabData";

type TabType = "personal" | "medical" | "insurance" | "banking" | "system" | "notes" | "policies" | "callHistory";

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const {
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
  } = useLeadData(id, userRole);

  const {
    formData,
    hasChanges,
    selectedCallCenterId,
    setSelectedCallCenterId,
    handleInputChange,
    resetForm,
  } = useLeadForm(lead, userRole);

  const {
    notes,
    loadingNotes,
    policies,
    loadingPolicies,
    callHistory,
    loadingCallHistory,
  } = useLeadTabData(id, activeTab);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          const role = (profile as any).role;
          if (isValidRole(role)) {
            setUserRole(role);
            localStorage.setItem("userRole", role);
          }
        }
      } else {
        const savedRole = localStorage.getItem("userRole");
        if (savedRole && isValidRole(savedRole)) {
          setUserRole(savedRole);
        }
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedCallCenterId) {
      fetchAgentsForCallCenter(selectedCallCenterId).then((fetchedAgents) => {
        if (formData && formData.assigned_agent_id && fetchedAgents) {
          const currentAgentExists = fetchedAgents.some((a: any) => a.id === formData.assigned_agent_id);
          if (!currentAgentExists) {
            handleInputChange("assigned_agent_id", "");
          }
        }
      });
    } else {
      fetchSalesAgents().then((fetchedAgents) => {
        if (formData && formData.assigned_agent_id && fetchedAgents) {
          const currentAgentExists = fetchedAgents.some((a: any) => a.id === formData.assigned_agent_id);
          if (!currentAgentExists) {
            handleInputChange("assigned_agent_id", "");
          }
        }
      });
    }
  }, [selectedCallCenterId, userRole]);

  const handleCallCenterChange = (callCenterId: string) => {
    setSelectedCallCenterId(callCenterId);
    handleInputChange("call_center_id", callCenterId);
    if (callCenterId) {
      fetchAgentsForCallCenter(callCenterId);
    } else {
      fetchSalesAgents();
    }
  };

  const handleSave = async () => {
    if (!lead || !formData) return;
    setSaveLoading(true);
    try {
      if ((!formData.call_center_id || formData.call_center_id === "") && 
          (!formData.assigned_agent_id || formData.assigned_agent_id === "")) {
        toast.error("Please select an assigned agent when creating an agency lead (no call center)");
        setSaveLoading(false);
        return;
      }

      const { beneficiary_name, beneficiary_relation, call_center_id, assigned_agent_id, ...updateData } = formData;
      const updatePayload: any = {
        ...updateData,
        beneficiary_info: {
          name: beneficiary_name || null,
          relation: beneficiary_relation || null
        },
        call_center_id: call_center_id && call_center_id !== "" ? call_center_id : null,
        assigned_agent_id: assigned_agent_id && assigned_agent_id !== "" ? assigned_agent_id : null,
      };

      if (!updatePayload.stage_id || updatePayload.stage_id === "") {
        updatePayload.stage_id = null;
      }

      if (updatePayload.age === "" || updatePayload.age === null) {
        updatePayload.age = null;
      } else if (typeof updatePayload.age === "string") {
        updatePayload.age = parseInt(updatePayload.age) || null;
      }

      if (updatePayload.desired_coverage === "" || updatePayload.desired_coverage === null) {
        updatePayload.desired_coverage = null;
      } else if (typeof updatePayload.desired_coverage === "string") {
        updatePayload.desired_coverage = parseFloat(updatePayload.desired_coverage) || null;
      }

      if (updatePayload.monthly_budget === "" || updatePayload.monthly_budget === null) {
        updatePayload.monthly_budget = null;
      } else if (typeof updatePayload.monthly_budget === "string") {
        updatePayload.monthly_budget = parseFloat(updatePayload.monthly_budget) || null;
      }

      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === "") {
          updatePayload[key] = null;
        }
      });

      const { error } = await (supabase
        .from("leads") as any)
        .update(updatePayload)
        .eq("id", lead.id)
        .select();

      if (error) throw error;

      setIsEditing(false);
      toast.success("Lead updated successfully");
      
      if (updatePayload.call_center_id) {
        const { data: callCenter } = await supabase
          .from("call_centers")
          .select("id, name")
          .eq("id", updatePayload.call_center_id)
          .single();
        
        if (callCenter) {
          // This will be handled by useLeadData hook on refetch
        }
      }
      
      await fetchLeadData();
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead: " + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetForm();
  };

  const renderTabContent = () => {
    if (!lead || !formData) return null;

    switch (activeTab) {
      case "personal":
        return <PersonalInfoTab lead={lead} formData={formData} isEditing={isEditing} onInputChange={handleInputChange} />;
      case "medical":
        return <MedicalInfoTab lead={lead} formData={formData} isEditing={isEditing} onInputChange={handleInputChange} />;
      case "insurance":
        return <InsuranceInfoTab lead={lead} formData={formData} isEditing={isEditing} onInputChange={handleInputChange} />;
      case "banking":
        return <BankingInfoTab lead={lead} formData={formData} isEditing={isEditing} onInputChange={handleInputChange} />;
      case "system":
        return (
          <SystemInfoTab
            lead={lead}
            formData={formData}
            isEditing={isEditing}
            userRole={userRole}
            pipelineStages={pipelineStages}
            callCenters={callCenters}
            agents={agents}
            selectedCallCenterId={selectedCallCenterId}
            assignedAgentCallCenter={assignedAgentCallCenter}
            onInputChange={handleInputChange}
            onCallCenterChange={handleCallCenterChange}
          />
        );
      case "notes":
        return <NotesTab notes={notes} loading={loadingNotes} />;
      case "policies":
        return <PoliciesTab policies={policies} loading={loadingPolicies} />;
      case "callHistory":
        return <CallHistoryTab callHistory={callHistory} loading={loadingCallHistory} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Head>
          <title>Lead Details - CRM</title>
        </Head>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lead || !formData) {
    return (
      <DashboardLayout>
        <Head>
          <title>Lead Details - CRM</title>
        </Head>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground mb-4">Lead not found</p>
          <Button onClick={() => router.push("/leads")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Lead Details - CRM</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        <LeadDetailHeader
          lead={lead}
          userRole={userRole}
          userId={userId}
          assignedAgentCallCenter={assignedAgentCallCenter}
          isEditing={isEditing}
          onBack={() => router.back()}
          onEdit={() => setIsEditing(true)}
          onConvertToCustomer={() => setConvertModalOpen(true)}
        />

        <div className="bg-card rounded-lg border border-border shadow-sm">
          <LeadDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="p-6">
            <div className="space-y-6">
              {renderTabContent()}
            </div>
          </div>

          {isEditing && (
            <EditActionsBar
              onCancel={handleCancel}
              onSave={handleSave}
              hasChanges={hasChanges}
              isLoading={saveLoading}
            />
          )}
        </div>
      </div>

      {lead && (
        <ConvertToCustomerModal
          isOpen={convertModalOpen}
          onClose={() => setConvertModalOpen(false)}
          lead={lead}
          onSuccess={() => {
            fetchLeadData();
            setConvertModalOpen(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}
