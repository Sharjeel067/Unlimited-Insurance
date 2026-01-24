import { supabase } from "@/lib/supabaseClient";

interface SlackNotifyOptions {
  message: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  blocks?: unknown[];
  attachments?: unknown[];
}

/**
 * Send a notification to Slack via the slack-notify Edge Function.
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
 *
 * // With rich formatting
 * await sendSlackNotification({
 *   message: "Call Result Update",
 *   blocks: [
 *     { type: "header", text: { type: "plain_text", text: "Call Result Updated" } },
 *     { type: "section", text: { type: "mrkdwn", text: "*Customer:* John Doe\n*Status:* Approved" } },
 *   ],
 * });
 */
export async function sendSlackNotification(options: SlackNotifyOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("slack-notify", {
      body: options,
    });

    if (error) {
      console.error("[sendSlackNotification] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendSlackNotification] Exception:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
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

  const blocks = [
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
    } as typeof blocks[0]);
  }

  // Add notes if present
  if (notes) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Notes:*\n${notes.substring(0, 500)}${notes.length > 500 ? "..." : ""}` },
    } as typeof blocks[0]);
  }

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `Sent from Unlimited Insurance CRM • ${new Date().toLocaleString()}` }],
  } as typeof blocks[0]);

  return sendSlackNotification({
    message: `Call result updated for ${customerName} by ${agentName}`,
    blocks,
    icon_emoji: statusEmoji,
  });
}
