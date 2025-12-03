import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <Head>
        <title>Admin Dashboard - Insurance CRM</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome back, System Administrator.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="p-6 bg-card rounded-lg border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Leads</h3>
          <p className="text-2xl font-bold text-foreground mt-2">1,234</p>
          <span className="text-xs text-emerald-500 mt-1 inline-block">↑ 12% from last month</span>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Active Agents</h3>
          <p className="text-2xl font-bold text-foreground mt-2">45</p>
          <span className="text-xs text-muted-foreground mt-1 inline-block">Across 3 Call Centers</span>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Conversion Rate</h3>
          <p className="text-2xl font-bold text-foreground mt-2">24.8%</p>
          <span className="text-xs text-emerald-500 mt-1 inline-block">↑ 2.4% increase</span>
        </div>
      </div>

      {/* Quick Actions / Recent Activity could go here */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent System Activity</h2>
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <p className="text-muted-foreground text-sm">No recent activity to display.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

