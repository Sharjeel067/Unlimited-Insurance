import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, User, Calendar, Phone, MapPin, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/router";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { BulkUploadModal } from "@/components/leads/BulkUploadModal";
import { getLeadsViewFilter, canDeleteLead, isValidRole, type UserRole } from "@/lib/permissions";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  state: string;
  created_at: string;
  assigned_agent_id: string | null;
  profiles?: { full_name: string }; 
  pipelines?: { name: string; type: string };
  stages?: { name: string; color_code: string };
  call_center_id?: string | null;
  call_centers?: { name: string }; 
}

import { getContrastTextColor } from "@/lib/utils";

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCallCenterId, setUserCallCenterId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, call_center_id")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          const role = (profile as any).role;
          if (isValidRole(role)) {
            setUserRole(role);
          }
          setUserCallCenterId((profile as any).call_center_id);
        }
      }
    };
    checkUser();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Get current user
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

    // Build query
    let query = supabase
      .from("leads")
      .select(`
        *,
        profiles:assigned_agent_id ( full_name ),
        pipelines:pipeline_id ( name, type ),
        stages:stage_id ( name, color_code ),
        call_centers:call_center_id ( name )
      `);

    // Apply role-based filtering
    const filter = getLeadsViewFilter(role, session.user.id);
    if (filter.filterBy === "assigned_agent_id" && filter.value) {
      query = query.eq("assigned_agent_id", filter.value);
    } else if (filter.filterBy === "call_center_id" && callCenterId) {
      query = query.eq("call_center_id", callCenterId);
    } else if (filter.filterBy === "user_id" && filter.value) {
      query = query.eq("user_id", filter.value);
    }
    // If filterBy is "all" or null, no filter is applied (show all leads)

    const { data: leadsData, error: leadsError } = await query.order("created_at", { ascending: false });

    if (leadsError) console.error("Error fetching leads:", leadsError);
    else setLeads(leadsData as any || []);
    
    setLoading(false);
  };

  useEffect(() => {
    if (userId !== null && userRole !== null) {
      fetchData();
    }
  }, [userId, userRole]);

  const handleEditClick = (leadId: string) => {
    router.push(`/leads/createLead?id=${leadId}`);
  };

  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadToDelete.id);

      if (error) {
        console.error("Error deleting lead:", error);
        alert("Failed to delete lead. You might not have permission.");
      } else {
        setLeads(leads.filter(l => l.id !== leadToDelete.id));
        setDeleteModalOpen(false);
        setLeadToDelete(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Leads - CRM</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your leads pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setBulkUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => router.push("/leads/createLead")}>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-card rounded-lg border border-border border-dashed py-16 text-center">
          <h3 className="text-lg font-medium text-foreground">No leads yet</h3>
          <p className="text-muted-foreground mt-1">
            Submissions from call centers will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium">
                <tr>
                  <th className="px-6 py-4">Lead Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Pipeline Status</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Call Center</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4">Date Added</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {lead.first_name} {lead.last_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {lead.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {lead.pipelines ? (
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {lead.pipelines.name}
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">No Pipeline</span>
                        )}
                        {lead.stages ? (
                            <span 
                                className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                style={{ 
                                  backgroundColor: lead.stages.color_code,
                                  color: getContrastTextColor(lead.stages.color_code)
                                }}
                            >
                                {lead.stages.name}
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {lead.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                        {lead.call_centers?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                        {lead.profiles?.full_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(lead.created_at), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => handleEditClick(lead.id)}
                                className="text-muted-foreground hover:text-primary transition-colors p-1"
                                title="Edit Lead"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            {canDeleteLead(userRole) && (
                                <button 
                                    onClick={() => handleDeleteClick(lead)}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    title="Delete Lead"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Lead"
        description={`Are you sure you want to delete ${leadToDelete?.first_name} ${leadToDelete?.last_name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={isDeleting}
      />

      <BulkUploadModal
        isOpen={bulkUploadModalOpen}
        onClose={() => setBulkUploadModalOpen(false)}
        onUploadComplete={() => {
          fetchData();
          setBulkUploadModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
}
