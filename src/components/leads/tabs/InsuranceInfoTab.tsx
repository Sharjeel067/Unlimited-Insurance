import { Input } from "@/components/ui/Input";
import { DollarSign } from "lucide-react";

interface InsuranceInfoTabProps {
  lead: any;
  formData: any;
  isEditing: boolean;
  onInputChange: (field: string, value: any) => void;
}

export function InsuranceInfoTab({ lead, formData, isEditing, onInputChange }: InsuranceInfoTabProps) {
  return (
    <section>
      <h3 className="font-semibold text-foreground mb-6 text-lg">Insurance Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Desired Coverage
          </label>
          {isEditing ? (
            <Input
              type="number"
              value={formData.desired_coverage}
              onChange={(e) => onInputChange("desired_coverage", e.target.value ? parseFloat(e.target.value) : "")}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.desired_coverage ? `$${lead.desired_coverage.toLocaleString()}` : "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Monthly Budget
          </label>
          {isEditing ? (
            <Input
              type="number"
              value={formData.monthly_budget}
              onChange={(e) => onInputChange("monthly_budget", e.target.value ? parseFloat(e.target.value) : "")}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.monthly_budget ? `$${lead.monthly_budget.toLocaleString()}` : "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Draft Date</label>
          {isEditing ? (
            <Input
              value={formData.draft_date}
              onChange={(e) => onInputChange("draft_date", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.draft_date || "N/A"}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Existing Coverage</label>
          {isEditing ? (
            <Input
              value={formData.existing_coverage}
              onChange={(e) => onInputChange("existing_coverage", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.existing_coverage || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Beneficiary Name</label>
          {isEditing ? (
            <Input
              value={formData.beneficiary_name}
              onChange={(e) => onInputChange("beneficiary_name", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.beneficiary_info?.name || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Beneficiary Relation</label>
          {isEditing ? (
            <Input
              value={formData.beneficiary_relation}
              onChange={(e) => onInputChange("beneficiary_relation", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.beneficiary_info?.relation || "N/A"}</p>
          )}
        </div>
      </div>
    </section>
  );
}

