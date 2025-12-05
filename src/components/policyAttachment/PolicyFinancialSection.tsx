import { Input } from "@/components/ui/Input";
import type { PolicyFormData } from "@/hooks/usePolicyForm";
import type { Dispatch, SetStateAction } from "react";

interface PolicyFinancialSectionProps {
  formData: PolicyFormData;
  setFormData: Dispatch<SetStateAction<PolicyFormData>>;
}

export function PolicyFinancialSection({ formData, setFormData }: PolicyFinancialSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Financial Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Deal Value
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.deal_value}
            onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            CC Value
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.cc_value}
            onChange={(e) => setFormData({ ...formData, cc_value: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Commission Type
          </label>
          <Input
            value={formData.commission_type}
            onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
            placeholder="Enter commission type"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Writing Number
          </label>
          <Input
            value={formData.writing_number}
            onChange={(e) => setFormData({ ...formData, writing_number: e.target.value })}
            placeholder="Enter writing number"
          />
        </div>
      </div>
    </div>
  );
}

