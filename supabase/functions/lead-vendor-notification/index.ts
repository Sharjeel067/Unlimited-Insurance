import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const SLACK_BOT_TOKEN = Deno.env.get('SLACK_BOT_TOKEN');

// Lead vendor to Slack channel mapping
const leadVendorCenterMapping: Record<string, string> = {
  "AJ BPO": "#orbit-team-aj-bpo",
  "Test": "#orbit-team-aj-bpo"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { leadData, notificationType, etaMinutes } = await req.json();
    
    if (!SLACK_BOT_TOKEN) {
      throw new Error('SLACK_BOT_TOKEN not configured');
    }

    console.log('Debug - leadData:', JSON.stringify(leadData, null, 2));
    console.log('Debug - notificationType:', notificationType);
    console.log('Debug - etaMinutes:', etaMinutes);

    // Get the lead vendor
    const leadVendor = leadData?.lead_vendor;
    
    if (!leadVendor) {
      console.log('No lead vendor found, cannot determine center channel');
      return new Response(JSON.stringify({
        success: false,
        message: 'No lead vendor specified'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const centerChannel = leadVendorCenterMapping[leadVendor];
    
    if (!centerChannel) {
      console.log(`No center channel mapping found for lead vendor: "${leadVendor}"`);
      return new Response(JSON.stringify({
        success: false,
        message: `No center channel mapping for vendor: ${leadVendor}`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Format common data
    const customerName = `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim() || 'Unknown';
    const phoneNumber = leadData.phone_number || 'No phone number';
    const productName = leadData.quoted_product || 'SOS All-In-One 2';
    const companyName = leadData.company_name || 'Bay Alarm Alert';
    const submissionId = leadData.submission_id || 'N/A';
    const centerUser = leadData.center_user_name || leadVendor;

    let slackMessage;

    // Build message based on notification type
    if (notificationType === 'eta_assigned') {
      // ETA Assignment Notification
      slackMessage = {
        channel: centerChannel,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `⏱️ ETA ASSIGNED - ${etaMinutes} MINUTES`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*A licensed agent will call this lead in ${etaMinutes} minutes.*`
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Customer Name:*\n${customerName}`
              },
              {
                type: 'mrkdwn',
                text: `*Phone Number:*\n${phoneNumber}`
              },
              {
                type: 'mrkdwn',
                text: `*Product:*\n${productName}`
              },
              {
                type: 'mrkdwn',
                text: `*Company:*\n${companyName}`
              },
              {
                type: 'mrkdwn',
                text: `*Submission ID:*\n${submissionId}`
              },
              {
                type: 'mrkdwn',
                text: `*Estimated Call Time:*\n${etaMinutes} minutes`
              }
            ]
          },
          {
            type: 'divider'
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Assigned by: ${centerUser} | Lead Vendor: ${leadVendor} | Time: ${new Date().toLocaleString()}`
              }
            ]
          }
        ]
      };
    } else if (notificationType === 'verification_started') {
      // Verification Started Notification
      const upfrontCost = leadData.total_upfront_cost ? `$${leadData.total_upfront_cost.toFixed(2)}` : 'N/A';
      const monthlyCost = leadData.total_monthly_cost ? `$${leadData.total_monthly_cost.toFixed(2)}/mo` : 'N/A';
      const paymentMethod = leadData.payment_method === 'credit_card' ? 'Credit Card' : 'ACH/Bank Transfer';

      slackMessage = {
        channel: centerChannel,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '✅ VERIFICATION STARTED - AGENT ON CALL'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*A licensed agent has started the verification process for this lead.*`
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Customer Name:*\n${customerName}`
              },
              {
                type: 'mrkdwn',
                text: `*Phone Number:*\n${phoneNumber}`
              },
              {
                type: 'mrkdwn',
                text: `*Product:*\n${productName}`
              },
              {
                type: 'mrkdwn',
                text: `*Company:*\n${companyName}`
              },
              {
                type: 'mrkdwn',
                text: `*Upfront Cost:*\n${upfrontCost}`
              },
              {
                type: 'mrkdwn',
                text: `*Monthly Cost:*\n${monthlyCost}`
              },
              {
                type: 'mrkdwn',
                text: `*Payment Method:*\n${paymentMethod}`
              },
              {
                type: 'mrkdwn',
                text: `*Submission ID:*\n${submissionId}`
              }
            ]
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📍 Address:*\n${leadData.address || 'N/A'}\n${leadData.city || ''}, ${leadData.state || ''} ${leadData.zip_code || ''}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Started by: ${centerUser} | Lead Vendor: ${leadVendor} | Time: ${new Date().toLocaleString()}`
              }
            ]
          }
        ]
      };
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: `Unknown notification type: ${notificationType}`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`Sending ${notificationType} notification to ${centerChannel} for vendor ${leadVendor}`);
    
    const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackMessage)
    });

    const slackResult = await slackResponse.json();
    console.log(`Slack API Response for ${centerChannel}:`, JSON.stringify(slackResult, null, 2));

    if (!slackResult.ok) {
      console.error(`Slack API error: ${slackResult.error}`);
      if (slackResult.error === 'channel_not_found') {
        console.log(`Channel ${centerChannel} not found, center may need to create it or invite the bot`);
        return new Response(JSON.stringify({
          success: false,
          message: `Channel ${centerChannel} not found`,
          error: slackResult.error
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        throw new Error(`Slack API error: ${slackResult.error}`);
      }
    }

    console.log(`${notificationType} notification sent to ${centerChannel} successfully`);
    
    return new Response(JSON.stringify({
      success: true,
      messageTs: slackResult.ts,
      channel: centerChannel,
      leadVendor: leadVendor,
      notificationType: notificationType
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in lead-vendor-notification:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
