import { z } from "zod";

export const updateCallResultSchema = z.object({
    application_submitted: z.enum(["yes", "no", "app_fix"]),
    call_source: z.string().min(1, "Call source is required"),
    buffer_agent: z.string().optional(),
    agent_who_took_call: z.string().min(1, "Agent who took the call is required"),
    status: z.string().min(1, "Status/Stage is required"),
    notes: z.string().min(1, "Notes are required"),
    licensed_agent_account: z.string().optional(),
    carrier: z.string().optional(),
    product_type: z.string().optional(),
    draft_date: z.string().optional(),
    monthly_premium: z.number().optional(),
    coverage_amount: z.number().optional(),
    sent_to_underwriting: z.enum(["yes", "no"]).optional(),
}).refine((data) => {
    if (data.application_submitted === "yes") {
        return data.licensed_agent_account && data.carrier && data.product_type && data.draft_date && data.monthly_premium !== undefined && data.coverage_amount !== undefined;
    }
    return true;
}, {
    message: "All application fields are required when application is submitted",
    path: ["licensed_agent_account"],
});

export type UpdateCallResultFormData = z.infer<typeof updateCallResultSchema>;

