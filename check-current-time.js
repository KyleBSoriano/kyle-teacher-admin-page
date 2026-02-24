// Quick script to check current time in PST and which period is active
// Run with: node check-current-time.js

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

// Parse time string to minutes (handles "1:35 AM" format)
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
  return 0;
}

// Get current time in PST
const now = new Date();
const isDST = isDaylightSavingTime(now);
const pstOffset = -8 * 60; // PST offset in minutes (UTC-8)
const actualOffset = isDST ? -7 * 60 : pstOffset; // PDT is UTC-7

// Convert UTC to PST/PDT
const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
const pstTime = new Date(utcTime + (actualOffset * 60000));

// Get today's date in PST
const today = new Date(pstTime);
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split('T')[0];

// Current time in PST (minutes since midnight)
const currentMinutesPST = pstTime.getHours() * 60 + pstTime.getMinutes();

// Format time for display
const hours = pstTime.getHours();
const minutes = pstTime.getMinutes();
const ampm = hours >= 12 ? 'PM' : 'AM';
const displayHours = hours % 12 || 12;
const displayMinutes = minutes.toString().padStart(2, '0');
const timeString = `${displayHours}:${displayMinutes} ${ampm}`;

console.log('═══════════════════════════════════════════════════════');
console.log('🕐 CURRENT TIME CHECK (Based on Bell Schedule System)');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`📅 Today's Date (PST): ${todayStr}`);
console.log(`🕐 Current Time (PST): ${timeString}`);
console.log(`⏱️  Minutes since midnight: ${currentMinutesPST}`);
console.log(`🌍 Timezone: ${isDST ? 'PDT (UTC-7)' : 'PST (UTC-8)'}`);
console.log('');

// Your schedule blocks (from create-schedule-blocks.sql)
const scheduleBlocks = [
  { period: 'Period 1', start_time: '1:35 AM', end_time: '1:37 AM' },
  { period: 'Period 2', start_time: '1:39 AM', end_time: '1:41 AM' }
];

console.log('📋 Your Bell Schedule:');
scheduleBlocks.forEach(block => {
  const startMin = parseTimeToMinutes(block.start_time);
  const endMin = parseTimeToMinutes(block.end_time);
  console.log(`   ${block.period}: ${block.start_time} - ${block.end_time} PST`);
  console.log(`      (${startMin} - ${endMin} minutes)`);
});
console.log('');

// Check which period is active
let activePeriod = null;
let status = '';

for (const block of scheduleBlocks) {
  const startMin = parseTimeToMinutes(block.start_time);
  const endMin = parseTimeToMinutes(block.end_time);
  
  if (currentMinutesPST >= startMin && currentMinutesPST <= endMin) {
    activePeriod = block.period;
    const minutesRemaining = endMin - currentMinutesPST;
    status = `✅ ACTIVE - ${minutesRemaining} minutes remaining`;
    break;
  }
}

// Calculate admin day range
const adminDayStart = Math.min(...scheduleBlocks.map(b => parseTimeToMinutes(b.start_time)));
const adminDayEnd = Math.max(...scheduleBlocks.map(b => parseTimeToMinutes(b.end_time)));

if (!activePeriod) {
  if (currentMinutesPST < adminDayStart) {
    status = `⏰ BEFORE ADMIN DAY - Admin day starts at ${scheduleBlocks[0].start_time} PST`;
  } else if (currentMinutesPST > adminDayEnd) {
    status = `🏁 AFTER ADMIN DAY - Auto clock-out (admin day ended at ${scheduleBlocks[scheduleBlocks.length - 1].end_time} PST)`;
  } else {
    status = `📅 BETWEEN PERIODS - Within admin day, using baseline template`;
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('📊 CURRENT STATUS:');
console.log('═══════════════════════════════════════════════════════');
if (activePeriod) {
  console.log(`🎯 Active Period: ${activePeriod}`);
} else {
  console.log(`🎯 Active Period: None`);
}
console.log(`📌 Status: ${status}`);
console.log('');

console.log('💡 What this means:');
if (activePeriod) {
  console.log(`   → Students in ${activePeriod} get their class template restrictions`);
} else if (currentMinutesPST >= adminDayStart && currentMinutesPST <= adminDayEnd) {
  console.log(`   → All clocked-in students get baseline template restrictions`);
} else if (currentMinutesPST < adminDayStart) {
  console.log(`   → No restrictions applied yet (before admin day starts)`);
} else {
  console.log(`   → All restrictions removed (auto clock-out after admin day)`);
}
console.log('');

console.log('═══════════════════════════════════════════════════════');
console.log('📖 How the system reads this:');
console.log('═══════════════════════════════════════════════════════');
console.log(`1. System queries: schedule_blocks WHERE schedule_date = '${todayStr}'`);
console.log(`2. Gets all periods for today: Period 1, Period 2`);
console.log(`3. Converts current time to PST: ${timeString}`);
console.log(`4. Compares ${currentMinutesPST} minutes with schedule block times`);
if (activePeriod) {
  console.log(`5. Finds match: Current time is in ${activePeriod}`);
  console.log(`6. Returns: Class template apps for ${activePeriod}`);
} else if (currentMinutesPST >= adminDayStart && currentMinutesPST <= adminDayEnd) {
  console.log(`5. Finds: Not in any period, but within admin day`);
  console.log(`6. Returns: Baseline template apps`);
} else {
  console.log(`5. Finds: Outside admin day range`);
  console.log(`6. Returns: Empty restrictions (no apps allowed)`);
}
console.log('═══════════════════════════════════════════════════════');

