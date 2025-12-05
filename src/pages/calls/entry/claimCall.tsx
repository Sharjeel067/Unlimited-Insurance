import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useClaimCallData } from "@/lib/calls/entry/useClaimCallData";
import { useSubmitCallResult } from "@/lib/calls/entry/useSubmitCallResult";
import { LeadDetailsCard } from "@/components/calls/LeadDetailsCard";
import { UpdateCallResultForm } from "@/components/calls/UpdateCallResultForm";
import { getDefaultLead } from "@/lib/calls/entry/defaultLead";

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

    const { onSubmit: submitOnSubmit, loading: submitLoading } = useSubmitCallResult({
        lead: lead || getDefaultLead(),
        agents,
        stages,
    });

    const handleSubmit = async (data: any) => {
        if (!lead) return;
        setLoading(true);
        await submitOnSubmit(data);
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
                <div className="mb-6 flex items-center justify-between">
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <LeadDetailsCard lead={lead} />
                    </div>

                    <div>
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
            </div>
        </DashboardLayout>
    );
}
