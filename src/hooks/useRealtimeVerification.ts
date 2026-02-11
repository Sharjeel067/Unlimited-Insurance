import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface VerificationItemRow {
  id: string;
  session_id: string;
  field_name: string;
  original_value: string | null;
  verified_value: string | null;
  is_verified: boolean;
  is_modified: boolean;
  notes: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationSessionRow {
  id: string;
  submission_id: string;
  status: string;
  buffer_agent_id: string | null;
  licensed_agent_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  transferred_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useRealtimeVerification(sessionId: string) {
  const [session, setSession] = useState<VerificationSessionRow | null>(null);
  const [verificationItems, setVerificationItems] = useState<VerificationItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retriedRef = useRef(false);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      console.log("[useRealtimeVerification] Fetching session:", sessionId);
      
      const { data: sessionData, error: sessionError } = await supabase
        .from("verification_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) {
        console.error("[useRealtimeVerification] Session error:", sessionError);
        throw sessionError;
      }
      console.log("[useRealtimeVerification] Session found:", sessionData?.id, "status:", sessionData?.status);
      setSession(sessionData as VerificationSessionRow);

      const { data: itemsData, error: itemsError } = await supabase
        .from("verification_items")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (itemsError) {
        console.error("[useRealtimeVerification] Items error:", itemsError);
        throw itemsError;
      }
      console.log("[useRealtimeVerification] Items found:", itemsData?.length ?? 0);
      if (itemsData && itemsData.length > 0) {
        console.log("[useRealtimeVerification] Sample item:", itemsData[0]);
      }
      setVerificationItems((itemsData as VerificationItemRow[]) || []);
      setError(null);
    } catch (err) {
      console.error("[useRealtimeVerification] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch verification data");
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationItem = async (
    itemId: string,
    updates: Partial<VerificationItemRow>
  ) => {
    const { data, error: updateError } = await supabase
      .from("verification_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .select()
      .single();

    if (updateError) throw updateError;
    setVerificationItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
    return data;
  };

  const toggleVerification = async (itemId: string, isVerified: boolean) => {
    await updateVerificationItem(itemId, {
      is_verified: isVerified,
      verified_at: isVerified ? new Date().toISOString() : null,
    });
  };

  const updateVerifiedValue = async (itemId: string, verifiedValue: string) => {
    const item = verificationItems.find((i) => i.id === itemId);
    const isModified = item?.original_value !== verifiedValue;
    await updateVerificationItem(itemId, {
      verified_value: verifiedValue,
      is_modified: isModified,
    });
  };

  const updateVerificationNotes = async (itemId: string, notes: string) => {
    await updateVerificationItem(itemId, { notes });
  };

  const updateSessionStatus = async (status: string) => {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "completed" || status === "transferred") {
      updates.completed_at = new Date().toISOString();
    }
    if (status === "transferred") {
      updates.transferred_at = new Date().toISOString();
    }
    const { data, error: updateError } = await supabase
      .from("verification_sessions")
      .update(updates)
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) throw updateError;
    if (session) setSession({ ...session, ...updates } as VerificationSessionRow);
    return data;
  };

  useEffect(() => {
    retriedRef.current = false;
    fetchSessionData();
    const sessionCh = supabase
      .channel(`verification_session_${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") setSession(payload.new as VerificationSessionRow);
        }
      )
      .subscribe();

    const itemsCh = supabase
      .channel(`verification_items_${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_items", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setVerificationItems((prev) =>
              prev.map((item) => (item.id === (payload.new as { id: string }).id ? (payload.new as VerificationItemRow) : item))
            );
          } else if (payload.eventType === "INSERT") {
            setVerificationItems((prev) => [...prev, payload.new as VerificationItemRow]);
          } else if (payload.eventType === "DELETE") {
            setVerificationItems((prev) =>
              prev.filter((item) => item.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionCh);
      supabase.removeChannel(itemsCh);
    };
  }, [sessionId]);

  // Retry fetch once when session exists but 0 items (e.g. insert/fetch race or RLS fix)
  useEffect(() => {
    if (loading || !session || verificationItems.length > 0 || retriedRef.current) return;
    retriedRef.current = true;
    const t = setTimeout(() => fetchSessionData(), 600);
    return () => clearTimeout(t);
  }, [loading, session, verificationItems.length]);

  return {
    session,
    verificationItems,
    loading,
    error,
    toggleVerification,
    updateVerifiedValue,
    updateVerificationNotes,
    updateSessionStatus,
    refetch: fetchSessionData,
  };
}
