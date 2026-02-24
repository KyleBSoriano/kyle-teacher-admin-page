import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

async function pushStudents(studentIds: string[], reason: string) {
  if (!studentIds.length) return;

  try {
    const internalKey = Deno.env.get("INTERNAL_PUSH_KEY") ?? "";
    const functionsBase =
      Deno.env.get("FUNCTIONS_BASE_URL") ??
      "https://dqynrbjixuidwqiacggx.functions.supabase.co";

    const response = await fetch(`${functionsBase}/send-apns-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey,
      },
      body: JSON.stringify({ student_ids: studentIds, reason }),
    });

    if (!response.ok) {
      console.error(`⚠️ Push notification failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Don't fail the whole request if push notifications fail
    console.error("⚠️ Error sending push notifications (non-blocking):", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: auth, error: aerr } = await supabase.auth.getUser();
    if (aerr || !auth.user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", ...cors },
    });

    const body = await req.json().catch(() => ({}));
    const school_id = body.school_id as string | undefined;
    const apps = body.apps as string[] | undefined;
    const name = body.name as string | undefined;

    if (!school_id) throw new Error("school_id required");
    if (!Array.isArray(apps)) throw new Error("apps must be an array");

    const updateData: Record<string, unknown> = { apps };
    if (typeof name === "string") updateData.name = name;

    // Try to update existing baseline template
    console.log("🔍 Attempting to update baseline template:", {
      school_id,
      period: "baseline",
      class_id: null,
      updateData
    });
    
    // First, find the most recent baseline template (in case there are duplicates)
    const { data: existingTemplate, error: findErr } = await admin
      .from("app_templates")
      .select("id")
      .eq("school_id", school_id)
      .eq("period", "baseline")
      .is("class_id", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (findErr) {
      console.error("❌ Error finding template:", findErr);
      throw findErr;
    }
    
    if (!existingTemplate) {
      console.log("📝 No baseline template found, will create one");
    } else {
      console.log("📝 Found baseline template to update:", existingTemplate.id);
      // Update the specific template by ID
      const { data: updated, error: uerr } = await admin
        .from("app_templates")
        .update(updateData)
        .eq("id", existingTemplate.id)
        .select("id")
        .single();
      
      console.log("📝 Update result:", {
        found: !!updated,
        updated: updated,
        error: uerr ? {
          message: uerr.message,
          code: uerr.code,
          details: uerr.details,
          hint: uerr.hint
        } : null
      });

      if (uerr) {
        console.error("❌ Update error details:", uerr);
        throw uerr;
      }
      
      if (updated) {
        // Template was updated successfully, continue with push notifications
        const { data: students, error: serr } = await admin
          .from("students")
          .select("id")
          .eq("school_id", school_id)
          .eq("clocked_in", true);

        if (serr) throw serr;

        const studentIds = (students ?? []).map((s: any) => s.id).filter(Boolean);
        await pushStudents(studentIds, "baseline_change");

        return new Response(JSON.stringify({ ok: true, pushed: studentIds.length }), {
          status: 200, headers: { "Content-Type": "application/json", ...cors },
        });
      }
    }

    // If no template exists, create one
    if (!existingTemplate) {
      console.log("📝 No template found, creating new baseline template");
      const insertData = {
        name: name || "App Template",
        apps: apps,
        description: "Default app template for campus use",
        class_id: null,
        period: "baseline",
        school_id: school_id,
      };
      console.log("📝 Insert data:", insertData);
      
      const { data: created, error: cerr } = await admin
        .from("app_templates")
        .insert(insertData)
        .select("id")
        .single();

      console.log("📝 Create result:", {
        created: created,
        error: cerr ? {
          message: cerr.message,
          code: cerr.code,
          details: cerr.details,
          hint: cerr.hint
        } : null
      });

      if (cerr) {
        console.error("❌ Create error details:", cerr);
        throw cerr;
      }
      if (!created) throw new Error("Failed to create baseline template");
      
      // Use the created template ID for push notifications
      const finalTemplateId = created.id;
      
      const { data: students, error: serr } = await admin
        .from("students")
        .select("id")
        .eq("school_id", school_id)
        .eq("clocked_in", true);

      if (serr) throw serr;

      const studentIds = (students ?? []).map((s: any) => s.id).filter(Boolean);
      await pushStudents(studentIds, "baseline_change");

      return new Response(JSON.stringify({ ok: true, pushed: studentIds.length, created: true }), {
        status: 200, headers: { "Content-Type": "application/json", ...cors },
      });
    }
  } catch (e) {
    // Properly serialize error object to see actual error message
    let errorMessage = "Unknown error";
    let errorDetails: any = {};
    
    if (e instanceof Error) {
      errorMessage = e.message;
      errorDetails = {
        name: e.name,
        message: e.message,
        stack: e.stack
      };
    } else if (typeof e === 'object' && e !== null) {
      // Handle Supabase error objects
      const errorObj = e as any;
      errorMessage = errorObj.message || errorObj.error?.message || JSON.stringify(e);
      errorDetails = {
        code: errorObj.code,
        message: errorObj.message,
        details: errorObj.details,
        hint: errorObj.hint,
        error: errorObj.error,
        fullError: JSON.stringify(e, Object.getOwnPropertyNames(e))
      };
    } else {
      errorMessage = String(e);
      errorDetails = { raw: e };
    }
    
    console.error("❌ Error in admin-update-baseline-template:", {
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      ok: false, 
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500, 
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
});
