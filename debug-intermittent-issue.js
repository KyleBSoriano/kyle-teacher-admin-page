// Debug script to check why baseline template is intermittent
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const SCHOOL_ID = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

// Same timezone conversion as edge function
function isDaylightSavingTime(date) {
  const year = date.getUTCFullYear();
  const march = new Date(Date.UTC(year, 2, 1));
  const november = new Date(Date.UTC(year, 10, 1));
  
  let secondSundayMarch = march;
  let sundayCount = 0;
  while (sundayCount < 2) {
    if (secondSundayMarch.getUTCDay() === 0) sundayCount++;
    if (sundayCount < 2) secondSundayMarch = new Date(secondSundayMarch.getTime() + 86400000);
  }
  
  let firstSundayNovember = november;
  while (firstSundayNovember.getUTCDay() !== 0) {
    firstSundayNovember = new Date(firstSundayNovember.getTime() + 86400000);
  }
  
  const currentUTC = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  return currentUTC >= secondSundayMarch && currentUTC < firstSundayNovember;
}

function getPSTTime() {
  const now = new Date();
  const pstOffset = -8 * 60;
  const isDST = isDaylightSavingTime(now);
  const actualOffset = isDST ? -7 * 60 : pstOffset;
  
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcTotalMinutes = utcHours * 60 + utcMinutes;
  
  let pstTotalMinutes = utcTotalMinutes + actualOffset;
  
  let pstDayOffset = 0;
  if (pstTotalMinutes < 0) {
    pstTotalMinutes += 1440;
    pstDayOffset = -1;
  } else if (pstTotalMinutes >= 1440) {
    pstTotalMinutes -= 1440;
    pstDayOffset = 1;
  }
  
  const utcDate = new Date(now);
  if (pstDayOffset !== 0) {
    utcDate.setUTCDate(utcDate.getUTCDate() + pstDayOffset);
  }
  const todayStr = utcDate.toISOString().split('T')[0];
  
  return { currentTime: pstTotalMinutes, todayStr };
}

