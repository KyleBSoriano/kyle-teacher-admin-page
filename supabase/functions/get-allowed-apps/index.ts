import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const url = new URL(req.url);
  const school_id = url.searchParams.get("school_id");
  const school_code = url.searchParams.get("school_code");
  
  if (!school_id && !school_code) {
    return new Response(JSON.stringify({ error: "Missing school_id or school_code" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(SUPABASE_URL, ANON);

  // Get school and its allowed_apps
  let schoolQuery = supabase.from("schools").select("id, allowed_apps");
  
  if (school_id) {
    schoolQuery = schoolQuery.eq("id", school_id);
  } else if (school_code) {
    schoolQuery = schoolQuery.eq("code", school_code.toUpperCase());
  }
  
  const { data: school, error: schoolErr } = await schoolQuery.maybeSingle();
  
  if (schoolErr || !school) {
    return new Response(JSON.stringify({ error: "School not found" }), { 
      status: 404, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Get allowed_apps from schools table (not from baseline template)
  const allowedAppKeys = (school.allowed_apps as string[]) || [];
  
  if (allowedAppKeys.length === 0) {
    return new Response(JSON.stringify({ 
      keys: [], 
      catalog: [],
      message: "No allowed apps configured for this school"
    }), { 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Fetch app_catalog entries for those keys
  const { data: catalog, error: catErr } = await supabase
    .from("app_catalog")
    .select("key, display_name, ios_bundle_id, aliases")
    .in("key", allowedAppKeys);
  
  if (catErr) {
    return new Response(JSON.stringify({ error: catErr.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  return new Response(JSON.stringify({ 
    keys: allowedAppKeys,
    catalog: catalog || []
  }), { 
    headers: { "Content-Type": "application/json", ...cors } 
  });
});

