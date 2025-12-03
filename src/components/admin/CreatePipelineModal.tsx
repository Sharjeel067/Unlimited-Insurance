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
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

interface CreatePipelineModalProps {
  onPipelineCreated: () => void;
}

interface StageInput {
  name: string;
  color_code: string;
}

export function CreatePipelineModal({ onPipelineCreated }: CreatePipelineModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pipelineName, setPipelineName] = useState("");
  const [stages, setStages] = useState<StageInput[]>([
    { name: "", color_code: "#cbd5e1" }
  ]);

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

  const addStage = () => {
    setStages([...stages, { name: "", color_code: "#cbd5e1" }]);
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const updateStage = (index: number, field: keyof StageInput, value: string) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };
    setStages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate stages
      const validStages = stages.filter(s => s.name.trim() !== "");
      if (validStages.length === 0) {
        toast.error("Please add at least one stage");
        setLoading(false);
        return;
      }

      // Create pipeline
      const { data: pipeline, error: pipelineError } = await supabase
        .from("pipelines")
        .insert({ 
          name: pipelineName,
          type: "transfer" 
        })
        .select()
        .single();

      if (pipelineError) throw pipelineError;
      if (!pipeline) throw new Error("Failed to create pipeline");

      // Create stages
      const stagesToInsert = validStages.map((stage, idx) => ({
        pipeline_id: pipeline.id,
        name: stage.name.trim(),
        color_code: stage.color_code,
        order_index: idx,
        is_default: idx === 0
      }));

      const { error: stagesError } = await supabase
        .from("stages")
        .insert(stagesToInsert);

      if (stagesError) throw stagesError;

      setIsOpen(false);
      resetForm();
      toast.success("Pipeline created successfully");
      onPipelineCreated();
    } catch (error: any) {
      console.error("Error creating pipeline:", error);
      toast.error(error.message || "Failed to create pipeline");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPipelineName("");
    setStages([{ name: "", color_code: "#cbd5e1" }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Pipeline</DialogTitle>
          <DialogDescription>
            Create a new pipeline with stages to organize your leads.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium">Pipeline Name</label>
            <Input
              required
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              placeholder="e.g. Transfer Portal"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Stages</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStage}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Stage
              </Button>
            </div>
            
            <div className="space-y-3">
              {stages.map((stage, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      value={stage.name}
                      onChange={(e) => updateStage(index, "name", e.target.value)}
                      placeholder={`Stage ${index + 1} name`}
                    />
                  </div>
                  <div className="w-32">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={stage.color_code}
                      onChange={(e) => updateStage(index, "color_code", e.target.value)}
                    >
                      {colorOptions.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {stages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStage(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
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
              Create Pipeline
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

