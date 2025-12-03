import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, LeadFormData } from "@/types/lead";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Loader2, Plus, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadFormModalProps {
  onLeadCreated: () => void;
}

const STEPS = ["Personal", "Medical", "Insurance", "Banking"];
const DRAFT_KEY = "lead_form_draft";

export function LeadFormModal({ onLeadCreated }: LeadFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema) as any,
    defaultValues: {
      tobacco_use: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      reset({}, { keepDefaultValues: false });
      setCurrentStep(0);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true);
    setIsSubmitting(true);
    try {
      const { data: firstPipeline, error: pipelineError } = await supabase
        .from("pipelines")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (pipelineError) throw new Error("Failed to fetch default pipeline: " + pipelineError.message);
      if (!firstPipeline) throw new Error("No pipeline found. Please create a pipeline first.");

      const { data: firstStage, error: stageError } = await supabase
        .from("stages")
        .select("id")
        .eq("pipeline_id", (firstPipeline as any).id)
        .order("order_index", { ascending: true })
        .limit(1)
        .single();

      if (stageError) throw new Error("Failed to fetch default stage: " + stageError.message);
      if (!firstStage) throw new Error("No stage found in the default pipeline.");

      const { beneficiary_name, beneficiary_relation, ...dbData } = data;
      
      const { error } = await supabase.from("leads").insert({
        ...dbData,
        submission_id: `SUB-${Date.now()}`, 
        pipeline_id: (firstPipeline as any).id,
        stage_id: (firstStage as any).id,
        beneficiary_info: {
            name: beneficiary_name,
            relation: beneficiary_relation
        }
      } as any);

      if (error) throw error;

      setIsOpen(false);
      toast.success("Lead created successfully");
      onLeadCreated();
    } catch (error: any) {
      console.error("Error creating lead:", error);
      toast.error("Failed to create lead: " + error.message);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fields as any);
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 0: return ["first_name", "last_name", "phone_number", "address", "city", "state", "zip_code", "date_of_birth", "ssn"];
      case 1: return ["height", "weight", "health_conditions", "medications"];
      case 2: return ["desired_coverage", "monthly_budget", "beneficiary_name"];
      case 3: return ["bank_name", "routing_number", "account_number"];
      default: return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[90vh] sm:h-auto flex flex-col" key={isOpen ? 'open' : 'closed'}>
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]} Information
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
            {STEPS.map((_, idx) => (
                <div 
                    key={idx}
                    className={cn(
                        "h-2 flex-1 rounded-full transition-colors",
                        idx <= currentStep ? "bg-primary" : "bg-secondary"
                    )}
                />
            ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto py-2 px-1">
          <div className="space-y-4">
            
            {/* STEP 0: PERSONAL */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-sm font-medium">First Name *</label>
                  <Input {...register("first_name")} placeholder="John" />
                  {errors.first_name && <span className="text-xs text-destructive">{errors.first_name.message}</span>}
                </div>
                <div className="sm:col-span-1">
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input {...register("last_name")} placeholder="Doe" />
                  {errors.last_name && <span className="text-xs text-destructive">{errors.last_name.message}</span>}
                </div>
                <div className="sm:col-span-1">
                  <label className="text-sm font-medium">Date of Birth *</label>
                  <Input type="date" {...register("date_of_birth")} />
                  {errors.date_of_birth && <span className="text-xs text-destructive">{errors.date_of_birth.message}</span>}
                </div>
                <div className="sm:col-span-1">
                  <label className="text-sm font-medium">SSN *</label>
                  <Input {...register("ssn")} placeholder="XXX-XX-XXXX" />
                  {errors.ssn && <span className="text-xs text-destructive">{errors.ssn.message}</span>}
                </div>
                <div className="sm:col-span-1">
                    <label className="text-sm font-medium">Phone *</label>
                    <Input {...register("phone_number")} placeholder="(555) 123-4567" />
                    {errors.phone_number && <span className="text-xs text-destructive">{errors.phone_number.message}</span>}
                </div>
                <div className="sm:col-span-1">
                    <label className="text-sm font-medium">Email</label>
                    <Input {...register("email")} placeholder="john@example.com" />
                    {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
                </div>
                <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Address *</label>
                    <Input {...register("address")} placeholder="123 Main St" />
                    {errors.address && <span className="text-xs text-destructive">{errors.address.message}</span>}
                </div>
                <div className="sm:col-span-1">
                    <label className="text-sm font-medium">City *</label>
                    <Input {...register("city")} />
                    {errors.city && <span className="text-xs text-destructive">{errors.city.message}</span>}
                </div>
                <div className="flex gap-4 sm:col-span-1">
                    <div className="flex-1">
                        <label className="text-sm font-medium">State *</label>
                        <Input {...register("state")} placeholder="NY" maxLength={2} />
                        {errors.state && <span className="text-xs text-destructive">{errors.state.message}</span>}
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium">Zip *</label>
                        <Input {...register("zip_code")} />
                        {errors.zip_code && <span className="text-xs text-destructive">{errors.zip_code.message}</span>}
                    </div>
                </div>
              </div>
            )}

            {/* STEP 1: MEDICAL */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="sm:col-span-1">
                    <label className="text-sm font-medium">Height</label>
                    <Input {...register("height")} placeholder="5'10" />
                </div>
                <div className="sm:col-span-1">
                    <label className="text-sm font-medium">Weight (lbs)</label>
                    <Input {...register("weight")} placeholder="180" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="tobacco" className="w-4 h-4" {...register("tobacco_use")} />
                    <label htmlFor="tobacco" className="text-sm font-medium">Tobacco User?</label>
                </div>
                <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Health Conditions</label>
                    <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="List conditions..."
                        {...register("health_conditions")}
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Medications</label>
                    <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="List medications..."
                        {...register("medications")}
                    />
                </div>
              </div>
            )}

            {/* STEP 2: INSURANCE */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-1">
                    <label className="text-sm font-medium">Desired Coverage ($)</label>
                    <Input 
                        type="number" 
                        {...register("desired_coverage", { valueAsNumber: true })} 
                    />
                </div>
                <div className="sm:col-span-1">
                    <label className="text-sm font-medium">Monthly Budget ($)</label>
                    <Input 
                        type="number" 
                        {...register("monthly_budget", { valueAsNumber: true })} 
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Existing Coverage</label>
                    <Input {...register("existing_coverage")} placeholder="Company Name / Amount" />
                </div>
                <div className="sm:col-span-1">
                    <label className="text-sm font-medium">Beneficiary Name</label>
                    <Input {...register("beneficiary_name")} />
                </div>
                 <div className="sm:col-span-1">
                    <label className="text-sm font-medium">Relationship</label>
                    <Input {...register("beneficiary_relation")} />
                </div>
              </div>
            )}

            {/* STEP 3: BANKING */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="text-sm font-medium">Bank Name</label>
                    <Input {...register("bank_name")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Routing Number</label>
                        <Input {...register("routing_number")} />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Account Number</label>
                        <Input {...register("account_number")} />
                    </div>
                </div>
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md text-xs text-yellow-800 dark:text-yellow-200 mt-4">
                    <p>Ensure the customer has consented to the draft on the recording.</p>
                 </div>
              </div>
            )}

          </div>
        </form>

        {/* Footer Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={currentStep === 0 || loading}
            >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
                <Button onClick={nextStep} type="button">
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            ) : (
                <Button onClick={handleSubmit(onSubmit as any)} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Lead
                </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

