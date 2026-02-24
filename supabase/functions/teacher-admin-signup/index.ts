import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const body = await req.json().catch(() => ({}));
  const { email, password, name, firstName, lastName, schoolCode, role } = body;
  
  // Support both 'name' (new format) and 'firstName'/'lastName' (old format)
  const fullName = name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || '');
  
  if (!email || !password || !fullName || !schoolCode || !role) {
    return new Response(JSON.stringify({ 
      error: "Missing required fields: email, password, name (or firstName/lastName), schoolCode, role",
      received: { email: !!email, password: !!password, name: !!name, firstName: !!firstName, lastName: !!lastName, schoolCode: !!schoolCode, role: !!role }
    }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Validate role
  if (role !== 'teacher' && role !== 'admin') {
    return new Response(JSON.stringify({ error: "Invalid role. Must be 'teacher' or 'admin'" }), { 
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
    .eq("code", schoolCode.toUpperCase())
    .maybeSingle();
  
  if (schoolErr || !school) {
    return new Response(JSON.stringify({ error: "Invalid school code" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // 2) Create auth user (auto-confirm email)
  // Split name into first and last if it's a single string
  const nameParts = fullName.split(' ');
  const first_name = firstName || nameParts[0] || fullName;
  const last_name = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
  
  const { data: created, error: adminErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      first_name,
      last_name,
      school_id: school.id,
    },
  });
  
  if (adminErr || !created.user) {
    return new Response(JSON.stringify({ error: adminErr?.message || "Failed to create user" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }
  const uid = created.user.id;

  // 3) Create profile in profiles table
  const { error: profileErr } = await admin
    .from("profiles")
    .insert({
      id: uid,
      email,
      first_name,
      last_name,
      school_id: school.id,
      school_name: school.name,
    });
  
  if (profileErr) {
    // Clean up auth user if profile creation fails
    await admin.auth.admin.deleteUser(uid).catch(() => {});
    
    // Enhanced error logging
    console.error("Failed to create profile:", {
      error: profileErr,
      message: profileErr.message,
      details: profileErr.details,
      hint: profileErr.hint,
      code: profileErr.code,
      user_id: uid,
      email: email,
      school_id: school.id,
    });
    
    return new Response(JSON.stringify({ 
      error: profileErr.message || "Failed to create profile",
      details: profileErr.details,
      hint: profileErr.hint,
      code: profileErr.code,
    }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // 4) Create user_role in user_roles table
  const { error: roleErr, data: roleData } = await admin
    .from("user_roles")
    .insert({
      user_id: uid,
      school_id: school.id,
      role: role,
    })
    .select();
  
  if (roleErr) {
    // Clean up: delete profile and auth user if role creation fails
    await admin.from("profiles").delete().eq("id", uid).catch(() => {});
    await admin.auth.admin.deleteUser(uid).catch(() => {});
    
    // Enhanced error logging
    console.error("Failed to create user_role:", {
      error: roleErr,
      message: roleErr.message,
      details: roleErr.details,
      hint: roleErr.hint,
      code: roleErr.code,
      user_id: uid,
      school_id: school.id,
      role: role,
    });
    
    return new Response(JSON.stringify({ 
      error: roleErr.message || "Failed to create user role",
      details: roleErr.details,
      hint: roleErr.hint,
      code: roleErr.code,
    }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // 5) Sign in to return session tokens
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
    name: fullName,
    first_name,
    last_name,
    school_id: school.id,
    school_name: school.name,
    role: role,
    access_token: sess.session.access_token,
    refresh_token: sess.session.refresh_token,
  }), { 
    headers: { "Content-Type": "application/json", ...cors } 
  });
});

