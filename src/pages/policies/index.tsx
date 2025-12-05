import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Loader2, Shield, DollarSign, Calendar, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { toast } from "react-toastify";
import { Pagination } from "@/components/ui/Pagination";

const ITEMS_PER_PAGE = 10;

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [policyToEdit, setPolicyToEdit] = useState<Policy | null>(null);
  const [editForm, setEditForm] = useState({
    carrier_name: "",
    policy_number: "",
    status: "",
    premium_amount: "",
    effective_date: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    
    const { count } = await supabase
      .from("policies")
      .select("*", { count: "exact", head: true });
    
    setTotalCount(count || 0);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from("policies")
      .select("*, leads(first_name, last_name)")
      .range(from, to)
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
  }, [currentPage]);

  const handleEditClick = (policy: Policy) => {
    setPolicyToEdit(policy);
    setEditForm({
      carrier_name: policy.carrier_name || "",
      policy_number: policy.policy_number || "",
      status: policy.status || "",
      premium_amount: policy.premium_amount?.toString() || "",
      effective_date: policy.effective_date || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!policyToEdit) return;

    if (!editForm.carrier_name || !editForm.policy_number || !editForm.status || !editForm.premium_amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload = {
        carrier_name: editForm.carrier_name.trim(),
        policy_number: editForm.policy_number.trim(),
        status: editForm.status.toLowerCase(),
        premium_amount: parseFloat(editForm.premium_amount),
        effective_date: editForm.effective_date || null,
      };

      const { data, error } = await (supabase
        .from("policies") as any)
        .update(updatePayload)
        .eq("id", policyToEdit.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message || "Failed to update policy");
      }

      toast.success("Policy updated successfully!");
      await fetchPolicies();
      
      setEditModalOpen(false);
      setPolicyToEdit(null);
    } catch (err: any) {
      console.error("Error updating policy:", err);
      toast.error(err.message || "Failed to update policy. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
        toast.error("Failed to delete policy. You might not have permission.");
      } else {
        toast.success("Policy deleted successfully!");
        setPolicies(policies.filter(p => p.id !== policyToDelete.id));
        setDeleteModalOpen(false);
        setPolicyToDelete(null);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(err.message || "An unexpected error occurred");
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(policy)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                          title="Edit Policy"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(policy)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Delete Policy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
            onPageChange={setCurrentPage}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
          />
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

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>
              Update policy information for {policyToEdit?.policy_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Carrier Name
                </label>
                <Input
                  value={editForm.carrier_name}
                  onChange={(e) => setEditForm({ ...editForm, carrier_name: e.target.value })}
                  placeholder="Enter carrier name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Policy Number
                </label>
                <Input
                  value={editForm.policy_number}
                  onChange={(e) => setEditForm({ ...editForm, policy_number: e.target.value })}
                  placeholder="Enter policy number"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="lapsed">Lapsed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Premium Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.premium_amount}
                  onChange={(e) => setEditForm({ ...editForm, premium_amount: e.target.value })}
                  placeholder="Enter premium amount"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Effective Date
                </label>
                <Input
                  type="date"
                  value={editForm.effective_date}
                  onChange={(e) => setEditForm({ ...editForm, effective_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

