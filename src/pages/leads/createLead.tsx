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
import { canEditLead, canSeeAssignmentSection, canCreateLead, isValidRole, type UserRole } from "@/lib/permissions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function CreateLeadPage() {
  const router = useRouter();
  const { id: leadId } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCallCenterId, setUserCallCenterId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<"back" | "cancel" | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<Partial<LeadFormData> | null>(null);
  
  // Dropdown data
  const [callCenters, setCallCenters] = useState<{id: string, name: string}[]>([]);
  const [agents, setAgents] = useState<{id: string, full_name: string, call_center_id: string | null}[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
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

  const formValues = watch();

  const normalizeValue = (value: any): any => {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value;
    return String(value).trim();
  };

  const isFormDirty = () => {
    if (!initialFormValues) return isDirty;
    
    const current = getValues();
    const initial = initialFormValues;
    
    const fieldsToCheck: (keyof LeadFormData)[] = [
      "first_name", "last_name", "date_of_birth", "ssn", "phone_number", "email",
      "address", "city", "state", "zip_code", "height", "weight", "tobacco_use",
      "health_conditions", "medications", "desired_coverage", "monthly_budget",
      "existing_coverage", "beneficiary_name", "beneficiary_relation",
      "bank_name", "routing_number", "account_number", "call_center_id", "assigned_agent_id"
    ];
    
    for (const field of fieldsToCheck) {
      const currentValue = normalizeValue(current[field]);
      const initialValue = normalizeValue(initial[field]);
      
      if (currentValue !== initialValue) {
        return true;
      }
    }
    
    return false;
  };

  const selectedCallCenterId = watch("call_center_id");

  useEffect(() => {
    const initializeData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          const role = (profile as any).role;
          if (isValidRole(role) && !canCreateLead(role)) {
            toast.error("You don't have permission to create leads. Only call center agents can create leads.");
            router.push("/leads");
            return;
          }
        }
      }
      
      await fetchDropdownData();
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
        
        // Only call center agents have call centers, sales agents don't
        if (isValidRole(role) && role === "call_center_agent") {
          if (profileData.call_center_id) {
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
            
            const { data: agentData, error: agentError } = await (supabase
              .from("profiles") as any)
              .select("id, full_name, call_center_id")
              .in("role", ["call_center_agent", "call_center_manager"])
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
            
            setAgents(finalAgentsList);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            setValue("call_center_id", profileData.call_center_id, { shouldValidate: true });
            setValue("assigned_agent_id", session.user.id, { shouldValidate: true });
            
            setTimeout(() => {
              const currentValues = getValues();
              setInitialFormValues({ ...currentValues });
            }, 200);
          }
        } else if (isValidRole(role) && canSeeAssignmentSection(role)) {
          if (!leadId) {
            await fetchSalesAgents();
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
    // Only fetch agents if user can see assignment section and role is set
    if (!userRole || !canSeeAssignmentSection(userRole)) return;
    
    if (userRole === "call_center_agent") {
      return;
    }

    // If call center is selected, fetch call center agents
    // If no call center is selected, fetch sales agents
    if (selectedCallCenterId) {
      fetchAgentsForCallCenter(selectedCallCenterId);
    } else {
      // Fetch sales agents when no call center is selected
      fetchSalesAgents();
    }
  }, [selectedCallCenterId, userRole]);

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

  useEffect(() => {
    const currentValues = getValues();
    if (!initialFormValues) {
      const defaultInitialValues: Partial<LeadFormData> = {
        first_name: "",
        last_name: "",
        date_of_birth: "",
        ssn: "",
        phone_number: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        height: "",
        weight: "",
        tobacco_use: false,
        health_conditions: "",
        medications: "",
        desired_coverage: 0,
        monthly_budget: 0,
        existing_coverage: "",
        bank_name: "",
        routing_number: "",
        account_number: "",
        beneficiary_name: "",
        beneficiary_relation: "",
        call_center_id: "",
        assigned_agent_id: "",
      };
      setInitialFormValues(defaultInitialValues);
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formValues, initialFormValues]);

  const handleCancel = () => {
    if (isFormDirty()) {
      setPendingNavigation("cancel");
      setShowConfirmModal(true);
    } else {
      router.push("/leads");
    }
  };

  const handleBack = () => {
    if (isFormDirty()) {
      setPendingNavigation("back");
      setShowConfirmModal(true);
    } else {
      router.back();
    }
  };

  const handleConfirmNavigation = () => {
    setShowConfirmModal(false);
    if (pendingNavigation === "cancel") {
      router.push("/leads");
    } else if (pendingNavigation === "back") {
      router.back();
    }
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };
  
  const fetchDropdownData = async () => {
    const { data: centers } = await supabase.from("call_centers").select("id, name");
    if (centers) setCallCenters(centers);
  };

  const fetchAgentsForCallCenter = async (callCenterId: string) => {
    if (!callCenterId) {
      // If no call center selected, fetch sales agents
      await fetchSalesAgents();
      return;
    }

    const { data: agentData, error } = await (supabase
      .from("profiles") as any)
      .select("id, full_name, call_center_id")
      .in("role", ["call_center_agent", "call_center_manager"])
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

  const fetchSalesAgents = async () => {
    try {
      const { data: agentData, error } = await (supabase
        .from("profiles") as any)
        .select("id, full_name, call_center_id")
        .in("role", ["sales_agent_licensed", "sales_agent_unlicensed", "sales_manager"])
        .order("full_name", { ascending: true });
      
      if (error) {
        console.error("Error fetching sales agents:", error);
        toast.error("Failed to load sales agents: " + error.message);
        setAgents([]);
        return;
      }
      
      const agentsList = agentData as any[] || [];
      setAgents(agentsList);
      
      if (agentsList.length === 0) {
        console.warn("No sales agents found in database");
      }
      
      const currentAgentId = getValues("assigned_agent_id");
      if (currentAgentId) {
        const currentAgent = agentsList.find((a: any) => a.id === currentAgentId);
        if (!currentAgent) {
          setValue("assigned_agent_id", "");
        }
      }
    } catch (err: any) {
      console.error("Unexpected error fetching sales agents:", err);
      toast.error("Failed to load sales agents");
      setAgents([]);
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
      // For call_center_agent and sales agents, override with their own call center and agent
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
      setInitialFormValues({ ...formData });
      
      const centerIdToFetch = userRole === "call_center_agent" && userCallCenterId ? userCallCenterId : (data as any).call_center_id;
      if (centerIdToFetch) {
        await fetchAgentsForCallCenter(centerIdToFetch);
      } else {
        // If no call center, fetch sales agents
        await fetchSalesAgents();
      }
    }
    setFetching(false);
  };


  const onSubmit = async (data: LeadFormData) => {
    setLoading(true);
    try {
      const { beneficiary_name, beneficiary_relation, call_center_id, assigned_agent_id, ...dbData } = data;
    
      const hasCallCenter = call_center_id && call_center_id !== "";
      const hasAssignedAgent = assigned_agent_id && assigned_agent_id !== "";
      
      if (!hasCallCenter && !hasAssignedAgent) {
        // If no agent is selected, try to fetch agents one more time in case they weren't loaded
        if (agents.length === 0) {
          // Fetch agents and wait for the result
          const { data: agentData, error: fetchError } = await (supabase
            .from("profiles") as any)
            .select("id, full_name, call_center_id")
            .in("role", ["sales_agent_licensed", "sales_agent_unlicensed", "sales_manager"])
            .order("full_name", { ascending: true });
          
          if (fetchError) {
            toast.error("Failed to load sales agents. Please try again or contact your administrator.");
            setLoading(false);
            return;
          }
          
          const fetchedAgents = agentData as any[] || [];
          if (fetchedAgents.length === 0) {
            toast.error("No sales agents available. Please contact your administrator to create sales agent accounts.");
            setLoading(false);
            return;
          }
          
          // Update agents state
          setAgents(fetchedAgents);
        }
        
        // Show error to select an agent
        toast.error("Please select an assigned agent from the dropdown. Agency leads (without call center) require an assigned sales agent.");
        setLoading(false);
        return;
      }
      
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
        
        if (!canCreateLead(userRole)) {
          toast.error("You don't have permission to create leads. Only call center agents can create leads.");
          setLoading(false);
          return;
        }

        if (commonData.ssn && commonData.call_center_id) {
          const { data: existingLead, error: checkError } = await supabase
            .from("leads")
            .select("id, first_name, last_name")
            .eq("ssn", commonData.ssn)
            .eq("call_center_id", commonData.call_center_id)
            .limit(1)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            throw new Error("Failed to check for duplicate leads: " + checkError.message);
          }

          if (existingLead) {
            toast.error("A lead with this SSN already exists in this call center. Duplicate leads cannot be added.");
            setLoading(false);
            return;
          }
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

      const defaultInitialValues: Partial<LeadFormData> = {
        first_name: "",
        last_name: "",
        date_of_birth: "",
        ssn: "",
        phone_number: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        height: "",
        weight: "",
        tobacco_use: false,
        health_conditions: "",
        medications: "",
        desired_coverage: 0,
        monthly_budget: 0,
        existing_coverage: "",
        bank_name: "",
        routing_number: "",
        account_number: "",
        beneficiary_name: "",
        beneficiary_relation: "",
        call_center_id: "",
        assigned_agent_id: "",
      };
      reset(defaultInitialValues);
      setInitialFormValues(defaultInitialValues);
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
          <Button variant="ghost" onClick={handleBack} className="p-2">
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
                  <label className="text-sm font-medium text-foreground">Call Center (Optional)</label>
                  <select
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${!canSeeAssignmentSection(userRole) || userRole === "sales_agent_licensed" || userRole === "sales_agent_unlicensed" ? "opacity-60 cursor-not-allowed" : ""}`}
                  {...register("call_center_id")}
                  disabled={!canSeeAssignmentSection(userRole) || userRole === "sales_agent_licensed" || userRole === "sales_agent_unlicensed"}
                  >
                    <option value="">No Call Center (Agency Lead)</option>
                    {callCenters.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {selectedCallCenterId 
                      ? "Select an agent from this call center" 
                      : "Select a sales agent to assign this lead"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Assigned Agent {!selectedCallCenterId && "(Required)"}</label>
                  <select
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${!canSeeAssignmentSection(userRole) ? "opacity-60 cursor-not-allowed" : ""}`}
                  {...register("assigned_agent_id")}
                  disabled={!canSeeAssignmentSection(userRole)}
                  >
                    <option value="">
                      {selectedCallCenterId 
                        ? "Select Call Center Agent..." 
                        : "Select Sales Agent..."}
                    </option>
                    {agents.length > 0 ? (
                      agents.map(a => (
                        <option key={a.id} value={a.id}>{a.full_name}</option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {selectedCallCenterId 
                          ? "No call center agents available" 
                          : "No sales agents available"}
                      </option>
                    )}
                  </select>
                  {!selectedCallCenterId && (
                    <p className="text-xs text-muted-foreground">
                      This lead will be assigned to a sales agent (agency lead)
                    </p>
                  )}
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
            <Button type="button" variant="outline" onClick={handleCancel}>
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

        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={handleCancelNavigation}
          onConfirm={handleConfirmNavigation}
          title="Unsaved Changes"
          description="You have unsaved changes. Are you sure you want to leave? All your progress will be lost."
          confirmText="Leave"
          cancelText="Stay"
          variant="destructive"
        />
      </div>
    </DashboardLayout>
  );
}

