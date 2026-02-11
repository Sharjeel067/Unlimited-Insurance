import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useClaimCallData } from "@/lib/calls/entry/useClaimCallData";
import { useSubmitCallResult } from "@/lib/calls/entry/useSubmitCallResult";
import { UpdateCallResultForm } from "@/components/calls/UpdateCallResultForm";
import { StartVerificationModal } from "@/components/calls/StartVerificationModal";
import { VerificationPanel } from "@/components/calls/VerificationPanel";
import { TopVerificationProgress } from "@/components/calls/TopVerificationProgress";
import { getDefaultLead } from "@/lib/calls/entry/defaultLead";
import { supabase } from "@/lib/supabaseClient";

export default function ClaimCallPage() {
    const router = useRouter();
    const {
        loading,
        fetchingLead,
        lead,
        agents,
        stages,
        licensedAgents,
        setLoading,
    } = useClaimCallData();

    const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null);
    const [showVerificationPanel, setShowVerificationPanel] = useState(false);

    const submissionId = lead?.submission_id ?? null;

    useEffect(() => {
        if (!submissionId) return;
        const check = async () => {
            const { data } = await supabase
                .from("verification_sessions")
                .select("id")
                .eq("submission_id", submissionId)
                .in("status", ["pending", "in_progress", "ready_for_transfer", "transferred", "completed"])
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            const row = data as { id?: string } | null;
            if (row?.id) {
                setVerificationSessionId(row.id);
                setShowVerificationPanel(true);
            }
        };
        check();
    }, [submissionId]);

    const handleVerificationStarted = (sessionId: string) => {
        setVerificationSessionId(sessionId);
        setShowVerificationPanel(true);
    };

    const { onSubmit: submitOnSubmit, loading: submitLoading } = useSubmitCallResult({
        lead: lead || getDefaultLead(),
        agents,
        stages,
    });

    const handleSubmit = async (data: unknown) => {
        if (!lead) return;
        setLoading(true);
        await submitOnSubmit(data as Parameters<typeof submitOnSubmit>[0]);
    };

    if (fetchingLead) {
        return (
            <DashboardLayout>
                <Head>
                    <title>Claim Call - Loading...</title>
                </Head>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Loading lead information...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!lead) {
        return (
            <DashboardLayout>
                <Head>
                    <title>Claim Call - Lead Not Found</title>
                </Head>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Lead not found</p>
                        <Button onClick={() => router.push("/calls/entry")}>
                            Back to Call Entry
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Head>
                <title>Update Call Result - CRM</title>
            </Head>

            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.push("/calls/entry")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Update Call Result</h1>
                            <p className="text-muted-foreground mt-1">
                                Update the status and details for this lead
                            </p>
                        </div>
                    </div>
                    {submissionId && (
                        <>
                            {!showVerificationPanel || !verificationSessionId ? (
                                <div className="flex-shrink-0">
                                    <StartVerificationModal
                                        submissionId={submissionId}
                                        lead={lead as unknown as Record<string, unknown>}
                                        onVerificationStarted={handleVerificationStarted}
                                    />
                                </div>
                            ) : (
                                <div className="w-full max-w-[420px] flex-shrink-0">
                                    <TopVerificationProgress
                                        submissionId={submissionId}
                                        verificationSessionId={verificationSessionId}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {showVerificationPanel && verificationSessionId ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start min-h-[600px]">
                        <div className="h-full flex flex-col">
                            <VerificationPanel
                                sessionId={verificationSessionId}
                                onTransferReady={() => {}}
                            />
                        </div>
                        <div className="h-full flex flex-col">
                            <UpdateCallResultForm
                                lead={lead}
                                agents={agents}
                                stages={stages}
                                licensedAgents={licensedAgents}
                                loading={submitLoading || loading}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                ) : submissionId ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center">
                        <p className="text-muted-foreground mb-4">
                            Lead found. Click <strong>Start Verification</strong> above to begin verification and update the call result.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            No lead details are shown until verification has started.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-border bg-card p-8 text-center">
                        <p className="text-muted-foreground">
                            This lead has no <code>submission_id</code>. Start Verification is not available.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
