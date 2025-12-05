import { useState, useEffect } from "react";
import { canSeeAssignmentSection, type UserRole } from "@/lib/permissions";

export function useLeadForm(lead: any, userRole: UserRole | null) {
  const [formData, setFormData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCallCenterId, setSelectedCallCenterId] = useState<string>("");

  useEffect(() => {
    if (lead) {
      const initialFormData: any = {
        first_name: lead.first_name || "",
        last_name: lead.last_name || "",
        date_of_birth: lead.date_of_birth || "",
        age: lead.age || "",
        ssn: lead.ssn || "",
        phone_number: lead.phone_number || "",
        email: lead.email || "",
        address: lead.address || "",
        city: lead.city || "",
        state: lead.state || "",
        zip_code: lead.zip_code || "",
        birth_state: lead.birth_state || "",
        driver_license: lead.driver_license || "",
        height: lead.height || "",
        weight: lead.weight || "",
        tobacco_use: lead.tobacco_use || false,
        health_conditions: lead.health_conditions || "",
        medications: lead.medications || "",
        doctor_name: lead.doctor_name || "",
        desired_coverage: lead.desired_coverage || "",
        monthly_budget: lead.monthly_budget || "",
        existing_coverage: lead.existing_coverage || "",
        beneficiary_name: lead.beneficiary_info?.name || "",
        beneficiary_relation: lead.beneficiary_info?.relation || "",
        draft_date: lead.draft_date || "",
        bank_name: lead.bank_name || "",
        routing_number: lead.routing_number || "",
        account_number: lead.account_number || "",
        stage_id: lead.stage_id || "",
      };

      if (canSeeAssignmentSection(userRole)) {
        initialFormData.call_center_id = lead.call_center_id || "";
        initialFormData.assigned_agent_id = lead.assigned_agent_id || "";
        setSelectedCallCenterId(lead.call_center_id || "");
      }

      setFormData(initialFormData);
    }
  }, [lead, userRole]);

  useEffect(() => {
    if (!formData || !lead) return;
    const baseComparison: any = {
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      date_of_birth: lead.date_of_birth || "",
      age: lead.age || "",
      ssn: lead.ssn || "",
      phone_number: lead.phone_number || "",
      email: lead.email || "",
      address: lead.address || "",
      city: lead.city || "",
      state: lead.state || "",
      zip_code: lead.zip_code || "",
      birth_state: lead.birth_state || "",
      driver_license: lead.driver_license || "",
      height: lead.height || "",
      weight: lead.weight || "",
      tobacco_use: lead.tobacco_use || false,
      health_conditions: lead.health_conditions || "",
      medications: lead.medications || "",
      doctor_name: lead.doctor_name || "",
      desired_coverage: lead.desired_coverage || "",
      monthly_budget: lead.monthly_budget || "",
      existing_coverage: lead.existing_coverage || "",
      beneficiary_name: lead.beneficiary_info?.name || "",
      beneficiary_relation: lead.beneficiary_info?.relation || "",
      draft_date: lead.draft_date || "",
      bank_name: lead.bank_name || "",
      routing_number: lead.routing_number || "",
      account_number: lead.account_number || "",
      stage_id: lead.stage_id || "",
    };

    if (canSeeAssignmentSection(userRole)) {
      baseComparison.call_center_id = lead.call_center_id || "";
      baseComparison.assigned_agent_id = lead.assigned_agent_id || "";
    }

    const changed = JSON.stringify(formData) !== JSON.stringify(baseComparison);
    setHasChanges(changed);
  }, [formData, lead, userRole]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    if (lead) {
      setFormData({
        first_name: lead.first_name || "",
        last_name: lead.last_name || "",
        date_of_birth: lead.date_of_birth || "",
        age: lead.age || "",
        ssn: lead.ssn || "",
        phone_number: lead.phone_number || "",
        email: lead.email || "",
        address: lead.address || "",
        city: lead.city || "",
        state: lead.state || "",
        zip_code: lead.zip_code || "",
        birth_state: lead.birth_state || "",
        driver_license: lead.driver_license || "",
        height: lead.height || "",
        weight: lead.weight || "",
        tobacco_use: lead.tobacco_use || false,
        health_conditions: lead.health_conditions || "",
        medications: lead.medications || "",
        doctor_name: lead.doctor_name || "",
        desired_coverage: lead.desired_coverage || "",
        monthly_budget: lead.monthly_budget || "",
        existing_coverage: lead.existing_coverage || "",
        beneficiary_name: lead.beneficiary_info?.name || "",
        beneficiary_relation: lead.beneficiary_info?.relation || "",
        draft_date: lead.draft_date || "",
        bank_name: lead.bank_name || "",
        routing_number: lead.routing_number || "",
        account_number: lead.account_number || "",
        stage_id: lead.stage_id || "",
      });
    }
  };

  return {
    formData,
    hasChanges,
    selectedCallCenterId,
    setSelectedCallCenterId,
    handleInputChange,
    resetForm,
  };
}

