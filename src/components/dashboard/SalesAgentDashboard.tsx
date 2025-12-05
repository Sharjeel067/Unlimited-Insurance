import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Phone, Clock, AlertCircle, TrendingUp, DollarSign, User, Calendar, ArrowRight } from "lucide-react";
import { format, isToday, isAfter, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useRouter } from "next/router";
import { type UserRole } from "@/lib/permissions";
import { MyLeadsWidget } from "./MyLeadsWidget";
import { PerformanceMetricsWidget } from "./PerformanceMetricsWidget";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { PipelineOverviewWidget } from "./PipelineOverviewWidget";

interface SalesAgentDashboardProps {
  userRole: UserRole | null;
}

export function SalesAgentDashboard({ userRole }: SalesAgentDashboardProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading || !userId) {
    return (
      <DashboardLayout>
        <Head>
          <title>Sales Dashboard - CRM</title>
        </Head>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Sales Dashboard - CRM</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Sales Dashboard</h1>
        <p className="text-muted-foreground mt-2">Your work queue and performance overview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <MyLeadsWidget userId={userId} />
        </div>
        <div>
          <QuickActionsWidget userId={userId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PerformanceMetricsWidget userId={userId} />
        <PipelineOverviewWidget userId={userId} />
      </div>
    </DashboardLayout>
  );
}

