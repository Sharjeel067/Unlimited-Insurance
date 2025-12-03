import { supabase } from "@/lib/supabaseClient";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NextRouter } from "next/router";

export interface LoginCredentials {
  email: string;
  password: string;
}

export const handleLogin = async (
  credentials: LoginCredentials,
  router: NextRouter,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  setLoading(true);
  setError(null);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;

    // Check user role to determine redirect
    // For MVP, we'll fetch the profile to get the role
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        // If profile not found, it might be a sync issue or first login
        // Fallback to default dashboard or show error
        console.error("Profile fetch error:", profileError);
        router.push("/dashboard"); 
        return;
      }

      switch ((profile as any).role) {
        case "system_admin":
          router.push("/dashboard");
          break;
        case "sales_manager":
        case "sales_agent_licensed":
        case "sales_agent_unlicensed":
          router.push("/dashboard");
          break;
        case "call_center_manager":
          router.push("/dashboard");
          break;
        case "call_center_agent":
          router.push("/leads");
          break;
        default:
          router.push("/dashboard");
      }
    }
  } catch (err: any) {
    setError(err.message || "An error occurred during login");
  } finally {
    setLoading(false);
  }
};

export const handleLogout = async (router: NextRouter) => {
  await supabase.auth.signOut();
  // Clear user info from localStorage
  localStorage.removeItem("userInfo");
  localStorage.removeItem("userRole");
  router.push("/");
};

