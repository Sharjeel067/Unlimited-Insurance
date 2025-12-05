import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema for the form
const callLogSchema = z.object({
    status: z.string().min(1, "Status is required"),
    notes: z.string().optional(),
    // Daily Deal fields (conditional)
    carrier: z.string().optional(),
    product_type: z.string().optional(),
    monthly_premium: z.number().optional(),
    face_amount: z.number().optional(),
    draft_date: z.string().optional(),
    bank_name: z.string().optional(),
    account_number: z.string().optional(),
    routing_number: z.string().optional(),
});

type CallLogFormData = z.infer<typeof callLogSchema>;

interface CallLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: {
        id: string;
        first_name: string;
        last_name: string;
        phone_number: string;
        assigned_agent_id: string | null;
        call_center_id: string | null;
    };
    onSuccess: () => void;
}

export function CallLogModal({ isOpen, onClose, lead, onSuccess }: CallLogModalProps) {
    const [loading, setLoading] = useState(false);
    const [isSale, setIsSale] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<CallLogFormData>({
        resolver: zodResolver(callLogSchema),
        defaultValues: {
            status: "",
            notes: "",
        },
    });

    const selectedStatus = watch("status");

    useEffect(() => {
        // Check if selected status implies a sale/submission
        const saleStatuses = ["Sale", "Submission", "Application Taken"];
        setIsSale(saleStatuses.includes(selectedStatus));
    }, [selectedStatus]);

    const onSubmit = async (data: CallLogFormData) => {
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
                    agent_id: session.user.id,
                    status: data.status,
                    notes: data.notes || null,
                    submission_id: isSale ? submissionId : null,
                    created_at: timestamp,
                } as any);

            if (callResultError) throw callResultError;

            // 2. If Sale, insert into daily_deal_flow
            if (isSale) {
                const { error: dealError } = await supabase
                    .from("daily_deal_flow")
                    .insert({
                        submission_id: submissionId,
                        date: new Date().toISOString().split('T')[0],
                        client_phone_number: lead.phone_number,
                        insured_name: `${lead.first_name} ${lead.last_name}`,
                        agent: session.user.email || null,
                        status: "Pending",
                        call_result: data.status,
                        carrier: data.carrier || null,
                        product_type: data.product_type || null,
                        monthly_premium: data.monthly_premium || null,
                        face_amount: data.face_amount || null,
                        draft_date: data.draft_date || null,
                        notes: data.notes || null,
                    } as any);

                if (dealError) throw dealError;

                // 3. Update Lead status/stage (Optional but recommended)
                // Find "Sold" or "Application Taken" stage in current pipeline?
                // For now, let's just update the lead's status field if it exists, or leave it to manual update
            }

            toast.success("Call logged successfully");
            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error logging call:", error);
            toast.error("Failed to log call: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Log Call Result</DialogTitle>
                    <DialogDescription>
                        Record the outcome of your call with {lead.first_name} {lead.last_name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Call Result *</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            {...register("status")}
                        >
                            <option value="">Select Result...</option>
                            <option value="No Answer">No Answer</option>
                            <option value="Left Voicemail">Left Voicemail</option>
                            <option value="Bad Number">Bad Number</option>
                            <option value="Not Interested">Not Interested</option>
                            <option value="Callback Scheduled">Callback Scheduled</option>
                            <option value="Sale">Sale / Application Taken</option>
                            <option value="Submission">Submission</option>
                        </select>
                        {errors.status && <span className="text-xs text-destructive">{errors.status.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notes</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter call notes..."
                            {...register("notes")}
                        />
                    </div>

                    {/* Conditional Fields for Sales */}
                    {isSale && (
                        <div className="space-y-4 border-t pt-4 mt-4 animate-in slide-in-from-top-2">
                            <h4 className="font-semibold text-sm text-primary">Deal Details</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Carrier</label>
                                    <Input {...register("carrier")} placeholder="e.g. Aetna" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Product</label>
                                    <Input {...register("product_type")} placeholder="e.g. Whole Life" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Monthly Premium ($)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register("monthly_premium", { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Face Amount ($)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register("face_amount", { valueAsNumber: true })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Draft Date</label>
                                <Input type="date" {...register("draft_date")} />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Log
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
