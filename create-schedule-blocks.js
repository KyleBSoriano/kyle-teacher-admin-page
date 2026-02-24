/**
 * Script to Create Schedule Blocks for Period 1 and Period 2
 * 
 * Creates schedule blocks:
 * - Period 1: 1:35 AM to 1:37 AM PST (Class ID: 9608a350-bca6-4303-b84a-064100c90bd0)
 * - Period 2: 1:39 AM to 1:41 AM PST (Class ID: 48d5c0e5-f27d-42a6-9b17-ac4167732c46)
 * 
 * Run with: node create-schedule-blocks.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Class IDs
const PERIOD_1_CLASS_ID = '9608a350-bca6-4303-b84a-064100c90bd0';
const PERIOD_2_CLASS_ID = '48d5c0e5-f27d-42a6-9b17-ac4167732c46';

// School ID
const SCHOOL_ID = process.env.SCHOOL_ID || 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

// Get today's date in YYYY-MM-DD format (PST)
function getTodayDatePST() {
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

async function getSchoolIdFromClass(classId) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('school_id')
      .eq('id', classId)
      .single();

    if (error) {
      console.error(`❌ Error fetching school_id for class ${classId}:`, error);
      return null;
    }

    return data?.school_id;
  } catch (error) {
    console.error(`❌ Failed to fetch school_id:`, error);
    return null;
  }
}

async function getSchoolIdFromExistingBlocks() {
  try {
    // Try to get school_id from existing schedule blocks
    const { data, error } = await supabase
      .from('schedule_blocks')
      .select('school_id')
      .not('school_id', 'is', null)
      .limit(1)
      .single();

    if (!error && data?.school_id) {
      return data.school_id;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function createScheduleBlocks() {
  console.log('📅 Creating schedule blocks for today (PST)...\n');
  const today = getTodayDatePST();
  console.log(`📅 Today's date (PST): ${today}\n`);

  // Use the school_id from the constant (or env var if provided)
  const schoolId = SCHOOL_ID;
  console.log(`🏫 School ID: ${schoolId}\n`);

  // Period 1: 1:35 AM to 1:37 AM PST
  const period1Block = {
    period: 'Period 1',
    start_time: '1:35 AM',
    end_time: '1:37 AM',
    schedule_date: today,
    block_type: 'regular',
    color: 'blue'
  };
  
  // Add school_id only if we have it (some schemas allow null)
  if (schoolId) {
    period1Block.school_id = schoolId;
  }

  // Period 2: 1:39 AM to 1:41 AM PST
  const period2Block = {
    period: 'Period 2',
    start_time: '1:39 AM',
    end_time: '1:41 AM',
    schedule_date: today,
    block_type: 'regular',
    color: 'blue'
  };
  
  // Add school_id only if we have it (some schemas allow null)
  if (schoolId) {
    period2Block.school_id = schoolId;
  }

  try {
    // Check if blocks already exist for today
    const { data: existingBlocks, error: checkError } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('schedule_date', today)
      .in('period', ['Period 1', 'Period 2']);

    if (checkError) {
      console.error('❌ Error checking existing blocks:', checkError);
    } else if (existingBlocks && existingBlocks.length > 0) {
      console.log('⚠️  Schedule blocks already exist for today:');
      existingBlocks.forEach(block => {
        console.log(`   - ${block.period}: ${block.start_time} - ${block.end_time}`);
      });
      console.log('\n🗑️  Deleting existing Period 1 and Period 2 blocks for today...\n');
      
      // Delete existing Period 1 and Period 2 blocks for today
      const { error: deleteError } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('schedule_date', today)
        .in('period', ['Period 1', 'Period 2']);
      
      if (deleteError) {
        console.error('❌ Error deleting existing blocks:', deleteError);
        return;
      }
      console.log('✅ Deleted existing blocks\n');
    }

    // Insert Period 1
    console.log('📝 Creating Period 1 block...');
    const { data: block1, error: error1 } = await supabase
      .from('schedule_blocks')
      .insert([period1Block])
      .select();

    if (error1) {
      console.error('❌ Error creating Period 1 block:', error1);
      return;
    }
    console.log('✅ Created Period 1 block:', {
      id: block1[0].id,
      period: block1[0].period,
      start_time: block1[0].start_time,
      end_time: block1[0].end_time,
      schedule_date: block1[0].schedule_date
    });

    // Insert Period 2
    console.log('\n📝 Creating Period 2 block...');
    const { data: block2, error: error2 } = await supabase
      .from('schedule_blocks')
      .insert([period2Block])
      .select();

    if (error2) {
      console.error('❌ Error creating Period 2 block:', error2);
      return;
    }
    console.log('✅ Created Period 2 block:', {
      id: block2[0].id,
      period: block2[0].period,
      start_time: block2[0].start_time,
      end_time: block2[0].end_time,
      schedule_date: block2[0].schedule_date
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Schedule blocks created successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Period 1: 1:35 AM - 1:37 AM PST (Class: ${PERIOD_1_CLASS_ID})`);
    console.log(`   - Period 2: 1:39 AM - 1:41 AM PST (Class: ${PERIOD_2_CLASS_ID})`);
    console.log(`   - Date: ${today}`);
    console.log(`   - School ID: ${schoolId}`);
    
  } catch (error) {
    console.error('❌ Error creating schedule blocks:', error);
  }
}

// Run the script
createScheduleBlocks().catch(console.error);

