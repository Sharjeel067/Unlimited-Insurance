import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Search, X, Calendar, Phone, User, FileText, Filter } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/router";
import { isValidRole, type UserRole, hasPermission } from "@/lib/permissions";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "react-toastify";

interface DailyDealFlow {
  id: string;
  submission_id: string;
  client_phone_number: string | null;
  lead_vendor: string | null;
  date: string | null;
  insured_name: string | null;
  buffer_agent: string | null;
  agent: string | null;
  licensed_agent_account: string | null;
  status: string | null;
  call_result: string | null;
  carrier: string | null;
  product_type: string | null;
  draft_date: string | null;
  monthly_premium: number | null;
  face_amount: number | null;
  notes: string | null;
  policy_number: string | null;
  created_at: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function DailyDealFlowPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<DailyDealFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [callResultFilter, setCallResultFilter] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [leadVendorFilter, setLeadVendorFilter] = useState("");

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole && isValidRole(savedRole)) {
      setUserRole(savedRole);
    }
  }, []);

  useEffect(() => {
    if (userRole && hasPermission(userRole, "generate_reports")) {
      fetchData();
    }
  }, [userRole, searchQuery, startDate, endDate, statusFilter, callResultFilter, carrierFilter, agentFilter, leadVendorFilter, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate, statusFilter, callResultFilter, carrierFilter, agentFilter, leadVendorFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let countQuery = supabase
        .from("daily_deal_flow")
        .select("*", { count: "exact", head: true });

      let dataQuery = supabase
        .from("daily_deal_flow")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (searchQuery) {
        const searchFilter = `insured_name.ilike.%${searchQuery}%,client_phone_number.ilike.%${searchQuery}%,submission_id.ilike.%${searchQuery}%,agent.ilike.%${searchQuery}%,buffer_agent.ilike.%${searchQuery}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }

      if (startDate) {
        countQuery = countQuery.gte("date", startDate);
        dataQuery = dataQuery.gte("date", startDate);
      }

      if (endDate) {
        countQuery = countQuery.lte("date", endDate);
        dataQuery = dataQuery.lte("date", endDate);
      }

      if (statusFilter) {
        countQuery = countQuery.eq("status", statusFilter);
        dataQuery = dataQuery.eq("status", statusFilter);
      }

      if (callResultFilter) {
        countQuery = countQuery.eq("call_result", callResultFilter);
        dataQuery = dataQuery.eq("call_result", callResultFilter);
      }

      if (carrierFilter) {
        countQuery = countQuery.eq("carrier", carrierFilter);
        dataQuery = dataQuery.eq("carrier", carrierFilter);
      }

      if (agentFilter) {
        countQuery = countQuery.ilike("agent", `%${agentFilter}%`);
        dataQuery = dataQuery.ilike("agent", `%${agentFilter}%`);
      }

      if (leadVendorFilter) {
        countQuery = countQuery.eq("lead_vendor", leadVendorFilter);
        dataQuery = dataQuery.eq("lead_vendor", leadVendorFilter);
      }

      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery
      ]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      setTotalCount(countResult.count || 0);
      setDeals((dataResult.data as any) || []);
    } catch (error: any) {
      console.error("Error fetching daily deal flow:", error);
      toast.error("Failed to load daily deal flow data");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (dealId: string) => {
    router.push(`/dailyDealFlow/detail?id=${dealId}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
    setCallResultFilter("");
    setCarrierFilter("");
    setAgentFilter("");
    setLeadVendorFilter("");
  };

  if (!hasPermission(userRole, "generate_reports")) {
    return (
      <DashboardLayout>
        <Head>
          <title>Daily Deal Flow - CRM</title>
        </Head>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Daily Deal Flow - CRM</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Deal Flow</h1>
          <p className="text-muted-foreground mt-2">
            View and manage daily deal flow records.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 mb-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, submission ID, or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
              <Input
                placeholder="Filter by status..."
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Call Result</label>
              <Input
                placeholder="Filter by call result..."
                value={callResultFilter}
                onChange={(e) => setCallResultFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Carrier</label>
              <Input
                placeholder="Filter by carrier..."
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Agent</label>
              <Input
                placeholder="Filter by agent..."
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Lead Vendor</label>
              <Input
                placeholder="Filter by lead vendor..."
                value={leadVendorFilter}
                onChange={(e) => setLeadVendorFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : deals.length === 0 ? (
        <div className="bg-card rounded-lg border border-border border-dashed py-16 text-center">
          <h3 className="text-lg font-medium text-foreground">No records found</h3>
          <p className="text-muted-foreground mt-1">
            No daily deal flow records match your filters.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 320px)', maxHeight: 'calc(100vh - 320px)' }}>
          <div className="overflow-x-auto flex-1 min-h-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Insured Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Call Result</th>
                  <th className="px-6 py-4">Carrier</th>
                  <th className="px-6 py-4">Monthly Premium</th>
                  <th className="px-6 py-4">Face Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(deal.id)}
                  >
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {deal.date ? format(new Date(deal.date), "MMM d, yyyy") : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {deal.insured_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {deal.client_phone_number || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {deal.agent || "Unassigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {deal.status || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {deal.call_result || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {deal.carrier || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {deal.monthly_premium ? `$${deal.monthly_premium.toLocaleString()}` : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {deal.face_amount ? `$${deal.face_amount.toLocaleString()}` : "N/A"}
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

