import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Shield, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { isValidRole, type UserRole } from "@/lib/permissions";
import { useRouter } from "next/router";

const ITEMS_PER_PAGE = 10;

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
  call_center_id: string | null;
  stage_id: string | null;
  pipeline_id: string | null;
  stages?: { name: string; color_code: string } | null;
  pipelines?: { name: string; type: string } | null;
  call_centers?: { name: string } | null;
  created_at: string;
  policies?: { policy_number: string }[] | null;
}

export default function PolicyAttachmentPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const role = (profile as any).role;
        if (isValidRole(role)) {
          setUserRole(role);
          if (role !== "sales_manager" && role !== "system_admin") {
            router.push("/dashboard");
          }
        }
      }
    };
    checkUser();
  }, [router]);

  const fetchLeads = async () => {
    if (!userRole || (userRole !== "sales_manager" && userRole !== "system_admin")) {
      return;
    }

    setLoading(true);
    try {
      const { data: stagesData } = await supabase
        .from("stages")
        .select("id, name")
        .ilike("name", "%pending approval%");

      if (!stagesData || stagesData.length === 0) {
        setLeads([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const stageIds = stagesData.map((s: any) => s.id);

      let countQuery = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("stage_id", stageIds);

      if (searchQuery) {
        countQuery = countQuery.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`);
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let dataQuery = supabase
        .from("leads")
        .select(`
          *,
          stages:stage_id ( name, color_code ),
          pipelines:pipeline_id ( name, type ),
          call_centers:call_center_id ( name )
        `)
        .in("stage_id", stageIds)
        .range(from, to)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        dataQuery = dataQuery.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`);
      }

      const { data: leadsData, error } = await dataQuery;

      if (error) {
        console.error("Error fetching leads:", error);
        setLeads([]);
      } else {
        const leadIds = (leadsData || []).map((lead: any) => lead.id);
        
        if (leadIds.length > 0) {
          const { data: policiesData } = await supabase
            .from("policies")
            .select("lead_id, policy_number")
            .in("lead_id", leadIds);

          const policiesMap: Record<string, { policy_number: string }[]> = {};
          if (policiesData) {
            policiesData.forEach((policy: any) => {
              if (!policiesMap[policy.lead_id]) {
                policiesMap[policy.lead_id] = [];
              }
              policiesMap[policy.lead_id].push({ policy_number: policy.policy_number });
            });
          }

          const leadsWithPolicies = (leadsData || []).map((lead: any) => ({
            ...lead,
            policies: policiesMap[lead.id] || null
          }));

          setLeads(leadsWithPolicies as any);
        } else {
          setLeads([]);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole && (userRole === "sales_manager" || userRole === "system_admin")) {
      fetchLeads();
    }
  }, [userRole, currentPage, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleAttachPolicy = (lead: Lead) => {
    router.push(`/policyAttachment/attach?leadId=${lead.id}`);
  };

  if (!userRole || (userRole !== "sales_manager" && userRole !== "system_admin")) {
    return null;
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Policy Attachment - CRM</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Policy Attachment</h1>
        <p className="text-muted-foreground mt-2">
          Attach policies to leads with pending approval status.
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search</label>
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-card rounded-lg border border-border border-dashed py-16 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground">No leads found</h3>
          <p className="text-muted-foreground mt-1">
            No leads with pending approval status.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 320px)', maxHeight: 'calc(100vh - 320px)' }}>
          <div className="overflow-x-auto flex-1 min-h-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Lead Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Pipeline Status</th>
                  <th className="px-6 py-4">Call Center</th>
                  <th className="px-6 py-4">Policies Attached</th>
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
                      {lead.phone_number || lead.email || "-"}
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
                              color: "#000"
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
                      {lead.call_centers?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {lead.policies && lead.policies.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3 text-muted-foreground" />
                          {lead.policies.map((policy, index) => (
                            <span key={index}>
                              {policy.policy_number}
                              {index < lead.policies!.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleAttachPolicy(lead)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Attach Policy
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalCount > 10 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
              onPageChange={setCurrentPage}
              totalItems={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </div>
      )}

    </DashboardLayout>
  );
}

