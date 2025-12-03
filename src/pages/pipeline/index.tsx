import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Phone, MapPin, DollarSign, User, Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LeadDetailModal } from "@/components/leads/LeadDetailModal";
import { CreatePipelineModal } from "@/components/CreatePipelineModal";
import { CreateStageModal } from "@/components/CreateStageModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { getContrastTextColor } from "@/lib/utils";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { getLeadsViewFilter, canDragDropInPipeline, isPipelineReadOnly, canManagePipelineStages, isValidRole, type UserRole } from "@/lib/permissions";

interface Pipeline {
  id: string;
  name: string;
  type: string;
  created_at?: string;
}

interface Stage {
  id: string;
  name: string;
  color_code: string;
  pipeline_id: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  stage_id: string | null;
  pipeline_id: string | null;
  lead_value: number;
  assigned_agent_id: string | null;
  phone_number?: string;
  state?: string;
  created_at?: string;
  profiles?: { full_name: string };
  stages?: Stage;
  [key: string]: any;
}

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  stages: Stage[];
  isReadOnly?: boolean;
}

function LeadCard({ lead, onClick, stages, isReadOnly = false }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, disabled: isReadOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const leadStage = lead.stage_id ? stages.find(s => s.id === lead.stage_id) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isReadOnly ? {} : attributes)}
      {...(isReadOnly ? {} : listeners)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`bg-card p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-all ${isReadOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="font-medium text-foreground text-sm mb-2">
        {lead.first_name} {lead.last_name}
      </div>
      
      {leadStage && (
        <div className="mb-2">
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
            style={{ 
              backgroundColor: leadStage.color_code,
              color: getContrastTextColor(leadStage.color_code)
            }}
          >
            {leadStage.name}
          </span>
        </div>
      )}
      
      <div className="space-y-1.5 text-xs">
        {lead.phone_number && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span className="truncate">{lead.phone_number}</span>
          </div>
        )}
        
        {lead.state && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {lead.state}
          </div>
        )}
        
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="w-3 h-3" />
          <span className="truncate">{lead.profiles?.full_name || "Unassigned"}</span>
        </div>
        
        {lead.lead_value > 0 && (
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold pt-1">
            <DollarSign className="w-3 h-3" />
            ${lead.lead_value.toLocaleString()}
          </div>
        )}
        
        {lead.created_at && (
          <div className="text-muted-foreground pt-1 border-t border-border/50 mt-1.5">
            {format(new Date(lead.created_at), "MMM d")}
          </div>
        )}
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  pipeline: Pipeline;
  leads: Lead[];
  onLeadClick: (leadId: string) => void;
  isOver?: boolean;
  stages: Stage[];
  userRole: UserRole | null;
  onDelete?: (pipelineId: string, pipelineName: string) => void;
}

function DroppableColumn({ id, pipeline, leads, onLeadClick, isOver, stages, userRole, onDelete }: DroppableColumnProps) {
  const { setNodeRef, isOver: droppableIsOver } = useDroppable({ id });

  const protectedPipelines = ["Transfer Portal", "Customer Pipeline", "Chargeback Pipeline", "Marketing Pipeline"];
  const canDelete = canManagePipelineStages(userRole) && !protectedPipelines.includes(pipeline.name);

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 bg-secondary/50 dark:bg-secondary/10 rounded-lg p-4 flex flex-col transition-all border border-border/50 h-full ${
        isOver || droppableIsOver ? "ring-2 ring-primary ring-offset-2 bg-primary/5 dark:bg-primary/10" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="font-semibold text-foreground">{pipeline.name}</h3>
        <div className="flex items-center gap-2">
        <span className="bg-background text-muted-foreground text-xs px-2 py-1 rounded-full border border-border">
          {leads.length}
        </span>
          {canDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(pipeline.id, pipeline.name);
              }}
              className="text-destructive hover:text-destructive/80 transition-colors p-1"
              title="Delete Pipeline"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <SortableContext
        items={leads.map(l => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden min-h-0 pr-1">
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead.id)}
              stages={stages}
              isReadOnly={userRole === "call_center_agent"}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

interface DroppableStageColumnProps {
  id: string;
  stage: Stage;
  leads: Lead[];
  onLeadClick: (leadId: string) => void;
  isOver?: boolean;
  stages: Stage[];
  userRole: string | null;
}

function DroppableStageColumn({ id, stage, leads, onLeadClick, isOver, stages, userRole }: DroppableStageColumnProps) {
  const { setNodeRef, isOver: droppableIsOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[280px] bg-secondary/50 dark:bg-secondary/10 rounded-lg p-4 flex flex-col transition-all border-2 h-full ${
        isOver || droppableIsOver ? "ring-2 ring-primary ring-offset-2 bg-primary/5 dark:bg-primary/10" : ""
      }`}
      style={{ 
        borderColor: stage.color_code,
      }}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{stage.name}</h3>
        </div>
        <span 
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ 
            backgroundColor: stage.color_code,
            color: getContrastTextColor(stage.color_code)
          }}
        >
          {leads.length}
        </span>
      </div>
      
      <SortableContext
        items={leads.map(l => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden min-h-0 pr-1">
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead.id)}
              stages={stages}
              isReadOnly={userRole === "call_center_agent"}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "stages">("pipeline");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [isPipelineDropdownOpen, setIsPipelineDropdownOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    pipelineId: string | null;
    pipelineName: string;
  }>({
    isOpen: false,
    pipelineId: null,
    pipelineName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchData = async () => {
    setLoading(true);

    const { data: pipelinesData } = await supabase
        .from("pipelines")
      .select("*")
      .order("created_at", { ascending: true });

    if (pipelinesData) setPipelines(pipelinesData as any);

    const { data: stagesData } = await supabase
      .from("stages")
      .select("*")
      .order("order_index", { ascending: true });

    if (stagesData) setStages(stagesData as any);

    // Get current user for filtering
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const role = (profile as any)?.role;
    const callCenterId = (profile as any)?.call_center_id;

    if (!isValidRole(role)) {
      setLoading(false);
      return;
    }

    // Build leads query
    let leadsQuery = supabase
      .from("leads")
      .select(`
        *,
        profiles:assigned_agent_id ( full_name )
      `);

    // Apply role-based filtering
    const filter = getLeadsViewFilter(role, session.user.id);
    if (filter.filterBy === "assigned_agent_id" && filter.value) {
      leadsQuery = leadsQuery.eq("assigned_agent_id", filter.value);
    } else if (filter.filterBy === "call_center_id" && callCenterId) {
      leadsQuery = leadsQuery.eq("call_center_id", callCenterId);
    } else if (filter.filterBy === "user_id" && filter.value) {
      leadsQuery = leadsQuery.eq("user_id", filter.value);
    }
    // If filterBy is "all" or null, no filter is applied (show all leads)

    const { data: leadsData } = await leadsQuery;
    
    if (leadsData) setLeads(leadsData as any);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines]);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        const role = (profile as any).role;
        if (isValidRole(role)) {
          setUserRole(role);
        }
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      if (activeTab === "pipeline") {
        const isPipeline = pipelines.some(p => p.id === over.id);
        if (isPipeline) {
          setOverId(over.id as string);
        } else {
          const overLead = leads.find(l => l.id === over.id);
          if (overLead && overLead.pipeline_id) {
            setOverId(overLead.pipeline_id);
          } else {
            setOverId(null);
          }
        }
      } else {
        const isStage = stages.some(s => s.id === over.id);
        if (isStage) {
          setOverId(over.id as string);
        } else {
          const overLead = leads.find(l => l.id === over.id);
          if (overLead && overLead.stage_id) {
            setOverId(overLead.stage_id);
          } else {
            setOverId(null);
          }
        }
      }
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    // Disable drag and drop if user doesn't have permission
    if (!canDragDropInPipeline(userRole)) {
      return;
    }
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const leadId = active.id as string;

    if (activeTab === "pipeline") {
      let newPipelineId = over.id as string;
      const isDroppingOnPipeline = pipelines.some(p => p.id === newPipelineId);
      
      if (!isDroppingOnPipeline) {
        const overLead = leads.find(l => l.id === newPipelineId);
        if (overLead && overLead.pipeline_id) {
          newPipelineId = overLead.pipeline_id;
        } else {
          return;
        }
      }

      const lead = leads.find(l => l.id === leadId);
      if (!lead || lead.pipeline_id === newPipelineId) return;

      const pipelineStages = stages.filter(s => s.pipeline_id === newPipelineId);
      const sortedStages = pipelineStages.sort((a, b) => ((a as any).order_index || 0) - ((b as any).order_index || 0));
      const defaultStage = sortedStages[0];

      if (!defaultStage) {
        console.error("No default stage found for pipeline");
        const { data: fetchedStage, error: stageError } = await supabase
          .from("stages")
          .select("id")
          .eq("pipeline_id", newPipelineId)
          .order("order_index", { ascending: true })
          .limit(1)
          .single();

        if (stageError || !fetchedStage) {
          console.error("Failed to fetch default stage", stageError);
          fetchData();
          return;
        }

        // Use fetched stage
        setLeads(prev => prev.map(l => 
          l.id === leadId ? { ...l, pipeline_id: newPipelineId, stage_id: (fetchedStage as any).id } : l
        ));

        const { error } = await (supabase
          .from("leads") as any)
          .update({ 
            pipeline_id: newPipelineId,
            stage_id: (fetchedStage as any).id
          })
          .eq("id", leadId);
        
        if (error) {
            console.error("Failed to move lead", error);
            toast.error("Failed to move lead: " + error.message);
            fetchData();
        } else {
            toast.success("Lead moved successfully");
        }
        return;
      }

      // Optimistically update UI immediately using the stage found in state
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, pipeline_id: newPipelineId, stage_id: defaultStage.id } : l
      ));

      const { error } = await (supabase
        .from("leads") as any)
        .update({ 
          pipeline_id: newPipelineId,
          stage_id: defaultStage.id
        })
        .eq("id", leadId);

      if (error) {
        console.error("Failed to move lead", error);
        toast.error("Failed to move lead: " + error.message);
        fetchData();
      } else {
        toast.success("Lead moved successfully");
      }
    } else {
      let newStageId = over.id as string;
      const isDroppingOnStage = stages.some(s => s.id === newStageId);
      
      if (!isDroppingOnStage) {
        const overLead = leads.find(l => l.id === newStageId);
        if (overLead && overLead.stage_id) {
          newStageId = overLead.stage_id;
        } else {
          return;
        }
      }

      const lead = leads.find(l => l.id === leadId);
      if (!lead || lead.stage_id === newStageId) return;

      const targetStage = stages.find(s => s.id === newStageId);
      if (!targetStage) return;

      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, stage_id: newStageId, pipeline_id: targetStage.pipeline_id } : l
      ));

      const { error } = await (supabase
        .from("leads") as any)
        .update({ 
          stage_id: newStageId,
          pipeline_id: targetStage.pipeline_id
        })
        .eq("id", leadId);

      if (error) {
        console.error("Failed to move lead", error);
        toast.error("Failed to move lead: " + error.message);
        fetchData();
      } else {
        toast.success("Lead moved successfully");
      }
    }
  };

  const handleDeleteClick = (pipelineId: string, pipelineName: string) => {
    const protectedPipelines = ["Transfer Portal", "Customer Pipeline", "Chargeback Pipeline", "Marketing Pipeline"];
    
    if (protectedPipelines.includes(pipelineName)) {
      toast.error("This pipeline cannot be deleted as it is a protected system pipeline.");
      return;
    }

    setDeleteConfirmation({
      isOpen: true,
      pipelineId,
      pipelineName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.pipelineId) return;

    setIsDeleting(true);
    const pipelineId = deleteConfirmation.pipelineId;
    const protectedPipelines = ["Transfer Portal", "Customer Pipeline", "Chargeback Pipeline", "Marketing Pipeline"];

    try {
      const firstPipeline = pipelines.find(p => !protectedPipelines.includes(p.name) && p.id !== pipelineId) || pipelines[0];
      
      if (firstPipeline) {
        const { data: defaultStage } = await supabase
          .from("stages")
          .select("id")
          .eq("pipeline_id", firstPipeline.id)
          .order("order_index", { ascending: true })
          .limit(1)
          .single();

        if (defaultStage) {
          const { error: leadsError } = await (supabase
            .from("leads") as any)
            .update({ 
              pipeline_id: firstPipeline.id,
              stage_id: (defaultStage as any).id
            })
            .eq("pipeline_id", pipelineId);

          if (leadsError) throw leadsError;
        }
      }

      const { error: stagesError } = await supabase
        .from("stages")
        .delete()
        .eq("pipeline_id", pipelineId);

      if (stagesError) {
        throw new Error(`Failed to delete stages: ${stagesError.message}`);
      }

      const { error: pipelineError } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", pipelineId);

      if (pipelineError) {
        throw new Error(`Failed to delete pipeline: ${pipelineError.message}`);
      }

      setDeleteConfirmation({
        isOpen: false,
        pipelineId: null,
        pipelineName: "",
      });
      toast.success("Pipeline deleted successfully");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting pipeline:", error);
      toast.error("Failed to delete pipeline: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeadClick = async (leadId: string) => {
    const { data } = await supabase
      .from("leads")
      .select(`
        *,
        profiles:assigned_agent_id ( full_name )
      `)
      .eq("id", leadId)
      .single();

    if (data) {
      const leadData = data as any;
      const leadWithStage = {
        ...leadData,
        stages: leadData.stage_id ? stages.find(s => s.id === leadData.stage_id) : null
      };
      setSelectedLead(leadWithStage);
      setIsModalOpen(true);
    }
  };

  const groupedLeads = pipelines.map(pipeline => {
    return {
      pipeline,
      leads: leads.filter(l => 
        l.pipeline_id === pipeline.id || (!l.pipeline_id && pipeline.id === pipelines[0]?.id)
      )
    };
  });

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const selectedPipelineStages = stages
    .filter(s => s.pipeline_id === selectedPipelineId)
    .sort((a, b) => {
      const aOrder = (a as any).order_index ?? 0;
      const bOrder = (b as any).order_index ?? 0;
      return aOrder - bOrder;
    });

  const groupedStageLeads = selectedPipelineStages.map(stage => {
    return {
      stage,
      leads: leads.filter(l => l.stage_id === stage.id && l.pipeline_id === selectedPipelineId)
    };
  });

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <DashboardLayout>
      <Head>
        <title>Pipeline - CRM</title>
      </Head>

      <div className="flex flex-col h-[calc(100vh-8rem)] w-full">
        <div className="mb-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("pipeline")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === "pipeline"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab("stages")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === "stages"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Stages
            </button>
          </div>
          {userRole === "system_admin" && (
            activeTab === "pipeline" ? (
              <CreatePipelineModal onPipelineCreated={fetchData} />
            ) : (
              <CreateStageModal 
                onStageCreated={fetchData} 
                defaultPipelineId={selectedPipelineId}
              />
            )
          )}
        </div>

        {activeTab === "stages" && (
          <div className="mb-4 shrink-0">
            <div className="relative inline-block">
              <button
                onClick={() => setIsPipelineDropdownOpen(!isPipelineDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <span className="font-medium text-foreground">
                  {selectedPipeline?.name || "Select Pipeline"}
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isPipelineDropdownOpen && "rotate-180"
                )} />
              </button>
              {isPipelineDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsPipelineDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto min-w-[200px]">
                    {pipelines.map((pipeline) => (
                      <button
                        key={pipeline.id}
                        onClick={() => {
                          setSelectedPipelineId(pipeline.id);
                          setIsPipelineDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 hover:bg-accent transition-colors",
                          selectedPipelineId === pipeline.id && "bg-accent"
                        )}
                      >
                        {pipeline.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeTab === "pipeline" ? (
          <DndContext
            sensors={canDragDropInPipeline(userRole) ? sensors : []}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-y-hidden px-2 pt-2 pb-4 flex-1 min-h-0">
              {groupedLeads.map(({ pipeline, leads: pipelineLeads }) => (
                <DroppableColumn
                  key={pipeline.id}
                  id={pipeline.id}
                  pipeline={pipeline}
                  leads={pipelineLeads}
                  onLeadClick={handleLeadClick}
                  isOver={overId === pipeline.id}
                  stages={stages}
                  userRole={userRole}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeLead ? (
                <div className="bg-card p-3 rounded-lg border border-border shadow-lg w-[300px] rotate-2">
                  <div className="font-medium text-foreground text-sm mb-2">
                    {activeLead.first_name} {activeLead.last_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activeLead.profiles?.full_name || "Unassigned"}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          selectedPipelineId ? (
            selectedPipelineStages.length > 0 ? (
              <DndContext
                sensors={canDragDropInPipeline(userRole) ? sensors : []}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  <div className="flex gap-4 overflow-x-auto overflow-y-hidden px-2 pt-2 pb-4 flex-1 min-h-0">
                    {groupedStageLeads.map(({ stage, leads: stageLeads }) => (
                      <DroppableStageColumn
                        key={stage.id}
                        id={stage.id}
                        stage={stage}
                        leads={stageLeads}
                        onLeadClick={handleLeadClick}
                        isOver={overId === stage.id}
                        stages={stages}
                        userRole={userRole}
                      />
                    ))}
                  </div>
                </div>

                <DragOverlay>
                  {activeLead ? (
                    <div className="bg-card p-3 rounded-lg border border-border shadow-lg w-[300px] rotate-2">
                      <div className="font-medium text-foreground text-sm mb-2">
                        {activeLead.first_name} {activeLead.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeLead.profiles?.full_name || "Unassigned"}
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="flex items-center justify-center flex-1 text-muted-foreground">
                No stages found for this pipeline. Create your first stage to get started.
              </div>
            )
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              Please select a pipeline to view stages
            </div>
          )
        )}
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          onLeadUpdated={fetchData}
        />
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmation({
              isOpen: false,
              pipelineId: null,
              pipelineName: "",
            });
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Pipeline"
        description={`Are you sure you want to delete the pipeline "${deleteConfirmation.pipelineName}"? This will also delete all associated stages and move all leads to the first available pipeline.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </DashboardLayout>
  );
}
