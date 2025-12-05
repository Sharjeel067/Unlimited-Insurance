import { Input } from "@/components/ui/Input";
import type { PolicyFormData } from "@/hooks/usePolicyForm";
import type { Dispatch, SetStateAction } from "react";

interface PolicyBasicInfoSectionProps {
  formData: PolicyFormData;
  setFormData: Dispatch<SetStateAction<PolicyFormData>>;
  pipelines: any[];
  stages: any[];
  selectedPipelineId: string;
  onPipelineChange: (pipelineId: string) => void;
}

export function PolicyBasicInfoSection({
  formData,
  setFormData,
  pipelines,
  stages,
  selectedPipelineId,
  onPipelineChange,
}: PolicyBasicInfoSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Policy Holder Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.policy_holder_name}
            onChange={(e) => setFormData({ ...formData, policy_holder_name: e.target.value })}
            placeholder="Enter policy holder name"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            GHL Name
          </label>
          <Input
            value={formData.ghl_name}
            onChange={(e) => setFormData({ ...formData, ghl_name: e.target.value })}
            placeholder="Lead name"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Pipeline
          </label>
          <select
            value={selectedPipelineId}
            onChange={(e) => onPipelineChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select pipeline</option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Stage
          </label>
          <select
            value={formData.stage_id}
            onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={!selectedPipelineId}
          >
            <option value="">Select stage</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

