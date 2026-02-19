import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Loader2, ArrowLeft, Save, Shield, CreditCard, User, Smartphone, Phone, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/router";
import { canCreateLead, isValidRole, type UserRole } from "@/lib/permissions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface BayAlarmFormData {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  primary_user_same_as_client: boolean;
  primary_user_first_name: string;
  primary_user_last_name: string;
  payment_method: "credit_card" | "ach";
  card_number: string;
  card_expiry: string;
  card_cvv: string;
  cardholder_name: string;
  bank_name: string;
  routing_number: string;
  account_number: string;
  dnc_tcpa_verified: boolean;
  protection_plan_included: boolean;
}

const DEVICE_COST = 89.40;
const ORIGINAL_DEVICE_COST = 149.00;
const SHIPPING_COST = 15.00;
const MONTHLY_SUBSCRIPTION = 34.95;
const PROTECTION_PLAN_COST = 4.95;

export default function CreateBayAlarmLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userCallCenterId, setUserCallCenterId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<"back" | "cancel" | null>(null);

  // DNC Check states
  const [dncChecking, setDncChecking] = useState(false);
  const [dncResult, setDncResult] = useState<{isDnc: boolean; isTcpa: boolean; message: string} | null>(null);
  const [showDncModal, setShowDncModal] = useState(false);

  const [formData, setFormData] = useState<BayAlarmFormData>({
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone_number: "",
    primary_user_same_as_client: true,
    primary_user_first_name: "",
    primary_user_last_name: "",
    payment_method: "credit_card",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
    cardholder_name: "",
    bank_name: "",
    routing_number: "",
    account_number: "",
    dnc_tcpa_verified: false,
    protection_plan_included: false,
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, call_center_id")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          const role = (profile as any).role;
          const allowedRoles = ["call_center_agent", "sales_agent_licensed", "sales_agent_unlicensed"];
          if (isValidRole(role) && !allowedRoles.includes(role)) {
            toast.error("You don't have permission to create leads.");
            router.push("/leads");
            return;
          }
          setUserRole(role);
          setUserCallCenterId((profile as any).call_center_id);
        }
      }
    };
    checkUser();
  }, []);

  const handleInputChange = (field: keyof BayAlarmFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const totalUpfront = DEVICE_COST + SHIPPING_COST + (formData.protection_plan_included ? PROTECTION_PLAN_COST : 0);
  const totalMonthly = MONTHLY_SUBSCRIPTION + (formData.protection_plan_included ? PROTECTION_PLAN_COST : 0);

  const handleCancel = () => {
    if (isDirty) {
      setPendingNavigation("cancel");
      setShowConfirmModal(true);
    } else {
      router.push("/leads");
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setPendingNavigation("back");
      setShowConfirmModal(true);
    } else {
      router.back();
    }
  };

  const handleConfirmNavigation = () => {
    setShowConfirmModal(false);
    if (pendingNavigation === "cancel") {
      router.push("/leads");
    } else if (pendingNavigation === "back") {
      router.back();
    }
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  // DNC Check Function
  const checkDnc = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number before checking DNC.");
      return null;
    }

    setDncChecking(true);
    setDncResult(null);

    try {
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
      
      let isTcpa = false;
      let isDnc = false;
      
      if (result && result.data) {
        const data = result.data;
        
        if (data.federal_dnc && Array.isArray(data.federal_dnc)) {
          isDnc = data.federal_dnc.includes(cleanPhone);
        }
        
        if (!isDnc && data.dnc && Array.isArray(data.dnc)) {
          isDnc = data.dnc.includes(cleanPhone);
        }
        
        if (data.tcpa_litigator && Array.isArray(data.tcpa_litigator)) {
          isTcpa = data.tcpa_litigator.includes(cleanPhone);
        }
      }
      
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

      if (isTcpa) {
        setShowDncModal(true);
        toast.error("This phone number is flagged as TCPA/Litigator.");
      } else if (isDnc) {
        setShowDncModal(true);
        toast.warning("This number is on the Do Not Call list. Please verify before proceeding.");
      } else {
        handleInputChange("dnc_tcpa_verified", true);
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
    handleInputChange("dnc_tcpa_verified", true);
    setShowDncModal(false);
    setDncResult(null);
  };

  const handleDncModalCancel = () => {
    setShowDncModal(false);
    setDncResult(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.first_name || !formData.last_name || !formData.phone_number ||
          !formData.dnc_tcpa_verified) {
        toast.error("Please fill in name, phone number and verify DNC/TCPA");
        setLoading(false);
        return;
      }

      if (!formData.primary_user_same_as_client && 
          (!formData.primary_user_first_name || !formData.primary_user_last_name)) {
        toast.error("Please provide primary user information");
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id || null;

      let assignedAgentId = null;
      let callCenterId = null;
      
      if ((userRole === "call_center_agent" || userRole === "sales_agent_licensed" || userRole === "sales_agent_unlicensed") && userId) {
        callCenterId = userCallCenterId;
        assignedAgentId = userId;
      }

      const { data: firstPipeline } = await (supabase
        .from("pipelines") as any)
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (!firstPipeline) throw new Error("No pipeline found");

      const { data: firstStage } = await (supabase
        .from("stages") as any)
        .select("id")
        .eq("pipeline_id", (firstPipeline as any).id)
        .order("order_index", { ascending: true })
        .limit(1)
        .single();

      if (!firstStage) throw new Error("No stage found");

      const cardLastFour = formData.card_number.slice(-4);
      const accountLastFour = formData.account_number.slice(-4);

      const leadData = {
        company_name: "Bay Alarm Alert",
        product_type: "SOS All-In-One 2",
        device_cost: DEVICE_COST,
        original_device_cost: ORIGINAL_DEVICE_COST,
        discounted_device_cost: DEVICE_COST,
        shipping_cost: SHIPPING_COST,
        monthly_subscription: MONTHLY_SUBSCRIPTION,
        protection_plan_cost: formData.protection_plan_included ? PROTECTION_PLAN_COST : 0,
        protection_plan_included: formData.protection_plan_included,
        total_upfront_cost: totalUpfront,
        total_monthly_cost: totalMonthly,
        
        first_name: formData.first_name,
        last_name: formData.last_name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        phone_number: formData.phone_number,
        
        primary_user_same_as_client: formData.primary_user_same_as_client,
        primary_user_first_name: formData.primary_user_same_as_client ? formData.first_name : formData.primary_user_first_name,
        primary_user_last_name: formData.primary_user_same_as_client ? formData.last_name : formData.primary_user_last_name,
        
        payment_method: formData.payment_method,
        card_number_last_four: formData.payment_method === "credit_card" ? cardLastFour : null,
        card_expiry: formData.payment_method === "credit_card" ? formData.card_expiry : null,
        cardholder_name: formData.payment_method === "credit_card" ? formData.cardholder_name : null,
        bank_name: formData.payment_method === "ach" ? formData.bank_name : null,
        account_number_last_four: formData.payment_method === "ach" ? accountLastFour : null,
        
        call_center_id: callCenterId,
        assigned_agent_id: assignedAgentId,
        
        submission_id: `BAY-${Date.now()}`,
        pipeline_id: firstPipeline.id,
        stage_id: firstStage.id,
        source: "bay_alarm_sos",
      };

      const { error } = await (supabase.from("leads") as any)
        .insert(leadData);

      if (error) throw error;

      toast.success("Bay Alarm Alert lead created successfully");
      router.push("/leads");
    } catch (error: any) {
      console.error("Error creating lead:", error);
      toast.error("Failed to create lead: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Create Bay Alarm Alert Lead - CRM</title>
      </Head>

      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={handleBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bay Alarm Alert - SOS All-In-One 2</h1>
            <p className="text-muted-foreground text-sm">
              Create a new lead for the Bay Alarm Alert device
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Device Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Device</p>
                <p className="font-semibold">SOS All-In-One 2</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Original Price</p>
                <p className="font-semibold line-through text-muted-foreground">${ORIGINAL_DEVICE_COST.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Your Price</p>
                <p className="font-semibold text-green-600">${DEVICE_COST.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Monthly</p>
                <p className="font-semibold">${MONTHLY_SUBSCRIPTION.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Protection Plan
            </h2>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="protection_plan"
                  checked={formData.protection_plan_included}
                  onChange={(e) => handleInputChange("protection_plan_included", e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium">Add Device Protection Plan - ${PROTECTION_PLAN_COST.toFixed(2)}/month</p>
                  <p className="text-sm text-muted-foreground">Covers device replacement and repairs</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Total Summary
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Upfront</p>
                <p className="text-2xl font-bold text-foreground">${totalUpfront.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Monthly Total</p>
                <p className="text-2xl font-bold text-foreground">${totalMonthly.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Holder Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First Name *</label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Name *</label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Last name"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Mailing Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Street Address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">State</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">ZIP Code</label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange("zip_code", e.target.value)}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number *</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                    placeholder="(555) 123-4567"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => checkDnc(formData.phone_number)}
                    disabled={dncChecking || !formData.phone_number}
                    className="whitespace-nowrap"
                  >
                    {dncChecking ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Phone className="h-4 w-4 mr-2" />
                    )}
                    Verify
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Verification Status</label>
                {dncResult ? (
                  <div className={`p-3 rounded-md text-sm font-medium ${
                    dncResult.isTcpa
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : dncResult.isDnc
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {dncResult.isTcpa ? (
                        <><ShieldAlert className="h-4 w-4" /> TCPA - Do not proceed</>
                      ) : dncResult.isDnc ? (
                        <><AlertTriangle className="h-4 w-4" /> DNC - Verification required</>
                      ) : (
                        <><CheckCircle className="h-4 w-4" /> Safe - Good to go</>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-border rounded-md text-sm text-muted-foreground">
                    Click "Verify" to check phone number status
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Primary User
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Person who will be wearing/using the device
            </p>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="same_as_client"
                checked={formData.primary_user_same_as_client}
                onChange={(e) => handleInputChange("primary_user_same_as_client", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="same_as_client" className="text-sm text-foreground">
                Primary user is the same as the account holder (person completing this order)
              </label>
            </div>
            {!formData.primary_user_same_as_client && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Primary User First Name</label>
                  <Input
                    value={formData.primary_user_first_name}
                    onChange={(e) => handleInputChange("primary_user_first_name", e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Primary User Last Name</label>
                  <Input
                    value={formData.primary_user_last_name}
                    onChange={(e) => handleInputChange("primary_user_last_name", e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing Information
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="credit_card"
                    name="payment_method"
                    checked={formData.payment_method === "credit_card"}
                    onChange={() => handleInputChange("payment_method", "credit_card")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="credit_card" className="text-sm text-foreground">Credit Card</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="ach"
                    name="payment_method"
                    checked={formData.payment_method === "ach"}
                    onChange={() => handleInputChange("payment_method", "ach")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="ach" className="text-sm text-foreground">ACH/Bank Transfer</label>
                </div>
              </div>

              {formData.payment_method === "credit_card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Card Number</label>
                    <Input
                      value={formData.card_number}
                      onChange={(e) => handleInputChange("card_number", e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Expiry Date</label>
                      <Input
                        value={formData.card_expiry}
                        onChange={(e) => handleInputChange("card_expiry", e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">CVV</label>
                      <Input
                        value={formData.card_cvv}
                        onChange={(e) => handleInputChange("card_cvv", e.target.value)}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground">Cardholder Name</label>
                    <Input
                      value={formData.cardholder_name}
                      onChange={(e) => handleInputChange("cardholder_name", e.target.value)}
                      placeholder="Cardholder Name"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Bank Name</label>
                    <Input
                      value={formData.bank_name}
                      onChange={(e) => handleInputChange("bank_name", e.target.value)}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Routing Number</label>
                    <Input
                      value={formData.routing_number}
                      onChange={(e) => handleInputChange("routing_number", e.target.value)}
                      placeholder="Routing Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Account Number</label>
                    <Input
                      value={formData.account_number}
                      onChange={(e) => handleInputChange("account_number", e.target.value)}
                      placeholder="Account Number"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[150px]">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Lead
                </>
              )}
            </Button>
          </div>
        </form>

        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={handleCancelNavigation}
          onConfirm={handleConfirmNavigation}
          title="Unsaved Changes"
          description="You have unsaved changes. Are you sure you want to leave? All your progress will be lost."
          confirmText="Leave"
          cancelText="Stay"
          variant="destructive"
        />

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

              {!dncResult?.isTcpa && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">DNC Verification Script</h4>
                  
                  <div className="bg-muted p-4 rounded-lg space-y-4 text-sm">
                    <p className="font-medium text-foreground">
                      "Is your phone number <span className="text-primary font-bold">{formData.phone_number}</span> on the Federal, National or State Do Not Call List?"
                    </p>
                    
                    <div className="text-muted-foreground italic text-xs">
                      (If a customer says no and we see it's on the DNC list we still have to take the verbal consent.)
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="font-medium text-foreground leading-relaxed">
                        "Sir/Ma'am even if your phone number is on the Federal National or State Do not call list do we still have your permission to call you and complete your order with Bay Alarm Medical today <span className="text-primary font-bold">{new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' })}</span> via your phone number <span className="text-primary font-bold">{formData.phone_number}</span>? And do we have your permission to call you on the same phone number in the future if needed?"
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
    </DashboardLayout>
  );
}
