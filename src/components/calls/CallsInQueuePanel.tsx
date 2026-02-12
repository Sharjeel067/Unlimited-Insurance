"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Clock, Phone, User, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

interface QueuedLead {
  id: string;
  submission_id: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  created_at: string;
  eta_minutes: number | null;
  assigned_agent_id: string | null;
}

interface VerificationSession {
  submission_id: string;
}

const ETA_OPTIONS = [
  { label: "3 min", value: 3, color: "bg-green-500 hover:bg-green-600" },
  { label: "5 min", value: 5, color: "bg-yellow-500 hover:bg-yellow-600" },
  { label: "10 min", value: 10, color: "bg-orange-500 hover:bg-orange-600" },
];

export function CallsInQueuePanel() {
  const [leads, setLeads] = useState<QueuedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  const fetchQueuedLeads = async () => {
    try {
      setLoading(true);
      
      // Get leads where verification hasn't started
      // Exclude leads that have an active verification session
      const { data: verificationSessions } = await supabase
        .from("verification_sessions")
        .select("submission_id")
        .in("status", ["pending", "in_progress", "ready_for_transfer"]);

      const activeSubmissionIds = (verificationSessions as VerificationSession[] | null)?.map(s => s.submission_id) || [];

      // Fetch latest 10 leads that don't have active verification
      let query = supabase
        .from("leads")
        .select("id, submission_id, first_name, last_name, phone_number, created_at, eta_minutes, assigned_agent_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (activeSubmissionIds.length > 0) {
        query = query.not("submission_id", "in", `(${activeSubmissionIds.join(",")})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setLeads((data as QueuedLead[]) || []);
    } catch (error) {
      console.error("Error fetching queued leads:", error);
      toast.error("Failed to load call queue");
    } finally {
      setLoading(false);
    }
  };

  const assignETA = async (leadId: string, etaMinutes: number) => {
    try {
      setUpdatingLeadId(leadId);
      
      // First fetch full lead data for the notification
      const { data: leadData, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("leads")
        // @ts-ignore
        .update({ eta_minutes: etaMinutes })
        .eq("id", leadId);

      if (error) throw error;

      // Send Slack notification to lead vendor
      try {
        const { error: notifyError } = await supabase.functions.invoke(
          "lead-vendor-notification",
          {
            body: {
              leadData,
              notificationType: "eta_assigned",
              etaMinutes,
            },
          }
        );
        
        if (notifyError) {
          console.error("Error sending ETA notification:", notifyError);
        } else {
          console.log(`ETA notification sent for lead ${leadId}`);
        }
      } catch (notifyErr) {
        console.error("Failed to send ETA notification:", notifyErr);
      }

      // Update local state
      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, eta_minutes: etaMinutes } : lead
        )
      );

      toast.success(`ETA set to ${etaMinutes} minutes`);
    } catch (error) {
      console.error("Error assigning ETA:", error);
      toast.error("Failed to assign ETA");
    } finally {
      setUpdatingLeadId(null);
    }
  };

  useEffect(() => {
    fetchQueuedLeads();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchQueuedLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Calls In Queue
          </h3>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Calls In Queue
        </h3>
        <span className="text-sm text-muted-foreground">
          {leads.length} leads waiting
        </span>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {leads.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No calls in queue
          </p>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {lead.first_name || 'Unknown'} {lead.last_name || ''}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {lead.phone_number || 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </div>
                </div>
                {lead.eta_minutes && (
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    <Clock className="h-4 w-4" />
                    {lead.eta_minutes} min
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {ETA_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={lead.eta_minutes === option.value ? "default" : "outline"}
                    className={`flex-1 text-xs ${
                      lead.eta_minutes === option.value ? option.color : ""
                    }`}
                    onClick={() => assignETA(lead.id, option.value)}
                    disabled={updatingLeadId === lead.id}
                  >
                    {updatingLeadId === lead.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      option.label
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
