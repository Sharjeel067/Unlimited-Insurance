import { Button } from "@/components/ui/Button";
import { Copy, Phone, Mail, MapPin, Calendar, DollarSign, Heart, Landmark, CreditCard, Hash, User, Users, Building2, Tag, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Lead } from "@/lib/calls/entry/types";

interface LeadDetailsCardProps {
    lead: Lead;
}

export function LeadDetailsCard({ lead }: LeadDetailsCardProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Lead Details</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`${lead.first_name} ${lead.last_name}\n${lead.phone_number}\n${lead.address}, ${lead.city}, ${lead.state} ${lead.zip_code}`)}
                >
                    <Copy className="w-4 h-4" />
                </Button>
            </div>
            <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* Personal Information */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Personal Information</h4>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                        <p className="text-sm font-medium text-foreground">{lead.first_name || ""} {lead.last_name || ""}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            Phone
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.phone_number || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            Email
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.email || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            Address
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.address || ""}, {lead.city || ""}, {lead.state || ""} {lead.zip_code || ""}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            Date of Birth
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.date_of_birth ? format(new Date(lead.date_of_birth), "MMM d, yyyy") : "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Age</label>
                        <p className="text-sm font-medium text-foreground">{lead.age !== null && lead.age !== undefined ? lead.age : "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">SSN</label>
                        <p className="text-sm font-medium text-foreground">{lead.ssn || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Birth State</label>
                        <p className="text-sm font-medium text-foreground">{lead.birth_state || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Driver License</label>
                        <p className="text-sm font-medium text-foreground">{lead.driver_license || "N/A"}</p>
                    </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Medical Information</h4>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Height</label>
                        <p className="text-sm font-medium text-foreground">{lead.height || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Weight</label>
                        <p className="text-sm font-medium text-foreground">{lead.weight || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tobacco Use</label>
                        <p className="text-sm font-medium text-foreground">{lead.tobacco_use !== null && lead.tobacco_use !== undefined ? (lead.tobacco_use ? "Yes" : "No") : "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Health Conditions</label>
                        <p className="text-sm font-medium text-foreground">{lead.health_conditions || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Medications</label>
                        <p className="text-sm font-medium text-foreground">{lead.medications || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Doctor Name</label>
                        <p className="text-sm font-medium text-foreground">{lead.doctor_name || "N/A"}</p>
                    </div>
                </div>

                {/* Insurance Information */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Insurance Information</h4>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            Desired Coverage
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.desired_coverage !== null && lead.desired_coverage !== undefined ? `$${lead.desired_coverage.toLocaleString()}` : "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            Monthly Budget
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.monthly_budget !== null && lead.monthly_budget !== undefined ? `$${lead.monthly_budget.toLocaleString()}` : "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Existing Coverage</label>
                        <p className="text-sm font-medium text-foreground">{lead.existing_coverage || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Heart className="w-3 h-3" />
                            Beneficiary
                        </label>
                        <p className="text-sm font-medium text-foreground">
                            {lead.beneficiary_info 
                                ? (typeof lead.beneficiary_info === 'object' 
                                    ? `${lead.beneficiary_info.name || ""} (${lead.beneficiary_info.relation || ""})` 
                                    : String(lead.beneficiary_info))
                                : "N/A"}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Draft Date</label>
                        <p className="text-sm font-medium text-foreground">{lead.draft_date || "N/A"}</p>
                    </div>
                </div>

                {/* Banking Information */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Banking Information</h4>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Landmark className="w-3 h-3" />
                            Bank Name
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.bank_name || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <CreditCard className="w-3 h-3" />
                            Routing Number
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.routing_number || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <CreditCard className="w-3 h-3" />
                            Account Number
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.account_number || "N/A"}</p>
                    </div>
                </div>

                {/* System Information */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">System Information</h4>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Hash className="w-3 h-3" />
                            Lead ID
                        </label>
                        <p className="text-xs font-medium text-foreground font-mono">{lead.id || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Hash className="w-3 h-3" />
                            Submission ID
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.submission_id || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <User className="w-3 h-3" />
                            User ID
                        </label>
                        <p className="text-xs font-medium text-foreground font-mono">{lead.user_id || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            Lead Value
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.lead_value !== null && lead.lead_value !== undefined ? `$${lead.lead_value.toLocaleString()}` : "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            Assigned Agent
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.profiles?.full_name || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            Buffer Agent
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.buffer_agent?.full_name || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            Call Center
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.call_centers?.name || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Tag className="w-3 h-3" />
                            Stage
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.stages?.name || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Pipeline
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.pipelines?.name || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Created At
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy h:mm a") : "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Updated At
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.updated_at ? format(new Date(lead.updated_at), "MMM d, yyyy h:mm a") : "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Last Contacted At
                        </label>
                        <p className="text-sm font-medium text-foreground">{lead.last_contacted_at ? format(new Date(lead.last_contacted_at), "MMM d, yyyy h:mm a") : "N/A"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

