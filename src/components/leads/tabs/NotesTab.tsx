import { Loader2, MessageSquare, FileCheck } from "lucide-react";
import { format } from "date-fns";

interface NotesTabProps {
  notes: any[];
  loading: boolean;
}

export function NotesTab({ notes, loading }: NotesTabProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No notes yet</p>
      </div>
    );
  }

  return (
    <section>
      <h3 className="font-semibold text-foreground mb-6 text-lg">Notes</h3>
      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-card border border-border rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {note.user_name}
                </span>
                {note.is_pinned && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    Pinned
                  </span>
                )}
                {note.content && note.content.startsWith("Policy attached:") && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    Policy Note
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div className="text-sm text-foreground whitespace-pre-wrap">
              {note.content}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

