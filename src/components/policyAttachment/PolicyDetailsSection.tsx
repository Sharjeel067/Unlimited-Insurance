import { Input } from "@/components/ui/Input";
import type { PolicyFormData } from "@/hooks/usePolicyForm";
import type { Dispatch, SetStateAction } from "react";

interface PolicyDetailsSectionProps {
  formData: PolicyFormData;
  setFormData: Dispatch<SetStateAction<PolicyFormData>>;
}

export function PolicyDetailsSection({ formData, setFormData }: PolicyDetailsSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Policy Details</h2>
      <div className="grid grid-cols-2 gap-4">
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
            Effective Date
          </label>
          <Input
            type="date"
            value={formData.effective_date}
            onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

