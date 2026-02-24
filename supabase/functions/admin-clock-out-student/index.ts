import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

// Helper function to send push notification
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
    // Call send-apns-push edge function
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
      const errorText = await response.text();
      console.error(`❌ Push notification failed for student ${studentId}:`, errorText);
    } else {
      console.log(`✅ Push notification sent to student ${studentId} (reason: ${reason})`);
    }
  } catch (error) {
    console.error(`❌ Error sending push notification to student ${studentId}:`, error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { student_id, school_id } = await req.json();

    if (!student_id || !school_id) {
      return new Response(JSON.stringify({ error: "Missing required fields: student_id, school_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // Step 1: Get student's device_id before updating
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, device_id, clocked_in")
      .eq("id", student_id)
      .eq("school_id", school_id)
      .maybeSingle();

    if (studentError || !student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    if (!student.clocked_in) {
      console.log(`ℹ️ Student ${student_id} is already clocked out`);
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Student already clocked out",
        }),
        {
          headers: { "Content-Type": "application/json", ...cors },
        }
      );
    }

    const deviceId = student.device_id;

    // Step 2: Update students table - set clocked_in = false
    const { error: updateStudentError } = await supabaseAdmin
      .from("students")
      .update({ clocked_in: false })
      .eq("id", student_id);

    if (updateStudentError) {
      throw updateStudentError;
    }

    console.log(`✅ Updated student ${student_id} clocked_in = false`);

    // Step 3: Update attendance_records for today - mark as clocked out
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { error: attendanceError } = await supabaseAdmin
      .from("attendance_records")
      .update({
        status: "clocked_out",
        clocked_out_at: new Date().toISOString(),
      })
      .eq("student_id", student_id)
      .eq("status", "in")
      .is("clocked_out_at", null)
      .gte("timestamp", today.toISOString())
      .lt("timestamp", tomorrow.toISOString());

    if (attendanceError) {
      console.error("Error updating attendance records:", attendanceError);
      // Continue anyway - student clock-out succeeded
    }

    console.log(`✅ Updated attendance records for student ${student_id}`);

    // Step 4: Send push notification
    await sendPushNotification(SUPABASE_URL, SERVICE_ROLE, student_id, deviceId, "clock_out");

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Student clocked out successfully",
      }),
      {
        headers: { "Content-Type": "application/json", ...cors },
      }
    );
  } catch (error: any) {
    console.error("❌ Error clocking out student:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to clock out student" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
});

