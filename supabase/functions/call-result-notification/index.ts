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
    const { leadData, callResult } = await req.json();
    
    if (!SLACK_BOT_TOKEN) {
      throw new Error('SLACK_BOT_TOKEN not configured');
    }

    console.log('Debug - leadData:', JSON.stringify(leadData, null, 2));
    console.log('Debug - callResult:', JSON.stringify(callResult, null, 2));

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
    const submissionId = leadData.submission_id || 'N/A';
    const agentName = callResult.agent_who_took_call_name || callResult.agent_who_took_call || 'Unknown Agent';
    const notes = callResult.notes || 'No notes provided';
    const centerUser = leadData.center_user_name || leadVendor;

    // Determine status and emoji based on call result
    const applicationSubmitted = callResult.application_submitted;
    let statusEmoji = '';
    let statusText = '';
    let statusColor = '';
    
    switch (applicationSubmitted) {
      case 'yes':
        statusEmoji = '✅';
        statusText = 'APPLICATION SUBMITTED';
        statusColor = '#36a64f'; // Green
        break;
      case 'no':
        statusEmoji = '❌';
        statusText = 'APPLICATION NOT SUBMITTED';
        statusColor = '#ff0000'; // Red
        break;
      case 'app_fix':
        statusEmoji = '🔧';
        statusText = 'APPLICATION NEEDS FIX';
        statusColor = '#ff9900'; // Orange
        break;
      default:
        statusEmoji = '⏳';
        statusText = 'CALL COMPLETED';
        statusColor = '#808080'; // Gray
    }

    // Build the Slack message
    const slackMessage: any = {
      channel: centerChannel,
      attachments: [
        {
          color: statusColor,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${statusEmoji} CALL RESULT - ${statusText}`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Call has been completed and result has been saved.*`
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
                  text: `*Submission ID:*\n${submissionId}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Agent:*\n${agentName}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Result:*\n${applicationSubmitted === 'yes' ? 'Submitted' : applicationSubmitted === 'no' ? 'Not Submitted' : 'Needs Fix'}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Status:*\n${callResult.status_name || callResult.status || 'N/A'}`
                }
              ]
            }
          ]
        }
      ]
    };

    // Add notes section
    slackMessage.attachments[0].blocks.push({
      type: 'divider'
    });
    
    slackMessage.attachments[0].blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📝 Agent Notes:*\n${notes}`
      }
    });

    // Add product info if available
    if (leadData.quoted_product || leadData.company_name) {
      slackMessage.attachments[0].blocks.push({
        type: 'divider'
      });
      
      const productFields: any[] = [];
      
      if (leadData.quoted_product) {
        productFields.push({
          type: 'mrkdwn',
          text: `*Product:*\n${leadData.quoted_product}`
        });
      }
      
      if (leadData.company_name) {
        productFields.push({
          type: 'mrkdwn',
          text: `*Company:*\n${leadData.company_name}`
        });
      }
      
      if (productFields.length > 0) {
        slackMessage.attachments[0].blocks.push({
          type: 'section',
          fields: productFields
        });
      }
    }

    // Add context footer
    slackMessage.attachments[0].blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Saved by: ${centerUser} | Lead Vendor: ${leadVendor} | Time: ${new Date().toLocaleString()}`
        }
      ]
    });

    console.log(`Sending call result notification to ${centerChannel} for vendor ${leadVendor}`);
    
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

    console.log(`Call result notification sent to ${centerChannel} successfully`);
    
    return new Response(JSON.stringify({
      success: true,
      messageTs: slackResult.ts,
      channel: centerChannel,
      leadVendor: leadVendor,
      resultType: applicationSubmitted
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in call-result-notification:', error);
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
