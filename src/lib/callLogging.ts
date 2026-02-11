import { supabase } from "@/lib/supabaseClient";

export interface CallLogEvent {
  submissionId: string;
  agentId: string;
  agentType: "buffer" | "licensed";
  agentName: string;
  eventType:
    | "verification_started"
    | "call_picked_up"
    | "call_claimed"
    | "call_dropped"
    | "call_disconnected"
    | "transferred_to_la"
    | "transferred_to_licensed_agent"
    | "application_submitted"
    | "application_not_submitted";
  eventDetails?: Record<string, unknown>;
  verificationSessionId?: string;
  customerName?: string;
  leadVendor?: string;
  isRetentionCall?: boolean;
}

export const logCallUpdate = async (
  event: CallLogEvent
): Promise<string | null> => {
  try {
    // @ts-ignore
    const { data, error } = await supabase.rpc("log_call_update", {
      p_submission_id: event.submissionId,
      p_agent_id: event.agentId,
      p_agent_type: event.agentType,
      p_agent_name: event.agentName,
      p_event_type: event.eventType,
      p_event_details: event.eventDetails || {},
      p_verification_session_id: event.verificationSessionId || null,
      p_customer_name: event.customerName || null,
      p_lead_vendor: event.leadVendor || null,
    });
    if (error) {
      console.warn("log_call_update RPC not available or error:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.warn("logCallUpdate failed:", e);
    return null;
  }
};

export const getLeadInfo = async (
  submissionId: string
): Promise<{ customerName: string; leadVendor: string }> => {
  try {
    const { data } = await supabase
      .from("leads")
      .select("customer_full_name, lead_vendor, first_name, last_name")
      .eq("submission_id", submissionId)
      .maybeSingle();
    type Row = { customer_full_name?: string; first_name?: string; last_name?: string; lead_vendor?: string };
    const r = data as Row | null;
    const name =
      r?.customer_full_name ||
      [r?.first_name, r?.last_name].filter(Boolean).join(" ") ||
      "";
    return { customerName: name, leadVendor: r?.lead_vendor || "" };
  } catch {
    return { customerName: "", leadVendor: "" };
  }
};
