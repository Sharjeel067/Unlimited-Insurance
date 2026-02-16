"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ColoredProgress } from "@/components/ui/ColoredProgress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Copy, CheckCircle, XCircle, Clock, User, Loader2, Phone, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";
import { supabase } from "@/lib/supabaseClient";
import { logCallUpdate, getLeadInfo } from "@/lib/callLogging";
import { useRealtimeVerification, type VerificationItemRow } from "@/hooks/useRealtimeVerification";

const FIELD_ORDER = [
  // 1. Protection Plan
  "protection_plan_included",
  // 2-3. First & Last Name
  "first_name",
  "last_name",
  // 4. Mailing Address (combined)
  "address",
  "city",
  "state",
  "zip_code",
  // 5. Phone with DNC & TCPA
  "phone_number",
  "dnc_status",
  "tcpa_consent",
  // 6-7. Email & Password
  "email",
  "client_password",
  // 8. Primary User Same As Client
  "primary_user_same_as_client",
  "primary_user_first_name",
  "primary_user_last_name",
  // 9. Billing - Payment Method (determines which fields show)
  "payment_method",
  // Credit Card Fields (shown when payment_method = credit_card)
  "cardholder_name",
  "card_number",
  "card_expiry",
  // ACH Fields (shown when payment_method = ach)
  "account_holder_name",
  "routing_number",
  "account_number",
  "account_type",
  "bank_name",
  // Product Information
  "company_name",
  "quoted_product",
  "device_cost",
  "shipping_cost",
  "monthly_subscription",
  "protection_plan_cost",
  // Totals
  "total_upfront_cost",
  "total_monthly_cost",
];

// Fields to exclude from the verification panel
const EXCLUDED_FIELDS = [
  "form_version",
  "source",
  "center_user_name",
  "lead_vendor",
  "discounted_device_cost",
];

interface VerificationPanelProps {
  sessionId: string;
  onTransferReady?: () => void;
}

