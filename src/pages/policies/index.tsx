import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Loader2, Shield, DollarSign, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Policy {
  id: string;
  carrier_name: string;
  policy_number: string;
  status: string;
  premium_amount: number;
  effective_date: string;
  lead_id: string;
  leads?: { first_name: string; last_name: string };
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending: "bg-yellow-100 text-yellow-800",
  lapsed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("policies")
      .select("*, leads(first_name, last_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching policies:", error);
    } else {
      setPolicies(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleDeleteClick = (policy: Policy) => {
    setPolicyToDelete(policy);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("policies")
        .delete()
        .eq("id", policyToDelete.id);

      if (error) {
        console.error("Error deleting policy:", error);
        alert("Failed to delete policy. You might not have permission.");
      } else {
        setPolicies(policies.filter(p => p.id !== policyToDelete.id));
        setDeleteModalOpen(false);
        setPolicyToDelete(null);
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
        <title>Policies - CRM</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Policies</h1>
        <p className="text-muted-foreground mt-2">
          Manage active insurance policies and carrier details.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-card rounded-lg border border-border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No policies found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Policy Details</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Premium</th>
                <th className="px-6 py-4">Effective Date</th>
                {userRole === 'system_admin' && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {policies.map((policy) => (
                <tr key={policy.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{policy.carrier_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {policy.policy_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {policy.leads ? `${policy.leads.first_name} ${policy.leads.last_name}` : "Unknown"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[policy.status?.toLowerCase()] || "bg-gray-100")}>
                      {policy.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        {policy.premium_amount?.toFixed(2)}/mo
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {policy.effective_date ? format(new Date(policy.effective_date), "MMM d, yyyy") : "-"}
                    </div>
                  </td>
                  {userRole === 'system_admin' && (
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => handleDeleteClick(policy)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Delete Policy"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Policy"
        description={`Are you sure you want to delete policy ${policyToDelete?.policy_number}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={isDeleting}
      />
    </DashboardLayout>
  );
}

