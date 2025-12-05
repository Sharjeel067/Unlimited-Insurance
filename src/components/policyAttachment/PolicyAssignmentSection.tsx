import type { PolicyFormData } from "@/hooks/usePolicyForm";
import type { Dispatch, SetStateAction } from "react";

interface PolicyAssignmentSectionProps {
  formData: PolicyFormData;
  setFormData: Dispatch<SetStateAction<PolicyFormData>>;
  agents: any[];
}

export function PolicyAssignmentSection({ formData, setFormData, agents }: PolicyAssignmentSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Assignment</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="lapsed">Lapsed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Sales Agent
          </label>
          <select
            value={formData.sales_agent_id}
            onChange={(e) => setFormData({ ...formData, sales_agent_id: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select sales agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

