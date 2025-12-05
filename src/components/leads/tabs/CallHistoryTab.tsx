import { Loader2, History, Calendar, User, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CallHistoryTabProps {
  callHistory: any[];
  loading: boolean;
}

export function CallHistoryTab({ callHistory, loading }: CallHistoryTabProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (callHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No call update records found</p>
      </div>
    );
  }

  return (
    <section>
      <h3 className="font-semibold text-foreground mb-6 text-lg">Call Update History</h3>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Call Source</th>
                <th className="px-6 py-4">Carrier</th>
                <th className="px-6 py-4">Product Type</th>
                <th className="px-6 py-4">Application Submitted</th>
                <th className="px-6 py-4">Coverage Amount</th>
                <th className="px-6 py-4">Monthly Premium</th>
                <th className="px-6 py-4">Sent to Underwriting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {callHistory.map((call) => (
                <tr key={call.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {call.created_at ? format(new Date(call.created_at), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      {call.profiles?.full_name || call.agent_who_took_call || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {call.call_source || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {call.carrier || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {call.product_type || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {call.application_submitted !== null ? (
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        call.application_submitted 
                          ? "bg-emerald-100 text-black dark:bg-emerald-900/20 dark:text-black"
                          : "bg-gray-100 text-black dark:bg-gray-900/20 dark:text-black"
                      )}>
                        {call.application_submitted ? "Yes" : "No"}
                      </span>
                    ) : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {call.coverage_amount ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        ${call.coverage_amount.toLocaleString()}
                      </div>
                    ) : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {call.monthly_premium ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        ${call.monthly_premium.toLocaleString()}
                      </div>
                    ) : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {call.sent_to_underwriting !== null ? (
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        call.sent_to_underwriting 
                          ? "bg-emerald-100 text-black dark:bg-emerald-900/20 dark:text-black"
                          : "bg-gray-100 text-black dark:bg-gray-900/20 dark:text-black"
                      )}>
                        {call.sent_to_underwriting ? "Yes" : "No"}
                      </span>
                    ) : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

