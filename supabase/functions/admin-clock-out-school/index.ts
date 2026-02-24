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
    const { school_id } = await req.json();

    if (!school_id) {
      return new Response(JSON.stringify({ error: "Missing required field: school_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // Step 1: Get all clocked-in students with device_ids before updating
    const { data: clockedInStudents, error: studentsError } = await supabaseAdmin
      .from("students")
      .select("id, device_id")
      .eq("school_id", school_id)
      .eq("clocked_in", true);

    if (studentsError) {
      console.error("Error fetching clocked-in students:", studentsError);
    }

    const studentIds = clockedInStudents?.map((s) => s.id) || [];

    if (studentIds.length === 0) {
      console.log(`ℹ️ No clocked-in students found for school ${school_id}`);
      return new Response(
        JSON.stringify({
          ok: true,
          message: "No students are currently clocked in",
          clocked_out_count: 0,
        }),
        {
          headers: { "Content-Type": "application/json", ...cors },
        }
      );
    }

    // Step 2: Get all class IDs for this school
    const { data: classes, error: classesError } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("school_id", school_id);

    if (classesError) {
      console.error("Error fetching classes:", classesError);
    }

    const classIds = classes?.map((c) => c.id) || [];

    // Step 3: Update ALL students in the school - set clocked_in = false
    const { error: updateStudentsError } = await supabaseAdmin
      .from("students")
      .update({ clocked_in: false })
      .eq("school_id", school_id);

    if (updateStudentsError) {
      throw updateStudentsError;
    }

    console.log(`✅ Updated ${studentIds.length} students clocked_in = false`);

    // Step 4: Update ALL attendance_records for today - mark as clocked out
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (classIds.length > 0) {
      const { error: attendanceError } = await supabaseAdmin
        .from("attendance_records")
        .update({
          status: "clocked_out",
          clocked_out_at: new Date().toISOString(),
        })
        .in("class_id", classIds)
        .eq("status", "in")
        .is("clocked_out_at", null)
        .gte("timestamp", today.toISOString())
        .lt("timestamp", tomorrow.toISOString());

      if (attendanceError) {
        console.error("Error updating attendance records:", attendanceError);
        // Continue anyway - student clock-out succeeded
      } else {
        console.log(`✅ Updated attendance records for classes in school ${school_id}`);
      }
    }

    // Step 5: Send push notifications to all clocked-out students
    const pushPromises: Promise<void>[] = [];
    if (clockedInStudents && clockedInStudents.length > 0) {
      console.log(`📱 Sending push notifications to ${clockedInStudents.length} clocked-out students`);
      for (const student of clockedInStudents) {
        pushPromises.push(
          sendPushNotification(SUPABASE_URL, SERVICE_ROLE, student.id, student.device_id, "clock_out")
        );
      }
    }

    // Wait for all push notifications (don't fail if some fail)
    await Promise.allSettled(pushPromises);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "All students clocked out successfully",
        clocked_out_count: studentIds.length,
        notified_count: clockedInStudents?.length || 0,
      }),
      {
        headers: { "Content-Type": "application/json", ...cors },
      }
    );
  } catch (error: any) {
    console.error("❌ Error clocking out all students:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to clock out all students" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
});

