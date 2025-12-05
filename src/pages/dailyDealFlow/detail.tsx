import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Phone, Calendar, DollarSign, User, FileText, Info, ArrowLeft, Loader2, Building2, CreditCard, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { isValidRole, type UserRole, hasPermission } from "@/lib/permissions";
import { useRouter } from "next/router";

type TabType = "basic" | "agent" | "carrier" | "financial" | "system";

export default function DailyDealFlowDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("basic");

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole && isValidRole(savedRole)) {
      setUserRole(savedRole);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchDealData();
    }
  }, [id]);

  const fetchDealData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_deal_flow")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setDeal(data);
      }
    } catch (error: any) {
      console.error("Error fetching deal:", error);
      toast.error("Failed to load deal details");
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission(userRole, "generate_reports")) {
    return (
      <DashboardLayout>
        <Head>
          <title>Deal Flow Detail - CRM</title>
        </Head>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Head>
          <title>Deal Flow Detail - CRM</title>
        </Head>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!deal) {
    return (
      <DashboardLayout>
        <Head>
          <title>Deal Flow Detail - CRM</title>
        </Head>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Deal flow record not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Deal Flow Detail - CRM</title>
      </Head>

      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Deal Flow Details</h1>
          <p className="text-muted-foreground mt-2">
            Complete information for {deal.insured_name || "Deal Flow Record"}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="border-b border-border">
          <div className="flex space-x-1 p-2">
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === "basic"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <FileText className="w-4 h-4" />
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab("agent")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === "agent"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <User className="w-4 h-4" />
              Agent Info
            </button>
            <button
              onClick={() => setActiveTab("carrier")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === "carrier"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Carrier Info
            </button>
            <button
              onClick={() => setActiveTab("financial")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === "financial"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Financial
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === "system"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Info className="w-4 h-4" />
              System Info
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "basic" && (
            <section>
              <h3 className="font-semibold text-foreground mb-6 text-lg">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Submission ID</label>
                  <p className="font-medium text-foreground">{deal.submission_id || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Client Phone
                  </label>
                  <p className="font-medium text-foreground">{deal.client_phone_number || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Insured Name</label>
                  <p className="font-medium text-foreground">{deal.insured_name || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </label>
                  <p className="font-medium text-foreground">
                    {deal.date ? format(new Date(deal.date), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Lead Vendor</label>
                  <p className="font-medium text-foreground">{deal.lead_vendor || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Status</label>
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                    {deal.status || "N/A"}
                  </span>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Call Result</label>
                  <p className="font-medium text-foreground">{deal.call_result || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Draft Date</label>
                  <p className="font-medium text-foreground">
                    {deal.draft_date ? format(new Date(deal.draft_date), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                {deal.notes && (
                  <div className="md:col-span-2">
                    <label className="text-muted-foreground text-xs font-medium mb-1 block">Notes</label>
                    <p className="font-medium text-foreground whitespace-pre-wrap">{deal.notes}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "agent" && (
            <section>
              <h3 className="font-semibold text-foreground mb-6 text-lg">Agent Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Buffer Agent</label>
                  <p className="font-medium text-foreground">{deal.buffer_agent || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Agent</label>
                  <p className="font-medium text-foreground">{deal.agent || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Licensed Agent Account</label>
                  <p className="font-medium text-foreground">{deal.licensed_agent_account || "N/A"}</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === "carrier" && (
            <section>
              <h3 className="font-semibold text-foreground mb-6 text-lg">Carrier Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Carrier</label>
                  <p className="font-medium text-foreground">{deal.carrier || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Product Type</label>
                  <p className="font-medium text-foreground">{deal.product_type || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Product Type Carrier</label>
                  <p className="font-medium text-foreground">{deal.product_type_carrier || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Level or GI</label>
                  <p className="font-medium text-foreground">{deal.level_or_gi || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Carrier Audit</label>
                  <p className="font-medium text-foreground">{deal.carrier_audit || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Policy Number</label>
                  <p className="font-medium text-foreground">{deal.policy_number || "N/A"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Placement Status</label>
                  <p className="font-medium text-foreground">{deal.placement_status || "N/A"}</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === "financial" && (
            <section>
              <h3 className="font-semibold text-foreground mb-6 text-lg">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Monthly Premium
                  </label>
                  <p className="font-medium text-foreground">
                    {deal.monthly_premium ? `$${deal.monthly_premium.toLocaleString()}` : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Face Amount
                  </label>
                  <p className="font-medium text-foreground">
                    {deal.face_amount ? `$${deal.face_amount.toLocaleString()}` : "N/A"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeTab === "system" && (
            <section>
              <h3 className="font-semibold text-foreground mb-6 text-lg">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Created</label>
                  <p className="font-medium text-foreground">
                    {deal.created_at ? format(new Date(deal.created_at), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Updated</label>
                  <p className="font-medium text-foreground">
                    {deal.updated_at ? format(new Date(deal.updated_at), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">From Callback</label>
                  <p className="font-medium text-foreground">
                    {deal.from_callback ? (
                      <span className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : "No"}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Is Callback</label>
                  <p className="font-medium text-foreground">
                    {deal.is_callback ? (
                      <span className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : "No"}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Is Retention Call</label>
                  <p className="font-medium text-foreground">
                    {deal.is_retention_call ? (
                      <span className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : "No"}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Sync Status</label>
                  <p className="font-medium text-foreground">{deal.sync_status || "N/A"}</p>
                </div>
                {deal.ghl_location_id && (
                  <div>
                    <label className="text-muted-foreground text-xs font-medium mb-1 block">GHL Location ID</label>
                    <p className="font-medium text-foreground">{deal.ghl_location_id}</p>
                  </div>
                )}
                {deal.ghl_opportunity_id && (
                  <div>
                    <label className="text-muted-foreground text-xs font-medium mb-1 block">GHL Opportunity ID</label>
                    <p className="font-medium text-foreground">{deal.ghl_opportunity_id}</p>
                  </div>
                )}
                {deal.ghlcontactid && (
                  <div>
                    <label className="text-muted-foreground text-xs font-medium mb-1 block">GHL Contact ID</label>
                    <p className="font-medium text-foreground">{deal.ghlcontactid}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

