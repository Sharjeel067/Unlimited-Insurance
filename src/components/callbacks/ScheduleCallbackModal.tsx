import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Calendar, Clock } from "lucide-react";
import { toast } from "react-toastify";

interface ScheduleCallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
}

export function ScheduleCallbackModal({ isOpen, onClose, lead, onSuccess }: ScheduleCallbackModalProps) {
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("");
  const [reason, setReason] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("7");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackDate || !callbackTime) {
      toast.error("Please select date and time");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const callbackDateTime = new Date(`${callbackDate}T${callbackTime}`);
      const now = new Date();
      if (callbackDateTime < now) {
        toast.error("Callback date and time must be in the future");
        return;
      }

      const { error } = await supabase
        .from("call_results")
        .insert({
          lead_id: lead.id,
          user_id: session.user.id,
          agent_id: session.user.id,
          outcome: "Callback Scheduled",
          notes: reason || `Callback scheduled for ${callbackDate} at ${callbackTime}${isRecurring ? ` (Recurring every ${recurringInterval} days)` : ""}`,
          is_callback: true,
          created_at: callbackDateTime.toISOString()
        } as any);

      if (error) throw error;

      if (isRecurring) {
        const intervalDays = parseInt(recurringInterval);
        for (let i = 1; i <= 12; i++) {
          const nextDate = new Date(callbackDateTime);
          nextDate.setDate(nextDate.getDate() + (intervalDays * i));
          
          await supabase
            .from("call_results")
            .insert({
              lead_id: lead.id,
              user_id: session.user.id,
              agent_id: session.user.id,
              outcome: "Callback Scheduled",
              notes: reason || `Recurring callback #${i + 1} scheduled for ${nextDate.toISOString().split('T')[0]}`,
              is_callback: true,
              created_at: nextDate.toISOString()
            } as any);
        }
      }

      toast.success("Callback scheduled successfully");
      setCallbackDate("");
      setCallbackTime("");
      setReason("");
      setIsRecurring(false);
      setRecurringInterval("7");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error scheduling callback:", error);
      toast.error("Failed to schedule callback: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Callback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <Input
              type="date"
              value={callbackDate}
              onChange={(e) => setCallbackDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </label>
            <Input
              type="time"
              value={callbackTime}
              onChange={(e) => setCallbackTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter callback reason..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-input"
            />
            <label htmlFor="recurring" className="text-sm text-foreground">
              Recurring callback
            </label>
          </div>
          {isRecurring && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Repeat every (days)
              </label>
              <Input
                type="number"
                min="1"
                value={recurringInterval}
                onChange={(e) => setRecurringInterval(e.target.value)}
                placeholder="7"
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

