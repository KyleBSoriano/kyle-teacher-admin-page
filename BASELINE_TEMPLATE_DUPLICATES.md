# Baseline Template Duplicates - Where They Come From

## Where Baseline Templates Are Created

### 1. AdminAppsPage.tsx - `loadDefaultTemplate()` (Lines 34-87)
**File:** `src/pages/admin/AdminAppsPage.tsx`

**When it creates:**
- On page load if no baseline template exists
- Called in `useEffect` when `schoolId` changes (line 28-32)

**Code:**
```typescript
// Lines 55-69
if (data) {
  // Template exists, load it
} else {
  // ❌ CREATES NEW TEMPLATE if none exists
  const { data: newTemplate, error: insertError } = await supabase
    .from('app_templates')
    .insert({
      name: 'App Template',
      apps: initialApps,
      description: 'Default app template for campus use',
      class_id: null,
      period: 'baseline',  // ← Creates baseline template
      school_id: schoolId
    })
}
```

**Problem:** This creates a template if `maybeSingle()` returns null, but if there are multiple templates, `maybeSingle()` might return the first one, and this code won't run. However, if the query fails or returns null for any reason, it creates a duplicate.

### 2. AdminAppsPage.tsx - `handleAppPickerComplete()` (Lines 199-244)
**File:** `src/pages/admin/AdminAppsPage.tsx`

**When it creates:**
- When user saves template but `templateId` is not set
- If `actualTemplateId` is null/undefined (line 152)

**Code:**
```typescript
// Lines 152-198
const actualTemplateId = templateId || existingTemplate?.id;

if (actualTemplateId) {
  // UPDATE existing template
} else {
  // ❌ CREATES NEW TEMPLATE if templateId is not set
  const { data: newTemplate, error: insertError } = await supabase
    .from('app_templates')
    .insert({
      name: name || 'App Template',
      apps: selectedApps,
      description: 'Default app template for campus use',
      class_id: null,
      period: 'baseline',  // ← Creates baseline template
      school_id: schoolId
    })
}
```

**Problem:** If `templateId` state is not properly set (e.g., after page refresh), this will create a new template instead of updating the existing one.

### 3. Database Migrations
**Files:** `supabase/migrations/`

**Migration:** `20251023061428_8fdd4856-111f-4283-bfd9-81d3f8e84989.sql` (Lines 18-29)
```sql
-- Creates a default baseline template if none exists
INSERT INTO public.app_templates (name, description, apps, is_custom, period, class_id)
SELECT 
  'Default App Template',
  'Campus-wide default apps for all classes',
  '["calculator", "notes", "google-calendar", "google-docs", "desmos"]'::jsonb,
  false,
  'baseline',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_templates WHERE period = 'baseline' AND is_custom = false
);
```

**Problem:** This migration creates one, but if run multiple times or if the `NOT EXISTS` check fails, it could create duplicates.

---

## Where Baseline Templates Are Read From

### 1. Edge Function - `get-current-restrictions/index.ts` (Lines 263-269)
**File:** `supabase/functions/get-current-restrictions/index.ts`

**Query:**
```typescript
const { data: baselineTemplate, error: baselineErr } = await supabase
  .from("app_templates")
  .select("apps, name")
  .eq("school_id", student.school_id)
  .eq("period", "baseline")
  .is("class_id", null)
  .maybeSingle();  // ← Returns FIRST match if multiple exist
```

**Problem:** If multiple baseline templates exist, `maybeSingle()` returns the first one (unpredictable which one).

### 2. AdminAppsPage.tsx - `loadDefaultTemplate()` (Lines 38-45)
**File:** `src/pages/admin/AdminAppsPage.tsx`

**Query:**
```typescript
const { data, error } = await supabase
  .from('app_templates')
  .select('*')
  .eq('school_id', schoolId)
  .eq('period', 'baseline')
  .is('class_id', null)
  .limit(1)  // ← Limits to 1, but doesn't prevent duplicates
  .maybeSingle();
```

**Problem:** `limit(1)` only limits the query result, not the database. Multiple templates can still exist.

---

## Why Duplicates Are Created

### Root Causes:

1. **State Management Issue:**
   - `templateId` state is not persisted across page refreshes
   - When user saves template, if `templateId` is null, it creates a new one instead of updating

2. **Race Condition:**
   - `loadDefaultTemplate()` and `handleAppPickerComplete()` both check for existing templates
   - If both run simultaneously, both might not find an existing template and both create one

3. **Migration Issues:**
   - Old migrations might have created templates without proper checks
   - Multiple migrations might have run creating duplicates

4. **No Unique Constraint:**
   - Database doesn't have a unique constraint on `(school_id, period, class_id)`
   - Multiple baseline templates can exist for the same school

---

## How to Clean Up Duplicates

