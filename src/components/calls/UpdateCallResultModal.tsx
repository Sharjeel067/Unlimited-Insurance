import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Loader2, Save, Copy, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/router";

// Schema for the Update Call Result form
const updateCallResultSchema = z.object({
    application_submitted: z.enum(["yes", "no", "app_fix"]),
    call_source: z.string().min(1, "Call source is required"),
    buffer_agent: z.string().optional(),
    agent_who_took_call: z.string().min(1, "Agent who took the call is required"),
    status: z.string().min(1, "Status/Stage is required"),
    notes: z.string().min(1, "Notes are required"),
});

type UpdateCallResultFormData = z.infer<typeof updateCallResultSchema>;

interface Lead {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    ssn: string | null;
    state: string | null;
    address: string | null;
    city: string | null;
    zip_code: string | null;
    date_of_birth: string | null;
    birth_state: string | null;
    age: number | null;
    height: string | null;
    weight: string | null;
    tobacco_use: boolean | null;
    health_conditions: string | null;
    medications: string | null;
    doctor_name: string | null;
    existing_coverage: string | null;
    desired_coverage: number | null;
    monthly_budget: number | null;
    draft_date: string | null;
    bank_name: string | null;
    routing_number: string | null;
    account_number: string | null;
    beneficiary_info: any;
    assigned_agent_id: string | null;
    call_center_id: string | null;
    stage_id: string | null;
    pipeline_id: string | null;
}

interface UpdateCallResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    onSuccess: () => void;
}

