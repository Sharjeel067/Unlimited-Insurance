import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Loader2, ArrowLeft, Save, Shield, CreditCard, User, Lock, Smartphone } from "lucide-react";
import { useRouter } from "next/router";
import { canCreateLead, isValidRole, type UserRole } from "@/lib/permissions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface BayAlarmFormData {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  email: string;
  client_password: string;
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

  const [formData, setFormData] = useState<BayAlarmFormData>({
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone_number: "",
    email: "",
    client_password: "",
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.first_name || !formData.last_name || !formData.address || 
          !formData.city || !formData.state || !formData.zip_code || !formData.phone_number ||
          !formData.email || !formData.dnc_tcpa_verified) {
        toast.error("Please fill in all required fields and verify DNC/TCPA");
        setLoading(false);
        return;
      }

      if (formData.payment_method === "credit_card") {
        if (!formData.card_number || !formData.card_expiry || !formData.card_cvv || !formData.cardholder_name) {
          toast.error("Please fill in all credit card fields");
          setLoading(false);
          return;
        }
      } else {
        if (!formData.bank_name || !formData.routing_number || !formData.account_number) {
          toast.error("Please fill in all banking fields");
          setLoading(false);
          return;
        }
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
        email: formData.email,
        
        primary_user_same_as_client: formData.primary_user_same_as_client,
        primary_user_first_name: formData.primary_user_same_as_client ? formData.first_name : formData.primary_user_first_name,
        primary_user_last_name: formData.primary_user_same_as_client ? formData.last_name : formData.primary_user_last_name,
        
        payment_method: formData.payment_method,
        card_number_last_four: formData.payment_method === "credit_card" ? cardLastFour : null,
        card_expiry: formData.payment_method === "credit_card" ? formData.card_expiry : null,
        cardholder_name: formData.payment_method === "credit_card" ? formData.cardholder_name : null,
        bank_name: formData.payment_method === "ach" ? formData.bank_name : null,
        account_number_last_four: formData.payment_method === "ach" ? accountLastFour : null,
        
        client_password: formData.client_password,
        
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
                <label className="text-sm font-medium text-foreground">Mailing Address *</label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Street Address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">State *</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">ZIP Code *</label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange("zip_code", e.target.value)}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number *</label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">DNC/TCPA Verification *</label>
                <div className="flex items-center gap-2 p-3 border border-border rounded-md">
                  <input
                    type="checkbox"
                    id="dnc_tcpa"
                    checked={formData.dnc_tcpa_verified}
                    onChange={(e) => handleInputChange("dnc_tcpa_verified", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="dnc_tcpa" className="text-sm text-foreground">
                    I confirm DNC/TCPA verification is complete
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Account Login Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password *</label>
                <Input
                  type="password"
                  value={formData.client_password}
                  onChange={(e) => handleInputChange("client_password", e.target.value)}
                  placeholder="Minimum 8 characters"
                />
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
                  <label className="text-sm font-medium text-foreground">Primary User First Name *</label>
                  <Input
                    value={formData.primary_user_first_name}
                    onChange={(e) => handleInputChange("primary_user_first_name", e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Primary User Last Name *</label>
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
                    <label className="text-sm font-medium text-foreground">Card Number *</label>
                    <Input
                      value={formData.card_number}
                      onChange={(e) => handleInputChange("card_number", e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Expiry Date *</label>
                      <Input
                        value={formData.card_expiry}
                        onChange={(e) => handleInputChange("card_expiry", e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">CVV *</label>
                      <Input
                        value={formData.card_cvv}
                        onChange={(e) => handleInputChange("card_cvv", e.target.value)}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground">Cardholder Name *</label>
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
                    <label className="text-sm font-medium text-foreground">Bank Name *</label>
                    <Input
                      value={formData.bank_name}
                      onChange={(e) => handleInputChange("bank_name", e.target.value)}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Routing Number *</label>
                    <Input
                      value={formData.routing_number}
                      onChange={(e) => handleInputChange("routing_number", e.target.value)}
                      placeholder="Routing Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Account Number *</label>
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
      </div>
    </DashboardLayout>
  );
}
