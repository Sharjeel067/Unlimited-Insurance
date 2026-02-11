import { useEffect, useState } from "react";
import { VerificationProgressBar } from "@/components/calls/VerificationProgressBar";
import { supabase } from "@/lib/supabaseClient";

interface TopVerificationProgressProps {
  submissionId: string;
  verificationSessionId: string;
}

export function TopVerificationProgress({
  verificationSessionId,
}: TopVerificationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const fetchProgress = async () => {
      const { data: items, error } = await supabase
        .from("verification_items")
        .select("is_verified")
        .eq("session_id", verificationSessionId);
      if (error) {
        console.error("[TopVerificationProgress] Error fetching items:", error);
        return;
      }
      console.log("[TopVerificationProgress] Items count:", items?.length ?? 0, "for session:", verificationSessionId);
      if (items && Array.isArray(items)) {
        const total = items.length;
        const verified = items.filter((item: { is_verified?: boolean }) => item.is_verified).length;
        setTotalCount(total);
        setVerifiedCount(verified);
        setProgress(total > 0 ? Math.round((verified / total) * 100) : 0);
      }
    };
    if (verificationSessionId) {
      fetchProgress();
      intervalId = setInterval(fetchProgress, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [verificationSessionId]);

  return (
    <VerificationProgressBar
      progress={progress}
      verifiedCount={verifiedCount}
      totalCount={totalCount}
    />
  );
}
