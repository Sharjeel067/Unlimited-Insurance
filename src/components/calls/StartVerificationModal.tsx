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
    const { data, error } = await supabase
      .from("agent_status")
      .select("user_id, status")
      .eq("agent_type", type);
    const agents = data as { user_id: string; status: string }[] | null;

    if (error || !agents?.length) return [];

    const ids = agents.map((a) => a.user_id);
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    const profiles = profileData as { id: string; full_name: string | null }[] | null;

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
    const { data: rawData, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", role)
      .order("full_name");
    const data = rawData as { id: string; full_name: string | null }[] | null;

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
        .single() as { data: any; error: any };

      if (sessionError) throw sessionError;

      try {
        await (supabase
          .from("leads") as any)
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
        // 1. Protection Plan
        { field_name: "protection_plan_included", field_category: "product", original_value: get("protection_plan_included") },
        { field_name: "protection_plan_cost", field_category: "product", original_value: get("protection_plan_cost") },
        // 2-3. First & Last Name
        { field_name: "first_name", field_category: "client", original_value: get("first_name") },
        { field_name: "last_name", field_category: "client", original_value: get("last_name") },
        // 4. Mailing Address
        { field_name: "address", field_category: "client", original_value: get("address") },
        { field_name: "city", field_category: "client", original_value: get("city") },
        { field_name: "state", field_category: "client", original_value: get("state") },
        { field_name: "zip_code", field_category: "client", original_value: get("zip_code") },
        // 5. Phone with DNC & TCPA
        { field_name: "phone_number", field_category: "client", original_value: get("phone_number") },
        { field_name: "dnc_status", field_category: "compliance", original_value: get("dnc_status") },
        { field_name: "tcpa_consent", field_category: "compliance", original_value: get("tcpa_consent") },
        // 6-7. Email & Password
        { field_name: "email", field_category: "client", original_value: get("email") },
        { field_name: "client_password", field_category: "client", original_value: get("client_password") },
        // 8. Primary User
        { field_name: "primary_user_same_as_client", field_category: "primary_user", original_value: get("primary_user_same_as_client") },
        { field_name: "primary_user_first_name", field_category: "primary_user", original_value: get("primary_user_first_name") },
        { field_name: "primary_user_last_name", field_category: "primary_user", original_value: get("primary_user_last_name") },
        // 9. Payment Method (determines which billing fields show)
        { field_name: "payment_method", field_category: "payment", original_value: get("payment_method") },
        // Credit Card Fields
        { field_name: "cardholder_name", field_category: "payment", original_value: get("cardholder_name") },
        { field_name: "card_number", field_category: "payment", original_value: get("card_number") },
        { field_name: "card_expiry", field_category: "payment", original_value: get("card_expiry") },
        // ACH Fields
        { field_name: "account_holder_name", field_category: "payment", original_value: get("account_holder_name") },
        { field_name: "routing_number", field_category: "payment", original_value: get("routing_number") },
        { field_name: "account_number", field_category: "payment", original_value: get("account_number") },
        { field_name: "account_type", field_category: "payment", original_value: get("account_type") },
        { field_name: "bank_name", field_category: "payment", original_value: get("bank_name") },
        // Product Information
        { field_name: "company_name", field_category: "product", original_value: get("company_name") },
        { field_name: "quoted_product", field_category: "product", original_value: get("quoted_product") },
        { field_name: "device_cost", field_category: "product", original_value: get("device_cost") },
        { field_name: "shipping_cost", field_category: "product", original_value: get("shipping_cost") },
        { field_name: "monthly_subscription", field_category: "product", original_value: get("monthly_subscription") },
        // Totals
        { field_name: "total_upfront_cost", field_category: "totals", original_value: get("total_upfront_cost") },
        { field_name: "total_monthly_cost", field_category: "totals", original_value: get("total_monthly_cost") },
      ];

      const items = fields.map((f) => ({
        session_id: session.id,
        field_name: f.field_name,
        field_category: f.field_category,
        original_value: f.original_value || "",
        verified_value: f.original_value || "",
        is_verified: false,
        is_modified: false,
      }));

      console.log("[StartVerification] Creating", items.length, "verification items for session:", session.id);
      console.log("[StartVerification] Sample items:", items.slice(0, 5));

      const { data: insertedItems, error: itemsErr } = await supabase
        .from("verification_items")
        .insert(items as any)
        .select() as { data: any; error: any };
      
      if (itemsErr) {
        console.error("[StartVerification] Error inserting verification_items:", itemsErr);
        throw itemsErr;
      }
      console.log("[StartVerification] Successfully inserted", insertedItems?.length, "items");

      await (supabase
        .from("verification_sessions") as any)
        .update({ total_fields: items.length })
        .eq("id", session.id);

      try {
        await (supabase.from("agent_status") as any).upsert({
          user_id: agentId,
          status: "on_call",
          current_session_id: session.id,
          last_activity: new Date().toISOString(),
        });
      } catch {
        /* optional */
      }

      // Send notification to lead vendor Slack channel
      try {
        if (leadRow) {
          const { error: notifyError } = await supabase.functions.invoke(
            "lead-vendor-notification",
            {
              body: {
                leadData: leadRow,
                notificationType: "verification_started",
              },
            }
          );
          
          if (notifyError) {
            console.error("Error sending verification notification:", notifyError);
          } else {
            console.log("Verification started notification sent to lead vendor");
          }
        }
      } catch (notifyErr) {
        console.error("Failed to send verification notification:", notifyErr);
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
        eventDetails: { workflow_type: "licensed", session_id: session.id, started_by: user.id },
        verificationSessionId: session.id,
        customerName,
        leadVendor,
        isRetentionCall,
      });

      toast.success("Verification session started with licensed agent");

      setOpen(false);
      setSelectedLA("");
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
