import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }
  });

  // Get student ID from token or query param
  const url = new URL(req.url);
  let studentId = url.searchParams.get("student_id");
  
  if (!studentId) {
    const { data: auth, error: aerr } = await supabase.auth.getUser();
    if (aerr || !auth.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json", ...cors } 
      });
    }
    studentId = auth.user.id;
  }

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

  // Check if student is clocked in (check students.clocked_in boolean)
  const { data: student, error: stuErr } = await supabase
    .from("students")
    .select("clocked_in, school_id")
    .eq("id", studentId)
    .maybeSingle();
  
  if (stuErr || !student) {
    return new Response(JSON.stringify({ error: "Student not found" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // If not clocked in, return empty restrictions
  if (!student.clocked_in) {
    return new Response(JSON.stringify({ 
      clocked_in: false, 
      keys: [], 
      catalog: [],
      reason: "not_clocked_in"
    }), { 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }


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

  // ─────────────────────────────────────────────
  // STEP 1: Get ALL schedule blocks for today
  // ─────────────────────────────────────────────
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
    // Find earliest start and latest end from all schedule blocks
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

  // ─────────────────────────────────────────────
  // STEP 2: Check if past admin day end → auto clock-out
  // ─────────────────────────────────────────────
  if (adminDayEnd !== null && currentTime > adminDayEnd) {
    console.log(`⏰ Past admin day end (${adminDayEnd} min), current: ${currentTime} min - restrictions lifted`);
    return new Response(JSON.stringify({ 
      clocked_in: true,
      keys: [], 
      catalog: [],
      template_source: "none",
      reason: "past_admin_day_end"
    }), { 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // ─────────────────────────────────────────────
  // STEP 3: Check if within any active period
  // ─────────────────────────────────────────────
  let templateApps: string[] = [];
  let templateSource = "baseline";
  let activePeriod: string | null = null;

  if (allScheduleBlocks && allScheduleBlocks.length > 0) {
    // Get student's enrollments to find which classes they're in
    const { data: enrollments, error: enrollErr } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("student_id", studentId);

    if (!enrollErr && enrollments && enrollments.length > 0) {
      // Get all classes student is enrolled in
      const classIds = enrollments.map(e => e.class_id);
      const { data: studentClasses, error: classesErr } = await supabase
        .from("classes")
        .select("id, period, active_template_id")
        .in("id", classIds);

      if (!classesErr && studentClasses) {
        // Create a map of period -> class for quick lookup
        const periodToClass = new Map<string, typeof studentClasses[0]>();
        for (const cls of studentClasses) {
          if (cls.period) {
            periodToClass.set(cls.period.trim(), cls);
          }
        }

        // Check each schedule block to see if we're in that period's time
        for (const block of allScheduleBlocks) {
          if (block.start_time && block.end_time) {
            const startMin = parseTimeToMinutes(block.start_time);
            const endMin = parseTimeToMinutes(block.end_time);
            
            // Use < instead of <= for endMin so that at exactly end time, we're "between periods"
            // This ensures baseline template applies immediately when period ends
            if (currentTime >= startMin && currentTime < endMin) {
              // We're in this period's time!
              activePeriod = block.period;
              const classData = periodToClass.get(block.period.trim());
              
              if (classData && classData.active_template_id) {
                // Get the class template
                const { data: classTemplate, error: templateErr } = await supabase
                  .from("app_templates")
                  .select("apps, name")
                  .eq("id", classData.active_template_id)
                  .maybeSingle();

                if (!templateErr && classTemplate && classTemplate.apps && Array.isArray(classTemplate.apps)) {
                  templateApps = classTemplate.apps as string[];
                  templateSource = `class_${block.period}`;
                  if (templateApps.length === 0) {
                    console.log(`🚫 In active period "${block.period}" - using class template with 0 apps (all apps blocked)`);
                  } else {
                    console.log(`✅ In active period "${block.period}" - using class template with ${templateApps.length} apps`);
                  }
                  break; // Found active period, stop checking
                }
              }
            }
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // STEP 4: If not in any period, check admin day range
  // ─────────────────────────────────────────────
  if (templateApps.length === 0) {
    if (adminDayStart !== null && adminDayEnd !== null) {
      if (currentTime >= adminDayStart && currentTime <= adminDayEnd) {
        // Within admin day but not in any period → use baseline/admin restrictions
        console.log(`📅 Within admin day (${adminDayStart}-${adminDayEnd} min) but not in any period - using baseline`);
        
        const { data: baselineTemplate, error: baselineErr } = await supabase
          .from("app_templates")
          .select("apps, name, id, updated_at")
          .eq("school_id", student.school_id)
          .eq("period", "baseline")
          .is("class_id", null)
          .order("updated_at", { ascending: false })  // Get most recent (from Admin Apps page)
          .limit(1)
          .maybeSingle();

        // Add detailed logging to debug
        console.log(`🔍 Baseline template query:`, {
          school_id: student.school_id,
          found: !!baselineTemplate,
          template_id: baselineTemplate?.id,
          template_name: baselineTemplate?.name,
          updated_at: baselineTemplate?.updated_at,
          apps_count: baselineTemplate?.apps ? (Array.isArray(baselineTemplate.apps) ? baselineTemplate.apps.length : 0) : 0,
          error: baselineErr?.message
        });

        if (!baselineErr && baselineTemplate && baselineTemplate.apps && Array.isArray(baselineTemplate.apps)) {
          templateApps = baselineTemplate.apps as string[];
          templateSource = "baseline";
          if (templateApps.length === 0) {
            console.log(`🚫 Baseline template found: "${baselineTemplate.name}" with 0 apps (all apps blocked)`);
          } else {
            console.log(`✅ Baseline template found: "${baselineTemplate.name}" with ${templateApps.length} apps`);
          }
        } else {
          // Only fallback to school's allowed_apps if baseline template doesn't exist or has no apps property
          // If baseline template exists with empty array, we use it (don't fallback)
          if (!baselineTemplate || !baselineTemplate.apps) {
            console.log(`⚠️ Baseline template not found or has no apps property. Error: ${baselineErr?.message || 'none'}, Template: ${baselineTemplate ? 'exists but no apps property' : 'not found'}`);
            // Fallback to school's allowed_apps if no baseline template
            const { data: school, error: schoolErr } = await supabase
              .from("schools")
              .select("allowed_apps")
              .eq("id", student.school_id)
              .maybeSingle();

            if (!schoolErr && school && school.allowed_apps) {
              templateApps = school.allowed_apps as string[];
              templateSource = "school_allowed";
              console.log(`✅ Using school.allowed_apps fallback with ${templateApps.length} apps`);
            } else {
              console.log(`⚠️ No baseline template and no school.allowed_apps fallback`);
            }
          }
        }
      } else {
        // Before admin day start → no restrictions yet
        console.log(`⏰ Before admin day start (${adminDayStart} min), current: ${currentTime} min - no restrictions`);
        return new Response(JSON.stringify({ 
          clocked_in: true,
          keys: [], 
          catalog: [],
          template_source: "none",
          reason: "before_admin_day_start"
        }), { 
          headers: { "Content-Type": "application/json", ...cors } 
        });
      }
    } else {
      // No schedule blocks for today → no restrictions
      console.log(`⚠️ No schedule blocks for today - no restrictions applied`);
      return new Response(JSON.stringify({ 
        clocked_in: true,
        keys: [], 
        catalog: [],
        template_source: "none",
        reason: "no_schedule_blocks"
      }), { 
        headers: { "Content-Type": "application/json", ...cors } 
      });
    }
  }

  // ─────────────────────────────────────────────
  // STEP 5: Fetch app_catalog entries
  // ─────────────────────────────────────────────
  let catalog: any[] = [];
  if (templateApps.length > 0) {
    const { data: catalogData, error: catErr } = await supabase
      .from("app_catalog")
      .select("key, display_name, ios_bundle_id, aliases")
      .in("key", templateApps);

    if (!catErr && catalogData) {
      catalog = catalogData;
    }
  }

  return new Response(JSON.stringify({ 
    clocked_in: true,
    keys: templateApps,
    catalog: catalog,
    template_source: templateSource,
    active_period: activePeriod
  }), { 
    headers: { "Content-Type": "application/json", ...cors } 
  });
});
