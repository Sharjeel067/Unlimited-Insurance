"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ColoredProgress } from "@/components/ui/ColoredProgress";
import { Copy, CheckCircle, XCircle, Clock, User, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { supabase } from "@/lib/supabaseClient";
import { logCallUpdate, getLeadInfo } from "@/lib/callLogging";
import { useRealtimeVerification, type VerificationItemRow } from "@/hooks/useRealtimeVerification";

const FIELD_ORDER = [
  "lead_vendor",
  "customer_full_name",
  "street_address",
  "beneficiary_information",
  "billing_and_mailing_address_is_the_same",
  "date_of_birth",
  "age",
  "phone_number",
  "social_security",
  "driver_license",
  "existing_coverage",
  "height",
  "weight",
  "doctors_name",
  "tobacco_use",
  "health_conditions",
  "medications",
  "carrier",
  "monthly_premium",
  "coverage_amount",
  "draft_date",
  "institution_name",
  "beneficiary_routing",
  "beneficiary_account",
  "account_type",
  "city",
  "state",
  "zip_code",
  "birth_state",
  "additional_notes",
];

interface VerificationPanelProps {
  sessionId: string;
  onTransferReady?: () => void;
}

export function VerificationPanel({ sessionId, onTransferReady }: VerificationPanelProps) {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [elapsedTime, setElapsedTime] = useState("00:00");

  const {
    session,
    verificationItems,
    loading,
    error,
    toggleVerification,
    updateVerifiedValue,
    updateSessionStatus,
  } = useRealtimeVerification(sessionId);

  const copyNotesToClipboard = () => {
    if (!verificationItems?.length) return;
    const fieldValues: Record<string, string> = {};
    verificationItems.forEach((item) => {
      fieldValues[item.field_name] = inputValues[item.id] ?? item.verified_value ?? item.original_value ?? "N/A";
    });
    const lines = [
      `lead_vendor: ${fieldValues.lead_vendor ?? "N/A"}`,
      `customer_full_name: ${fieldValues.customer_full_name ?? "N/A"}`,
      `Address: ${[fieldValues.street_address, fieldValues.city, fieldValues.state, fieldValues.zip_code].filter(Boolean).join(", ") || "N/A"}`,
      `Beneficiary: ${fieldValues.beneficiary_information ?? "N/A"}`,
      `Date of Birth: ${fieldValues.date_of_birth ?? "N/A"}`,
      `Age: ${fieldValues.age ?? "N/A"}`,
      `Phone: ${fieldValues.phone_number ?? "N/A"}`,
      `SSN: ${fieldValues.social_security ?? "N/A"}`,
      `Driver License: ${fieldValues.driver_license ?? "N/A"}`,
      `Carrier: ${fieldValues.carrier ?? "N/A"}`,
      `Premium: ${fieldValues.monthly_premium ?? "N/A"}`,
      `Coverage: ${fieldValues.coverage_amount ?? "N/A"}`,
      `Draft Date: ${fieldValues.draft_date ?? "N/A"}`,
      `Notes: ${fieldValues.additional_notes ?? "N/A"}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Lead information copied to clipboard");
  };

  useEffect(() => {
    if (!session?.started_at) return;
    const iv = setInterval(() => {
      const start = new Date(session.started_at!);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsedTime(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [session?.started_at]);

  useEffect(() => {
    if (!verificationItems?.length) return;
    const next: Record<string, string> = {};
    verificationItems.forEach((item) => {
      if (inputValues[item.id] === undefined) {
        next[item.id] = item.verified_value || item.original_value || "";
      }
    });
    if (Object.keys(next).length) setInputValues((prev) => ({ ...prev, ...next }));
  }, [verificationItems]);

  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleFieldChange = (itemId: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [itemId]: value }));
    const prev = debounceRef.current[itemId];
    if (prev) clearTimeout(prev);
    debounceRef.current[itemId] = setTimeout(() => {
      updateVerifiedValue(itemId, value);
      delete debounceRef.current[itemId];
    }, 500);
  };

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    toggleVerification(itemId, checked);
  };

  const handleTransferToLA = async () => {
    await updateSessionStatus("transferred");
    if (session?.buffer_agent_id) {
      const { customerName, leadVendor } = await getLeadInfo(session.submission_id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.buffer_agent_id)
        .maybeSingle();
      const agentName = (profile as { full_name?: string } | null)?.full_name || "Buffer Agent";
      await logCallUpdate({
        submissionId: session.submission_id,
        agentId: session.buffer_agent_id,
        agentType: "buffer",
        agentName,
        eventType: "transferred_to_la",
        eventDetails: { verification_session_id: session.id, transferred_at: new Date().toISOString() },
        verificationSessionId: session.id,
        customerName,
        leadVendor,
      });
    }
    onTransferReady?.();
    toast.success("Lead ready for Licensed Agent review");
  };

  const totalItems = verificationItems?.length ?? 0;
  const progress =
    totalItems > 0
      ? Math.round(
          (verificationItems!.filter((i) => i.is_verified).length / totalItems) * 100
        )
      : 0;

  const formatFieldName = (n: string) =>
    n.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const getFieldIcon = (item: VerificationItemRow) => {
    if (!item.is_verified) return <XCircle className="h-4 w-4 text-gray-400" />;
    if (item.is_modified) return <CheckCircle className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const sortedItems = [...(verificationItems || [])].sort((a, b) => {
    const ai = FIELD_ORDER.indexOf(a.field_name);
    const bi = FIELD_ORDER.indexOf(b.field_name);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading verification panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <div className="text-center text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <div className="text-center text-muted-foreground">No verification session found</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Verification Panel</h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                session.status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : session.status === "transferred"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {session.status.replace("_", " ").toUpperCase()}
            </span>
            <Button variant="outline" size="sm" onClick={copyNotesToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Edited Notes
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Agent: {session.buffer_agent_id || session.licensed_agent_id || "—"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {elapsedTime}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span
              className={`font-semibold ${
                progress >= 76 ? "text-green-600" : progress >= 51 ? "text-yellow-600" : progress >= 26 ? "text-orange-600" : "text-red-600"
              }`}
            >
              {progress}%
            </span>
          </div>
          <ColoredProgress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {verificationItems!.filter((i) => i.is_verified).length} of {verificationItems!.length}{" "}
            fields verified
          </p>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: "calc(100vh - 420px)", minHeight: 400 }}
      >
        {sortedItems.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center gap-2">
              {getFieldIcon(item)}
              <Label className="text-xs font-medium">{formatFieldName(item.field_name)}</Label>
              <input
                type="checkbox"
                checked={!!item.is_verified}
                onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                className="ml-auto h-4 w-4 rounded border-input cursor-pointer"
              />
            </div>
            <Input
              value={inputValues[item.id] ?? item.verified_value ?? item.original_value ?? ""}
              onChange={(e) => handleFieldChange(item.id, e.target.value)}
              placeholder={`Enter ${formatFieldName(item.field_name).toLowerCase()}`}
              className="text-sm"
            />
          </div>
        ))}
      </div>

      {session.buffer_agent_id && progress >= 76 && session.status !== "transferred" && (
        <div className="p-4 border-t border-border flex-shrink-0">
          <Button onClick={handleTransferToLA}>Transfer to Licensed Agent</Button>
        </div>
      )}
    </div>
  );
}
