import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CreateUserModal } from "@/components/CreateUserModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Loader2, User, Mail, Briefcase, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  call_centers?: { name: string };
}

const roleLabels: Record<string, string> = {
  system_admin: "System Admin",
  sales_manager: "Sales Manager",
  sales_agent_licensed: "Sales Agent (Licensed)",
  sales_agent_unlicensed: "Sales Agent (Unlicensed)",
  call_center_manager: "Call Center Manager",
  call_center_agent: "Call Center Agent",
};

const roleColors: Record<string, string> = {
  system_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  sales_manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  sales_agent_licensed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  sales_agent_unlicensed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  call_center_manager: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  call_center_agent: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setCurrentUserRole(role);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*, call_centers(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteClick = (user: Profile) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleEditClick = (user: Profile) => {
    setUserToEdit(user);
    setEditModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      // Note: This deletes from the 'profiles' table.
      // If you want to delete from auth.users as well, you need to do it via Supabase Admin API (server-side)
      // or rely on database triggers if you have them set up to cascade back to auth.users (rare).
      // Usually, deleting from profiles is enough for the application logic, but the auth user remains.
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);

      if (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user. You might not have permission.");
      } else {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setDeleteModalOpen(false);
        setUserToDelete(null);
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
        <title>Users - Admin</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage system users, roles, and assignments.
          </p>
        </div>
        <CreateUserModal onUserCreated={fetchUsers} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Assignment</th>
                  <th className="px-6 py-4">Status</th>
                  {currentUserRole === 'system_admin' && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {user.full_name?.[0] || "U"}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", roleColors[user.role] || "bg-gray-100")}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.call_centers ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-4 h-4" />
                          {user.call_centers.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Active
                      </span>
                    </td>
                    {currentUserRole === 'system_admin' && (
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button 
                                    onClick={() => handleEditClick(user)}
                                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                                    title="Edit User"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(user)}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    title="Delete User"
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
          </div>
        </div>
      )}
      
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.full_name}? This will remove their profile from the system.`}
        confirmText="Delete"
        variant="destructive"
        loading={isDeleting}
      />
      
      {/* Edit Modal */}
      {userToEdit && (
        <CreateUserModal 
            isOpen={editModalOpen}
            onClose={() => {
                setEditModalOpen(false);
                setUserToEdit(null);
            }}
            onUserCreated={() => {
                fetchUsers();
                setEditModalOpen(false);
                setUserToEdit(null);
            }}
            userToEdit={userToEdit}
        />
      )}
    </DashboardLayout>
  );
}

