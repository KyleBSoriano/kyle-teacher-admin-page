// Local test script to simulate clock-in timezone logic
// This tests the fixed timezone conversion

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Helper function to check if date is in daylight saving time (PST/PDT)
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

// Parse time format: "8:30 AM" or "14:30" (24-hour) to minutes since midnight
function parseTimeToMinutes(timeStr) {
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
}

// NEW FIXED TIMEZONE CONVERSION (same as in clock-in-via-qr/index.ts)
function getPSTTime() {
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
  const todayStr = utcDate.toISOString().split('T')[0];
  
  return { currentTime, todayStr, pstHours: Math.floor(pstTotalMinutes / 60), pstMinutes: pstTotalMinutes % 60 };
}

async function testClockInLogic() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTING CLOCK-IN TIMEZONE LOGIC (FIXED VERSION)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Get PST time using the FIXED logic
  const { currentTime, todayStr, pstHours, pstMinutes } = getPSTTime();
  
  console.log('📅 Current Time Calculation:');
  console.log(`  UTC Time: ${new Date().toISOString()}`);
  console.log(`  PST Date: ${todayStr}`);
  console.log(`  PST Time: ${pstHours}:${String(pstMinutes).padStart(2, '0')} ${pstHours >= 12 ? 'PM' : 'AM'}`);
  console.log(`  PST Minutes: ${currentTime} (since midnight)`);
  console.log('');

  // Get schedule blocks for today
  const SCHOOL_ID = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';
  
  const { data: allScheduleBlocks, error: scheduleErr } = await supabase
    .from("schedule_blocks")
    .select("period, start_time, end_time, schedule_date")
    .eq("school_id", SCHOOL_ID)
    .eq("schedule_date", todayStr)
    .order("start_time", { ascending: true });

  if (scheduleErr) {
    console.error('❌ Error fetching schedule blocks:', scheduleErr);
    return;
  }

  if (!allScheduleBlocks || allScheduleBlocks.length === 0) {
    console.log('⚠️  No schedule blocks found for today!');
    return;
  }

  console.log('📋 Schedule Blocks for Today:');
  let adminDayStart = null;
  let adminDayEnd = null;

  allScheduleBlocks.forEach(block => {
    if (block.start_time && block.end_time) {
      const startMin = parseTimeToMinutes(block.start_time);
      const endMin = parseTimeToMinutes(block.end_time);
      
      if (adminDayStart === null || startMin < adminDayStart) {
        adminDayStart = startMin;
      }
      if (adminDayEnd === null || endMin > adminDayEnd) {
        adminDayEnd = endMin;
      }
      
      console.log(`  ${block.period}: ${block.start_time} - ${block.end_time} (${startMin} - ${endMin} min)`);
    }
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ VALIDATION TEST');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Current Time (PST): ${currentTime} minutes (${pstHours}:${String(pstMinutes).padStart(2, '0')})`);
  console.log(`Admin Day Start: ${adminDayStart} minutes (${Math.floor(adminDayStart / 60)}:${String(adminDayStart % 60).padStart(2, '0')})`);
  console.log(`Admin Day End: ${adminDayEnd} minutes (${Math.floor(adminDayEnd / 60)}:${String(adminDayEnd % 60).padStart(2, '0')})`);
  console.log('');

  if (currentTime < adminDayStart) {
    console.log('❌ RESULT: Cannot clock in - BEFORE school hours');
    console.log(`   Current time (${pstHours}:${String(pstMinutes).padStart(2, '0')}) is before ${Math.floor(adminDayStart / 60)}:${String(adminDayStart % 60).padStart(2, '0')}`);
  } else if (currentTime > adminDayEnd) {
    console.log('❌ RESULT: Cannot clock in - AFTER school hours');
    console.log(`   Current time (${pstHours}:${String(pstMinutes).padStart(2, '0')}) is after ${Math.floor(adminDayEnd / 60)}:${String(adminDayEnd % 60).padStart(2, '0')}`);
  } else {
    console.log('✅ RESULT: CAN CLOCK IN - Within school hours!');
    console.log(`   Current time (${pstHours}:${String(pstMinutes).padStart(2, '0')}) is between ${Math.floor(adminDayStart / 60)}:${String(adminDayStart % 60).padStart(2, '0')} and ${Math.floor(adminDayEnd / 60)}:${String(adminDayEnd % 60).padStart(2, '0')}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('💡 This is what the edge function will calculate');
  console.log('   If it shows ✅, clock-in should work!');
  console.log('   If it shows ❌, you need to wait for school hours');
  console.log('═══════════════════════════════════════════════════════');
}

testClockInLogic().catch(console.error);

