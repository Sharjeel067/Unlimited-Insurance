import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";

interface CreateUserModalProps {
  onUserCreated: () => void;
}

export function CreateUserModal({ onUserCreated }: CreateUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("sales_agent_unlicensed");
  const [callCenterId, setCallCenterId] = useState("");
  const [managerId, setManagerId] = useState("");

  // Dropdown Data
  const [centers, setCenters] = useState<{id: string, name: string}[]>([]);
  const [managers, setManagers] = useState<{id: string, full_name: string}[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    const { data: centersData } = await supabase.from("call_centers").select("id, name");
    if (centersData) setCenters(centersData);

    const { data: managersData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in('role', ['sales_manager', 'call_center_manager']);
    if (managersData) setManagers(managersData as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          call_center_id: callCenterId || null,
          manager_id: managerId || null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setIsOpen(false);
      resetForm();
      toast.success("User created successfully");
      onUserCreated();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("sales_agent_unlicensed");
    setCallCenterId("");
    setManagerId("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Role</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="sales_agent_unlicensed">Sales Agent (Unlicensed)</option>
              <option value="sales_agent_licensed">Sales Agent (Licensed)</option>
              <option value="sales_manager">Sales Manager</option>
              <option value="call_center_agent">Call Center Agent</option>
              <option value="call_center_manager">Call Center Manager</option>
              <option value="system_admin">System Admin</option>
            </select>
          </div>

          {(role.includes("call_center")) && (
            <div>
              <label className="text-sm font-medium">Call Center</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={callCenterId}
                onChange={(e) => setCallCenterId(e.target.value)}
                required={role.includes("call_center")}
              >
                <option value="">Select Center...</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {(role.includes("sales_agent")) && (
            <div>
              <label className="text-sm font-medium">Reporting Manager</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
              >
                <option value="">Select Manager (Optional)...</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

