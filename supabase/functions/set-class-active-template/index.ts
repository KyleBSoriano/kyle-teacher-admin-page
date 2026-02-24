import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

// Helper function to send push notification (optional - won't fail if service doesn't exist)
async function sendPushNotification(
  supabaseUrl: string,
  serviceKey: string,
  studentId: string,
  deviceId: string | null,
  reason: string
): Promise<void> {
  if (!deviceId) {
    console.log(`⚠️ No device_id for student ${studentId}, skipping push notification`);
    return;
  }

  try {
    // Call send-apns-push edge function (if it exists)
    const response = await fetch(`${supabaseUrl}/functions/v1/send-apns-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify({
        device_id: deviceId,
        student_id: studentId,
        reason: reason,
      }),
    });

    if (!response.ok) {
      // If function doesn't exist (404) or other error, just log and continue
      if (response.status === 404) {
        console.log(`ℹ️ send-apns-push function not found (not deployed yet), skipping push for student ${studentId}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Push notification failed for student ${studentId}:`, errorText);
      }
    } else {
      console.log(`✅ Push notification sent to student ${studentId} (reason: ${reason})`);
    }
  } catch (error) {
    // Network errors or function not deployed - just log and continue
    console.log(`ℹ️ Could not send push notification to student ${studentId} (function may not be deployed):`, error instanceof Error ? error.message : String(error));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { class_id, template_id } = await req.json();

    if (!class_id || !template_id) {
      return new Response(JSON.stringify({ error: "Missing required fields: class_id, template_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // Step 1: Verify class exists and get school_id
    const { data: classData, error: classError } = await supabaseAdmin
      .from("classes")
      .select("id, school_id")
      .eq("id", class_id)
      .maybeSingle();

    if (classError || !classData) {
      return new Response(JSON.stringify({ error: "Class not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // Step 2: Verify template exists
    const { data: templateData, error: templateError } = await supabaseAdmin
      .from("app_templates")
      .select("id")
      .eq("id", template_id)
      .maybeSingle();

    if (templateError || !templateData) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // Step 3: Update class's active_template_id
    const { error: updateError } = await supabaseAdmin
      .from("classes")
      .update({ active_template_id: template_id })
      .eq("id", class_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Updated class ${class_id} active_template_id to ${template_id}`);

    // Step 4: Get all enrolled students in this class
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from("enrollments")
      .select("student_id")
      .eq("class_id", class_id);

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      // Continue anyway - template update succeeded
    }

    if (!enrollments || enrollments.length === 0) {
      console.log("ℹ️ No enrolled students in this class");
      return new Response(
        JSON.stringify({
          ok: true,
          class_id: class_id,
          template_id: template_id,
          notified_students: 0,
        }),
        {
          headers: { "Content-Type": "application/json", ...cors },
        }
      );
    }

    const studentIds = enrollments.map((e) => e.student_id).filter((id): id is string => id !== null);

    if (studentIds.length === 0) {
      console.log("ℹ️ No valid student IDs found in enrollments");
      return new Response(
        JSON.stringify({
          ok: true,
          class_id: class_id,
          template_id: template_id,
          notified_students: 0,
        }),
        {
          headers: { "Content-Type": "application/json", ...cors },
        }
      );
    }

    // Step 5: Get clocked-in enrolled students with device_ids
    const { data: clockedInStudents, error: studentsError } = await supabaseAdmin
      .from("students")
      .select("id, device_id")
      .in("id", studentIds)
      .eq("clocked_in", true);

    if (studentsError) {
      console.error("Error fetching clocked-in students:", studentsError);
      // Continue anyway - template update succeeded
    }

    // Step 6: Send push notifications to enrolled clocked-in students
    const pushPromises: Promise<void>[] = [];
    if (clockedInStudents && clockedInStudents.length > 0) {
      console.log(`📱 Sending push notifications to ${clockedInStudents.length} enrolled clocked-in students`);
      for (const student of clockedInStudents) {
        pushPromises.push(
          sendPushNotification(
            SUPABASE_URL,
            SERVICE_ROLE,
            student.id,
            student.device_id,
            "template_change"
          )
        );
      }
    } else {
      console.log("ℹ️ No clocked-in enrolled students to notify");
    }

    // Wait for all push notifications (don't fail if some fail)
    await Promise.allSettled(pushPromises);

    return new Response(
      JSON.stringify({
        ok: true,
        class_id: class_id,
        template_id: template_id,
        notified_students: clockedInStudents?.length || 0,
      }),
      {
        headers: { "Content-Type": "application/json", ...cors },
      }
    );
  } catch (error: any) {
    console.error("❌ Error setting class active template:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
    });
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to set class active template",
        details: error.details || undefined,
        code: error.code || undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors },
      }
    );
  }
});