export function VerificationPanel({ sessionId, onTransferReady }: VerificationPanelProps) {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [protectionPlanIncluded, setProtectionPlanIncluded] = useState<string>("");
  const [primaryUserSameAsClient, setPrimaryUserSameAsClient] = useState<string>("");
  
  // DNC Check states
  const [dncChecking, setDncChecking] = useState(false);
  const [dncResult, setDncResult] = useState<{isDnc: boolean; isTcpa: boolean; message: string} | null>(null);
  const [showDncModal, setShowDncModal] = useState(false);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string>("");
  const [pendingPhoneVerification, setPendingPhoneVerification] = useState<string | null>(null);
  const [phoneDncStatus, setPhoneDncStatus] = useState<{itemId: string; status: 'clear' | 'dnc' | 'tcpa'} | null>(null);

  const {
    session,
    verificationItems,
    loading,
    error,
    toggleVerification,
    updateVerifiedValue,
    updateSessionStatus,
  } = useRealtimeVerification(sessionId);

  // DNC Check Function
  const checkDnc = async (phoneNumber: string, itemId: string) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number before checking DNC.");
      return null;
    }

    setDncChecking(true);
    setDncResult(null);

    try {
      // Clean the phone number - remove non-digits
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      console.log(`[DNC Check] Checking number: ${cleanPhone}`);
      
      const response = await fetch('https://akdryqadcxhzqcqhssok.supabase.co/functions/v1/dnc-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZHJ5cWFkY3hoenFjcWhzc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg5MDQsImV4cCI6MjA2OTMwNDkwNH0.36poCyc_PGl2EnGM3283Hj5_yxRYQU2IetYl8aUA3r4',
        },
        body: JSON.stringify({ mobileNumber: cleanPhone }),
      });

      if (!response.ok) {
        throw new Error(`DNC check failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[DNC Check] API Response:', result);
      
      // Debug: Log the full response structure
      console.log('[DNC Check] Full result object:', JSON.stringify(result, null, 2));
      
      // Parse RealValidito API response
      let isTcpa = false;
      let isDnc = false;
      
      // RealValidito response format:
      // { status: "success", data: { federal_dnc: ["4047686084"], tcpa_litigator: [] } }
      if (result && result.data) {
        const data = result.data;
        
        // Check DNC in federal_dnc array
        if (data.federal_dnc && Array.isArray(data.federal_dnc)) {
          isDnc = data.federal_dnc.includes(cleanPhone);
          if (isDnc) console.log(`[DNC Check] Found ${cleanPhone} in federal_dnc`);
        }
        
        // Also check for dnc array (alternative format)
        if (!isDnc && data.dnc && Array.isArray(data.dnc)) {
          isDnc = data.dnc.includes(cleanPhone);
          if (isDnc) console.log(`[DNC Check] Found ${cleanPhone} in dnc`);
        }
        
        // Check TCPA/Litigator in tcpa_litigator array
        if (data.tcpa_litigator && Array.isArray(data.tcpa_litigator)) {
          isTcpa = data.tcpa_litigator.includes(cleanPhone);
          if (isTcpa) console.log(`[DNC Check] Found ${cleanPhone} in tcpa_litigator`);
        }
      }
      
      console.log(`[DNC Check] Parsed results - isTcpa: ${isTcpa}, isDnc: ${isDnc}`);
      
      const resultData = {
        isDnc: isDnc,
        isTcpa: isTcpa,
        message: isTcpa 
          ? 'WARNING: This number is flagged as TCPA/Litigator. Cannot proceed with submission.'
          : isDnc 
            ? 'This number is on the DNC list. Proceed with caution.'
            : 'This number is clear. Safe to proceed.',
      };

      setDncResult(resultData);
      setCurrentPhoneNumber(phoneNumber);

      if (isTcpa) {
        // TCPA - Show modal in RED
        setPhoneDncStatus({ itemId, status: 'tcpa' });
        setPendingPhoneVerification(itemId);
        setShowDncModal(true);
        toast.error("This phone number is flagged as TCPA/Litigator.");
      } else if (isDnc) {
        // DNC - Show modal
        setPhoneDncStatus({ itemId, status: 'dnc' });
        setPendingPhoneVerification(itemId);
        setShowDncModal(true);
        toast.warning("This number is on the Do Not Call list. Please verify before proceeding.");
      } else {
        // Clear - Auto-verify and show green status
        setPhoneDncStatus({ itemId, status: 'clear' });
        toggleVerification(itemId, true);
        toast.success("This number is clear and safe to contact.");
      }

      return resultData;
    } catch (error) {
      console.error('[DNC Check] Error:', error);
      toast.error("Unable to check DNC status. Please try again.");
      return null;
    } finally {
      setDncChecking(false);
    }
  };

  const handleDncModalConfirm = () => {
    if (pendingPhoneVerification) {
      toggleVerification(pendingPhoneVerification, true);
      setPendingPhoneVerification(null);
    }
    setShowDncModal(false);
  };

  const handleDncModalCancel = () => {
    setPendingPhoneVerification(null);
    setShowDncModal(false);
  };

  const copyNotesToClipboard = () => {
    if (!verificationItems?.length) return;
    const fieldValues: Record<string, string> = {};
    verificationItems.forEach((item) => {
      fieldValues[item.field_name] = inputValues[item.id] ?? item.verified_value ?? item.original_value ?? "N/A";
    });
    
    const lines = [
      `PROTECTION PLAN: ${fieldValues.protection_plan_included ?? "N/A"}`,
      `---`,
      `FIRST NAME: ${fieldValues.first_name ?? "N/A"}`,
      `LAST NAME: ${fieldValues.last_name ?? "N/A"}`,
      `---`,
      `MAILING ADDRESS: ${[fieldValues.address, fieldValues.city, fieldValues.state, fieldValues.zip_code].filter(Boolean).join(", ") || "N/A"}`,
      `---`,
      `PHONE: ${fieldValues.phone_number ?? "N/A"}`,
      `DNC STATUS: ${fieldValues.dnc_status ?? "N/A"}`,
      `TCPA CONSENT: ${fieldValues.tcpa_consent ?? "N/A"}`,
      `---`,
      `EMAIL: ${fieldValues.email ?? "N/A"}`,
      `PASSWORD: ${fieldValues.client_password ?? "N/A"}`,
      `---`,
      `PRIMARY USER SAME AS CLIENT: ${fieldValues.primary_user_same_as_client ?? "N/A"}`,
      ...(fieldValues.primary_user_same_as_client !== "true" ? [
        `PRIMARY USER: ${fieldValues.primary_user_first_name ?? ""} ${fieldValues.primary_user_last_name ?? ""}`.trim()
      ] : []),
      `---`,
      `PAYMENT METHOD: ${fieldValues.payment_method ?? "N/A"}`,
      ...(fieldValues.payment_method?.toLowerCase().includes('credit') ? [
        `CARD NUMBER: ${fieldValues.card_number ?? "N/A"}`,
        `CARD EXPIRY: ${fieldValues.card_expiry ?? "N/A"}`,
        `CARDHOLDER: ${fieldValues.cardholder_name ?? "N/A"}`,
      ] : fieldValues.payment_method?.toLowerCase().includes('ach') ? [
        `ACCOUNT HOLDER: ${fieldValues.account_holder_name ?? "N/A"}`,
        `ROUTING: ${fieldValues.routing_number ?? "N/A"}`,
        `ACCOUNT: ${fieldValues.account_number ?? "N/A"}`,
        `ACCOUNT TYPE: ${fieldValues.account_type ?? "N/A"}`,
        `BANK: ${fieldValues.bank_name ?? "N/A"}`,
      ] : []),
      `---`,
      `PRODUCT: ${fieldValues.quoted_product ?? "N/A"}`,
      `COMPANY: ${fieldValues.company_name ?? "N/A"}`,
      `DEVICE COST: $${fieldValues.device_cost ?? "N/A"}`,
      `MONTHLY SUBSCRIPTION: $${fieldValues.monthly_subscription ?? "N/A"}`,
      `PROTECTION PLAN COST: $${fieldValues.protection_plan_cost ?? "N/A"}`,
      `---`,
      `TOTAL UPFRONT: $${fieldValues.total_upfront_cost ?? "N/A"}`,
      `TOTAL MONTHLY: $${fieldValues.total_monthly_cost ?? "N/A"}`,
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
      // Track payment method for conditional field display
      if (item.field_name === "payment_method") {
        const value = item.verified_value || item.original_value || "";
        setPaymentMethod(value.toLowerCase());
      }
      // Track protection plan
      if (item.field_name === "protection_plan_included") {
        const value = item.verified_value || item.original_value || "";
        setProtectionPlanIncluded(value.toLowerCase());
      }
      // Track primary user same as client
      if (item.field_name === "primary_user_same_as_client") {
        const value = item.verified_value || item.original_value || "";
        setPrimaryUserSameAsClient(value.toLowerCase());
      }
    });
    if (Object.keys(next).length) setInputValues((prev) => ({ ...prev, ...next }));
  }, [verificationItems]);

  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleFieldChange = (itemId: string, value: string, fieldName?: string) => {
    setInputValues((prev) => ({ ...prev, [itemId]: value }));
    
    // Update payment method state for conditional field display
    if (fieldName === "payment_method") {
      setPaymentMethod(value.toLowerCase());
    }
    // Update protection plan state
    if (fieldName === "protection_plan_included") {
      setProtectionPlanIncluded(value.toLowerCase());
    }
    // Update primary user same as client state
    if (fieldName === "primary_user_same_as_client") {
      setPrimaryUserSameAsClient(value.toLowerCase());
    }
    
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

  const handlePhoneVerify = async (itemId: string, phoneNumber: string) => {
    await checkDnc(phoneNumber, itemId);
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

  // Credit card fields - only show when payment method is credit_card
  const creditCardFields = ["card_number", "card_expiry", "cardholder_name"];
  // ACH fields - only show when payment method is ach
  const achFields = ["account_holder_name", "routing_number", "account_number", "account_type", "bank_name"];
  // Primary user name fields - only show when primary_user_same_as_client is not true
  const primaryUserNameFields = ["primary_user_first_name", "primary_user_last_name"];
  // Boolean fields that should use dropdown
  const booleanFields = ["protection_plan_included", "primary_user_same_as_client"];
  // Payment method field - special dropdown
  const paymentMethodField = "payment_method";
  
  const sortedItems = [...(verificationItems || [])]
    .filter((item) => {
      // Filter out excluded fields
      if (EXCLUDED_FIELDS.includes(item.field_name)) {
        return false;
      }
      // Filter out credit card fields if not using credit card
      if (creditCardFields.includes(item.field_name) && paymentMethod !== "credit_card") {
        return false;
      }
      // Filter out ACH fields if not using ACH
      if (achFields.includes(item.field_name) && paymentMethod !== "ach") {
        return false;
      }
      // Filter out primary user name fields if primary_user_same_as_client is true
      if (primaryUserNameFields.includes(item.field_name) && primaryUserSameAsClient === "true") {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
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
    <div className="bg-card rounded-lg border border-border shadow-sm flex flex-col" style={{ maxHeight: '1000px' }}>
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '800px' }}>
        {sortedItems.map((item, index) => {
          // Skip state and zip_code as they'll be rendered with city
          if (item.field_name === "state" || item.field_name === "zip_code") {
            return null;
          }
          
          // Handle city field - render with state and zip in a row
          if (item.field_name === "city") {
            const stateItem = sortedItems.find(i => i.field_name === "state");
            const zipItem = sortedItems.find(i => i.field_name === "zip_code");
            
            return (
              <div key="address-group" className="space-y-2">
                <div className="grid grid-cols-3 gap-3">
                  {/* City */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getFieldIcon(item)}
                      <Label className="text-xs font-medium">City</Label>
                      <input
                        type="checkbox"
                        checked={!!item.is_verified}
                        onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                        className="ml-auto h-4 w-4 rounded border-input cursor-pointer"
                      />
                    </div>
                    <Input
                      value={inputValues[item.id] ?? item.verified_value ?? item.original_value ?? ""}
                      onChange={(e) => handleFieldChange(item.id, e.target.value, item.field_name)}
                      placeholder="City"
                      className="text-sm"
                    />
                  </div>
                  
                  {/* State */}
                  {stateItem && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getFieldIcon(stateItem)}
                        <Label className="text-xs font-medium">State</Label>
                        <input
                          type="checkbox"
                          checked={!!stateItem.is_verified}
                          onChange={(e) => handleCheckboxChange(stateItem.id, e.target.checked)}
                          className="ml-auto h-4 w-4 rounded border-input cursor-pointer"
                        />
                      </div>
                      <Input
                        value={inputValues[stateItem.id] ?? stateItem.verified_value ?? stateItem.original_value ?? ""}
                        onChange={(e) => handleFieldChange(stateItem.id, e.target.value, stateItem.field_name)}
                        placeholder="State"
                        className="text-sm"
                      />
                    </div>
                  )}
                  
                  {/* Zip Code */}
                  {zipItem && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getFieldIcon(zipItem)}
                        <Label className="text-xs font-medium">Zip</Label>
                        <input
                          type="checkbox"
                          checked={!!zipItem.is_verified}
                          onChange={(e) => handleCheckboxChange(zipItem.id, e.target.checked)}
                          className="ml-auto h-4 w-4 rounded border-input cursor-pointer"
                        />
                      </div>
                      <Input
                        value={inputValues[zipItem.id] ?? zipItem.verified_value ?? zipItem.original_value ?? ""}
                        onChange={(e) => handleFieldChange(zipItem.id, e.target.value, zipItem.field_name)}
                        placeholder="Zip"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          }
          
          return (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center gap-2">
              {getFieldIcon(item)}
              <Label className="text-xs font-medium">{formatFieldName(item.field_name)}</Label>
              {item.field_name === "phone_number" ? (
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePhoneVerify(item.id, inputValues[item.id] ?? item.verified_value ?? item.original_value ?? "")}
                    disabled={dncChecking || !inputValues[item.id] && !item.verified_value && !item.original_value}
                    className="h-7 px-2 text-xs"
                  >
                    {dncChecking && phoneDncStatus?.itemId === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Phone className="h-3 w-3 mr-1" />
                    )}
                    Verify
                  </Button>
                  <input
                    type="checkbox"
                    checked={!!item.is_verified}
                    onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                    className="h-4 w-4 rounded border-input cursor-pointer"
                  />
                </div>
              ) : (
                <input
                  type="checkbox"
                  checked={!!item.is_verified}
                  onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                  className="ml-auto h-4 w-4 rounded border-input cursor-pointer"
                />
              )}
            </div>
            
            {/* DNC Status Indicator for Phone Field */}
            {item.field_name === "phone_number" && phoneDncStatus?.itemId === item.id && (
              <div className={`p-2 rounded text-xs font-medium ${
                phoneDncStatus.status === 'clear'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : phoneDncStatus.status === 'dnc'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {phoneDncStatus.status === 'clear' && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Safe - Good to go
                  </span>
                )}
                {phoneDncStatus.status === 'dnc' && (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    DNC - Verification required
                  </span>
                )}
                {phoneDncStatus.status === 'tcpa' && (
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    TCPA - Do not proceed
                  </span>
                )}
              </div>
            )}
            
            {booleanFields.includes(item.field_name) ? (
              <select
                value={inputValues[item.id] ?? item.verified_value ?? item.original_value ?? ""}
                onChange={(e) => handleFieldChange(item.id, e.target.value, item.field_name)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select...</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : item.field_name === paymentMethodField ? (
              <select
                value={inputValues[item.id] ?? item.verified_value ?? item.original_value ?? ""}
                onChange={(e) => handleFieldChange(item.id, e.target.value, item.field_name)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select Payment Method...</option>
                <option value="credit_card">Credit Card</option>
                <option value="ach">ACH / Bank Transfer</option>
              </select>
            ) : (
              <Input
                value={inputValues[item.id] ?? item.verified_value ?? item.original_value ?? ""}
                onChange={(e) => handleFieldChange(item.id, e.target.value, item.field_name)}
                placeholder={`Enter ${formatFieldName(item.field_name).toLowerCase()}`}
                className="text-sm"
              />
            )}
          </div>
          );
        })}
      </div>

      {session.buffer_agent_id && progress >= 76 && session.status !== "transferred" && (
        <div className="p-4 border-t border-border flex-shrink-0">
          <Button onClick={handleTransferToLA}>Transfer to Licensed Agent</Button>
        </div>
      )}

      {/* DNC/TCPA Check Modal */}
      <Dialog open={showDncModal} onOpenChange={setShowDncModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dncResult?.isTcpa ? (
                <>
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  TCPA Alert - Do Not Proceed
                </>
              ) : dncResult?.isDnc ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  DNC Warning - Verification Required
                </>
              ) : (
                <>
                  <Phone className="h-5 w-5 text-green-500" />
                  Number Clear - Safe to Proceed
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Status Banner */}
            <div className={`p-4 rounded-lg ${
              dncResult?.isTcpa 
                ? 'bg-red-50 border border-red-200' 
                : dncResult?.isDnc 
                  ? 'bg-yellow-50 border border-yellow-200' 
                  : 'bg-green-50 border border-green-200'
            }`}>
              <p className={`font-semibold ${
                dncResult?.isTcpa 
                  ? 'text-red-800' 
                  : dncResult?.isDnc 
                    ? 'text-yellow-800' 
                    : 'text-green-800'
              }`}>
                {dncResult?.message}
              </p>
              
              {dncResult?.isTcpa && (
                <p className="text-red-700 mt-2 text-sm">
                  <strong>Action Required:</strong> This number is flagged as TCPA/Litigator. You must hang up immediately and cannot proceed with this lead.
                </p>
              )}
            </div>

            {/* Script Section - Only show for DNC or Clear numbers */}
            {!dncResult?.isTcpa && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">DNC Verification Script</h4>
                
                <div className="bg-muted p-4 rounded-lg space-y-4 text-sm">
                  <p className="font-medium text-foreground">
                    "Is your phone number <span className="text-primary font-bold">{currentPhoneNumber}</span> on the Federal, National or State Do Not Call List?"
                  </p>
                  
                  <div className="text-muted-foreground italic text-xs">
                    (If a customer says no and we see it's on the DNC list we still have to take the verbal consent.)
                  </div>
                  
                  <div className="border-t pt-4">
                    <p className="font-medium text-foreground leading-relaxed">
                      "Sir/Ma'am even if your phone number is on the Federal National or State Do not call list do we still have your permission to call you and complete your order with Bay Alarm Medical today <span className="text-primary font-bold">{new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' })}</span> via your phone number <span className="text-primary font-bold">{currentPhoneNumber}</span>? And do we have your permission to call you on the same phone number in the future if needed?"
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Instructions:</strong> Read the script above to the customer and ensure they provide verbal consent before proceeding with the verification.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {dncResult?.isTcpa ? (
                <Button 
                  variant="destructive" 
                  onClick={handleDncModalCancel}
                >
                  Acknowledge - Hang Up
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleDncModalCancel}
                  >
                    Cancel Verification
                  </Button>
                  <Button 
                    onClick={handleDncModalConfirm}
                    className={dncResult?.isDnc ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  >
                    {dncResult?.isDnc ? 'Confirm & Proceed with Caution' : 'Confirm & Verify Number'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
