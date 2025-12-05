import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";

export function useLeadTabData(leadId: string | string[] | undefined, activeTab: string) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [loadingCallHistory, setLoadingCallHistory] = useState(false);

  const fetchNotes = async () => {
    if (!leadId) return;
    setLoadingNotes(true);
    try {
      const { data, error } = await supabase
        .from("lead_notes")
        .select(`
          *,
          profiles:user_id ( full_name )
        `)
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const allNotes: any[] = [];

      if (data) {
        data.forEach((note: any) => {
          allNotes.push({
            id: note.id,
            type: "note",
            content: note.content,
            created_at: note.created_at,
            user_name: note.profiles?.full_name || "Unknown",
            is_pinned: note.is_pinned,
          });
        });
      }

      allNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotes(allNotes);
    } catch (error: any) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchPolicies = async () => {
    if (!leadId) return;
    setLoadingPolicies(true);
    try {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error: any) {
      console.error("Error fetching policies:", error);
      toast.error("Failed to load policies");
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchCallHistory = async () => {
    if (!leadId) return;
    setLoadingCallHistory(true);
    try {
      const { data, error } = await supabase
        .from("call_update")
        .select(`
          *,
          profiles:user_id ( full_name )
        `)
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCallHistory(data || []);
    } catch (error: any) {
      console.error("Error fetching call history:", error);
      toast.error("Failed to load call history");
    } finally {
      setLoadingCallHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "notes" && leadId) {
      fetchNotes();
    }
    if (activeTab === "policies" && leadId) {
      fetchPolicies();
    }
    if (activeTab === "callHistory" && leadId) {
      fetchCallHistory();
    }
  }, [activeTab, leadId]);

  return {
    notes,
    loadingNotes,
    policies,
    loadingPolicies,
    callHistory,
    loadingCallHistory,
  };
}

