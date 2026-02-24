// Check what template should be applied right now
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const SCHOOL_ID = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

// Helper to check if date is in daylight saving time (PST/PDT)
function isDaylightSavingTime(date) {
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

// Get current time in PST (same logic as get-current-restrictions)
function getPSTTime() {
  const now = new Date();
  const pstOffset = -8 * 60; // PST offset in minutes (UTC-8)
  const isDST = isDaylightSavingTime(now);
  const actualOffset = isDST ? -7 * 60 : pstOffset; // PDT is UTC-7
  
  // Convert UTC to PST/PDT
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcTotalMinutes = utcHours * 60 + utcMinutes;
  
  // Convert to PST by subtracting the offset (offset is negative, so we add it)
  let pstTotalMinutes = utcTotalMinutes + actualOffset;
  
  // Handle day rollover
  let pstDayOffset = 0;
  if (pstTotalMinutes < 0) {
    pstTotalMinutes += 1440;
    pstDayOffset = -1;
  } else if (pstTotalMinutes >= 1440) {
    pstTotalMinutes -= 1440;
    pstDayOffset = 1;
  }
  
  const currentTime = pstTotalMinutes;
  
  // Get today's date in PST
  const utcDate = new Date(now);
  if (pstDayOffset !== 0) {
    utcDate.setUTCDate(utcDate.getUTCDate() + pstDayOffset);
  }
  const todayStr = utcDate.toISOString().split('T')[0];
  
  return { 
    currentTime, 
    todayStr, 
    pstHours: Math.floor(pstTotalMinutes / 60), 
    pstMinutes: pstTotalMinutes % 60 
  };
}

// Parse time format: "8:30 AM" or "14:30" (24-hour) to minutes since midnight
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

async function checkCurrentRestrictions() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 CHECKING CURRENT RESTRICTIONS');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Get current PST time
  const { currentTime, todayStr, pstHours, pstMinutes } = getPSTTime();
  const timeStr = `${pstHours}:${String(pstMinutes).padStart(2, '0')} ${pstHours >= 12 ? 'PM' : 'AM'}`;
  
  console.log(`📅 Current Time (PST): ${timeStr}`);
  console.log(`📅 Current Date (PST): ${todayStr}`);
  console.log(`⏱️  Minutes since midnight: ${currentTime}`);
  console.log('');

  // Get schedule blocks for today
  const { data: allScheduleBlocks, error: scheduleErr } = await supabase
    .from("schedule_blocks")
    .select("period, start_time, end_time, schedule_date")
    .eq("school_id", SCHOOL_ID)
    .eq("schedule_date", todayStr)
    .order("start_time", { ascending: true });

  if (scheduleErr || !allScheduleBlocks || allScheduleBlocks.length === 0) {
    console.log('❌ No schedule blocks found for today!');
    return;
  }

  // Calculate admin day range
  let adminDayStart = null;
  let adminDayEnd = null;
  let activePeriod = null;

  console.log('📋 Schedule Blocks:');
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
      
      // Check if we're in this period
      if (currentTime >= startMin && currentTime <= endMin) {
        activePeriod = block.period;
      }
      
      const inPeriod = currentTime >= startMin && currentTime <= endMin;
      const status = inPeriod ? '✅ ACTIVE' : '   ';
      console.log(`   ${status} ${block.period}: ${block.start_time} - ${block.end_time} (${startMin}-${endMin} min)`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 STATUS ANALYSIS');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (activePeriod) {
    console.log(`✅ You are IN an active period: ${activePeriod}`);
    console.log(`   → Should apply: Class template for ${activePeriod}`);
    console.log('');
    console.log('💡 To see which class template, you need to:');
    console.log('   1. Check which class you\'re enrolled in for this period');
    console.log('   2. Check that class\'s active_template_id');
  } else if (currentTime >= adminDayStart && currentTime <= adminDayEnd) {
    console.log(`📅 You are BETWEEN periods (within admin day)`);
    console.log(`   → Should apply: BASELINE TEMPLATE`);
    console.log('');
    
    // Check for baseline template
    const { data: baselineTemplate, error: baselineErr } = await supabase
      .from("app_templates")
      .select("id, name, apps, period, class_id")
      .eq("school_id", SCHOOL_ID)
      .eq("period", "baseline")
      .is("class_id", null)
      .maybeSingle();

    if (baselineErr) {
      console.log('❌ Error checking baseline template:', baselineErr);
    } else if (!baselineTemplate) {
      console.log('❌ NO BASELINE TEMPLATE FOUND!');
      console.log('');
      console.log('   This is why baseline restrictions aren\'t applying.');
      console.log('   You need to create a baseline template in Admin Apps page.');
      console.log('');
      
      // Check school fallback
      const { data: school, error: schoolErr } = await supabase
        .from("schools")
        .select("allowed_apps")
        .eq("id", SCHOOL_ID)
        .maybeSingle();

      if (!schoolErr && school && school.allowed_apps) {
        console.log('   Fallback: school.allowed_apps exists');
        console.log(`   Apps: ${JSON.stringify(school.allowed_apps)}`);
      } else {
        console.log('   Fallback: No school.allowed_apps either');
        console.log('   Result: Empty restrictions (no apps allowed)');
      }
    } else {
      console.log('✅ BASELINE TEMPLATE FOUND:');
      console.log(`   Name: ${baselineTemplate.name}`);
      console.log(`   ID: ${baselineTemplate.id}`);
      console.log(`   Apps: ${JSON.stringify(baselineTemplate.apps)}`);
      console.log(`   Apps Count: ${baselineTemplate.apps && Array.isArray(baselineTemplate.apps) ? baselineTemplate.apps.length : 0}`);
      console.log('');
      console.log('✅ This template SHOULD be applied right now!');
      if (!baselineTemplate.apps || baselineTemplate.apps.length === 0) {
        console.log('⚠️  WARNING: Baseline template has no apps (empty array)');
        console.log('   This means no apps will be allowed.');
      }
    }
  } else if (currentTime < adminDayStart) {
    console.log(`⏰ Before admin day starts`);
    console.log(`   → Should apply: NO RESTRICTIONS (empty)`);
  } else {
    console.log(`🏁 After admin day ends`);
    console.log(`   → Should apply: NO RESTRICTIONS (auto clock-out)`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
}

checkCurrentRestrictions().catch(console.error);

