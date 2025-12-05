import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
}

export function AddNoteModal({ isOpen, onClose, lead, onSuccess }: AddNoteModalProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await (supabase
        .from("lead_notes") as any)
        .insert({
          lead_id: lead.id,
          user_id: session.user.id,
          content: note.trim()
        });

      if (error) throw error;

      toast.success("Note added successfully");
      setNote("");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Note for {lead?.first_name} {lead?.last_name}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter your note here..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Note
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

