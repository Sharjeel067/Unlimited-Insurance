import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { LogOut, LayoutDashboard, Users, Settings, Phone, FileText, Shield, Kanban, User, ChevronDown, TrendingUp, FileCheck } from "lucide-react";
import { FaBell } from "react-icons/fa";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getRolesWithAccess, isValidRole, type UserRole } from "@/lib/permissions";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: getRolesWithAccess("view_own_performance").concat(
      getRolesWithAccess("view_team_performance"),
      getRolesWithAccess("view_center_performance"),
      getRolesWithAccess("view_all_performance")
    )
  },
  {
    label: "Call Entry",
    href: "/calls/entry",
    icon: Phone,
    roles: ["sales_agent_licensed", "sales_agent_unlicensed", "sales_manager", "call_center_manager", "system_admin"] as UserRole[]
  },
  {
    label: "Stages",
    href: "/stages",
    icon: Kanban,
    roles: getRolesWithAccess("access_pipeline_readonly").concat(
      getRolesWithAccess("access_pipeline_full")
    )
  },
  {
    label: "Leads",
    href: "/leads",
    icon: FileText,
    roles: getRolesWithAccess("view_own_leads").concat(
      getRolesWithAccess("view_assigned_leads"),
      getRolesWithAccess("view_center_leads"),
      getRolesWithAccess("view_all_team_leads"),
      getRolesWithAccess("view_all_leads")
    )
  },
  {
    label: "Policies",
    href: "/policies",
    icon: Shield,
    roles: getRolesWithAccess("convert_leads_to_customers")
  },
  {
    label: "Policy Attachment",
    href: "/policyAttachment",
    icon: FileCheck,
    roles: ["sales_manager", "system_admin"] as UserRole[]
  },
  {
    label: "Daily Deal Flow",
    href: "/dailyDealFlow",
    icon: TrendingUp,
    roles: getRolesWithAccess("generate_reports")
  },
  {
    label: "Agents",
    href: "/agents",
    icon: Users,
    roles: getRolesWithAccess("manage_call_center_agents").concat(
      getRolesWithAccess("manage_users")
    )
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: getRolesWithAccess("manage_users")
  },
  {
    label: "Call Centers",
    href: "/centers",
    icon: Phone,
    roles: getRolesWithAccess("manage_users")
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedRole = localStorage.getItem("userRole");
    if (savedRole && isValidRole(savedRole)) {
      setUserRole(savedRole);
    }
  }, []);

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
        .select("id, email, full_name, role, call_center_id, manager_id, avatar_url, status, created_at, updated_at")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const profileData = profile as any;
        const role = profileData.role || null;

        if (role) {
          localStorage.setItem("userRole", role);
          setUserRole(role);
        }

        // Save full user info to localStorage
        const userInfo = {
          id: session.user.id,
          email: profileData.email,
          full_name: profileData.full_name,
          role: profileData.role,
          call_center_id: profileData.call_center_id,
          manager_id: profileData.manager_id,
          avatar_url: profileData.avatar_url,
          status: profileData.status,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
        };
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        setUserProfile({
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
        });
      }
    };

    checkUser();
  }, [router]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAvatarDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
    };

    if (avatarDropdownOpen || notificationDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [avatarDropdownOpen, notificationDropdownOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userRole");
    localStorage.removeItem("userInfo");
    setAvatarDropdownOpen(false);
    router.push("/");
  };

  const handleProfileClick = () => {
    setAvatarDropdownOpen(false);
    router.push("/settings");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - full height, starts from top, highest z-index */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full top-0 left-0 transition-colors duration-300 z-30">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">Unlimited Insurance</h1>
        </div>

        <nav className="flex-1 p-4 pt-6 space-y-1 overflow-y-auto">
          {mounted && userRole && isValidRole(userRole) ? (
            sidebarItems.filter(item => !item.roles || item.roles.includes(userRole)).map((item) => {
            const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-slate-400 group-hover:text-white")} />
                {item.label}
              </Link>
            );
            })
          ) : (
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="opacity-50">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* Header - only on right side, starts where sidebar ends */}
      <header className="h-16 bg-card border-b border-border fixed top-0 left-64 right-0 z-20 flex items-center justify-end gap-4 px-6 shadow-sm">
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setNotificationDropdownOpen(!notificationDropdownOpen);
              setAvatarDropdownOpen(false);
            }}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Notifications"
          >
            <FaBell className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Notification Dropdown */}
          {notificationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border z-30">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <FaBell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground mt-1">You'll see notifications here when they arrive</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setAvatarDropdownOpen(!avatarDropdownOpen);
              setNotificationDropdownOpen(false);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium overflow-hidden">
              {mounted && userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.full_name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(mounted ? userProfile?.full_name || null : null)
              )}
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", avatarDropdownOpen && "rotate-180")} />
          </button>

          {/* Dropdown Menu */}
          {avatarDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-30">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 ml-64 mt-16 p-6 lg:p-8 min-w-0 overflow-x-hidden">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
