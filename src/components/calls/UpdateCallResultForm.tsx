import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Save, Check, X, Wrench } from "lucide-react";
import { updateCallResultSchema, UpdateCallResultFormData } from "@/lib/calls/entry/schema";
import { Lead } from "@/lib/calls/entry/types";
import { CALL_SOURCES, CARRIERS, PRODUCT_TYPES } from "@/lib/calls/entry/constants";

interface UpdateCallResultFormProps {
    lead: Lead;
    agents: Array<{ id: string; full_name: string }>;
    stages: Array<{ id: string; name: string; pipeline_id: string }>;
    licensedAgents: Array<{ id: string; full_name: string }>;
    loading: boolean;
    onSubmit: (data: UpdateCallResultFormData) => Promise<void>;
}

export function UpdateCallResultForm({
    lead,
    agents,
    stages,
    licensedAgents,
    loading,
    onSubmit,
}: UpdateCallResultFormProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
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
            sent_to_underwriting: "no",
        },
    });

    const applicationSubmitted = watch("application_submitted");
    const sentToUnderwriting = watch("sent_to_underwriting");

    return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Update Call Result</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                        Was the application submitted? <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setValue("application_submitted", "yes", { shouldValidate: true })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                applicationSubmitted === "yes"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                        >
                            <Check className="w-4 h-4" />
                            Yes
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue("application_submitted", "no", { shouldValidate: true })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                applicationSubmitted === "no"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                        >
                            <X className="w-4 h-4" />
                            No
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue("application_submitted", "app_fix", { shouldValidate: true })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                applicationSubmitted === "app_fix"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                        >
                            <Wrench className="w-4 h-4" />
                            App Fix
                        </button>
                    </div>
                    <input type="hidden" {...register("application_submitted")} />
                </div>

                {applicationSubmitted === "no" && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-amber-100 mb-2">
                            Application Not Submitted
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-amber-200">
                            Please provide a reason why the application was not submitted.
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Call Source <span className="text-destructive">*</span>
                    </label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...register("call_source")}
                    >
                        <option value="">Select call source</option>
                        {CALL_SOURCES.map((source) => (
                            <option key={source} value={source}>
                                {source}
                            </option>
                        ))}
                    </select>
                    {errors.call_source && (
                        <span className="text-xs text-destructive">{errors.call_source.message}</span>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Agent who took the call <span className="text-destructive">*</span>
                    </label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...register("agent_who_took_call")}
                    >
                        <option value="">Select agent</option>
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

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Status <span className="text-destructive">*</span>
                    </label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...register("status")}
                    >
                        <option value="">Select status</option>
                        {(applicationSubmitted === "yes"
                            ? stages.filter(stage => {
                                const nameLower = stage.name.toLowerCase().trim();
                                return nameLower.includes("pending") || nameLower.includes("approved");
                            })
                            : stages
                        ).map((stage) => (
                            <option key={stage.id} value={stage.id}>
                                {stage.name}
                            </option>
                        ))}
                    </select>
                    {errors.status && (
                        <span className="text-xs text-destructive">{errors.status.message}</span>
                    )}
                </div>

                {applicationSubmitted === "yes" && (
                    <div className="space-y-6 border-t border-border pt-6">
                        <h4 className="font-semibold text-foreground">Application Submitted Details</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Licensed Agent Account <span className="text-destructive">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    {...register("licensed_agent_account")}
                                >
                                    <option value="">Select licensed account</option>
                                    {licensedAgents.map((agent) => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.full_name}
                                        </option>
                                    ))}
                                </select>
                                {errors.licensed_agent_account && (
                                    <span className="text-xs text-destructive">{errors.licensed_agent_account.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Carrier Name <span className="text-destructive">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    {...register("carrier")}
                                >
                                    <option value="">Select carrier</option>
                                    {CARRIERS.map((carrier) => (
                                        <option key={carrier} value={carrier}>
                                            {carrier}
                                        </option>
                                    ))}
                                </select>
                                {errors.carrier && (
                                    <span className="text-xs text-destructive">{errors.carrier.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Product Type <span className="text-destructive">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    {...register("product_type")}
                                >
                                    <option value="">Select product type</option>
                                    {PRODUCT_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.product_type && (
                                    <span className="text-xs text-destructive">{errors.product_type.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Draft Date <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="date"
                                    {...register("draft_date")}
                                />
                                {errors.draft_date && (
                                    <span className="text-xs text-destructive">{errors.draft_date.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Monthly Premium <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...register("monthly_premium", { valueAsNumber: true })}
                                />
                                {errors.monthly_premium && (
                                    <span className="text-xs text-destructive">{errors.monthly_premium.message}</span>
                                )}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-foreground">
                                    Coverage Amount <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...register("coverage_amount", { valueAsNumber: true })}
                                />
                                {errors.coverage_amount && (
                                    <span className="text-xs text-destructive">{errors.coverage_amount.message}</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                Sent to Underwriting?
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setValue("sent_to_underwriting", "yes", { shouldValidate: true })}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        sentToUnderwriting === "yes"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-muted text-muted-foreground hover:bg-accent"
                                    }`}
                                >
                                    <Check className="w-4 h-4" />
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue("sent_to_underwriting", "no", { shouldValidate: true })}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        sentToUnderwriting === "no"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-muted text-muted-foreground hover:bg-accent"
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                    No
                                </button>
                            </div>
                            <input type="hidden" {...register("sent_to_underwriting")} />
                            {sentToUnderwriting === "yes" && (
                                <p className="text-sm text-muted-foreground">Call Result will be: Submitted</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Agent Notes <span className="text-destructive">*</span>
                    </label>
                    <textarea
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit" disabled={loading} className="min-w-[150px]">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Call Result
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

