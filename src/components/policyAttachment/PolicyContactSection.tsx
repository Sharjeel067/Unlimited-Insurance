import { Input } from "@/components/ui/Input";
import type { PolicyFormData } from "@/hooks/usePolicyForm";
import type { Dispatch, SetStateAction } from "react";

interface PolicyContactSectionProps {
  formData: PolicyFormData;
  setFormData: Dispatch<SetStateAction<PolicyFormData>>;
}

export function PolicyContactSection({ formData, setFormData }: PolicyContactSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
      <div className="grid grid-cols-2 gap-4">
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
      </div>
    </div>
  );
}

