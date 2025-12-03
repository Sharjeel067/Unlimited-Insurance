import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Plus } from "lucide-react";
import { toast } from "react-toastify";

interface CreateStageModalProps {
  onStageCreated: () => void;
  defaultPipelineId?: string | null;
}

export function CreateStageModal({ onStageCreated, defaultPipelineId }: CreateStageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stageName, setStageName] = useState("");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(defaultPipelineId || "");
  const [pipelines, setPipelines] = useState<{ id: string; name: string }[]>([]);
  const [colorCode, setColorCode] = useState("#cbd5e1");

  const colorOptions = [
    { value: "#cbd5e1", label: "Gray" },
    { value: "#dbeafe", label: "Blue" },
    { value: "#fef3c7", label: "Yellow" },
    { value: "#e9d5ff", label: "Purple" },
    { value: "#c7d2fe", label: "Indigo" },
    { value: "#bbf7d0", label: "Green" },
    { value: "#fecaca", label: "Red" },
    { value: "#fed7aa", label: "Orange" },
    { value: "#fbcfe8", label: "Pink" },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchPipelines();
      if (defaultPipelineId) {
        setSelectedPipelineId(defaultPipelineId);
      }
    }
  }, [isOpen, defaultPipelineId]);

  const fetchPipelines = async () => {
    const { data } = await supabase
      .from("pipelines")
      .select("id, name")
      .order("created_at", { ascending: true });
    
    if (data) {
      const pipelinesData = data as any;
      setPipelines(pipelinesData);
      if (!selectedPipelineId && pipelinesData.length > 0) {
        setSelectedPipelineId(pipelinesData[0].id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedPipelineId) {
        toast.error("Please select a pipeline");
        setLoading(false);
        return;
      }

      if (!stageName.trim()) {
        toast.error("Please enter a stage name");
        setLoading(false);
        return;
      }

      const { data: existingStages } = await supabase
        .from("stages")
        .select("order_index")
        .eq("pipeline_id", selectedPipelineId)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = existingStages && existingStages.length > 0 
        ? (existingStages[0] as any).order_index + 1 
        : 0;

      const { error } = await (supabase
        .from("stages") as any)
        .insert({
          pipeline_id: selectedPipelineId,
          name: stageName.trim(),
          color_code: colorCode,
          order_index: nextOrderIndex,
          is_default: false
        });

      if (error) throw error;

      setIsOpen(false);
      resetForm();
      toast.success("Stage created successfully");
      onStageCreated();
    } catch (error: any) {
      console.error("Error creating stage:", error);
      toast.error(error.message || "Failed to create stage");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStageName("");
    setColorCode("#cbd5e1");
    if (defaultPipelineId) {
      setSelectedPipelineId(defaultPipelineId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Stage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Stage</DialogTitle>
          <DialogDescription>
            Add a new stage to organize leads in your pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Pipeline</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              required
            >
              <option value="">Select a pipeline</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Stage Name</label>
            <Input
              required
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="e.g. New, In Progress, Completed"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Color</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
            >
              {colorOptions.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Stage
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

