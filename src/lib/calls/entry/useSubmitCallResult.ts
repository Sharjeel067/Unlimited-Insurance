import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { UpdateCallResultFormData } from "./schema";
import { Lead } from "./types";
import { notifyCallResultUpdate } from "@/lib/slackNotify";

interface UseSubmitCallResultProps {
    lead: Lead;
    agents: Array<{ id: string; full_name: string }>;
    stages: Array<{ id: string; name: string; pipeline_id: string }>;
}

export function useSubmitCallResult({ lead, agents, stages }: UseSubmitCallResultProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: UpdateCallResultFormData) => {
        if (!lead) return;

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const timestamp = new Date().toISOString();
            const submissionId = data.application_submitted === "yes" ? `SUB-${Date.now()}` : null;

            const callResultData: any = {
                lead_id: lead.id,
                user_id: session.user.id,
                agent_id: data.agent_who_took_call,
                buffer_agent: data.buffer_agent || null,
                agent_who_took_call: data.agent_who_took_call,
                application_submitted: data.application_submitted === "yes",
                call_source: data.call_source,
                status: data.status,
                notes: data.notes,
                submission_id: submissionId,
                dq_reason: data.application_submitted === "no" ? data.notes : null,
                created_at: timestamp,
            };

            if (data.application_submitted === "yes") {
                callResultData.licensed_agent_account = data.licensed_agent_account;
                callResultData.carrier = data.carrier;
                callResultData.product_type = data.product_type;
                callResultData.draft_date = data.draft_date;
                callResultData.monthly_premium = data.monthly_premium || 0;
                callResultData.coverage_amount = data.coverage_amount || 0;
                callResultData.sent_to_underwriting = data.sent_to_underwriting === "yes";
            }

            const { error: callResultError } = await (supabase
                .from("call_update") as any)
                .insert(callResultData);

            if (callResultError) throw callResultError;

            const { error: noteError } = await (supabase
                .from("lead_notes") as any)
                .insert({
                    lead_id: lead.id,
                    user_id: session.user.id,
                    content: `Call Result: ${data.call_source}\n${data.notes}`,
                });

            if (noteError) console.error("Error saving note:", noteError);

            if (data.status) {
                const selectedStage = stages.find(s => s.id === data.status);
                if (selectedStage) {
                    const { error: leadUpdateError } = await (supabase
                        .from("leads") as any)
                        .update({
                            stage_id: data.status,
                            pipeline_id: selectedStage.pipeline_id,
                            last_contacted_at: timestamp,
                            updated_at: timestamp,
                        })
                        .eq("id", lead.id);

                    if (leadUpdateError) throw leadUpdateError;
                }
            }

            if (data.application_submitted === "yes") {
                const { error: dealError } = await supabase
                    .from("daily_deal_flow")
                    .insert({
                        submission_id: submissionId,
                        date: new Date().toISOString().split('T')[0],
                        client_phone_number: lead.phone_number || null,
                        insured_name: `${lead.first_name || ""} ${lead.last_name || ""}`,
                        buffer_agent: data.buffer_agent || null,
                        agent: agents.find(a => a.id === data.agent_who_took_call)?.full_name || null,
                        status: data.sent_to_underwriting === "yes" ? "Submitted" : "Pending",
                        call_result: "Application Submitted",
                        notes: data.notes,
                        carrier: data.carrier || null,
                        monthly_premium: data.monthly_premium || null,
                        face_amount: data.coverage_amount || null,
                    } as any);

                if (dealError) throw dealError;
            }

            // Send Slack notification via edge function to lead vendor channel
            const agentName = agents.find(a => a.id === data.agent_who_took_call)?.full_name || "Unknown Agent";
            const stageName = stages.find(s => s.id === data.status)?.name || data.status;
            
            // Send notification to lead vendor Slack channel
            try {
                const { error: notifyError } = await supabase.functions.invoke(
                    "call-result-notification",
                    {
                        body: {
                            leadData: lead,
                            callResult: {
                                ...data,
                                agent_who_took_call_name: agentName,
                                status_name: stageName,
                            },
                        },
                    }
                );
                
                if (notifyError) {
                    console.error("[Slack] Lead vendor notification failed:", notifyError);
                } else {
                    console.log("[Slack] Call result notification sent to lead vendor");
                }
            } catch (notifyErr) {
                console.error("[Slack] Failed to send lead vendor notification:", notifyErr);
            }

            // Also send to general Slack notification (existing)
            const customerName = lead.first_name && lead.last_name 
              ? `${lead.first_name} ${lead.last_name}`.trim()
              : (lead as unknown as { customer_full_name?: string }).customer_full_name || "Unknown";

            notifyCallResultUpdate({
              customerName,
              submissionId: lead.submission_id || lead.id,
              status: stageName,
              agentName,
              applicationSubmitted: data.application_submitted,
              carrier: data.carrier,
              premium: data.monthly_premium,
              coverage: data.coverage_amount,
              notes: data.notes,
            }).catch((err) => {
              // Don't block on Slack notification failure
              console.error("[Slack] Notification failed:", err);
            });

            toast.success("Call result saved successfully");
            router.push("/calls/entry");
        } catch (error: any) {
            console.error("Error saving call result:", error);
            toast.error("Failed to save call result: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return { onSubmit, loading };
}

