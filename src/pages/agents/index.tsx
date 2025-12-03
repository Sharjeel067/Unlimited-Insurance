import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { Loader2, User, Mail, Briefcase, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  call_centers?: { name: string; location: string };
}

const roleLabels: Record<string, string> = {
  sales_agent_licensed: "Licensed Agent",
  sales_agent_unlicensed: "Unlicensed Agent",
  call_center_agent: "Call Center Agent",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*, call_centers(name, location)")
      .in("role", ["sales_agent_licensed", "sales_agent_unlicensed", "call_center_agent"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching agents:", error);
    } else {
      setAgents(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <DashboardLayout>
      <Head>
        <title>Agents - Admin</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground mt-2">
            Manage your sales and call center agents.
          </p>
        </div>
        <CreateUserModal onUserCreated={fetchAgents} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-card rounded-lg border border-border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No agents found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-card rounded-lg border border-border shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {agent.full_name?.[0] || "A"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{agent.full_name}</h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {agent.email}
                    </span>
                  </div>
                </div>
                <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide",
                    agent.role.includes('licensed') ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                    agent.role.includes('call_center') ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                )}>
                    {roleLabels[agent.role] || "Agent"}
                </span>
              </div>

              <div className="flex-1 space-y-3 mt-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Briefcase className="w-4 h-4 mr-2 opacity-70" />
                  {agent.call_centers?.name || "No Center Assigned"}
                </div>
                {agent.call_centers?.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2 opacity-70" />
                    {agent.call_centers.location}
                    </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-border flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">
                    Status
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

