// Check if baseline template exists and is configured correctly
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const SCHOOL_ID = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

async function checkBaselineTemplate() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 CHECKING BASELINE TEMPLATE CONFIGURATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Check for baseline template
  const { data: baselineTemplate, error: baselineErr } = await supabase
    .from("app_templates")
    .select("*")
    .eq("school_id", SCHOOL_ID)
    .eq("period", "baseline")
    .is("class_id", null)
    .maybeSingle();

  if (baselineErr) {
    console.error('❌ Error checking baseline template:', baselineErr);
    return;
  }

  if (!baselineTemplate) {
    console.log('❌ NO BASELINE TEMPLATE FOUND!');
    console.log('');
    console.log('💡 To create a baseline template:');
    console.log('   1. Go to Admin Templates page');
    console.log('   2. Create a new template');
    console.log('   3. Set period to "baseline"');
    console.log('   4. Leave class_id as null/empty');
    console.log('   5. Add the apps you want to allow between periods');
    console.log('');
    console.log('   The template should have:');
    console.log('     - period = "baseline"');
    console.log('     - class_id = null');
    console.log('     - school_id = your school ID');
    console.log('     - apps = array of allowed app keys');
    return;
  }

  console.log('✅ BASELINE TEMPLATE FOUND:');
  console.log('');
  console.log(`   ID: ${baselineTemplate.id}`);
  console.log(`   Name: ${baselineTemplate.name || 'No name'}`);
  console.log(`   Period: ${baselineTemplate.period}`);
  console.log(`   Class ID: ${baselineTemplate.class_id || 'null (correct)'}`);
  console.log(`   School ID: ${baselineTemplate.school_id}`);
  console.log(`   Apps: ${baselineTemplate.apps ? JSON.stringify(baselineTemplate.apps) : 'No apps'}`);
  console.log(`   Apps Count: ${baselineTemplate.apps && Array.isArray(baselineTemplate.apps) ? baselineTemplate.apps.length : 0}`);
  console.log('');

  if (!baselineTemplate.apps || !Array.isArray(baselineTemplate.apps) || baselineTemplate.apps.length === 0) {
    console.log('⚠️  WARNING: Baseline template has no apps!');
    console.log('   This means no restrictions will be applied (empty array = no apps allowed)');
    console.log('   You should add apps to the baseline template.');
  }

  // Check school's allowed_apps as fallback
  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .select("allowed_apps")
    .eq("id", SCHOOL_ID)
    .maybeSingle();

  if (!schoolErr && school) {
    console.log('📋 School Fallback (allowed_apps):');
    console.log(`   Apps: ${school.allowed_apps ? JSON.stringify(school.allowed_apps) : 'No apps'}`);
    console.log(`   Apps Count: ${school.allowed_apps && Array.isArray(school.allowed_apps) ? school.allowed_apps.length : 0}`);
    console.log('');
    console.log('💡 If baseline template is not found, system will use school.allowed_apps');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📖 HOW BASELINE TEMPLATE WORKS:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('1. When student is clocked in but NOT in any active period');
  console.log('2. System checks if within admin day range');
  console.log('3. If yes, looks for baseline template:');
  console.log('   - period = "baseline"');
  console.log('   - class_id = null');
  console.log('   - school_id = student\'s school');
  console.log('4. If found, returns baseline template apps');
  console.log('5. If not found, falls back to school.allowed_apps');
  console.log('6. If neither exists, returns empty restrictions');
  console.log('');
  console.log('✅ Your baseline template is configured correctly!');
  console.log('   It should apply when students are between periods.');
  console.log('═══════════════════════════════════════════════════════');
}

checkBaselineTemplate().catch(console.error);

