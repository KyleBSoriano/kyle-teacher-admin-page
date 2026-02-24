// Debug script to check what time the clock-in function sees
// This simulates the exact logic from clock-in-via-qr/index.ts

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

// Get current time in PST (same logic as clock-in-via-qr)
const now = new Date();
const pstOffset = -8 * 60; // PST offset in minutes (UTC-8)
const isDST = isDaylightSavingTime(now);
const actualOffset = isDST ? -7 * 60 : pstOffset; // PDT is UTC-7

// Convert UTC to PST/PDT
const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
const pstTime = new Date(utcTime + (actualOffset * 60000));
const currentTime = pstTime.getHours() * 60 + pstTime.getMinutes(); // minutes since midnight (PST)

// Get today's date in PST
const today = new Date(pstTime);
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split('T')[0];

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 CLOCK-IN TIME DEBUG');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('Current UTC time:', now.toISOString());
console.log('Current browser time:', now.toString());
console.log('');
console.log('PST Conversion:');
console.log(`  DST Active: ${isDST ? 'Yes (PDT)' : 'No (PST)'}`);
console.log(`  Offset: ${actualOffset / 60} hours`);
console.log(`  PST Time: ${pstTime.toLocaleString()}`);
console.log(`  PST Date: ${todayStr}`);
console.log(`  Current Time (minutes): ${currentTime}`);
console.log(`  Current Time (formatted): ${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`);
console.log('');

// Simulate schedule blocks from today
const scheduleBlocks = [
  { period: 'Period 1', start_time: '8:00 AM', end_time: '9:47 AM' },
  { period: 'Period 2', start_time: '9:54 AM', end_time: '10:41 AM' },
  { period: 'Period 3', start_time: '10:48 AM', end_time: '11:35 AM' },
  { period: 'Period 4', start_time: '11:42 AM', end_time: '12:31 PM' },
  { period: 'Period 5', start_time: '1:19 PM', end_time: '2:06 PM' },
  { period: 'Period 6', start_time: '2:13 PM', end_time: '3:00 PM' }
];

console.log('Schedule Blocks:');
let adminDayStart = null;
let adminDayEnd = null;

scheduleBlocks.forEach(block => {
  const startMin = parseTimeToMinutes(block.start_time);
  const endMin = parseTimeToMinutes(block.end_time);
  
  if (adminDayStart === null || startMin < adminDayStart) {
    adminDayStart = startMin;
  }
  if (adminDayEnd === null || endMin > adminDayEnd) {
    adminDayEnd = endMin;
  }
  
  console.log(`  ${block.period}: ${block.start_time} - ${block.end_time} (${startMin} - ${endMin} minutes)`);
});

console.log('');
console.log('Admin Day Range:');
console.log(`  Start: ${adminDayStart} minutes (${Math.floor(adminDayStart / 60)}:${(adminDayStart % 60).toString().padStart(2, '0')})`);
console.log(`  End: ${adminDayEnd} minutes (${Math.floor(adminDayEnd / 60)}:${(adminDayEnd % 60).toString().padStart(2, '0')})`);
console.log('');

console.log('Validation Check:');
console.log(`  Current Time: ${currentTime} minutes`);
console.log(`  Admin Day Start: ${adminDayStart} minutes`);
console.log(`  Admin Day End: ${adminDayEnd} minutes`);
console.log('');

if (currentTime < adminDayStart) {
  console.log('❌ BEFORE SCHOOL: currentTime < adminDayStart');
  console.log(`   Error: "Cannot clock in before school starts"`);
} else if (currentTime > adminDayEnd) {
  console.log('❌ AFTER SCHOOL: currentTime > adminDayEnd');
  console.log(`   Error: "Cannot clock in after school ends"`);
  console.log(`   This is the error you're seeing!`);
  console.log('');
  console.log('   Debugging:');
  console.log(`     currentTime (${currentTime}) > adminDayEnd (${adminDayEnd})`);
  console.log(`     Difference: ${currentTime - adminDayEnd} minutes`);
  console.log(`     This means the server thinks it's ${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')} PST`);
} else {
  console.log('✅ WITHIN SCHOOL HOURS: adminDayStart <= currentTime <= adminDayEnd');
  console.log(`   Clock-in should work!`);
}

console.log('');
console.log('═══════════════════════════════════════════════════════');