export function UpdateCallResultModal({ isOpen, onClose, lead, onSuccess }: UpdateCallResultModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState<Array<{ id: string; full_name: string }>>([]);
    const [stages, setStages] = useState<Array<{ id: string; name: string; pipeline_id: string }>>([]);
    const [callSources] = useState([
        "Inbound Call",
        "Outbound Call",
        "Callback",
        "Transfer",
        "Lead Follow-up",
        "Retention Call",
    ]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<UpdateCallResultFormData>({
        resolver: zodResolver(updateCallResultSchema),
        defaultValues: {
            application_submitted: "no",
            call_source: "",
            buffer_agent: "",
            agent_who_took_call: "",
            status: "",
            notes: "",
        },
    });

    const applicationSubmitted = watch("application_submitted");

    useEffect(() => {
        if (isOpen) {
            fetchAgents();
            fetchStages();
        }
    }, [isOpen]);

    const fetchAgents = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name")
                .order("full_name");

            if (error) throw error;
            setAgents(data || []);
        } catch (error) {
            console.error("Error fetching agents:", error);
        }
    };

    const fetchStages = async () => {
        try {
            const { data, error } = await supabase
                .from("stages")
                .select("id, name, pipeline_id")
                .order("order_index");

            if (error) throw error;
            setStages(data || []);
        } catch (error) {
            console.error("Error fetching stages:", error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const formatLeadDetails = () => {
        const details = [
            `Maverick: ${lead.first_name || ""} ${lead.last_name || ""}`,
            "",
            `Address: ${lead.address || ""}, ${lead.city || ""}, ${lead.state || ""} ${lead.zip_code || ""}`,
            `Beneficiary Information: ${lead.beneficiary_info ? JSON.stringify(lead.beneficiary_info) : "N/A"}`,
            `Billing and mailing address is the same: (Y/N)`,
            `Date of Birth: ${lead.date_of_birth || ""}`,
            `Birth State: ${lead.birth_state || ""}`,
            `Age: ${lead.age || ""}`,
            `Number: ${lead.phone_number || ""}`,
            `Call phone/landline:`,
            `Social: ${lead.ssn || ""}`,
            `Driver License Number:`,
            `Exp:`,
            `Existing coverage: ${lead.existing_coverage || ""}`,
            `Applied to life insurance last two years:`,
            `Height: ${lead.height || ""}`,
            `Weight: ${lead.weight || ""}`,
            `Doctors Name: ${lead.doctor_name || ""}`,
            `Tobacco Use: ${lead.tobacco_use ? "Yes" : "No"}`,
            `Health Conditions: ${lead.health_conditions || ""}`,
            `Medications: ${lead.medications || ""}`,
            `Insurance Application Details:`,
            `Carrier:`,
            `Monthly Premium: $`,
            `Coverage Amount: $`,
            `Draft Date: ${lead.draft_date || ""}`,
            `First Draft:`,
            `Bank Name: ${lead.bank_name || ""}`,
            `Routing Number: ${lead.routing_number || ""}`,
            `Account Number: ${lead.account_number || ""}`,
            `Checking/savings account:`,
            `ADDITIONAL NOTES:`,
        ];
        return details.join("\n");
    };

    const onSubmit = async (data: UpdateCallResultFormData) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const timestamp = new Date().toISOString();
            const submissionId = `SUB-${Date.now()}`;

            // 1. Insert into call_results
            const { error: callResultError } = await supabase
                .from("call_results")
                .insert({
                    lead_id: lead.id,
                    user_id: session.user.id,
                    agent_id: data.agent_who_took_call,
                    buffer_agent: data.buffer_agent || null,
                    agent_who_took_call: data.agent_who_took_call,
                    application_submitted: data.application_submitted === "yes",
                    call_source: data.call_source,
                    status: data.status,
                    notes: data.notes,
                    submission_id: data.application_submitted === "yes" ? submissionId : null,
                    dq_reason: data.application_submitted === "no" ? data.notes : null,
                    created_at: timestamp,
                } as any);

            if (callResultError) throw callResultError;

            // 2. Update lead's stage if status is selected
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

            // 3. If application submitted, create entry in daily_deal_flow
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
                        status: "Pending",
                        call_result: "Application Submitted",
                        notes: data.notes,
                    } as any);

                if (dealError) throw dealError;
            }

            toast.success("Call result saved successfully");
            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error saving call result:", error);
            toast.error("Failed to save call result: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartVerification = () => {
        // Navigate to a verification page or open verification flow
        toast.info("Starting verification process...");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl">Update Call Result</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Update the status and details for this lead
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleStartVerification} variant="default">
                                Start Verification
                            </Button>
                            <button
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex overflow-hidden" style={{ height: "calc(95vh - 120px)" }}>
                    {/* Left Side - Lead Details */}
                    <div className="w-1/2 border-r overflow-y-auto p-6 bg-muted/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Additional Notes & Lead Details</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(formatLeadDetails())}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </Button>
                        </div>

                        <div className="space-y-3 text-sm font-mono bg-card p-4 rounded-lg border">
                            <div>
                                <strong>Maverick:</strong> {lead.first_name || ""} {lead.last_name || ""}
                            </div>
                            <div className="h-px bg-border my-3" />
                            <div>
                                <strong>Address:</strong> {lead.address || ""}, {lead.city || ""}, {lead.state || ""} {lead.zip_code || ""}
                            </div>
                            <div>
                                <strong>Beneficiary Information:</strong>
                                <div className="ml-4 text-muted-foreground">
                                    {lead.beneficiary_info ? JSON.stringify(lead.beneficiary_info, null, 2) : "N/A"}
                                </div>
                            </div>
                            <div>
                                <strong>Billing and mailing address is the same:</strong> (Y/N)
                            </div>
                            <div>
                                <strong>Date of Birth:</strong> {lead.date_of_birth || ""}
                            </div>
                            <div>
                                <strong>Birth State:</strong> {lead.birth_state || ""}
                            </div>
                            <div>
                                <strong>Age:</strong> {lead.age || ""}
                            </div>
                            <div>
                                <strong>Number:</strong> {lead.phone_number || ""}
                            </div>
                            <div>
                                <strong>Call phone/landline:</strong>
                            </div>
                            <div>
                                <strong>Social:</strong> {lead.ssn || ""}
                            </div>
                            <div>
                                <strong>Driver License Number:</strong>
                            </div>
                            <div>
                                <strong>Exp:</strong>
                            </div>
                            <div>
                                <strong>Existing coverage:</strong> {lead.existing_coverage || ""}
                            </div>
                            <div>
                                <strong>Applied to life insurance last two years:</strong>
                            </div>
                            <div>
                                <strong>Height:</strong> {lead.height || ""}
                            </div>
                            <div>
                                <strong>Weight:</strong> {lead.weight || ""}
                            </div>
                            <div>
                                <strong>Doctors Name:</strong> {lead.doctor_name || ""}
                            </div>
                            <div>
                                <strong>Tobacco Use:</strong> {lead.tobacco_use ? "Yes" : "No"}
                            </div>
                            <div>
                                <strong>Health Conditions:</strong> {lead.health_conditions || ""}
                            </div>
                            <div>
                                <strong>Medications:</strong> {lead.medications || ""}
                            </div>
                            <div className="h-px bg-border my-3" />
                            <div>
                                <strong>Insurance Application Details:</strong>
                            </div>
                            <div>
                                <strong>Carrier:</strong>
                            </div>
                            <div>
                                <strong>Monthly Premium:</strong> $
                            </div>
                            <div>
                                <strong>Coverage Amount:</strong> $
                            </div>
                            <div>
                                <strong>Draft Date:</strong> {lead.draft_date || ""}
                            </div>
                            <div>
                                <strong>First Draft:</strong>
                            </div>
                            <div>
                                <strong>Bank Name:</strong> {lead.bank_name || ""}
                            </div>
                            <div>
                                <strong>Routing Number:</strong> {lead.routing_number || ""}
                            </div>
                            <div>
                                <strong>Account Number:</strong> {lead.account_number || ""}
                            </div>
                            <div>
                                <strong>Checking/savings account:</strong>
                            </div>
                            <div className="h-px bg-border my-3" />
                            <div>
                                <strong>ADDITIONAL NOTES:</strong>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Update Form */}
                    <div className="w-1/2 overflow-y-auto p-6">
                        <h3 className="text-lg font-semibold mb-4">Update Call Result</h3>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Application Submitted Toggle */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Was the application submitted? <span className="text-destructive">*</span>
                                </label>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="yes"
                                            {...register("application_submitted")}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Yes</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="no"
                                            {...register("application_submitted")}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">No</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="app_fix"
                                            {...register("application_submitted")}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">App Fix</span>
                                    </label>
                                </div>
                            </div>

                            {/* Conditional Section - Application Not Submitted */}
                            {applicationSubmitted === "no" && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 animate-in slide-in-from-top-2">
                                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-3">
                                        Application Not Submitted
                                    </h4>
                                </div>
                            )}

                            {/* Call Source */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Call Source <span className="text-destructive">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    {...register("call_source")}
                                >
                                    <option value="">Select call source (required)</option>
                                    {callSources.map((source) => (
                                        <option key={source} value={source}>
                                            {source}
                                        </option>
                                    ))}
                                </select>
                                {errors.call_source && (
                                    <span className="text-xs text-destructive">{errors.call_source.message}</span>
                                )}
                            </div>

                            {/* Buffer Agent */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Buffer Agent</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    {...register("buffer_agent")}
                                >
                                    <option value="">Select buffer agent (optional)</option>
                                    {agents.map((agent) => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Agent Who Took Call */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Agent who took the call <span className="text-destructive">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    {...register("agent_who_took_call")}
                                >
                                    <option value="">Select agent (required)</option>
                                    {agents.map((agent) => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.full_name}
                                        </option>
                                    ))}
                                </select>
                                {errors.agent_who_took_call && (
                                    <span className="text-xs text-destructive">{errors.agent_who_took_call.message}</span>
                                )}
                            </div>

                            {/* Status/Stage */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Status/Stage <span className="text-destructive">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    {...register("status")}
                                >
                                    <option value="">Select status (required)</option>
                                    {stages.map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.status && (
                                    <span className="text-xs text-destructive">{errors.status.message}</span>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Notes <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder={
                                        applicationSubmitted === "no"
                                            ? "Why the call got dropped or application not get submitted? Please provide the reason (required)"
                                            : "Enter call notes (required)"
                                    }
                                    {...register("notes")}
                                />
                                {errors.notes && (
                                    <span className="text-xs text-destructive">{errors.notes.message}</span>
                                )}
                            </div>

                            {/* Validation Message */}
                            {Object.keys(errors).length > 0 && (
                                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                                    Please complete all required fields: Agent who took the call, Status/Stage, Notes
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={loading} className="min-w-[150px]">
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Call Result"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

