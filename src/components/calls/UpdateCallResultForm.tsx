import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Save, Check, X, Wrench } from "lucide-react";
import { updateCallResultSchema, UpdateCallResultFormData } from "@/lib/calls/entry/schema";
import { Lead } from "@/lib/calls/entry/types";

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
            buffer_agent: "",
            agent_who_took_call: "",
            status: "",
            notes: "",
        },
    });

    const applicationSubmitted = watch("application_submitted");

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

