import { Button } from "@/components/ui/Button";
import { ArrowLeft, Shield, Edit2 } from "lucide-react";
import { hasPermission, canEditLead, type UserRole } from "@/lib/permissions";

interface LeadDetailHeaderProps {
  lead: any;
  userRole: UserRole | null;
  userId: string | null;
  assignedAgentCallCenter: any;
  isEditing: boolean;
  onBack: () => void;
  onEdit: () => void;
  onConvertToCustomer: () => void;
}

export function LeadDetailHeader({
  lead,
  userRole,
  userId,
  assignedAgentCallCenter,
  isEditing,
  onBack,
  onEdit,
  onConvertToCustomer,
}: LeadDetailHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Details</h1>
          <p className="text-muted-foreground mt-1">
            Complete information for {lead.first_name} {lead.last_name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {hasPermission(userRole, "convert_leads_to_customers") && !isEditing && (
          <Button onClick={onConvertToCustomer}>
            <Shield className="w-4 h-4 mr-2" />
            Convert to Customer
          </Button>
        )}
        {!isEditing && canEditLead(userRole, userId, lead, assignedAgentCallCenter?.id) && (
          <Button variant="outline" onClick={onEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Lead
          </Button>
        )}
      </div>
    </div>
  );
}