function parseTimeToMinutes(timeStr) {
  const amPmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (amPmMatch) {
    let hour = parseInt(amPmMatch[1]);
    const minute = parseInt(amPmMatch[2]);
    const period = amPmMatch[3].toUpperCase();
    
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    return hour * 60 + minute;
  }
  
  const [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
}

async function debugIntermittentIssue() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 DEBUGGING INTERMITTENT BASELINE TEMPLATE ISSUE');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Get current time
  const { currentTime, todayStr } = getPSTTime();
  const pstHours = Math.floor(currentTime / 60);
  const pstMinutes = currentTime % 60;
  const timeStr = `${pstHours}:${String(pstMinutes).padStart(2, '0')} ${pstHours >= 12 ? 'PM' : 'AM'}`;
  
  console.log(`📅 Current Time (PST): ${timeStr}`);
  console.log(`📅 Current Date (PST): ${todayStr}`);
  console.log(`⏱️  Minutes: ${currentTime}`);
  console.log('');

  // Get schedule blocks
  const { data: allScheduleBlocks, error: scheduleErr } = await supabase
    .from("schedule_blocks")
    .select("period, start_time, end_time, schedule_date")
    .eq("school_id", SCHOOL_ID)
    .eq("schedule_date", todayStr)
    .order("start_time", { ascending: true });

  if (scheduleErr || !allScheduleBlocks || allScheduleBlocks.length === 0) {
    console.log('❌ No schedule blocks found!');
    return;
  }

  // Calculate admin day and check active period
  let adminDayStart = null;
  let adminDayEnd = null;
  let activePeriod = null;
  const periodRanges = [];

  for (const block of allScheduleBlocks) {
    if (block.start_time && block.end_time) {
      const startMin = parseTimeToMinutes(block.start_time);
      const endMin = parseTimeToMinutes(block.end_time);
      
      periodRanges.push({ period: block.period, start: startMin, end: endMin });
      
      if (adminDayStart === null || startMin < adminDayStart) {
        adminDayStart = startMin;
      }
      if (adminDayEnd === null || endMin > adminDayEnd) {
        adminDayEnd = endMin;
      }
      
      // Check if in this period (using >= and <= like the code)
      if (currentTime >= startMin && currentTime <= endMin) {
        activePeriod = block.period;
      }
    }
  }

  console.log('📋 Period Ranges:');
  periodRanges.forEach(({ period, start, end }) => {
    const inPeriod = currentTime >= start && currentTime <= end;
    const status = inPeriod ? '✅ IN' : '   ';
    const startStr = `${Math.floor(start/60)}:${String(start%60).padStart(2,'0')}`;
    const endStr = `${Math.floor(end/60)}:${String(end%60).padStart(2,'0')}`;
    console.log(`   ${status} ${period}: ${startStr} - ${endStr} (${start}-${end} min)`);
  });

  console.log('');
  console.log(`Admin Day: ${adminDayStart} - ${adminDayEnd} minutes`);
  console.log(`Current Time: ${currentTime} minutes`);
  console.log(`Active Period: ${activePeriod || 'None (between periods)'}`);
  console.log('');

  // Check if between periods
  const isBetweenPeriods = !activePeriod && currentTime >= adminDayStart && currentTime <= adminDayEnd;
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 LOGIC CHECK');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`1. In active period? ${activePeriod ? 'YES (' + activePeriod + ')' : 'NO'}`);
  console.log(`2. Within admin day? ${currentTime >= adminDayStart && currentTime <= adminDayEnd ? 'YES' : 'NO'}`);
  console.log(`3. Between periods? ${isBetweenPeriods ? 'YES ✅' : 'NO'}`);
  console.log('');

  if (isBetweenPeriods) {
    console.log('✅ SHOULD APPLY BASELINE TEMPLATE');
    console.log('');
    
    // Check baseline template
    const { data: baselineTemplate, error: baselineErr } = await supabase
      .from("app_templates")
      .select("id, name, apps, period, class_id")
      .eq("school_id", SCHOOL_ID)
      .eq("period", "baseline")
      .is("class_id", null)
      .maybeSingle();

    if (baselineErr) {
      console.log('❌ Error querying baseline template:', baselineErr);
    } else if (!baselineTemplate) {
      console.log('❌ NO BASELINE TEMPLATE FOUND!');
      console.log('   This is why it\'s not working.');
    } else {
      console.log('✅ BASELINE TEMPLATE FOUND:');
      console.log(`   ID: ${baselineTemplate.id}`);
      console.log(`   Name: ${baselineTemplate.name}`);
      console.log(`   Apps: ${JSON.stringify(baselineTemplate.apps)}`);
      console.log(`   Apps Count: ${baselineTemplate.apps && Array.isArray(baselineTemplate.apps) ? baselineTemplate.apps.length : 0}`);
      console.log('');
      console.log('✅ Everything looks correct! Baseline should be applied.');
    }
  } else if (activePeriod) {
    console.log(`📚 IN ACTIVE PERIOD: ${activePeriod}`);
    console.log('   Should apply class template for this period, not baseline.');
  } else {
    console.log('⏰ OUTSIDE ADMIN DAY');
    console.log('   Should return empty restrictions.');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('💡 POTENTIAL ISSUES:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('1. Edge case: If currentTime exactly equals period end time');
  console.log('   - Code uses: currentTime >= startMin && currentTime <= endMin');
  console.log('   - If currentTime = endMin, you\'re still "in" the period');
  console.log('   - Baseline only applies when NOT in any period');
  console.log('');
  console.log('2. Timing precision: Edge function might calculate time slightly differently');
  console.log('   - Check if there\'s a 1-2 second difference in time calculation');
  console.log('');
  console.log('3. Database query timing: Template might not be found sometimes');
  console.log('   - Check RLS policies on app_templates table');
  console.log('   - Check if query is case-sensitive for "baseline"');
  console.log('');
  console.log('4. Caching: Edge function might cache results');
  console.log('   - Check if there\'s any caching in the edge function');
  console.log('═══════════════════════════════════════════════════════');
}

debugIntermittentIssue().catch(console.error);

