import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface EditActionsBarProps {
  onCancel: () => void;
  onSave: () => void;
  hasChanges: boolean;
  isLoading: boolean;
}

export function EditActionsBar({ onCancel, onSave, hasChanges, isLoading }: EditActionsBarProps) {
  return (
    <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30">
      <Button variant="outline" onClick={onCancel} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={!hasChanges || isLoading}>
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Changes
      </Button>
    </div>
  );
}

