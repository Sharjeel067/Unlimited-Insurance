import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CreateCenterModal } from "@/components/CreateCenterModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Loader2, MapPin, Trash2 } from "lucide-react";

interface CallCenter {
  id: string;
  name: string;
  location: string;
  created_at: string;
  agent_count?: number;
}

export default function CallCentersPage() {
  const [centers, setCenters] = useState<CallCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<CallCenter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const fetchCenters = async () => {
    setLoading(true);
    // Fetch centers with a count of agents (profiles linked to them)
    const { data, error } = await supabase
      .from("call_centers")
      .select("*, profiles(count)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching centers:", error);
    } else {
      // Transform data to include agent count
      const formatted = data.map((center: any) => ({
        ...center,
        agent_count: center.profiles ? center.profiles[0].count : 0,
      }));
      setCenters(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  const handleDeleteClick = (center: CallCenter) => {
    setCenterToDelete(center);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!centerToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("call_centers")
        .delete()
        .eq("id", centerToDelete.id);

      if (error) {
        console.error("Error deleting center:", error);
        alert("Failed to delete center. Ensure there are no agents assigned to this center before deleting.");
      } else {
        setCenters(centers.filter(c => c.id !== centerToDelete.id));
        setDeleteModalOpen(false);
        setCenterToDelete(null);
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
        <title>Call Centers - Admin</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Call Centers</h1>
          <p className="text-muted-foreground mt-2">
            Manage your call center locations and view their performance.
          </p>
        </div>
        <CreateCenterModal onCenterCreated={fetchCenters} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : centers.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border border-dashed">
          <p className="text-muted-foreground">No call centers found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centers.map((center) => (
            <div
              key={center.id}
              className="bg-card rounded-lg border border-border shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {center.name}
                </h3>
                {userRole === 'system_admin' && (
                    <button 
                        onClick={() => handleDeleteClick(center)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Delete Call Center"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  {center.location || "No location set"}
                </div>
                
                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Active Agents
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {center.agent_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Call Center"
        description={`Are you sure you want to delete ${centerToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={isDeleting}
      />
    </DashboardLayout>
  );
}

