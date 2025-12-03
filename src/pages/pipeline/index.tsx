import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Phone, MapPin, DollarSign, User, Trash2 } from "lucide-react";
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
import { CreatePipelineModal } from "@/components/admin/CreatePipelineModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { getContrastTextColor } from "@/lib/utils";
import { toast } from "react-toastify";

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
}

function LeadCard({ lead, onClick, stages }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

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
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="bg-card p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
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
  userRole: string | null;
  onDelete?: (pipelineId: string, pipelineName: string) => void;
}

function DroppableColumn({ id, pipeline, leads, onLeadClick, isOver, stages, userRole, onDelete }: DroppableColumnProps) {
  const { setNodeRef, isOver: droppableIsOver } = useDroppable({ id });

  const protectedPipelines = ["Transfer Portal", "Customer Pipeline", "Chargeback Pipeline", "Marketing Pipeline"];
  const canDelete = userRole === "system_admin" && !protectedPipelines.includes(pipeline.name);

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 bg-muted/30 rounded-lg p-4 flex flex-col h-full transition-all ${
        isOver || droppableIsOver ? "ring-2 ring-primary ring-offset-2 bg-primary/10" : ""
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
        <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead.id)}
              stages={stages}
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
  const [userRole, setUserRole] = useState<string | null>(null);
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

    const { data: leadsData } = await supabase
      .from("leads")
      .select(`
        *,
        profiles:assigned_agent_id ( full_name )
      `);
    
    if (leadsData) setLeads(leadsData as any);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setUserRole((profile as any).role);
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const isPipeline = pipelines.some(p => p.id === over.id);
      if (isPipeline) {
        setOverId(over.id as string);
      } else {
        setOverId(null);
      }
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newPipelineId = over.id as string;

    const isDroppingOnPipeline = pipelines.some(p => p.id === newPipelineId);
    if (!isDroppingOnPipeline) return;

    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.pipeline_id === newPipelineId) return;

    const { data: defaultStage, error: stageError } = await supabase
      .from("stages")
      .select("id")
      .eq("pipeline_id", newPipelineId)
      .order("order_index", { ascending: true })
      .limit(1)
      .single();

    if (stageError) {
      console.error("Failed to fetch default stage", stageError);
      fetchData();
      return;
    }

    if (!defaultStage) {
      console.error("No default stage found for pipeline");
      fetchData();
      return;
    }

    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, pipeline_id: newPipelineId, stage_id: (defaultStage as any).id } : l
    ));

    const { error } = await (supabase
      .from("leads") as any)
      .update({ 
        pipeline_id: newPipelineId,
        stage_id: (defaultStage as any).id
      })
      .eq("id", leadId);

    if (error) {
      console.error("Failed to move lead", error);
      toast.error("Failed to move lead: " + error.message);
      fetchData();
    } else {
      toast.success("Lead moved successfully");
      fetchData();
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

  // Group leads by pipeline
  const groupedLeads = pipelines.map(pipeline => {
    return {
      pipeline,
      leads: leads.filter(l => 
        l.pipeline_id === pipeline.id || (!l.pipeline_id && pipeline.id === pipelines[0]?.id)
      )
    };
  });

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <DashboardLayout>
      <Head>
        <title>Pipeline - CRM</title>
      </Head>

      <div className="flex flex-col h-[calc(100vh-4rem)] w-[calc(100vw-16rem)] -ml-8 -mr-8 px-8">
        <div className="mb-6 flex items-center justify-between shrink-0">
          <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
          {userRole === "system_admin" && (
            <CreatePipelineModal onPipelineCreated={fetchData} />
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-y-hidden pb-4 flex-1 min-h-0">
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
