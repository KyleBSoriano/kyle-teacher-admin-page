# Admin Template Storage & Retrieval Debug Guide

## Where Admin Template is Stored

### Storage Location: `app_templates` Table

**File:** `src/pages/admin/AdminAppsPage.tsx`

**Storage Query (lines 38-45):**
```typescript
const { data, error } = await supabase
  .from('app_templates')
  .select('*')
  .eq('school_id', schoolId)
  .eq('period', 'baseline')        // ← KEY: period must be 'baseline'
  .is('class_id', null)            // ← KEY: class_id must be NULL
  .limit(1)
  .maybeSingle();
```

**Storage Fields:**
- `school_id`: Your school's UUID
- `period`: **MUST be `'baseline'`** (string, exact match)
- `class_id`: **MUST be `null`** (not a class-specific template)
- `apps`: Array of app keys (e.g., `['notion', 'calculator', 'notes']`)
- `name`: Template name (e.g., "Default" or "App Template")
- `description`: Optional description
- `created_at`: Auto-generated timestamp
- `updated_at`: Auto-generated timestamp

---

## How Admin Template is Saved

### Save Logic (lines 115-260):

**When UPDATE (template exists):**
```typescript
// Lines 154-197
await supabase
  .from('app_templates')
  .update({ 
    apps: selectedApps,              // Array of app keys
    name: name || 'App Template',
    updated_at: new Date().toISOString()
  })
  .eq('id', actualTemplateId)      // Update by ID
  .select()
  .single();
```

