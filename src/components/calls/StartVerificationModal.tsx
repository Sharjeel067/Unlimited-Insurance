"use client";

import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { Loader2, UserCheck } from "lucide-react";
import { toast } from "react-toastify";
import { supabase } from "@/lib/supabaseClient";
import { logCallUpdate, getLeadInfo } from "@/lib/callLogging";

interface LicensedAgent {
  id: string;
  display_name: string;
  status: string;
}

interface StartVerificationModalProps {
  submissionId: string;
  lead?: Record<string, unknown> | null;
  onVerificationStarted: (sessionId: string) => void;
}

export function StartVerificationModal({
  submissionId,
  lead: leadProp,
  onVerificationStarted,
}: StartVerificationModalProps) {
  const [open, setOpen] = useState(false);
  const [licensedAgents, setLicensedAgents] = useState<LicensedAgent[]>([]);
  const [selectedLA, setSelectedLA] = useState<string>("");
  const [agentType] = useState<"buffer" | "licensed">("licensed");
  const [isRetentionCall, setIsRetentionCall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingAgents, setFetchingAgents] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLicensedAgents();
    }
  }, [open]);

  const fetchFromAgentStatus = async (
    type: "licensed"
  ): Promise<{ id: string; display_name: string; status: string }[]> => {
    const { data: agents, error } = await supabase
      .from("agent_status")
      .select("user_id, status")
      .eq("agent_type", type)
      .returns<{ user_id: string; status: string }[]>();

    if (error || !agents?.length) return [];

    const ids = agents.map((a) => a.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids)
      .returns<{ id: string; full_name: string | null }[]>();

    return (agents || []).map((agent) => {
      const p = (profiles || []).find((r) => r.id === agent.user_id);
      return {
        id: agent.user_id,
        display_name: (p?.full_name as string) || "Unknown",
        status: agent.status || "unknown",
      };
    });
  };

  const fetchFromProfilesByRole = async (
    role: "sales_agent_unlicensed" | "sales_agent_licensed"
  ): Promise<{ id: string; display_name: string; status: string }[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", role)
      .order("full_name")
      .returns<{ id: string; full_name: string | null }[]>();

    if (error || !data?.length) return [];
    return data.map((r) => ({
      id: r.id,
      display_name: (r.full_name as string) || "Unknown",
      status: "available",
    }));
  };

  const fetchLicensedAgents = async () => {
    setFetchingAgents(true);
    try {
      let agents = await fetchFromAgentStatus("licensed");
      if (!agents.length) agents = await fetchFromProfilesByRole("sales_agent_licensed");
      setLicensedAgents(agents);
    } catch (e) {
      console.error("Error fetching licensed agents:", e);
      toast.error("Failed to load licensed agents");
    } finally {
      setFetchingAgents(false);
    }
  };

  const startVerification = async () => {
    if (!selectedLA) {
      toast.error("Please select a licensed agent");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      let leadData: { lead_vendor?: string; customer_full_name?: string } = {};
      const { data: lead } = await supabase
        .from("leads")
        .select("lead_vendor, customer_full_name, first_name, last_name")
        .eq("submission_id", submissionId)
        .maybeSingle();
      if (lead) {
        leadData = {
          lead_vendor: (lead as { lead_vendor?: string }).lead_vendor,
          customer_full_name:
            (lead as { customer_full_name?: string }).customer_full_name ||
            [((lead as { first_name?: string }).first_name), ((lead as { last_name?: string }).last_name)].filter(Boolean).join(" "),
        };
      }

      const agentId = selectedLA;
      const agentName = licensedAgents.find((a) => a.id === selectedLA)?.display_name || "Licensed Agent";

      const sessionData = {
        submission_id: submissionId,
        licensed_agent_id: agentId,
        status: "in_progress",
        started_at: new Date().toISOString(),
      };

      const { data: session, error: sessionError } = await supabase
        .from("verification_sessions")
        .insert(sessionData as any)
        .select()
        .single();

      if (sessionError) throw sessionError;

      try {
        await supabase
          .from("leads")
          // @ts-ignore
          .update({ is_retention_call: isRetentionCall })
          .eq("submission_id", submissionId);
      } catch {
        /* leads.is_retention_call may not exist */
      }

      let leadRow: Record<string, unknown> | null = leadProp ?? null;
      console.log("[StartVerification] leadProp passed:", !!leadProp);
      if (!leadRow) {
        console.log("[StartVerification] Fetching lead by submission_id:", submissionId);
        const { data: fullLead, error: leadErr } = await supabase
          .from("leads")
          .select("*")
          .eq("submission_id", submissionId)
          .maybeSingle();
        if (leadErr) console.error("[StartVerification] Error fetching lead:", leadErr);
        leadRow = fullLead as Record<string, unknown> | null;
      }
      console.log("[StartVerification] leadRow keys:", leadRow ? Object.keys(leadRow) : "null");
      console.log("[StartVerification] leadRow sample:", leadRow ? {
        customer_full_name: leadRow.customer_full_name,
        phone_number: leadRow.phone_number,
        street_address: leadRow.street_address,
        city: leadRow.city,
        state: leadRow.state,
      } : "null");

      const get = (k: string, alt?: string) => {
        const v = leadRow?.[k] ?? (alt ? leadRow?.[alt] : undefined);
        if (v == null) return "";
        if (typeof v === "object" && !(v instanceof Date)) return JSON.stringify(v);
        return String(v);
      };

      const fields: { field_name: string; field_category: string; original_value: string }[] = [
        { field_name: "lead_vendor", field_category: "additional", original_value: get("lead_vendor") },
        { field_name: "customer_full_name", field_category: "personal", original_value: get("customer_full_name") || [get("first_name"), get("last_name")].filter(Boolean).join(" ").trim() },
        { field_name: "street_address", field_category: "contact", original_value: get("street_address", "address") },
        { field_name: "beneficiary_information", field_category: "banking", original_value: get("beneficiary_information", "beneficiary_info") },
        { field_name: "date_of_birth", field_category: "personal", original_value: get("date_of_birth") },
        { field_name: "age", field_category: "personal", original_value: get("age") },
        { field_name: "phone_number", field_category: "contact", original_value: get("phone_number") },
        { field_name: "social_security", field_category: "personal", original_value: get("social_security", "ssn") },
        { field_name: "driver_license", field_category: "personal", original_value: get("driver_license") },
        { field_name: "existing_coverage", field_category: "health", original_value: get("existing_coverage") },
        { field_name: "height", field_category: "health", original_value: get("height") },
        { field_name: "weight", field_category: "health", original_value: get("weight") },
        { field_name: "doctors_name", field_category: "health", original_value: get("doctors_name", "doctor_name") },
        { field_name: "tobacco_use", field_category: "health", original_value: get("tobacco_use") },
        { field_name: "health_conditions", field_category: "health", original_value: get("health_conditions") },
        { field_name: "medications", field_category: "health", original_value: get("medications") },
        { field_name: "carrier", field_category: "insurance", original_value: get("carrier") },
        { field_name: "monthly_premium", field_category: "insurance", original_value: get("monthly_premium", "monthly_budget") },
        { field_name: "coverage_amount", field_category: "insurance", original_value: get("coverage_amount", "desired_coverage") },
        { field_name: "draft_date", field_category: "insurance", original_value: get("draft_date") },
        { field_name: "institution_name", field_category: "banking", original_value: get("institution_name", "bank_name") },
        { field_name: "beneficiary_routing", field_category: "banking", original_value: get("beneficiary_routing", "routing_number") },
        { field_name: "beneficiary_account", field_category: "banking", original_value: get("beneficiary_account", "account_number") },
        { field_name: "account_type", field_category: "banking", original_value: get("account_type") },
        { field_name: "city", field_category: "contact", original_value: get("city") },
        { field_name: "state", field_category: "contact", original_value: get("state") },
        { field_name: "zip_code", field_category: "contact", original_value: get("zip_code") },
        { field_name: "birth_state", field_category: "personal", original_value: get("birth_state") },
        { field_name: "additional_notes", field_category: "additional", original_value: get("additional_notes") },
      ];

      // @ts-ignore
      const items = fields.map((f) => ({
        // @ts-ignore
        session_id: session.id,
        field_name: f.field_name,
        field_category: f.field_category,
        original_value: f.original_value || "",
        verified_value: f.original_value || "",
        is_verified: false,
        is_modified: false,
      }));

      // @ts-ignore
      console.log("[StartVerification] Creating", items.length, "verification items for session:", session.id);
      // @ts-ignore
      console.log("[StartVerification] Sample items:", items.slice(0, 5));

      // @ts-ignore
      const { data: insertedItems, error: itemsErr } = await supabase
        .from("verification_items")
        // @ts-ignore
        .insert(items)
        .select();
      
      if (itemsErr) {
        console.error("[StartVerification] Error inserting verification_items:", itemsErr);
        throw itemsErr;
      }
      // @ts-ignore
      console.log("[StartVerification] Successfully inserted", insertedItems?.length, "items");

      // @ts-ignore
      await supabase
        .from("verification_sessions")
        // @ts-ignore
        .update({ total_fields: items.length })
        // @ts-ignore
        .eq("id", session.id);

      try {
        // @ts-ignore
        await supabase.from("agent_status").upsert({
          user_id: agentId,
          status: "on_call",
          // @ts-ignore
          current_session_id: session.id,
          last_activity: new Date().toISOString(),
        });
      } catch {
        /* optional */
      }

      try {
        await supabase.functions.invoke("center-transfer-notification", {
          body: {
            type: "verification_started",
            submissionId,
            agentType: "licensed",
            licensedAgentName: agentName,
            leadData,
          },
        });
      } catch {
        /* optional */
      }

      const { customerName, leadVendor } = await getLeadInfo(submissionId);
      await logCallUpdate({
        submissionId,
        agentId,
        agentType: "licensed",
        agentName,
        eventType: "verification_started",
        // @ts-ignore
        eventDetails: { workflow_type: "licensed", session_id: session.id, started_by: user.id },
        // @ts-ignore
        verificationSessionId: session.id,
        customerName,
        leadVendor,
        isRetentionCall,
      });

      toast.success("Verification session started with licensed agent");

      setOpen(false);
      setSelectedLA("");
      // @ts-ignore
      onVerificationStarted(session.id);
    } catch (e: unknown) {
      console.error("Error starting verification:", e);
      toast.error(
        e instanceof Error ? e.message : "Failed to start verification session"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "available":
        return "text-green-600";
      case "on_call":
        return "text-red-600";
      case "busy":
        return "text-yellow-600";
      default:
        return "text-gray-400";
    }
  };
  const getStatusLabel = (s: string) => {
    switch (s) {
      case "available":
        return "Available";
      case "on_call":
        return "On Call";
      case "busy":
        return "Busy";
      default:
        return "Unknown";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Start Verification
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Verification Process</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licensed-agent">Select Licensed Agent</Label>
            {fetchingAgents ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading agents...</span>
              </div>
            ) : (
              <Select value={selectedLA} onValueChange={setSelectedLA}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a licensed agent" />
                </SelectTrigger>
                <SelectContent>
                  {licensedAgents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{a.display_name}</span>
                        <span className={`ml-2 text-xs ${getStatusColor(a.status)}`}>
                          {getStatusLabel(a.status)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!licensedAgents.length && !fetchingAgents && (
              <p className="text-sm text-muted-foreground">
                No licensed agents available.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2 border-t pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="retention-call" className="text-base">
                Mark as Retention Call
              </Label>
              <p className="text-sm text-muted-foreground">
                This call will be tracked as a retention team call
              </p>
            </div>
            <Switch
              id="retention-call"
              checked={isRetentionCall}
              onCheckedChange={setIsRetentionCall}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={startVerification}
              disabled={!selectedLA || loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Start Verification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
