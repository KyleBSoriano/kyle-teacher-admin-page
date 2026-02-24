import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const { email, password, name, school_code, device_id } = await req.json().catch(() => ({}));
  if (!email || !password || !name || !school_code) {
    return new Response(JSON.stringify({ error: "Missing required fields: email, password, name, school_code" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE);

  // 1) Lookup school by code
  const { data: school, error: schoolErr } = await admin
    .from("schools")
    .select("id, code, name")
    .eq("code", school_code.toUpperCase())
    .maybeSingle();
  
  if (schoolErr || !school) {
    return new Response(JSON.stringify({ error: "Invalid school code" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // 2) Create auth user (auto-confirm for mobile app)
  const { data: created, error: adminErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, device_id, school_id: school.id },
  });
  
  if (adminErr || !created.user) {
    return new Response(JSON.stringify({ error: adminErr?.message || "Failed to create user" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }
  const uid = created.user.id;

  // 3) Create student record in students table
  const { error: insErr } = await admin
    .from("students")
    .insert({
      id: uid,
      email,
      name,
      school_id: school.id,
      device_id: device_id ?? null,
    });
  
  if (insErr) {
    // Clean up auth user if student creation fails
    await admin.auth.admin.deleteUser(uid).catch(() => {});
    return new Response(JSON.stringify({ error: insErr.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // 4) Sign in to return session tokens
  const anon = createClient(SUPABASE_URL, ANON);
  const { data: sess, error: signInErr } = await anon.auth.signInWithPassword({ email, password });
  
  if (signInErr || !sess.session) {
    return new Response(JSON.stringify({ error: signInErr?.message || "Failed to sign in" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  return new Response(JSON.stringify({
    id: uid,
    email,
    name,
    school_id: school.id,
    school_name: school.name,
    access_token: sess.session.access_token,
    refresh_token: sess.session.refresh_token,
  }), { 
    headers: { "Content-Type": "application/json", ...cors } 
  });
});