**When CREATE (template doesn't exist):**
```typescript
// Lines 199-244
await supabase
  .from('app_templates')
  .insert({
    name: name || 'App Template',
    apps: selectedApps,              // Array of app keys
    description: 'Default app template for campus use',
    class_id: null,                  // ← MUST be null for admin template
    period: 'baseline',              // ← MUST be 'baseline'
    school_id: schoolId
  })
  .select()
  .single();
```

---

## Where Admin Template is Read From

### Read Location: Edge Function

**File:** `supabase/functions/get-current-restrictions/index.ts`

**Read Query (lines 263-269):**
```typescript
const { data: baselineTemplate, error: baselineErr } = await supabase
  .from("app_templates")
  .select("apps, name")
  .eq("school_id", student.school_id)
  .eq("period", "baseline")         // ← Must match exactly
  .is("class_id", null)             // ← Must be null
  .maybeSingle();
```

**When It's Read:**
- Student is clocked in (`students.clocked_in = true`)
- Current time is within admin day range
- Student is NOT in an active period (between periods)
- Lines 257-291 in `get-current-restrictions/index.ts`

---

## Common Storage Issues

### Issue 1: Period Field Mismatch
**Problem:** Period stored as something other than `'baseline'`
- ❌ `period: 'Baseline'` (capital B)
- ❌ `period: 'BASELINE'` (all caps)
- ❌ `period: 'admin'` (wrong value)
- ✅ `period: 'baseline'` (lowercase, exact match)

**Check:**
```sql
SELECT id, period, class_id, apps
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL;
```

### Issue 2: class_id Not Null
**Problem:** Template has a `class_id` set (making it a class template, not admin template)
- ❌ `class_id: 'some-uuid'` (class-specific)
- ✅ `class_id: null` (admin template)

**Check:**
```sql
SELECT id, period, class_id, apps
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline';
-- Should return class_id = null
```

### Issue 3: Apps Array Format
**Problem:** Apps not stored as array or empty array
- ❌ `apps: null`
- ❌ `apps: []` (empty array = no apps allowed)
- ❌ `apps: 'notion'` (string instead of array)
- ✅ `apps: ['notion', 'calculator']` (array of strings)

**Check:**
```sql
SELECT 
  id,
  apps,
  array_length(apps::text[], 1) as app_count
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL;
```

### Issue 4: Multiple Templates
**Problem:** Multiple baseline templates exist (query returns first one)
- Should only have ONE baseline template per school
- Multiple templates can cause inconsistent behavior

**Check:**
```sql
SELECT COUNT(*) as template_count
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL;
-- Should return 1
```

### Issue 5: RLS Policy Blocking
**Problem:** RLS policies prevent reading/writing templates
- Check RLS policies on `app_templates` table
- Ensure authenticated users can read/write their school's templates

**Check:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'app_templates';
```

---

## Debug Queries

### 1. Check What's Actually Stored
```sql
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
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL;
```

### 2. Check If Edge Function Can Read It
```sql
-- Simulate the edge function query
SELECT 
  apps,
  name
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL
LIMIT 1;
```

### 3. Check All Templates (Find Duplicates)
```sql
SELECT 
  id,
  name,
  period,
  class_id,
  school_id,
  array_length(apps::text[], 1) as app_count
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
ORDER BY period, class_id;
```

### 4. Verify Apps Array Content
```sql
SELECT 
  id,
  name,
  apps,
  jsonb_array_length(apps::jsonb) as app_count,
  apps::jsonb->0 as first_app,
  apps::jsonb->1 as second_app
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL;
```

---

## How to Fix Storage Issues

### Fix 1: Correct Period Value
```sql
UPDATE app_templates
SET period = 'baseline'
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period IN ('Baseline', 'BASELINE', 'admin', 'Admin');
```

### Fix 2: Set class_id to Null
```sql
UPDATE app_templates
SET class_id = NULL
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NOT NULL;
```

### Fix 3: Fix Apps Array
```sql
-- If apps is null, set to empty array
UPDATE app_templates
SET apps = '[]'::jsonb
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL
AND apps IS NULL;

-- If apps is a string, convert to array
UPDATE app_templates
SET apps = jsonb_build_array(apps::text)
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL
AND jsonb_typeof(apps::jsonb) = 'string';
```

### Fix 4: Delete Duplicates (Keep Most Recent)
```sql
-- Delete older duplicates, keep the most recent one
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
    ORDER BY updated_at DESC
    LIMIT 1
  )
);
```

---

## Expected Database Record

**Correct Admin Template Record:**
```json
{
  "id": "uuid-here",
  "name": "Default",
  "period": "baseline",
  "class_id": null,
  "school_id": "your-school-uuid",
  "apps": ["notion", "calculator", "notes"],
  "description": "Default app template for campus use",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Key Requirements:**
- ✅ `period` = `'baseline'` (exact lowercase string)
- ✅ `class_id` = `null` (not a UUID)
- ✅ `apps` = array of strings (not null, not empty)
- ✅ `school_id` = your school's UUID

---

## Testing the Flow

### Step 1: Save Template via UI
1. Go to Admin Apps page
2. Select apps
3. Click "Save Template"
4. Check browser console for: `✅ Template updated successfully:` or `✅ Template created successfully:`

### Step 2: Verify in Database
```sql
SELECT * FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'
AND period = 'baseline'
AND class_id IS NULL;
```

### Step 3: Test Edge Function
Call the edge function and check logs:
- Should see: `✅ Baseline template found: "Default" with X apps`
- Should NOT see: `⚠️ Baseline template not found or empty`

---

## Console Logs to Watch

**When Saving (AdminAppsPage.tsx):**
- `🔄 Updating existing template:` - Updating existing
- `🆕 Creating new baseline template:` - Creating new
- `✅ Template updated successfully:` - Success
- `✅ Template created successfully:` - Success
- `❌ Error saving template:` - Error

**When Reading (get-current-restrictions/index.ts):**
- `✅ Baseline template found: "Default" with X apps` - Success
- `⚠️ Baseline template not found or empty` - Not found or empty apps

---

## Quick Debug Checklist

- [ ] Template exists in database with `period = 'baseline'`
- [ ] Template has `class_id = null`
- [ ] Template has `school_id = your school ID`
- [ ] Template has `apps` as non-empty array
- [ ] Only ONE baseline template exists per school
- [ ] RLS policies allow reading templates
- [ ] Edge function logs show template found
- [ ] Apps array contains valid app_catalog keys

