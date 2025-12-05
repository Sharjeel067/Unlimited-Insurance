import { format } from "date-fns";
import { getContrastTextColor } from "@/lib/utils";
import { canSeeAssignmentSection, type UserRole } from "@/lib/permissions";

interface Stage {
  id: string;
  name: string;
  color_code: string;
  pipeline_id: string;
  order_index: number;
}

interface SystemInfoTabProps {
  lead: any;
  formData: any;
  isEditing: boolean;
  userRole: UserRole | null;
  pipelineStages: Stage[];
  callCenters: any[];
  agents: any[];
  selectedCallCenterId: string;
  assignedAgentCallCenter: any;
  onInputChange: (field: string, value: any) => void;
  onCallCenterChange: (callCenterId: string) => void;
}

export function SystemInfoTab({
  lead,
  formData,
  isEditing,
  userRole,
  pipelineStages,
  callCenters,
  agents,
  selectedCallCenterId,
  assignedAgentCallCenter,
  onInputChange,
  onCallCenterChange,
}: SystemInfoTabProps) {
  return (
    <section>
      <h3 className="font-semibold text-foreground mb-6 text-lg">System Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Submission ID</label>
          <p className="font-medium text-foreground">{lead.submission_id || "N/A"}</p>
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Created</label>
          <p className="font-medium text-foreground">
            {lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy 'at' h:mm a") : "N/A"}
          </p>
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Call Center (Optional)</label>
          {isEditing && canSeeAssignmentSection(userRole) ? (
            <select
              value={selectedCallCenterId}
              onChange={(e) => onCallCenterChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">No Call Center (Agency Lead)</option>
              {callCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="font-medium text-foreground">
              {assignedAgentCallCenter?.name || (lead.call_centers as any)?.name || "Agency Lead (No Call Center)"}
            </p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">
            Assigned Agent {!selectedCallCenterId && "(Required)"}
          </label>
          {isEditing && canSeeAssignmentSection(userRole) ? (
            <select
              value={formData.assigned_agent_id || ""}
              onChange={(e) => onInputChange("assigned_agent_id", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">
                {selectedCallCenterId 
                  ? "Select Call Center Agent..." 
                  : "Select Sales Agent..."}
              </option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.full_name}
                </option>
              ))}
            </select>
          ) : (
            <p className="font-medium text-foreground">{lead.profiles?.full_name || "Unassigned"}</p>
          )}
        </div>
        {lead.lead_value > 0 && (
          <div>
            <label className="text-muted-foreground text-xs font-medium mb-1 block">Lead Value</label>
            <p className="font-medium text-emerald-600">${lead.lead_value.toLocaleString()}</p>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Current Stage</label>
          {isEditing ? (
            <select
              value={formData.stage_id || ""}
              onChange={(e) => onInputChange("stage_id", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select Stage...</option>
              {pipelineStages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          ) : lead.stages ? (
            <div>
              <span
                className="inline-block px-3 py-1 rounded text-sm font-medium"
                style={{ 
                  backgroundColor: lead.stages.color_code,
                  color: getContrastTextColor(lead.stages.color_code)
                }}
              >
                {lead.stages.name}
              </span>
            </div>
          ) : (
            <p className="font-medium text-foreground">N/A</p>
          )}
        </div>
      </div>
    </section>
  );
}

