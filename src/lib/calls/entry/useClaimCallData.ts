import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Lead } from "./types";

export function useClaimCallData() {
    const router = useRouter();
    const { phone_number, lead_id } = router.query;
    const [loading, setLoading] = useState(false);
    const [fetchingLead, setFetchingLead] = useState(true);
    const [lead, setLead] = useState<Lead | null>(null);
    const [agents, setAgents] = useState<Array<{ id: string; full_name: string }>>([]);
    const [stages, setStages] = useState<Array<{ id: string; name: string; pipeline_id: string }>>([]);
    const [licensedAgents, setLicensedAgents] = useState<Array<{ id: string; full_name: string }>>([]);

    useEffect(() => {
        if (phone_number || lead_id) {
            fetchLead();
            fetchAgents();
            fetchStages();
            fetchLicensedAgents();
        }
    }, [phone_number, lead_id]);

    const fetchLead = async () => {
        if (!phone_number && !lead_id) return;

        setFetchingLead(true);
        try {
            let query = supabase
                .from("leads")
                .select(`
                    *,
                    profiles:assigned_agent_id ( full_name ),
                    buffer_agent:buffer_agent_id ( full_name ),
                    call_centers:call_center_id ( name ),
                    stages:stage_id ( name, color_code ),
                    pipelines:pipeline_id ( name, type )
                `);

            let data, error;
            if (lead_id) {
                const result = await query.eq("id", lead_id).maybeSingle();
                data = result.data;
                error = result.error;
            } else if (phone_number) {
                const result = await query
                    .eq("phone_number", phone_number)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                data = result.data;
                error = result.error;
            }

            if (error) throw error;
            if (!data) {
                toast.error("Lead not found");
                router.push("/calls/entry");
                return;
            }

            setLead(data as Lead);
        } catch (error: any) {
            console.error("Error fetching lead:", error);
            toast.error("Failed to fetch lead: " + error.message);
            router.push("/calls/entry");
        } finally {
            setFetchingLead(false);
        }
    };

    const fetchAgents = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name")
                .order("full_name");

            if (error) throw error;
            setAgents(data || []);
        } catch (error) {
            console.error("Error fetching agents:", error);
        }
    };

    const fetchLicensedAgents = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("role", ["sales_agent_licensed", "sales_manager"])
                .order("full_name");

            if (error) throw error;
            setLicensedAgents(data || []);
        } catch (error) {
            console.error("Error fetching licensed agents:", error);
        }
    };

    const fetchStages = async () => {
        try {
            // First get the Transfer Portal pipeline ID
            const { data: pipelines, error: pipelineError } = await supabase
                .from("pipelines")
                .select("id")
                .eq("name", "Transfer Portal")
                .maybeSingle();

            if (pipelineError) throw pipelineError;

            const transferPortalId = (pipelines as { id?: string } | null)?.id;

            // Then fetch stages, filtering by Transfer Portal pipeline if found
            let query = supabase
                .from("stages")
                .select("id, name, pipeline_id")
                .order("order_index");

            if (transferPortalId) {
                query = query.eq("pipeline_id", transferPortalId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setStages(data || []);
        } catch (error) {
            console.error("Error fetching stages:", error);
        }
    };

    return {
        loading,
        fetchingLead,
        lead,
        agents,
        stages,
        licensedAgents,
        setLoading,
    };
}

