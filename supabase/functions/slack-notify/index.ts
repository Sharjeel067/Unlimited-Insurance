import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Generic Slack Notification Edge Function (Bot Token)
 *
 * Sends messages to Slack channels using the Bot Token (OAuth) approach.
 * Uses the chat.postMessage API for full flexibility.
 *
 * Environment Variables:
 *   - SLACK_BOT_TOKEN: Bot OAuth Token (xoxb-...) - Required
 *   - SLACK_DEFAULT_CHANNEL: Default channel ID (optional, e.g., "C0123456789")
 *
 * Request Body:
 *   - message: string (required) - The message text to send
 *   - channel: string (required if no default) - Channel ID or name (e.g., "#call-results" or "C0123456789")
 *   - username: string (optional) - Bot display name override
 *   - icon_emoji: string (optional) - Emoji icon (e.g., ":bell:")
 *   - icon_url: string (optional) - URL for custom icon
 *   - blocks: array (optional) - Slack Block Kit blocks for rich formatting
 *   - attachments: array (optional) - Slack attachments
 *   - thread_ts: string (optional) - Thread timestamp to reply in thread
 *   - reply_broadcast: boolean (optional) - Also post to channel when replying in thread
 *
 * Example usage:
 *   await supabase.functions.invoke("slack-notify", {
 *     body: {
 *       message: "Call result updated for John Doe",
 *       channel: "#call-results",
 *     },
 *   });
 *
 * Setup:
 *   1. Create a Slack App at https://api.slack.com/apps
 *   2. Add OAuth scopes: chat:write, chat:write.public (for public channels without invite)
 *   3. Install to workspace and copy Bot User OAuth Token (xoxb-...)
 *   4. Set SLACK_BOT_TOKEN in Supabase Edge Function secrets
 *   5. Invite bot to private channels: /invite @YourBotName
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SlackMessage {
  channel: string;
  text: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  blocks?: unknown[];
  attachments?: unknown[];
  thread_ts?: string;
  reply_broadcast?: boolean;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  ts?: string;
  channel?: string;
  message?: unknown;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();

    // Get Bot Token from environment
    const botToken = Deno.env.get("SLACK_BOT_TOKEN");
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "Missing SLACK_BOT_TOKEN in environment secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!body.message && !body.blocks) {
      return new Response(
        JSON.stringify({ error: "Missing required field: message or blocks" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get channel from body or default
    const channel = body.channel || Deno.env.get("SLACK_DEFAULT_CHANNEL");
    if (!channel) {
      return new Response(
        JSON.stringify({ error: "Missing channel. Provide 'channel' in body or set SLACK_DEFAULT_CHANNEL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Slack message payload
    const slackMessage: SlackMessage = {
      channel,
      text: body.message || "",
      unfurl_links: false,
      unfurl_media: true,
    };

    // Optional overrides
    if (body.username) slackMessage.username = body.username;
    if (body.icon_emoji) slackMessage.icon_emoji = body.icon_emoji;
    if (body.icon_url) slackMessage.icon_url = body.icon_url;
    if (body.thread_ts) slackMessage.thread_ts = body.thread_ts;
    if (body.reply_broadcast) slackMessage.reply_broadcast = body.reply_broadcast;

    // Block Kit blocks for rich formatting
    if (body.blocks && Array.isArray(body.blocks)) {
      slackMessage.blocks = body.blocks;
    }

    // Attachments
    if (body.attachments && Array.isArray(body.attachments)) {
      slackMessage.attachments = body.attachments;
    }

    console.log("[slack-notify] Posting to channel:", channel, "| Message:", slackMessage.text?.substring(0, 50));

    // Call Slack chat.postMessage API
    const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${botToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(slackMessage),
    });

    const result: SlackApiResponse = await slackResponse.json();

    if (!result.ok) {
      console.error("[slack-notify] Slack API error:", result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          hint: getSlackErrorHint(result.error || ""),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[slack-notify] Message sent successfully. ts:", result.ts);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent to Slack",
        ts: result.ts,
        channel: result.channel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[slack-notify] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Provide helpful hints for common Slack API errors.
 */
function getSlackErrorHint(error: string): string {
  const hints: Record<string, string> = {
    "channel_not_found": "The channel doesn't exist or the bot hasn't been invited. Use /invite @BotName in the channel.",
    "not_in_channel": "The bot is not a member of this channel. Use /invite @BotName in the channel.",
    "is_archived": "The channel is archived and cannot receive messages.",
    "invalid_auth": "The SLACK_BOT_TOKEN is invalid. Check your token in Supabase secrets.",
    "token_revoked": "The bot token has been revoked. Reinstall the Slack app.",
    "missing_scope": "The bot lacks required scopes. Add 'chat:write' scope in your Slack app settings.",
    "no_text": "Message must include text or blocks.",
    "rate_limited": "Too many messages sent. Slack rate limits apply.",
  };
  return hints[error] || "Check Slack API documentation for this error.";
}
