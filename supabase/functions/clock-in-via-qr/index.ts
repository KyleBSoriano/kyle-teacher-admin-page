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
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  // Use ANON key for user authentication
  const supabase = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }
  });
  
  // Use SERVICE_ROLE_KEY for updates (bypasses RLS)
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Get authenticated student
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }
  const studentId = auth.user.id;

  // Verify student exists and get their school_id
  const { data: student, error: studentErr } = await supabase
    .from("students")
    .select("id, school_id, clocked_in")
    .eq("id", studentId)
    .maybeSingle();
  
  if (studentErr || !student) {
    return new Response(JSON.stringify({ error: "Student not found" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // If already clocked in, return success
  if (student.clocked_in) {
    return new Response(JSON.stringify({ 
      ok: true, 
      message: "Already clocked in"
    }), { 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // ─────────────────────────────────────────────
  // TIME VALIDATION: Check if within admin day range (PST)
  // ─────────────────────────────────────────────
  // Helper function to check if date is in daylight saving time (PST/PDT)
  function isDaylightSavingTime(date: Date): boolean {
    // DST in US Pacific: Second Sunday in March to First Sunday in November
    const year = date.getUTCFullYear();
    const march = new Date(Date.UTC(year, 2, 1)); // March 1
    const november = new Date(Date.UTC(year, 10, 1)); // November 1
    
    // Find second Sunday in March
    let secondSundayMarch = march;
    let sundayCount = 0;
    while (sundayCount < 2) {
      if (secondSundayMarch.getUTCDay() === 0) sundayCount++;
      if (sundayCount < 2) secondSundayMarch = new Date(secondSundayMarch.getTime() + 86400000);
    }
    
    // Find first Sunday in November
    let firstSundayNovember = november;
    while (firstSundayNovember.getUTCDay() !== 0) {
      firstSundayNovember = new Date(firstSundayNovember.getTime() + 86400000);
    }
    
    const currentUTC = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    return currentUTC >= secondSundayMarch && currentUTC < firstSundayNovember;
  }

  // Get current time in PST (Pacific Standard Time)
  // PST is UTC-8, PDT is UTC-7 (daylight saving)
  const now = new Date();
  const pstOffset = -8 * 60; // PST offset in minutes (UTC-8)
  const isDST = isDaylightSavingTime(now);
  const actualOffset = isDST ? -7 * 60 : pstOffset; // PDT is UTC-7
  
  // Convert UTC to PST/PDT
  // Get UTC time components
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcTotalMinutes = utcHours * 60 + utcMinutes;
  
  // Convert to PST by subtracting the offset (offset is negative, so we add it)
  let pstTotalMinutes = utcTotalMinutes + actualOffset;
  
  // Handle day rollover (if negative, it's previous day; if > 1440, it's next day)
  let pstDayOffset = 0;
  if (pstTotalMinutes < 0) {
    pstTotalMinutes += 1440; // Add 24 hours
    pstDayOffset = -1; // Previous day
  } else if (pstTotalMinutes >= 1440) {
    pstTotalMinutes -= 1440; // Subtract 24 hours
    pstDayOffset = 1; // Next day
  }
  
  const currentTime = pstTotalMinutes; // minutes since midnight (PST)
  
  // Get today's date in PST
  const utcDate = new Date(now);
  if (pstDayOffset !== 0) {
    utcDate.setUTCDate(utcDate.getUTCDate() + pstDayOffset);
  }
  const todayStr = utcDate.toISOString().split('T')[0]; // "2024-01-15"

  // Parse time format: "8:30 AM" or "14:30" (24-hour) to minutes since midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    // Handle "8:30 AM" format
    const amPmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (amPmMatch) {
      let hour = parseInt(amPmMatch[1]);
      const minute = parseInt(amPmMatch[2]);
      const period = amPmMatch[3].toUpperCase();
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      return hour * 60 + minute;
    }
    
    // Handle "14:30" format (24-hour)
    const [hour, minute] = timeStr.split(":").map(Number);
    return hour * 60 + minute;
  };

  // Get ALL schedule blocks for today
  const { data: allScheduleBlocks, error: scheduleErr } = await supabase
    .from("schedule_blocks")
    .select("period, start_time, end_time, schedule_date")
    .eq("school_id", student.school_id)
    .eq("schedule_date", todayStr)
    .order("start_time", { ascending: true });

  // Calculate admin day range (earliest start to latest end)
  let adminDayStart: number | null = null;
  let adminDayEnd: number | null = null;

  if (!scheduleErr && allScheduleBlocks && allScheduleBlocks.length > 0) {
    for (const block of allScheduleBlocks) {
      if (block.start_time && block.end_time) {
        const startMin = parseTimeToMinutes(block.start_time);
        const endMin = parseTimeToMinutes(block.end_time);
        
        if (adminDayStart === null || startMin < adminDayStart) {
          adminDayStart = startMin;
        }
        if (adminDayEnd === null || endMin > adminDayEnd) {
          adminDayEnd = endMin;
        }
      }
    }
  }

  // Check if no schedule blocks exist → block clocking in
  if (scheduleErr || !allScheduleBlocks || allScheduleBlocks.length === 0) {
    return new Response(JSON.stringify({ 
      error: "No schedule found for today. Cannot clock in.",
      message: "No schedule blocks found for today. Please contact your administrator."
    }), { 
      status: 403, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Check if outside admin day range
  if (adminDayStart !== null && adminDayEnd !== null) {
    if (currentTime < adminDayStart) {
      const startHour = Math.floor(adminDayStart / 60);
      const startMin = adminDayStart % 60;
      const endHour = Math.floor(adminDayEnd / 60);
      const endMin = adminDayEnd % 60;
      const startTimeStr = `${startHour}:${startMin.toString().padStart(2, '0')}`;
      const endTimeStr = `${endHour}:${endMin.toString().padStart(2, '0')}`;
      
      return new Response(JSON.stringify({ 
        error: "Cannot clock in before school starts",
        message: `School hours are ${startTimeStr} - ${endTimeStr}. Please clock in during school hours.`
      }), { 
        status: 403, 
        headers: { "Content-Type": "application/json", ...cors } 
      });
    }
    
    if (currentTime > adminDayEnd) {
      const startHour = Math.floor(adminDayStart / 60);
      const startMin = adminDayStart % 60;
      const endHour = Math.floor(adminDayEnd / 60);
      const endMin = adminDayEnd % 60;
      const startTimeStr = `${startHour}:${startMin.toString().padStart(2, '0')}`;
      const endTimeStr = `${endHour}:${endMin.toString().padStart(2, '0')}`;
      
      return new Response(JSON.stringify({ 
        error: "Cannot clock in after school ends",
        message: `School hours are ${startTimeStr} - ${endTimeStr}. Please clock in during school hours.`
      }), { 
        status: 403, 
        headers: { "Content-Type": "application/json", ...cors } 
      });
    }
  }

  // Update students table to mark as clocked in
  const { data: updatedStudent, error: updateErr } = await supabaseAdmin
    .from("students")
    .update({
      clocked_in: true,
      last_clock_in_at: new Date().toISOString()
    })
    .eq("id", studentId)
    .select()
    .single();
  
  if (updateErr) {
    console.error("Error updating student clock-in status:", updateErr);
    return new Response(JSON.stringify({ error: updateErr.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  return new Response(JSON.stringify({ 
    ok: true, 
    message: "Clocked in"
  }), { 
    headers: { "Content-Type": "application/json", ...cors } 
  });
});
