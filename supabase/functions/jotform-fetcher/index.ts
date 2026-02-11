import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * JotForm Webhook → Leads
 *
 * Accepts lead data from POST body (e.g. Zapier webhook on JotForm submit).
 * No JotForm API required. Configure Zapier to send JSON with keys matching
 * our leads schema.
 *
 * JotForm: https://form.jotform.com/260227398590464
 * (Clone of HEXA AFFILIATES / Test BPO Application)
 *
 * Map form fields → body keys, e.g.:
 *   submission_id (required), customer_full_name, street_address, city, state,
 *   zip_code, phone_number, email, birth_state, date_of_birth, age,
 *   social_security, driver_license, existing_coverage, previous_applications,
 *   height, weight, doctors_name, tobacco_use, health_conditions, medications,
 *   carrier, product_type, coverage_amount, monthly_premium, draft_date,
 *   future_draft_date, beneficiary_information, institution_name,
 *   beneficiary_routing, beneficiary_account, account_type, additional_notes,
 *   lead_vendor, quoted_product, MA_Product_Name, MA_Product_Price
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST with JSON body." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const leadData = await req.json();

    if (!leadData.submission_id) {
      throw new Error("Missing submission_id");
    }

    console.log("Processing lead for submission:", leadData.submission_id);

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("submission_id", leadData.submission_id)
      .maybeSingle();

    if (existingLead) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Lead already processed",
          leadId: existingLead.id,
          submissionId: leadData.submission_id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const processedLeadData = {
      submission_id: leadData.submission_id,
      submission_date: leadData.submission_date || new Date().toISOString(),
      customer_full_name: leadData.customer_full_name || "",
      street_address: leadData.street_address || "",
      city: leadData.city || "",
      state: leadData.state || "",
      zip_code: leadData.zip_code || "",
      phone_number: leadData.phone_number || "",
      email: leadData.email || "",
      birth_state: leadData.birth_state || "",
      date_of_birth: leadData.date_of_birth || null,
      age: leadData.age != null ? parseInt(String(leadData.age), 10) : null,
      social_security: leadData.social_security || "",
      driver_license: leadData.driver_license || "",
      existing_coverage: leadData.existing_coverage || "",
      previous_applications: leadData.previous_applications || "",
      height: leadData.height || "",
      weight: leadData.weight || "",
      doctors_name: leadData.doctors_name || "",
      tobacco_use: leadData.tobacco_use || "",
      health_conditions: leadData.health_conditions || "",
      medications: leadData.medications || "",
      carrier: leadData.carrier || "",
      product_type: leadData.product_type || "",
      coverage_amount:
        leadData.coverage_amount != null && leadData.coverage_amount !== ""
          ? parseFloat(String(leadData.coverage_amount))
          : null,
      monthly_premium:
        leadData.monthly_premium != null && leadData.monthly_premium !== ""
          ? parseFloat(String(leadData.monthly_premium))
          : null,
      draft_date: leadData.draft_date || "",
      future_draft_date: leadData.future_draft_date || "",
      beneficiary_information: leadData.beneficiary_information || "",
      institution_name: leadData.institution_name || "",
      beneficiary_routing: leadData.beneficiary_routing || "",
      beneficiary_account: leadData.beneficiary_account || "",
      additional_notes: leadData.additional_notes || "",
      lead_vendor: leadData.lead_vendor || null,
      account_type: leadData.account_type || "",
      quoted_product: leadData.quoted_product || "",
      MA_Product_Name: leadData.MA_Product_Name ?? leadData.ma_product_name ?? "",
      MA_Product_Price: (() => {
        const v = leadData.MA_Product_Price ?? leadData.ma_product_price;
        if (v == null || v === "") return null;
        return parseFloat(String(v));
      })(),
    };

    const { data, error } = await supabase
      .from("leads")
      .insert([processedLeadData])
      .select()
      .single();

    if (error) {
      console.error("Error storing lead:", error);
      throw error;
    }

    console.log("Lead stored successfully:", data.id);

    return new Response(
      JSON.stringify({
        success: true,
        leadId: data.id,
        submissionId: data.submission_id,
        message: "Lead processed and stored successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in jotform-fetcher:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