### Step 1: Find All Duplicates
```sql
-- Find all baseline templates for your school
SELECT 
  id,
  name,
  period,
  class_id,
  school_id,
  apps,
  array_length(apps::text[], 1) as app_count,
  created_at,
  updated_at
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- Replace with your school ID
AND period = 'baseline'
AND class_id IS NULL
ORDER BY updated_at DESC;
```

### Step 2: Keep the Most Recent One, Delete Others
```sql
-- Delete all except the most recently updated one
DELETE FROM app_templates
WHERE id IN (
  SELECT id
  FROM app_templates
  WHERE school_id = 'YOUR_SCHOOL_ID'
  AND period = 'baseline'
  AND class_id IS NULL
  AND id NOT IN (
    SELECT id
    FROM app_templates
    WHERE school_id = 'YOUR_SCHOOL_ID'
    AND period = 'baseline'
    AND class_id IS NULL
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 1
  )
);
```

### Step 3: Verify Only One Exists
```sql
-- Should return 1
SELECT COUNT(*) as template_count
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL;
```

---

## How to Prevent Future Duplicates

### Option 1: Add Unique Constraint (Recommended)
```sql
-- Add unique constraint to prevent duplicates
ALTER TABLE app_templates
ADD CONSTRAINT unique_baseline_template_per_school 
UNIQUE (school_id, period, class_id)
WHERE period = 'baseline' AND class_id IS NULL;
```

**Note:** This requires PostgreSQL 9.5+ for partial unique constraints. If not supported, use a trigger instead.

### Option 2: Fix the Code Logic

**File:** `src/pages/admin/AdminAppsPage.tsx`

**Fix `handleAppPickerComplete()` to always find existing template first:**
```typescript
// Always find existing template first, don't rely on state
const { data: existingTemplate, error: findError } = await supabase
  .from('app_templates')
  .select('id')
  .eq('school_id', schoolId)
  .eq('period', 'baseline')
  .is('class_id', null)
  .order('updated_at', { ascending: false })  // Get most recent
  .limit(1)
  .maybeSingle();

if (existingTemplate?.id) {
  // Always UPDATE, never CREATE
  await supabase
    .from('app_templates')
    .update({ ... })
    .eq('id', existingTemplate.id);
} else {
  // Only CREATE if truly doesn't exist
  await supabase
    .from('app_templates')
    .insert({ ... });
}
```

**Fix `loadDefaultTemplate()` to not create if multiple exist:**
```typescript
// Get all baseline templates
const { data: templates, error } = await supabase
  .from('app_templates')
  .select('*')
  .eq('school_id', schoolId)
  .eq('period', 'baseline')
  .is('class_id', null)
  .order('updated_at', { ascending: false });

if (templates && templates.length > 0) {
  // Use the most recent one
  const template = templates[0];
  setDefaultTemplateApps(template.apps || []);
  setTemplateId(template.id);
  setTemplateName(template.name || 'App Template');
  
  // If multiple exist, log warning
  if (templates.length > 1) {
    console.warn(`⚠️ Multiple baseline templates found (${templates.length}). Using most recent.`);
  }
} else {
  // Only create if none exist
  // ... create logic
}
```

---

## Quick Cleanup Script

```sql
-- ============================================
-- Clean Up Duplicate Baseline Templates
-- ============================================
-- Replace 'YOUR_SCHOOL_ID' with your actual school ID

-- Step 1: See what will be deleted
SELECT 
  id,
  name,
  apps,
  updated_at,
  'WILL BE DELETED' as action
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL
AND id NOT IN (
  SELECT id
  FROM app_templates
  WHERE school_id = 'YOUR_SCHOOL_ID'
  AND period = 'baseline'
  AND class_id IS NULL
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1
);

-- Step 2: Delete duplicates (keep most recent)
DELETE FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL
AND id NOT IN (
  SELECT id
  FROM app_templates
  WHERE school_id = 'YOUR_SCHOOL_ID'
  AND period = 'baseline'
  AND class_id IS NULL
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1
);

-- Step 3: Verify cleanup
SELECT 
  COUNT(*) as remaining_count,
  id,
  name,
  updated_at
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL
GROUP BY id, name, updated_at;
```

---

## Summary

**Where Created:**
1. `AdminAppsPage.tsx` - `loadDefaultTemplate()` (auto-creates on page load)
2. `AdminAppsPage.tsx` - `handleAppPickerComplete()` (creates if templateId not set)
3. Database migrations (historical)

**Where Read:**
1. `get-current-restrictions/index.ts` - Edge function (uses `maybeSingle()` - gets first match)
2. `AdminAppsPage.tsx` - `loadDefaultTemplate()` (uses `limit(1).maybeSingle()`)

**Fix:**
1. Clean up duplicates (keep most recent)
2. Add unique constraint or fix code logic
3. Always query for existing template before creating

