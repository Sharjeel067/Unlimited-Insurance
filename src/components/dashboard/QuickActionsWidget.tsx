import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Phone, FileText, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/Button";
import { ScheduleCallbackModal } from "@/components/callbacks/ScheduleCallbackModal";
import { AddNoteModal } from "@/components/leads/AddNoteModal";
import { MoveToStageModal } from "@/components/leads/MoveToStageModal";

interface QuickActionsWidgetProps {
  userId: string;
}

export function QuickActionsWidget({ userId }: QuickActionsWidgetProps) {
  const router = useRouter();
  const [nextLead, setNextLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [callbackModalOpen, setCallbackModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    fetchNextLead();
  }, [userId]);

  const fetchNextLead = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("assigned_agent_id", userId)
        .is("last_contacted_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setNextLead(data);
      }
    } catch (error: any) {
      console.error("Error fetching next lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNextLead = () => {
    if (nextLead) {
      router.push(`/calls/entry/claimCall?phone_number=${nextLead.phone_number}`);
    }
  };

  const handleScheduleCallback = () => {
    if (nextLead) {
      setSelectedLead(nextLead);
      setCallbackModalOpen(true);
    }
  };

  const handleAddNote = () => {
    if (nextLead) {
      setSelectedLead(nextLead);
      setNoteModalOpen(true);
    }
  };

  const handleMoveToStage = () => {
    if (nextLead) {
      setSelectedLead(nextLead);
      setStageModalOpen(true);
    }
  };

  const actions = [
    {
      label: "Call Next Lead",
      icon: Phone,
      onClick: handleCallNextLead,
      disabled: !nextLead,
      description: nextLead ? `${nextLead.first_name} ${nextLead.last_name}` : "No leads available"
    },
    {
      label: "Add Note",
      icon: FileText,
      onClick: handleAddNote,
      disabled: !nextLead,
      description: "Add note to lead"
    },
    {
      label: "Schedule Callback",
      icon: Calendar,
      onClick: handleScheduleCallback,
      disabled: !nextLead,
      description: "Schedule follow-up call"
    },
    {
      label: "Move to Stage",
      icon: ArrowRight,
      onClick: handleMoveToStage,
      disabled: !nextLead,
      description: "Change pipeline stage"
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              className="w-full justify-start"
              variant="outline"
            >
              <action.icon className="w-4 h-4 mr-2" />
              <div className="flex-1 text-left">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      )}

      {selectedLead && (
        <>
          <ScheduleCallbackModal
            isOpen={callbackModalOpen}
            onClose={() => {
              setCallbackModalOpen(false);
              setSelectedLead(null);
            }}
            lead={selectedLead}
            onSuccess={() => {
              fetchNextLead();
              setCallbackModalOpen(false);
              setSelectedLead(null);
            }}
          />
          <AddNoteModal
            isOpen={noteModalOpen}
            onClose={() => {
              setNoteModalOpen(false);
              setSelectedLead(null);
            }}
            lead={selectedLead}
            onSuccess={() => {
              fetchNextLead();
              setNoteModalOpen(false);
              setSelectedLead(null);
            }}
          />
          <MoveToStageModal
            isOpen={stageModalOpen}
            onClose={() => {
              setStageModalOpen(false);
              setSelectedLead(null);
            }}
            lead={selectedLead}
            onSuccess={() => {
              fetchNextLead();
              setStageModalOpen(false);
              setSelectedLead(null);
            }}
          />
        </>
      )}
    </div>
  );
}

