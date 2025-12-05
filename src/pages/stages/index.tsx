import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { Phone, MapPin, DollarSign, User, ChevronDown, Loader2, Search, X, Pencil } from "lucide-react";
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
import { CreateStageModal } from "@/components/CreateStageModal";
import { ChangePipelineModal } from "@/components/stages/ChangePipelineModal";
import { getContrastTextColor } from "@/lib/utils";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { getLeadsViewFilter, canDragDropInPipeline, canManagePipelineStages, isValidRole, type UserRole } from "@/lib/permissions";
import { Input } from "@/components/ui/Input";
import { useCallback, useRef } from "react";

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
  onEditClick?: () => void;
  stages: Stage[];
  isReadOnly?: boolean;
  canEdit?: boolean;
}

function LeadCard({ lead, onClick, onEditClick, stages, isReadOnly = false, canEdit = false }: LeadCardProps) {
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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditClick) {
      onEditClick();
    }
  };

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
      className={`bg-card p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-all relative ${isReadOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {canEdit && (
        <button
          onClick={handleEditClick}
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors z-10"
          title="Change Pipeline & Stage"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="font-medium text-foreground text-sm mb-2 pr-6">
        {lead.first_name} {lead.last_name}
      </div>
      
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

interface DroppableStageColumnProps {
  id: string;
  stage: Stage;
  leads: Lead[];
  onLeadClick: (leadId: string) => void;
  onLeadEditClick?: (lead: Lead) => void;
  isOver?: boolean;
  stages: Stage[];
  userRole: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  totalCount?: number;
}

function DroppableStageColumn({ id, stage, leads, onLeadClick, onLeadEditClick, isOver, stages, userRole, onLoadMore, hasMore, isLoading, totalCount }: DroppableStageColumnProps) {
  const { setNodeRef, isOver: droppableIsOver } = useDroppable({ id });
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !onLoadMore || !hasMore || isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoading]);

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
          {totalCount !== undefined ? totalCount : leads.length}
        </span>
      </div>
      
      <SortableContext
        items={leads.map(l => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden min-h-0 pr-1"
        >
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead.id)}
              onEditClick={onLeadEditClick ? () => onLeadEditClick(lead) : undefined}
              stages={stages}
              isReadOnly={userRole === "call_center_agent"}
              canEdit={userRole === "sales_manager" || userRole === "system_admin"}
            />
          ))}
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && hasMore && leads.length > 0 && (
            <div className="text-center py-2">
              <button
                onClick={onLoadMore}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Load more ({totalCount ? totalCount - leads.length : 0} remaining)
              </button>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

const LEADS_PER_PAGE = 10;

export default function PipelinePage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [isPipelineDropdownOpen, setIsPipelineDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageLeadCounts, setStageLeadCounts] = useState<Record<string, {loaded: number, total: number}>>({});
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [changePipelineModalOpen, setChangePipelineModalOpen] = useState(false);
  const [selectedLeadForPipelineChange, setSelectedLeadForPipelineChange] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchData = async () => {
    if (!selectedPipelineId) {
      const { data: pipelinesData } = await supabase
        .from("pipelines")
        .select("*")
        .order("created_at", { ascending: true });

      if (pipelinesData && pipelinesData.length > 0) {
        setPipelines(pipelinesData as any);
        setSelectedPipelineId((pipelinesData as any)[0].id);
      }
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, call_center_id")
      .eq("id", session.user.id)
      .single();

    const role = (profile as any)?.role;
    const callCenterId = (profile as any)?.call_center_id;

    if (!isValidRole(role)) {
      setLoading(false);
      return;
    }

    const { data: stagesData } = await supabase
      .from("stages")
      .select("*")
      .eq("pipeline_id", selectedPipelineId)
      .order("order_index", { ascending: true });

    if (stagesData) {
      setStages(stagesData as any);
      
      const filter = getLeadsViewFilter(role, session.user.id);
      const counts: Record<string, {loaded: number, total: number}> = {};
      
      for (const stage of (stagesData as any[])) {
        let countQuery = supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("stage_id", stage.id)
          .eq("pipeline_id", selectedPipelineId);

        if (filter.filterBy === "assigned_agent_id" && filter.value) {
          countQuery = countQuery.eq("assigned_agent_id", filter.value);
        } else if (filter.filterBy === "call_center_id" && callCenterId) {
          countQuery = countQuery.eq("call_center_id", callCenterId);
        } else if (filter.filterBy === "user_id" && filter.value) {
          countQuery = countQuery.eq("user_id", filter.value);
        }

        if (searchQuery) {
          countQuery = countQuery.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`);
        }

        const { count } = await countQuery;
        counts[stage.id] = { loaded: Math.min(LEADS_PER_PAGE, count || 0), total: count || 0 };
      }
      
      setStageLeadCounts(counts);
    }

    let leadsQuery = supabase
      .from("leads")
      .select(`
        *,
        profiles:assigned_agent_id ( full_name )
      `)
      .eq("pipeline_id", selectedPipelineId)
      .limit(LEADS_PER_PAGE * (stagesData?.length || 1));

    const filter = getLeadsViewFilter(role, session.user.id);
    if (filter.filterBy === "assigned_agent_id" && filter.value) {
      leadsQuery = leadsQuery.eq("assigned_agent_id", filter.value);
    } else if (filter.filterBy === "call_center_id" && callCenterId) {
      leadsQuery = leadsQuery.eq("call_center_id", callCenterId);
    } else if (filter.filterBy === "user_id" && filter.value) {
      leadsQuery = leadsQuery.eq("user_id", filter.value);
    }

    if (searchQuery) {
      leadsQuery = leadsQuery.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`);
    }

    const { data: leadsData } = await leadsQuery;
    
    if (leadsData) {
      const limitedLeads: any[] = [];
      const stageGroups: Record<string, any[]> = {};
      
      (leadsData as any[]).forEach(lead => {
        if (!stageGroups[lead.stage_id]) {
          stageGroups[lead.stage_id] = [];
        }
        stageGroups[lead.stage_id].push(lead);
      });
      
      Object.keys(stageGroups).forEach(stageId => {
        limitedLeads.push(...stageGroups[stageId].slice(0, LEADS_PER_PAGE));
      });
      
      setLeads(limitedLeads);
    }
    
    setLoading(false);
  };

  const loadMoreLeadsForStage = async (stageId: string) => {
    if (loadingStage || !stageLeadCounts[stageId]) return;
    
    const { loaded, total } = stageLeadCounts[stageId];
    if (loaded >= total) return;

    setLoadingStage(stageId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, call_center_id")
        .eq("id", session.user.id)
        .single();

      const role = (profile as any)?.role;
      const callCenterId = (profile as any)?.call_center_id;

      if (!selectedPipelineId) return;

      let query = supabase
        .from("leads")
        .select(`
          *,
          profiles:assigned_agent_id ( full_name )
        `)
        .eq("stage_id", stageId)
        .eq("pipeline_id", selectedPipelineId)
        .range(loaded, loaded + LEADS_PER_PAGE - 1);

      const filter = getLeadsViewFilter(role, session.user.id);
      if (filter.filterBy === "assigned_agent_id" && filter.value) {
        query = query.eq("assigned_agent_id", filter.value);
      } else if (filter.filterBy === "call_center_id" && callCenterId) {
        query = query.eq("call_center_id", callCenterId);
      } else if (filter.filterBy === "user_id" && filter.value) {
        query = query.eq("user_id", filter.value);
      }

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`);
      }

      const { data: newLeads } = await query;
      
      if (newLeads && newLeads.length > 0) {
        setLeads(prev => [...prev, ...(newLeads as any)]);
        setStageLeadCounts(prev => ({
          ...prev,
          [stageId]: {
            ...prev[stageId],
            loaded: prev[stageId].loaded + newLeads.length
          }
        }));
      }
    } finally {
      setLoadingStage(null);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      const { data: pipelinesData } = await supabase
        .from("pipelines")
        .select("*")
        .order("created_at", { ascending: true });

      if (pipelinesData && pipelinesData.length > 0) {
        setPipelines(pipelinesData as any);
        if (!selectedPipelineId) {
          setSelectedPipelineId((pipelinesData as any)[0].id);
        }
      }
    };

    initializePage();
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchData();
    }
  }, [selectedPipelineId, searchQuery]);

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
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canDragDropInPipeline(userRole)) {
      return;
    }
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const leadId = active.id as string;
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
  };


  const handleLeadClick = (leadId: string) => {
    router.push(`/leadDetail?id=${leadId}`);
  };

  const handleLeadEditClick = (lead: Lead) => {
    setSelectedLeadForPipelineChange(lead);
    setChangePipelineModalOpen(true);
  };

  const handlePipelineChangeSuccess = () => {
    fetchData();
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const selectedPipelineStages = stages
    .filter(s => s.pipeline_id === selectedPipelineId)
    .sort((a, b) => {
      const aOrder = (a as any).order_index ?? 0;
      const bOrder = (b as any).order_index ?? 0;
      return aOrder - bOrder;
    });

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.first_name?.toLowerCase().includes(query) ||
      lead.last_name?.toLowerCase().includes(query) ||
      lead.phone_number?.toLowerCase().includes(query) ||
      lead.state?.toLowerCase().includes(query) ||
      lead.profiles?.full_name?.toLowerCase().includes(query)
    );
  });

  const groupedStageLeads = selectedPipelineStages.map(stage => {
    return {
      stage,
      leads: filteredLeads.filter(l => l.stage_id === stage.id && l.pipeline_id === selectedPipelineId)
    };
  });

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <DashboardLayout>
      <Head>
        <title>Stages - CRM</title>
      </Head>

      <div className="flex flex-col h-[calc(100vh-8rem)] w-full">
        <div className="mb-6 flex items-center justify-between shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, phone, state, or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {userRole === "system_admin" && (
              <CreateStageModal 
                onStageCreated={fetchData} 
                defaultPipelineId={selectedPipelineId}
              />
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
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

            {selectedPipelineId ? (
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
                    {groupedStageLeads.map(({ stage, leads: stageLeads }) => {
                      const stageCount = stageLeadCounts[stage.id];
                      return (
                        <DroppableStageColumn
                          key={stage.id}
                          id={stage.id}
                          stage={stage}
                          leads={stageLeads}
                          onLeadClick={handleLeadClick}
                          onLeadEditClick={handleLeadEditClick}
                          isOver={overId === stage.id}
                          stages={stages}
                          userRole={userRole}
                          onLoadMore={() => loadMoreLeadsForStage(stage.id)}
                          hasMore={stageCount ? stageCount.loaded < stageCount.total : false}
                          isLoading={loadingStage === stage.id}
                          totalCount={stageCount?.total}
                        />
                      );
                    })}
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
            )}
          </>
        )}
      </div>

      {selectedLeadForPipelineChange && (
        <ChangePipelineModal
          isOpen={changePipelineModalOpen}
          onClose={() => {
            setChangePipelineModalOpen(false);
            setSelectedLeadForPipelineChange(null);
          }}
          lead={selectedLeadForPipelineChange}
          onSuccess={handlePipelineChangeSuccess}
        />
      )}
    </DashboardLayout>
  );
}
