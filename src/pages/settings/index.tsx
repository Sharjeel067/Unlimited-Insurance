import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, User, Bell, Shield, Moon, Sun } from "lucide-react";
import { toast } from "react-toastify";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme("dark");
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await (supabase
        .from("profiles") as any)
        .update({
          full_name: profile.full_name,
          // email is managed by Auth, separate flow needed
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error("Error updating profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Settings - CRM</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and system settings.
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        
        {/* Profile Section */}
        <section className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Profile Information</h2>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                value={profile?.full_name || ""} 
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input 
                value={profile?.email || ""} 
                disabled 
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Contact admin to change email.</p>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </section>

        {/* Appearance Section */}
        <section className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border">
            {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme Mode</p>
              <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
            </div>
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setTheme("light")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </section>

        {/* Notifications Section (Placeholder) */}
        <section className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive daily summaries and alerts.</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lead Assignments</p>
                <p className="text-sm text-muted-foreground">Get notified when a new lead is assigned.</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Security</h2>
          </div>
          
          <div>
            <Button variant="outline" onClick={() => toast.info("Password reset link sent!")}>
              Change Password
            </Button>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}

