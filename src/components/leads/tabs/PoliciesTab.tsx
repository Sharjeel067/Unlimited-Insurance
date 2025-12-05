import { Loader2, Shield, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PoliciesTabProps {
  policies: any[];
  loading: boolean;
}

export function PoliciesTab({ policies, loading }: PoliciesTabProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No policies attached to this lead</p>
      </div>
    );
  }

  return (
    <section>
      <h3 className="font-semibold text-foreground mb-6 text-lg">Policy Information</h3>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Carrier</th>
              <th className="px-6 py-4">Policy Number</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Premium</th>
              <th className="px-6 py-4">Commission</th>
              <th className="px-6 py-4">Application Date</th>
              <th className="px-6 py-4">Effective Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-accent/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">
                  {policy.carrier_name || "N/A"}
                </td>
                <td className="px-6 py-4 text-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-muted-foreground" />
                    {policy.policy_number || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                    policy.status?.toLowerCase() === "active" ? "bg-emerald-100 text-black dark:bg-emerald-900/20 dark:text-black" :
                    policy.status?.toLowerCase() === "pending" ? "bg-yellow-100 text-black dark:bg-yellow-900/20 dark:text-black" :
                    policy.status?.toLowerCase() === "lapsed" ? "bg-red-100 text-black dark:bg-red-900/20 dark:text-black" :
                    policy.status?.toLowerCase() === "cancelled" ? "bg-gray-100 text-black dark:bg-gray-900/20 dark:text-black" :
                    "bg-gray-100 text-black dark:bg-gray-900/20 dark:text-black"
                  )}>
                    {policy.status || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground">
                  {policy.premium_amount ? (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      ${policy.premium_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </div>
                  ) : "N/A"}
                </td>
                <td className="px-6 py-4 text-foreground">
                  {policy.commission_amount ? (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      ${policy.commission_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  ) : "N/A"}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {policy.application_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(policy.application_date), "MMM d, yyyy")}
                    </div>
                  ) : "N/A"}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {policy.effective_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(policy.effective_date), "MMM d, yyyy")}
                    </div>
                  ) : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

