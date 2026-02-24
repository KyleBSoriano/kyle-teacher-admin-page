# Baseline Template Code Path - Between Periods

## Exact Code Location

**File:** `supabase/functions/get-current-restrictions/index.ts`

## Flow: When Student is Between Periods

### Step 1: Check if Student is in an Active Period (Lines 195-252)

```typescript
// Lines 219-247: Check each schedule block
for (const block of allScheduleBlocks) {
  if (currentTime >= startMin && currentTime < endMin) {
    // Student IS in an active period
    // → Uses class template (NOT baseline)
    templateApps = classTemplate.apps;
    break; // Found active period, stop checking
  }
}
```

**Result:** If student is in an active period, `templateApps` is set and we skip baseline.

### Step 2: Check if Between Periods (Lines 254-303)

```typescript
// Line 257: Only runs if NO active period template was found
if (templateApps.length === 0) {
  // Line 259: Check if within admin day range
  if (currentTime >= adminDayStart && currentTime <= adminDayEnd) {
    // ✅ STUDENT IS BETWEEN PERIODS
    // → Use baseline template from Admin Apps page
```

### Step 3: Query Baseline Template (Lines 263-271)

**THIS IS WHERE IT GETS THE BASELINE TEMPLATE:**

```typescript
const { data: baselineTemplate, error: baselineErr } = await supabase
  .from("app_templates")                    // ← Table: app_templates
  .select("apps, name, id, updated_at")     // ← Gets apps array, name, id, updated_at
  .eq("school_id", student.school_id)       // ← Filters by student's school
  .eq("period", "baseline")                 // ← MUST be period = 'baseline'
  .is("class_id", null)                     // ← MUST have class_id = null
  .order("updated_at", { ascending: false }) // ← Gets MOST RECENT (from Admin Apps page)
  .limit(1)                                 // ← Only get 1 result
  .maybeSingle();                           // ← Returns single result or null
```

**What This Query Does:**
1. Looks in `app_templates` table
2. Filters by:
   - `school_id` = student's school ID
   - `period` = `'baseline'` (exact string match)
   - `class_id` = `null` (not a class-specific template)
3. Orders by `updated_at DESC` (most recent first)
4. Gets the first (most recent) result

**This matches exactly what Admin Apps page saves:**
- `period: 'baseline'`
- `class_id: null`
- `school_id: your school ID`

### Step 4: Apply Baseline Template (Lines 284-287)

```typescript
if (!baselineErr && baselineTemplate && baselineTemplate.apps) {
  templateApps = baselineTemplate.apps as string[];  // ← Uses apps from template
  templateSource = "baseline";
  console.log(`✅ Baseline template found: "${baselineTemplate.name}" with ${templateApps.length} apps`);
}
```

**Result:** Student gets the apps from the baseline template.

### Step 5: Fallback if No Baseline Template (Lines 288-303)

```typescript
else {
  // If baseline template not found, fallback to school's allowed_apps
  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .select("allowed_apps")
    .eq("id", student.school_id)
    .maybeSingle();

  if (!schoolErr && school && school.allowed_apps) {
    templateApps = school.allowed_apps as string[];  // ← Fallback
    templateSource = "school_allowed";
  }
}
```

---

## Summary: What Template is Used Between Periods

**Primary:** Baseline template from `app_templates` table with:
- `period = 'baseline'`
- `class_id = null`
- `school_id = student's school ID`
- **Most recent** (ordered by `updated_at DESC`)

**Fallback:** `schools.allowed_apps` if baseline template doesn't exist

---

## Database Query Equivalent

The code is essentially running this SQL query:

```sql
SELECT apps, name, id, updated_at
FROM app_templates
WHERE school_id = 'STUDENT_SCHOOL_ID'
  AND period = 'baseline'
  AND class_id IS NULL
ORDER BY updated_at DESC
LIMIT 1;
```

**This is exactly what you edit on Admin Apps page!**

---

## How to Verify It's Working

1. **Check edge function logs** - Look for:
   - `🔍 Baseline template query:` - Shows which template was found
   - `✅ Baseline template found:` - Confirms it's being used

2. **Verify in database:**
   ```sql
   SELECT id, name, apps, updated_at
   FROM app_templates
   WHERE school_id = 'YOUR_SCHOOL_ID'
     AND period = 'baseline'
     AND class_id IS NULL
   ORDER BY updated_at DESC
   LIMIT 1;
   ```
   This should return the template you edited on Admin Apps page.

3. **Test between periods:**
   - Student clocks in
   - Wait until between periods (not in any active period time block)
   - Check mobile app restrictions
   - Should match what you set on Admin Apps page

