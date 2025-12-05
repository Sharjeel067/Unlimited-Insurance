import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Search, Phone, User, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

// Types
interface Lead {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    ssn: string | null;
    state: string | null;
    address: string | null;
    city: string | null;
    zip_code: string | null;
    date_of_birth: string | null;
    birth_state: string | null;
    age: number | null;
    height: string | null;
    weight: string | null;
    tobacco_use: boolean | null;
    health_conditions: string | null;
    medications: string | null;
    doctor_name: string | null;
    existing_coverage: string | null;
    desired_coverage: number | null;
    monthly_budget: number | null;
    draft_date: string | null;
    bank_name: string | null;
    routing_number: string | null;
    account_number: string | null;
    beneficiary_info: any;
    assigned_agent_id: string | null;
    call_center_id: string | null;
    stage_id: string | null;
    pipeline_id: string | null;
    profiles?: { full_name: string };
}

export default function CallEntryPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [foundLead, setFoundLead] = useState<Lead | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setFoundLead(null);
        setHasSearched(false);

        try {
            // Search by Phone or SSN
            // We need to handle potential formatting differences, but for now simple match
            const { data, error } = await supabase
                .from("leads")
                .select(`
          id,
          first_name,
          last_name,
          phone_number,
          ssn,
          state,
          address,
          city,
          zip_code,
          date_of_birth,
          birth_state,
          age,
          height,
          weight,
          tobacco_use,
          health_conditions,
          medications,
          doctor_name,
          existing_coverage,
          desired_coverage,
          monthly_budget,
          draft_date,
          bank_name,
          routing_number,
          account_number,
          beneficiary_info,
          assigned_agent_id,
          call_center_id,
          stage_id,
          pipeline_id,
          profiles:assigned_agent_id ( full_name )
        `)
                .or(`phone_number.eq.${searchQuery},ssn.eq.${searchQuery}`)
                .maybeSingle();

            if (error) throw error;

            setFoundLead(data as any);
            setHasSearched(true);
        } catch (error: any) {
            console.error("Search error:", error);
            toast.error("Failed to search lead: " + error.message);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateNew = () => {
        // Navigate to create lead page with pre-filled phone/ssn if possible
        // For now just go to create page
        router.push("/leads/createLead");
    };

    return (
        <DashboardLayout>
            <Head>
                <title>Call Entry - CRM</title>
            </Head>

            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Call Entry</h1>
                    <p className="text-muted-foreground mt-2">
                        Search for a lead to log a call, or create a new one if they don't exist.
                    </p>
                </div>

                {/* Search Section */}
                <div className="bg-card rounded-lg border border-border p-8 shadow-sm mb-8">
                    <form onSubmit={handleSearch} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Search by Phone Number or SSN
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Enter phone (e.g. 5551234567) or SSN"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
                            {isSearching ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                "Search"
                            )}
                        </Button>
                    </form>
                </div>

                {/* Search Results */}
                {hasSearched && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {foundLead ? (
                            <div className="bg-card rounded-lg border border-border overflow-hidden">
                                <div className="bg-primary/5 border-b border-border p-4 flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold text-foreground">Lead Found</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Name</p>
                                            <p className="font-medium text-lg text-foreground">
                                                {foundLead.first_name} {foundLead.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Phone</p>
                                            <div className="flex items-center gap-2 text-foreground">
                                                <Phone className="w-4 h-4" />
                                                {foundLead.phone_number}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">State</p>
                                            <p className="text-foreground">{foundLead.state}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Assigned Agent</p>
                                            <div className="flex items-center gap-2 text-foreground">
                                                <User className="w-4 h-4" />
                                                {foundLead.profiles?.full_name || "Unassigned"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <Button variant="outline" onClick={() => router.push(`/leads/createLead?id=${foundLead.id}`)}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            View Details
                                        </Button>
                                        <Button onClick={() => router.push(`/calls/entry/claimCall?phone_number=${foundLead.phone_number}`)}>
                                            <Phone className="w-4 h-4 mr-2" />
                                            Claim Call
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card rounded-lg border border-border overflow-hidden">
                                <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800/50 p-4 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                    <h3 className="font-semibold text-foreground">No Lead Found</h3>
                                </div>
                                <div className="p-6 text-center">
                                    <p className="text-muted-foreground mb-6">
                                        We couldn't find a lead matching "<strong>{searchQuery}</strong>".
                                    </p>
                                    <Button onClick={handleCreateNew}>
                                        Create New Lead
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
