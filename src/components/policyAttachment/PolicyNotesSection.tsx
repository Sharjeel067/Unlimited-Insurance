import type { PolicyFormData } from "@/hooks/usePolicyForm";
import type { Dispatch, SetStateAction } from "react";

interface PolicyNotesSectionProps {
  formData: PolicyFormData;
  setFormData: Dispatch<SetStateAction<PolicyFormData>>;
}

export function PolicyNotesSection({ formData, setFormData }: PolicyNotesSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Notes</h2>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Enter notes (will be added to lead notes)"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}

