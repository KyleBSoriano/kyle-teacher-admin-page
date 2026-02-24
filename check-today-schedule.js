// Check schedule blocks for today
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Helper to check if date is in daylight saving time (PST/PDT)
function isDaylightSavingTime(date) {
  const year = date.getFullYear();
  const march = new Date(year, 2, 1); // March 1
  const november = new Date(year, 10, 1); // November 1
  
  // Find second Sunday in March
  let secondSundayMarch = march;
  let sundayCount = 0;
  while (sundayCount < 2) {
    if (secondSundayMarch.getDay() === 0) sundayCount++;
    if (sundayCount < 2) secondSundayMarch = new Date(secondSundayMarch.getTime() + 86400000);
  }
  
  // Find first Sunday in November
  let firstSundayNovember = november;
  while (firstSundayNovember.getDay() !== 0) {
    firstSundayNovember = new Date(firstSundayNovember.getTime() + 86400000);
  }
  
  return date >= secondSundayMarch && date < firstSundayNovember;
}

// Get today's date in PST
function getTodayDatePST() {
  const now = new Date();
  const isDST = isDaylightSavingTime(now);
  const pstOffset = -8 * 60; // PST offset in minutes (UTC-8)
  const actualOffset = isDST ? -7 * 60 : pstOffset; // PDT is UTC-7
  
  // Get PST/PDT time
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pstTime = new Date(utcTime + (actualOffset * 60000));
  
  // Get today's date in PST
  const today = new Date(pstTime);
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0];
}

async function checkTodaySchedule() {
  const todayStr = getTodayDatePST();
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📅 SCHEDULE BLOCKS FOR TODAY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Today's Date (PST): ${todayStr}`);
  console.log('');

  // Query all schedule blocks for today
  const { data: scheduleBlocks, error } = await supabase
    .from('schedule_blocks')
    .select('*')
    .eq('schedule_date', todayStr)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error fetching schedule blocks:', error);
    return;
  }

  if (!scheduleBlocks || scheduleBlocks.length === 0) {
    console.log('⚠️  No schedule blocks found for today!');
    console.log('');
    console.log('💡 To create schedule blocks, you can:');
    console.log('   1. Use the Admin Schedule Page in the web app');
    console.log('   2. Run create-schedule-blocks.sql in Supabase SQL Editor');
    console.log('   3. Run: npm run create:schedule');
    return;
  }

  console.log(`✅ Found ${scheduleBlocks.length} schedule block(s) for today:\n`);

  // Group by school_id if there are multiple schools
  const bySchool = {};
  scheduleBlocks.forEach(block => {
    const schoolId = block.school_id || 'unknown';
    if (!bySchool[schoolId]) {
      bySchool[schoolId] = [];
    }
    bySchool[schoolId].push(block);
  });

  Object.keys(bySchool).forEach(schoolId => {
    const blocks = bySchool[schoolId];
    console.log(`🏫 School ID: ${schoolId}`);
    console.log('─'.repeat(55));
    
    blocks.forEach((block, index) => {
      console.log(`\n${index + 1}. ${block.period || 'No Period Name'}`);
      console.log(`   Start Time: ${block.start_time || 'N/A'}`);
      console.log(`   End Time: ${block.end_time || 'N/A'}`);
      console.log(`   Date: ${block.schedule_date || 'N/A'}`);
      console.log(`   Type: ${block.block_type || 'regular'}`);
      console.log(`   Color: ${block.color || 'default'}`);
      console.log(`   ID: ${block.id}`);
    });
    
    console.log('');
  });

  // Calculate admin day range
  const times = scheduleBlocks
    .filter(b => b.start_time && b.end_time)
    .map(b => {
      // Parse time to minutes for sorting
      const parseTime = (timeStr) => {
        const amPmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (amPmMatch) {
          let hour = parseInt(amPmMatch[1]);
          const minute = parseInt(amPmMatch[2]);
          const period = amPmMatch[3].toUpperCase();
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          return hour * 60 + minute;
        }
        return 0;
      };
      return {
        start: parseTime(b.start_time),
        end: parseTime(b.end_time),
        startStr: b.start_time,
        endStr: b.end_time
      };
    });

  if (times.length > 0) {
    const earliestStart = Math.min(...times.map(t => t.start));
    const latestEnd = Math.max(...times.map(t => t.end));
    
    const formatMinutes = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
    };

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 ADMIN DAY SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Admin Day Start: ${formatMinutes(earliestStart)} PST`);
    console.log(`Admin Day End: ${formatMinutes(latestEnd)} PST`);
    console.log(`Total Duration: ${latestEnd - earliestStart} minutes`);
    console.log('');
    console.log('💡 What this means:');
    console.log(`   - Students can clock in between ${formatMinutes(earliestStart)} and ${formatMinutes(latestEnd)} PST`);
    console.log(`   - Restrictions apply during this time`);
    console.log(`   - After ${formatMinutes(latestEnd)} PST, restrictions are automatically removed (auto clock-out)`);
  }

  console.log('═══════════════════════════════════════════════════════');
}

checkTodaySchedule().catch(console.error);

