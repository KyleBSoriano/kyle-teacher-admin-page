import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }
  });

  // Get authenticated user
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }
  const studentId = auth.user.id;

  // Get request body
  const { class_code } = await req.json().catch(() => ({}));
  if (!class_code) {
    return new Response(JSON.stringify({ error: "Missing class_code" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Get student's school_id
  const { data: student, error: studentErr } = await supabase
    .from("students")
    .select("school_id")
    .eq("id", studentId)
    .maybeSingle();
  
  if (studentErr || !student) {
    return new Response(JSON.stringify({ error: "Student not found" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Find class by code
  const { data: klass, error: classErr } = await supabase
    .from("classes")
    .select("id, code, school_id, subject, period")
    .eq("code", class_code)
    .maybeSingle();
  
  if (classErr || !klass) {
    return new Response(JSON.stringify({ error: "Invalid class code" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Validate class is in student's school
  if (klass.school_id !== student.school_id) {
    return new Response(JSON.stringify({ error: "Class is not in your school" }), { 
      status: 403, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Check if already enrolled
  const { data: existing, error: checkErr } = await supabase
    .from("enrollments")
    .select("id")
    .eq("class_id", klass.id)
    .eq("student_id", studentId)
    .maybeSingle();
  
  if (checkErr) {
    return new Response(JSON.stringify({ error: checkErr.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  if (existing) {
    return new Response(JSON.stringify({ 
      ok: true, 
      class_id: klass.id,
      message: "Already enrolled in this class"
    }), { 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Create enrollment
  const { error: enrErr } = await supabase
    .from("enrollments")
    .insert({ 
      class_id: klass.id, 
      student_id: studentId 
    });
  
  if (enrErr) {
    return new Response(JSON.stringify({ error: enrErr.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  return new Response(JSON.stringify({ 
    ok: true, 
    class_id: klass.id,
    class_subject: klass.subject,
    class_period: klass.period
  }), { 
    headers: { "Content-Type": "application/json", ...cors } 
  });
});

