import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { LogOut, LayoutDashboard, Users, Settings, Phone, FileText, Shield, Kanban } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["system_admin", "sales_manager"] },
  { label: "Pipeline", href: "/pipeline", icon: Kanban, roles: ["system_admin", "sales_manager", "sales_agent_licensed", "sales_agent_unlicensed"] },
  { label: "Leads", href: "/leads", icon: FileText, roles: ["system_admin", "sales_manager", "sales_agent_licensed", "call_center_manager", "call_center_agent"] },
  { label: "Policies", href: "/policies", icon: Shield, roles: ["system_admin", "sales_manager", "sales_agent_licensed"] },
  { label: "Agents", href: "/agents", icon: Users, roles: ["system_admin", "sales_manager", "call_center_manager"] },
  { label: "Users", href: "/users", icon: Users, roles: ["system_admin"] },
  { label: "Call Centers", href: "/centers", icon: Phone, roles: ["system_admin"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["system_admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userRole");
    }
    return null;
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        localStorage.removeItem("userRole");
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const role = (profile as any)?.role || null;
      if (role) {
        localStorage.setItem("userRole", role);
        setUserRole(role);
      }
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userRole");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col fixed h-full">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">CRM System</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.filter(item => !item.roles || (userRole && item.roles.includes(userRole))).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                router.pathname === item.href || router.pathname.startsWith(item.href + "/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
