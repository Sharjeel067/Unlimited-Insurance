import { supabase } from "@/lib/supabaseClient";
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from "@supabase/supabase-js";

interface SlackNotifyOptions {
  message: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  blocks?: unknown[];
  attachments?: unknown[];
}

interface SlackNotifyResult {
  success: boolean;
  error?: string;
  hint?: string;
}

/**
 * Send a notification to Slack via the slack-notify Edge Function.
 * 
 * This function handles all errors gracefully and never throws.
 * If Slack is not configured, it will silently log and return.
 *
 * @param options - Notification options
 * @returns Promise with success status
 *
 * @example
 * // Simple message
 * await sendSlackNotification({ message: "Call result updated!" });
 *
 * // With channel override
 * await sendSlackNotification({
 *   message: "New lead submitted",
 *   channel: "#leads",
 * });
 */
export async function sendSlackNotification(options: SlackNotifyOptions): Promise<SlackNotifyResult> {
  try {
    const { data, error } = await supabase.functions.invoke("slack-notify", {
      body: options,
    });

    // Handle Supabase function errors
    if (error) {
      // FunctionsHttpError: Function returned non-2xx status
      if (error instanceof FunctionsHttpError) {
        try {
          const errorData = await error.context.json();
          console.warn("[Slack] Edge Function error:", errorData.error, errorData.hint || "");
          return { 
            success: false, 
            error: errorData.error || "Slack notification failed",
            hint: errorData.hint,
          };
        } catch {
          console.warn("[Slack] Edge Function returned error (no details)");
          return { success: false, error: "Slack notification failed" };
        }
      }

      // FunctionsRelayError: Relay error (e.g., function not deployed)
      if (error instanceof FunctionsRelayError) {
        console.warn("[Slack] Function relay error - is slack-notify deployed?");
        return { success: false, error: "Slack function not available" };
      }

      // FunctionsFetchError: Network error
      if (error instanceof FunctionsFetchError) {
        console.warn("[Slack] Network error:", error.message);
        return { success: false, error: "Network error" };
      }

      // Generic error
      console.warn("[Slack] Unknown error:", error.message);
      return { success: false, error: error.message };
    }

    // Check if the response indicates success
    if (data && data.success === false) {
      console.warn("[Slack] API returned failure:", data.error);
      return { success: false, error: data.error, hint: data.hint };
    }

    return { success: true };
  } catch (err) {
    // Catch-all for any unexpected errors
    console.warn("[Slack] Exception (non-blocking):", err instanceof Error ? err.message : "Unknown");
    return { success: false, error: "Slack notification failed" };
  }
}

/**
 * Pre-built notification for call result updates.
 */
export async function notifyCallResultUpdate(params: {
  customerName: string;
  submissionId: string;
  status: string;
  agentName: string;
  applicationSubmitted: "yes" | "no" | "app_fix";
  carrier?: string;
  premium?: number;
  coverage?: number;
  notes?: string;
}) {
  const {
    customerName,
    submissionId,
    status,
    agentName,
    applicationSubmitted,
    carrier,
    premium,
    coverage,
    notes,
  } = params;

  const statusEmoji =
    applicationSubmitted === "yes" ? ":white_check_mark:" :
    applicationSubmitted === "app_fix" ? ":wrench:" : ":x:";

  const appStatusText =
    applicationSubmitted === "yes" ? "Application Submitted" :
    applicationSubmitted === "app_fix" ? "App Fix Required" : "Not Submitted";

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `${statusEmoji} Call Result Updated`, emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Customer:*\n${customerName || "N/A"}` },
        { type: "mrkdwn", text: `*Submission ID:*\n${submissionId}` },
        { type: "mrkdwn", text: `*Agent:*\n${agentName}` },
        { type: "mrkdwn", text: `*Status:*\n${status}` },
        { type: "mrkdwn", text: `*Application:*\n${appStatusText}` },
      ],
    },
  ];

  // Add insurance details if application submitted
  if (applicationSubmitted === "yes" && (carrier || premium || coverage)) {
    blocks.push({
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Carrier:*\n${carrier || "N/A"}` },
        { type: "mrkdwn", text: `*Premium:*\n$${premium?.toFixed(2) || "N/A"}` },
        { type: "mrkdwn", text: `*Coverage:*\n$${coverage?.toLocaleString() || "N/A"}` },
      ],
    });
  }

  // Add notes if present
  if (notes) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Notes:*\n${notes.substring(0, 500)}${notes.length > 500 ? "..." : ""}` },
    });
  }

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `Sent from Unlimited Insurance CRM • ${new Date().toLocaleString()}` }],
  });

  return sendSlackNotification({
    message: `Call result updated for ${customerName} by ${agentName}`,
    blocks,
    icon_emoji: statusEmoji,
  });
}
