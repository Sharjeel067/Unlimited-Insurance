import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, LeadFormData } from "@/types/lead";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/router";
import { canEditLead, canSeeAssignmentSection, isValidRole, type UserRole } from "@/lib/permissions";

export default function CreateLeadPage() {
  const router = useRouter();
  const { id: leadId } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCallCenterId, setUserCallCenterId] = useState<string | null>(null);
  
  // Dropdown data
  const [callCenters, setCallCenters] = useState<{id: string, name: string}[]>([]);
  const [agents, setAgents] = useState<{id: string, full_name: string, call_center_id: string | null}[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema) as any,
    defaultValues: {
      tobacco_use: false,
    },
  });

  const selectedCallCenterId = watch("call_center_id");

  useEffect(() => {
    const initializeData = async () => {
      // Fetch call centers first
      await fetchDropdownData();
      // Then check user (which will use the call centers list)
      await checkUser();
    };
    initializeData();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, call_center_id, manager_id, avatar_url, status, created_at, updated_at")
        .eq("id", session.user.id)
        .single();
      
      if (profile) {
        const profileData = profile as any;
        
        // Save user info to localStorage
        const userInfo = {
          id: session.user.id,
          email: profileData.email,
          full_name: profileData.full_name,
          role: profileData.role,
          call_center_id: profileData.call_center_id,
          manager_id: profileData.manager_id,
          avatar_url: profileData.avatar_url,
          status: profileData.status,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
        };
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        
        const role = profileData.role;
        if (isValidRole(role)) {
          setUserRole(role);
        }
        setUserCallCenterId(profileData.call_center_id);
        
        // Auto-set call center and assigned agent for call_center_agent
        if (isValidRole(role) && role === "call_center_agent") {
          if (profileData.call_center_id) {
            // Fetch call center name to ensure it's in the dropdown options
            const { data: callCenterData } = await supabase
              .from("call_centers")
              .select("id, name")
              .eq("id", profileData.call_center_id)
              .single();
            
            // If call center not in list, add it
            if (callCenterData) {
              setCallCenters(prev => {
                const exists = prev.find(c => c.id === (callCenterData as any).id);
                if (!exists) {
                  return [...prev, { id: (callCenterData as any).id, name: (callCenterData as any).name }];
                }
                return prev;
              });
            }
            
            // Fetch agents for the call center directly
            const { data: agentData, error: agentError } = await (supabase
              .from("profiles") as any)
              .select("id, full_name, call_center_id")
              .in("role", ["call_center_agent", "sales_agent_licensed", "sales_agent_unlicensed"])
              .eq("call_center_id", profileData.call_center_id);
            
            if (agentError) {
              console.error("Error fetching agents:", agentError);
            }
            
            // Ensure the current user is in the agents list
            let finalAgentsList = (agentData as any[]) || [];
            const userExists = finalAgentsList.find((a: any) => a.id === session.user.id);
            if (!userExists && profileData.full_name) {
              finalAgentsList = [...finalAgentsList, {
                id: session.user.id,
                full_name: profileData.full_name,
                call_center_id: profileData.call_center_id
              }];
            }
            
            // Set the agents list
            setAgents(finalAgentsList);
            
            // Wait a moment for state to update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Then set the values so the dropdowns show the selected options
            setValue("call_center_id", profileData.call_center_id, { shouldValidate: true });
            // Set the agent as themselves
            setValue("assigned_agent_id", session.user.id, { shouldValidate: true });
          }
        }
      }
    }
  };

  useEffect(() => {
    if (leadId && userId && userRole !== null) {
      setFetching(true);
      fetchLeadData(leadId as string);
    } else if (!leadId) {
      setFetching(false);
    }
  }, [leadId, userId, userRole]);

  useEffect(() => {
    if (selectedCallCenterId && userRole !== "call_center_agent") {
      fetchAgentsForCallCenter(selectedCallCenterId);
    }
  }, [selectedCallCenterId, userRole]);

  // Auto-set assigned agent for call_center_agent when agents list is populated
  useEffect(() => {
    if (userRole === "call_center_agent" && userId && agents.length > 0 && !leadId) {
      const userInList = agents.find(a => a.id === userId);
      if (userInList) {
        const currentValue = getValues("assigned_agent_id");
        if (currentValue !== userId) {
          setValue("assigned_agent_id", userId, { shouldValidate: true });
        }
      }
    }
  }, [agents, userId, userRole, leadId]);
  
  const fetchDropdownData = async () => {
    const { data: centers } = await supabase.from("call_centers").select("id, name");
    if (centers) setCallCenters(centers);
  };

  const fetchAgentsForCallCenter = async (callCenterId: string) => {
    const { data: agentData, error } = await (supabase
      .from("profiles") as any)
      .select("id, full_name, call_center_id")
      .in("role", ["call_center_agent", "sales_agent_licensed", "sales_agent_unlicensed"])
      .eq("call_center_id", callCenterId);
    
    if (error) {
      console.error("Error fetching agents for call center:", error);
      toast.error("Failed to load agents");
    } else {
      setAgents(agentData as any || []);
      
      const currentAgentId = getValues("assigned_agent_id");
      if (currentAgentId) {
        const currentAgent = agentData?.find((a: any) => a.id === currentAgentId);
        if (!currentAgent) {
          setValue("assigned_agent_id", "");
        }
      }
    }
  };

  const fetchLeadData = async (id: string) => {
    setFetching(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching lead:", error);
      toast.error("Failed to load lead data");
      router.push("/leads");
      return;
    }

    // Check if user can edit this lead
    if (data && userRole && userId && !canEditLead(userRole, userId, data as any, userCallCenterId)) {
      toast.error("You don't have permission to edit this lead");
      router.push("/leads");
      return;
    }

    if (data) {
      // For call_center_agent, override with their own call center and agent
      let callCenterId = (data as any).call_center_id || "";
      let assignedAgentId = (data as any).assigned_agent_id || "";
      
      if (userRole === "call_center_agent" && userCallCenterId && userId) {
        callCenterId = userCallCenterId;
        assignedAgentId = userId;
      }
      
      // Populate form
      const formData = {
        first_name: (data as any).first_name || "",
        last_name: (data as any).last_name || "",
        date_of_birth: (data as any).date_of_birth || "",
        ssn: (data as any).ssn || "",
        phone_number: (data as any).phone_number || "",
        email: (data as any).email || "",
        address: (data as any).address || "",
        city: (data as any).city || "",
        state: (data as any).state || "",
        zip_code: (data as any).zip_code || "",
        height: (data as any).height || "",
        weight: (data as any).weight || "",
        tobacco_use: (data as any).tobacco_use || false,
        health_conditions: (data as any).health_conditions || "",
        medications: (data as any).medications || "",
        desired_coverage: (data as any).desired_coverage || 0,
        monthly_budget: (data as any).monthly_budget || 0,
        existing_coverage: (data as any).existing_coverage || "",
        bank_name: (data as any).bank_name || "",
        routing_number: (data as any).routing_number || "",
        account_number: (data as any).account_number || "",
        beneficiary_name: ((data as any).beneficiary_info as any)?.name || "",
        beneficiary_relation: ((data as any).beneficiary_info as any)?.relation || "",
        call_center_id: callCenterId,
        assigned_agent_id: assignedAgentId,
      };
      reset(formData);
      
      // Fetch agents for the call center (use user's call center if call_center_agent)
      const centerIdToFetch = userRole === "call_center_agent" && userCallCenterId ? userCallCenterId : (data as any).call_center_id;
      if (centerIdToFetch) {
        await fetchAgentsForCallCenter(centerIdToFetch);
      } else {
        setAgents([]);
      }
    }
    setFetching(false);
  };


  const onSubmit = async (data: LeadFormData) => {
    setLoading(true);
    try {
      const { beneficiary_name, beneficiary_relation, call_center_id, assigned_agent_id, ...dbData } = data;
      
      const commonData = {
        ...dbData,
        beneficiary_info: {
            name: beneficiary_name,
            relation: beneficiary_relation
        },
        call_center_id: call_center_id && call_center_id !== "" ? call_center_id : null,
        assigned_agent_id: assigned_agent_id && assigned_agent_id !== "" ? assigned_agent_id : null,
      };

      if (leadId) {
        // Check if user can edit this lead
        if (userRole && userId) {
          const { data: existingLead } = await supabase
            .from("leads")
            .select("assigned_agent_id, user_id, call_center_id")
            .eq("id", leadId)
            .single();
          
          if (existingLead && !canEditLead(userRole, userId, existingLead as any, userCallCenterId)) {
            toast.error("You don't have permission to update this lead");
            setLoading(false);
            return;
          }
        }

        if (userRole === "call_center_agent" && userCallCenterId && userId) {
          commonData.call_center_id = userCallCenterId;
          commonData.assigned_agent_id = userId;
        }

        const { error } = await (supabase.from("leads") as any)
          .update(commonData)
          .eq("id", leadId);

        if (error) throw error;
        toast.success("Lead updated successfully");

      } else {
        if (userRole === "call_center_agent" && userCallCenterId && userId) {
          commonData.call_center_id = userCallCenterId;
          commonData.assigned_agent_id = userId;
        }
        
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

        const { error } = await (supabase.from("leads") as any).insert({
          ...commonData,
          submission_id: `SUB-${Date.now()}`, 
          pipeline_id: (firstPipeline as any).id,
          stage_id: (firstStage as any).id,
        });

        if (error) throw error;
        toast.success("Lead created successfully");
      }

      router.push("/leads");
    } catch (error: any) {
      console.error("Error saving lead:", error);
      toast.error("Failed to save lead: " + error.message);
    } finally {
      setLoading(false);
    }
  };


  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>{leadId ? "Edit Lead" : "Create Lead"} - CRM</title>
      </Head>

      <div className="max-w-6xl mx-auto pb-10">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{leadId ? "Edit Lead" : "Create New Lead"}</h1>
            <p className="text-muted-foreground text-sm">
              {leadId ? "Update the information below." : "Fill out the form below to add a new lead to the system."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Assignment Information - Shown only to users with assign/reassign permissions */}
          {canSeeAssignmentSection(userRole) && (
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
                Assignment
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Call Center</label>
                  <select
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${!canSeeAssignmentSection(userRole) ? "opacity-60 cursor-not-allowed" : ""}`}
                  {...register("call_center_id")}
                  disabled={!canSeeAssignmentSection(userRole)}
                  >
                    <option value="">Select Call Center...</option>
                    {callCenters.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Assigned Agent</label>
                  <select
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${!canSeeAssignmentSection(userRole) ? "opacity-60 cursor-not-allowed" : ""}`}
                  {...register("assigned_agent_id")}
                  disabled={!canSeeAssignmentSection(userRole) || (canSeeAssignmentSection(userRole) && !selectedCallCenterId)}
                  >
                    <option value="">{selectedCallCenterId ? "Select Agent..." : "Select Call Center first"}</option>
                    {agents.length > 0 ? (
                      agents.map(a => (
                        <option key={a.id} value={a.id}>{a.full_name}</option>
                      ))
                    ) : (
                      <option value="" disabled>No agents available</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First Name *</label>
                <Input {...register("first_name")} placeholder="John" />
                {errors.first_name && <span className="text-xs text-destructive">{errors.first_name.message}</span>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Name *</label>
                <Input {...register("last_name")} placeholder="Doe" />
                {errors.last_name && <span className="text-xs text-destructive">{errors.last_name.message}</span>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date of Birth *</label>
                <Input type="date" {...register("date_of_birth")} />
                {errors.date_of_birth && <span className="text-xs text-destructive">{errors.date_of_birth.message}</span>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">SSN *</label>
                <Input {...register("ssn")} placeholder="XXX-XX-XXXX" />
                {errors.ssn && <span className="text-xs text-destructive">{errors.ssn.message}</span>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone *</label>
                <Input {...register("phone_number")} placeholder="(555) 123-4567" />
                {errors.phone_number && <span className="text-xs text-destructive">{errors.phone_number.message}</span>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input {...register("email")} placeholder="john@example.com" />
                {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Address *</label>
                <Input {...register("address")} placeholder="123 Main St" />
                {errors.address && <span className="text-xs text-destructive">{errors.address.message}</span>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City *</label>
                <Input {...register("city")} />
                {errors.city && <span className="text-xs text-destructive">{errors.city.message}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">State *</label>
                  <Input {...register("state")} placeholder="NY" maxLength={2} />
                  {errors.state && <span className="text-xs text-destructive">{errors.state.message}</span>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Zip *</label>
                  <Input {...register("zip_code")} />
                  {errors.zip_code && <span className="text-xs text-destructive">{errors.zip_code.message}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
              Medical Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Height</label>
                <Input {...register("height")} placeholder="5'10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Weight (lbs)</label>
                <Input {...register("weight")} placeholder="180" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                <input 
                  type="checkbox" 
                  id="tobacco" 
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" 
                  {...register("tobacco_use")} 
                />
                <label htmlFor="tobacco" className="text-sm font-medium text-foreground cursor-pointer">
                  Is the applicant a tobacco user?
                </label>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Health Conditions</label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="List all known health conditions..."
                  {...register("health_conditions")}
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Medications</label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="List current medications..."
                  {...register("medications")}
                />
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
              Insurance Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Desired Coverage ($)</label>
                <Input 
                  type="number" 
                  {...register("desired_coverage", { valueAsNumber: true })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Monthly Budget ($)</label>
                <Input 
                  type="number" 
                  {...register("monthly_budget", { valueAsNumber: true })} 
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Existing Coverage</label>
                <Input {...register("existing_coverage")} placeholder="Company Name / Amount" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Beneficiary Name</label>
                <Input {...register("beneficiary_name")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Relationship to Applicant</label>
                <Input {...register("beneficiary_relation")} />
              </div>
            </div>
          </div>

          {/* Banking Information */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
              Banking Information
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Bank Name</label>
                <Input {...register("bank_name")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Routing Number</label>
                  <Input {...register("routing_number")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Account Number</label>
                  <Input {...register("account_number")} />
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border-2 border-amber-300 dark:border-amber-800/50 text-sm">
                <p className="font-semibold text-foreground">⚠ Compliance Notice</p>
                <p className="mt-1 text-foreground">Ensure the customer has explicitly consented to the draft on the recorded line before submitting this information.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[150px]">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {leadId ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {leadId ? "Save Changes" : "Create Lead"}
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}

