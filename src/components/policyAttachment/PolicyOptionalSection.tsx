import { Input } from "@/components/ui/Input";
import type { PolicyFormData } from "@/hooks/usePolicyForm";
import type { Dispatch, SetStateAction } from "react";

interface PolicyOptionalSectionProps {
  formData: PolicyFormData;
  setFormData: Dispatch<SetStateAction<PolicyFormData>>;
}

export function PolicyOptionalSection({ formData, setFormData }: PolicyOptionalSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Optional Fields</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            CCPMTWS (Optional)
          </label>
          <Input
            value={formData.ccpmtws}
            onChange={(e) => setFormData({ ...formData, ccpmtws: e.target.value })}
            placeholder="Enter CCPMTWS"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            CCCBWS (Optional)
          </label>
          <Input
            value={formData.cccbws}
            onChange={(e) => setFormData({ ...formData, cccbws: e.target.value })}
            placeholder="Enter CCCBWS"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Carrier Status
          </label>
          <Input
            value={formData.carrier_status}
            onChange={(e) => setFormData({ ...formData, carrier_status: e.target.value })}
            placeholder="Enter carrier status"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Deal Creation Date
          </label>
          <Input
            type="date"
            value={formData.deal_creation_date}
            onChange={(e) => setFormData({ ...formData, deal_creation_date: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

