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
import { Loader2, Plus } from "lucide-react";
import { toast } from "react-toastify";

interface CreateCenterModalProps {
  onCenterCreated: () => void;
}

export function CreateCenterModal({ onCenterCreated }: CreateCenterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("call_centers")
        .insert({ name, location });

      if (error) throw error;

      setIsOpen(false);
      setName("");
      setLocation("");
      toast.success("Call center created successfully");
      onCenterCreated();
    } catch (error: any) {
      console.error("Error creating center:", error);
      toast.error(error.message || "Failed to create center");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Call Center
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Call Center</DialogTitle>
          <DialogDescription>
            Create a new call center location.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Center Name</label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Center"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, NY"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Center
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

