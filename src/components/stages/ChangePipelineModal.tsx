import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface ChangePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    pipeline_id: string | null;
    stage_id: string | null;
  };
  onSuccess: () => void;
}

export function ChangePipelineModal({ isOpen, onClose, lead, onSuccess }: ChangePipelineModalProps) {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(lead.pipeline_id || "");
  const [selectedStageId, setSelectedStageId] = useState<string>(lead.stage_id || "");
  const [loading, setLoading] = useState(false);
  const [fetchingStages, setFetchingStages] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPipelines();
      if (lead.pipeline_id) {
        setSelectedPipelineId(lead.pipeline_id);
        fetchStagesForPipeline(lead.pipeline_id);
      }
      if (lead.stage_id) {
        setSelectedStageId(lead.stage_id);
      }
    }
  }, [isOpen, lead]);

  const fetchPipelines = async () => {
    try {
      const { data } = await supabase
        .from("pipelines")
        .select("id, name")
        .order("created_at");

      if (data) setPipelines(data);
    } catch (error) {
      console.error("Error fetching pipelines:", error);
    }
  };

  const fetchStagesForPipeline = async (pipelineId: string) => {
    if (!pipelineId) {
      setStages([]);
      return;
    }

    setFetchingStages(true);
    try {
      const { data } = await supabase
        .from("stages")
        .select("id, name")
        .eq("pipeline_id", pipelineId)
        .order("order_index");

      if (data) {
        setStages(data);
        if (lead.pipeline_id === pipelineId && lead.stage_id) {
          const stageExists = (data as any).some((s: any) => s.id === lead.stage_id);
          if (!stageExists) {
            setSelectedStageId("");
          }
        } else {
          setSelectedStageId("");
        }
      }
    } catch (error) {
      console.error("Error fetching stages:", error);
    } finally {
      setFetchingStages(false);
    }
  };

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setSelectedStageId("");
    fetchStagesForPipeline(pipelineId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPipelineId || !selectedStageId) {
      toast.error("Please select both pipeline and stage");
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase
        .from("leads") as any)
        .update({
          pipeline_id: selectedPipelineId,
          stage_id: selectedStageId,
        })
        .eq("id", lead.id);

      if (error) throw error;

      toast.success("Pipeline and stage updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating pipeline:", error);
      toast.error("Failed to update pipeline: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Pipeline & Stage</DialogTitle>
          <DialogDescription>
            Update pipeline and stage for {lead.first_name} {lead.last_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Pipeline <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedPipelineId}
              onChange={(e) => handlePipelineChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
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
              Stage <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={!selectedPipelineId || fetchingStages}
              required
            >
              <option value="">{fetchingStages ? "Loading stages..." : "Select stage"}</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedPipelineId || !selectedStageId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

