import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Phone, Mail, MapPin, Calendar, DollarSign, User, Shield, Edit2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getContrastTextColor } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { isValidRole, type UserRole } from "@/lib/permissions";

interface LeadDetailModalProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

interface Stage {
  id: string;
  name: string;
  color_code: string;
  pipeline_id: string;
  order_index: number;
}

export function LeadDetailModal({ lead, isOpen, onClose, onLeadUpdated }: LeadDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<Stage[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole && isValidRole(savedRole)) {
      setUserRole(savedRole);
    }
  }, []);

  useEffect(() => {
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
      setHasChanges(false);
      setIsEditing(false);
      
      if (lead.pipeline_id) {
        fetchPipelineStages(lead.pipeline_id);
      }
    }
  }, [lead]);

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

  useEffect(() => {
    if (!formData || !lead) return;
    const changed = JSON.stringify(formData) !== JSON.stringify({
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
    setHasChanges(changed);
  }, [formData, lead]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!lead || !formData) return;
    setLoading(true);
    try {
      const { beneficiary_name, beneficiary_relation, ...updateData } = formData;
      const updatePayload: any = {
        ...updateData,
        beneficiary_info: {
          name: beneficiary_name || null,
          relation: beneficiary_relation || null
        }
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
        .eq("id", lead.id);

      if (error) throw error;

      setIsEditing(false);
      toast.success("Lead updated successfully");
      if (onLeadUpdated) onLeadUpdated();
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
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

  if (!lead || !formData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
          <DialogTitle>Lead Details</DialogTitle>
          <DialogDescription>
            Complete information for {lead.first_name} {lead.last_name}
          </DialogDescription>
            </div>
            {!isEditing && userRole !== "call_center_agent" && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Lead
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4 flex-1 overflow-y-auto">
          <section className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-muted-foreground">First Name</label>
                {isEditing ? (
                  <Input
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.first_name || "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground">Last Name</label>
                {isEditing ? (
                  <Input
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.last_name || "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground">Date of Birth</label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                <p className="font-medium">{lead.date_of_birth ? format(new Date(lead.date_of_birth), "MMM d, yyyy") : "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground">Age</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value ? parseInt(e.target.value) : "")}
                    className="mt-1"
                  />
                ) : (
                <p className="font-medium">{lead.age || "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground">SSN</label>
                {isEditing ? (
                  <Input
                    value={formData.ssn}
                    onChange={(e) => handleInputChange("ssn", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                <p className="font-medium">{lead.ssn ? "***-**-" + lead.ssn.slice(-4) : "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                {isEditing ? (
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                <p className="font-medium">{lead.phone_number || "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.email || "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground">Birth State</label>
                {isEditing ? (
                  <Input
                    value={formData.birth_state}
                    onChange={(e) => handleInputChange("birth_state", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.birth_state || "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground">Driver License</label>
                {isEditing ? (
                  <Input
                    value={formData.driver_license}
                    onChange={(e) => handleInputChange("driver_license", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.driver_license || "N/A"}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                {isEditing ? (
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.address || "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground">City</label>
                {isEditing ? (
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.city || "N/A"}</p>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-muted-foreground">State</label>
                  {isEditing ? (
                    <Input
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      maxLength={2}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{lead.state || "N/A"}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-muted-foreground">Zip Code</label>
                  {isEditing ? (
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange("zip_code", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{lead.zip_code || "N/A"}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

            <section className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-4">Medical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                <label className="text-muted-foreground">Height</label>
                {isEditing ? (
                  <Input
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.height || "N/A"}</p>
                )}
                  </div>
              <div>
                <label className="text-muted-foreground">Weight</label>
                {isEditing ? (
                  <Input
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.weight ? `${lead.weight} lbs` : "N/A"}</p>
                )}
              </div>
                  <div>
                <label className="text-muted-foreground">Tobacco Use</label>
                {isEditing ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.tobacco_use}
                      onChange={(e) => handleInputChange("tobacco_use", e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Tobacco User</span>
                  </div>
                ) : (
                  <p className="font-medium">{lead.tobacco_use ? "Yes" : "No"}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground">Doctor Name</label>
                {isEditing ? (
                  <Input
                    value={formData.doctor_name}
                    onChange={(e) => handleInputChange("doctor_name", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.doctor_name || "N/A"}</p>
                )}
                </div>
                  <div className="md:col-span-2">
                <label className="text-muted-foreground">Health Conditions</label>
                {isEditing ? (
                  <textarea
                    value={formData.health_conditions}
                    onChange={(e) => handleInputChange("health_conditions", e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">{lead.health_conditions || "N/A"}</p>
                )}
                  </div>
                  <div className="md:col-span-2">
                <label className="text-muted-foreground">Medications</label>
                {isEditing ? (
                  <textarea
                    value={formData.medications}
                    onChange={(e) => handleInputChange("medications", e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">{lead.medications || "N/A"}</p>
                )}
              </div>
              </div>
            </section>

            <section className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Insurance Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                <label className="text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Desired Coverage
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.desired_coverage}
                    onChange={(e) => handleInputChange("desired_coverage", e.target.value ? parseFloat(e.target.value) : "")}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.desired_coverage ? `$${lead.desired_coverage.toLocaleString()}` : "N/A"}</p>
                )}
                    </div>
              <div>
                <label className="text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monthly Budget
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.monthly_budget}
                    onChange={(e) => handleInputChange("monthly_budget", e.target.value ? parseFloat(e.target.value) : "")}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.monthly_budget ? `$${lead.monthly_budget.toLocaleString()}` : "N/A"}</p>
                )}
                  </div>
              <div>
                <label className="text-muted-foreground">Draft Date</label>
                {isEditing ? (
                  <Input
                    value={formData.draft_date}
                    onChange={(e) => handleInputChange("draft_date", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.draft_date || "N/A"}</p>
                )}
                    </div>
                  <div className="md:col-span-2">
                <label className="text-muted-foreground">Existing Coverage</label>
                {isEditing ? (
                  <Input
                    value={formData.existing_coverage}
                    onChange={(e) => handleInputChange("existing_coverage", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.existing_coverage || "N/A"}</p>
                )}
                  </div>
              <div>
                <label className="text-muted-foreground">Beneficiary Name</label>
                {isEditing ? (
                  <Input
                    value={formData.beneficiary_name}
                    onChange={(e) => handleInputChange("beneficiary_name", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.beneficiary_info?.name || "N/A"}</p>
                )}
                  </div>
              <div>
                <label className="text-muted-foreground">Beneficiary Relation</label>
                {isEditing ? (
                  <Input
                    value={formData.beneficiary_relation}
                    onChange={(e) => handleInputChange("beneficiary_relation", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.beneficiary_info?.relation || "N/A"}</p>
                )}
              </div>
              </div>
            </section>

            <section className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-4">Banking Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                <label className="text-muted-foreground">Bank Name</label>
                {isEditing ? (
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange("bank_name", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.bank_name || "N/A"}</p>
                )}
                  </div>
                  <div>
                <label className="text-muted-foreground">Routing Number</label>
                {isEditing ? (
                  <Input
                    value={formData.routing_number}
                    onChange={(e) => handleInputChange("routing_number", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.routing_number ? "****" + lead.routing_number.slice(-4) : "N/A"}</p>
                )}
                  </div>
                  <div>
                <label className="text-muted-foreground">Account Number</label>
                {isEditing ? (
                  <Input
                    value={formData.account_number}
                    onChange={(e) => handleInputChange("account_number", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{lead.account_number ? "****" + lead.account_number.slice(-4) : "N/A"}</p>
                )}
              </div>
              </div>
            </section>

          <section className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              System Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Submission ID:</span>
                <p className="font-medium">{lead.submission_id || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">
                  {lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Assigned Agent:</span>
                <p className="font-medium">{lead.profiles?.full_name || "Unassigned"}</p>
              </div>
              {lead.lead_value > 0 && (
                <div>
                  <span className="text-muted-foreground">Lead Value:</span>
                  <p className="font-medium text-emerald-600">${lead.lead_value.toLocaleString()}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="text-muted-foreground">Current Stage:</label>
                {isEditing ? (
                  <select
                    value={formData.stage_id || ""}
                    onChange={(e) => handleInputChange("stage_id", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  >
                    <option value="">Select Stage...</option>
                    {pipelineStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                ) : lead.stages ? (
                  <div className="mt-1">
                    <span
                      className="inline-block px-3 py-1 rounded text-sm font-medium"
                      style={{ 
                        backgroundColor: lead.stages.color_code,
                        color: getContrastTextColor(lead.stages.color_code)
                      }}
                    >
                      {lead.stages.name}
                    </span>
                  </div>
                ) : (
                  <p className="font-medium mt-1">N/A</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

