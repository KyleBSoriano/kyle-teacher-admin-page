// Check all templates to see what exists
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const SCHOOL_ID = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

async function checkAllTemplates() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 CHECKING ALL TEMPLATES');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Get ALL templates for this school
  const { data: allTemplates, error } = await supabase
    .from("app_templates")
    .select("*")
    .eq("school_id", SCHOOL_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!allTemplates || allTemplates.length === 0) {
    console.log('❌ No templates found for this school!');
    return;
  }

  console.log(`✅ Found ${allTemplates.length} template(s):\n`);

  let baselineFound = false;

  allTemplates.forEach((template, index) => {
    const isBaseline = template.period === 'baseline' && !template.class_id;
    if (isBaseline) baselineFound = true;

    console.log(`${index + 1}. ${template.name || 'Unnamed Template'}`);
    console.log(`   ID: ${template.id}`);
    console.log(`   Period: ${template.period || 'null'} ${isBaseline ? '✅ (BASELINE)' : ''}`);
    console.log(`   Class ID: ${template.class_id || 'null'} ${isBaseline ? '✅ (correct)' : template.class_id ? '❌ (should be null for baseline)' : ''}`);
    console.log(`   School ID: ${template.school_id}`);
    console.log(`   Apps: ${JSON.stringify(template.apps)}`);
    console.log(`   Apps Count: ${template.apps && Array.isArray(template.apps) ? template.apps.length : 0}`);
    
    if (template.apps && Array.isArray(template.apps)) {
      const hasNotion = template.apps.includes('notion') || template.apps.some(app => app.toLowerCase().includes('notion'));
      if (hasNotion) {
        console.log(`   ✅ Contains Notion`);
      }
    }
    
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 BASELINE TEMPLATE STATUS');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (!baselineFound) {
    console.log('❌ NO BASELINE TEMPLATE FOUND!');
    console.log('');
    console.log('💡 To fix this, you need a template with:');
    console.log('   - period = "baseline"');
    console.log('   - class_id = null');
    console.log('   - school_id = your school ID');
    console.log('');
    console.log('🔧 If you see a template with Notion above, you need to:');
    console.log('   1. Update it to set period = "baseline"');
    console.log('   2. Make sure class_id = null');
    console.log('   3. Or create a new baseline template');
  } else {
    console.log('✅ BASELINE TEMPLATE EXISTS!');
    console.log('   It should be used between periods.');
    console.log('');
    console.log('💡 If it\'s not working, check:');
    console.log('   1. Make sure you\'re clocked in');
    console.log('   2. Make sure current time is between periods');
    console.log('   3. Make sure current time is within admin day (8 AM - 3 PM PST)');
  }

  console.log('═══════════════════════════════════════════════════════');
}

checkAllTemplates().catch(console.error);

