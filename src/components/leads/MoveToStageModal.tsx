import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface MoveToStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
}

export function MoveToStageModal({ isOpen, onClose, lead, onSuccess }: MoveToStageModalProps) {
  const [stages, setStages] = useState<any[]>([]);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen && lead?.pipeline_id) {
      fetchStages();
    }
  }, [isOpen, lead]);

  const fetchStages = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("pipeline_id", lead.pipeline_id)
        .order("order_index", { ascending: true });

      if (error) throw error;

      if (data) {
        setStages(data);
        if (lead.stage_id) {
          setSelectedStageId(lead.stage_id);
        }
      }
    } catch (error: any) {
      console.error("Error fetching stages:", error);
      toast.error("Failed to load stages");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageId) {
      toast.error("Please select a stage");
      return;
    }

    setLoading(true);
    try {
      const selectedStage = stages.find(s => s.id === selectedStageId);
      if (!selectedStage) {
        toast.error("Selected stage not found");
        return;
      }

      const { error } = await (supabase
        .from("leads") as any)
        .update({
          stage_id: selectedStageId,
          pipeline_id: selectedStage.pipeline_id,
          updated_at: new Date().toISOString()
        })
        .eq("id", lead.id);

      if (error) throw error;

      toast.success("Lead moved to stage successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error moving lead:", error);
      toast.error("Failed to move lead: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to Stage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Select Stage
            </label>
            {fetching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select a stage...</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedStageId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Move Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

