import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const REALVALIDITO_API_KEY = Deno.env.get('REALVALIDITO_API_KEY') || '';
const REALVALIDITO_API_SECRET = Deno.env.get('REALVALIDITO_API_SECRET') || '';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  const { mobileNumber } = await req.json();
  if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
    return new Response(JSON.stringify({ error: "Invalid mobile number." }), {
      headers: corsHeaders,
      status: 400,
    });
  }

  const response = await fetch("https://app.realvalidito.com/dnclookup/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: REALVALIDITO_API_KEY,
      api_secret: REALVALIDITO_API_SECRET,
      numbers: [mobileNumber],
    }),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: corsHeaders,
    status: 200,
  });
});
