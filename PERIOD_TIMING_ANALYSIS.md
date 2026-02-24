# Period Timing & Bell Schedule Analysis

## Current State

### How Periods Are Associated With Times

**There are TWO ways periods can have times:**

1. **Schedule Blocks (Bell Schedule)** - `schedule_blocks` table
   - Created in Admin Schedule Page
   - Stores: `period`, `start_time`, `end_time`, `schedule_date` (specific date)
   - This is the **primary** source for bell schedule times

2. **Class-Level Times** - `classes` table
   - `start_time` and `end_time` fields (optional)
   - Used as **fallback** if schedule blocks don't exist

### How It Currently Works

#### In `get-current-restrictions` Edge Function:

```typescript
// Step 1: Check if demo class (no time restrictions)
if (period === "demo" || !start_time || !end_time) {
  // Always active
}

// Step 2: Try to use schedule_blocks (BELL SCHEDULE)
const scheduleBlocks = await supabase
  .from("schedule_blocks")
  .select("period, start_time, end_time, day_of_week")  // ❌ PROBLEM: day_of_week doesn't exist!
  .eq("school_id", student.school_id)
  .eq("day_of_week", dayOfWeek)  // ❌ PROBLEM: Querying non-existent column
  .eq("period", classData.period);

// Step 3: Fallback to class start_time/end_time
if (!scheduleBlocks) {
  // Use class.start_time and class.end_time
}
```

## ❌ PROBLEMS IDENTIFIED

### Problem 1: `day_of_week` Column Doesn't Exist

**Current Schema:**
```sql
CREATE TABLE schedule_blocks (
  id UUID,
  period TEXT,
  start_time TEXT,
  end_time TEXT,
  schedule_date DATE,  -- ✅ Has this
  school_id TEXT,       -- ✅ Has this
  -- ❌ NO day_of_week column!
);
```

**What the function is trying to do:**
- Query by `day_of_week` (1-7, Monday-Sunday)
- But the table only has `schedule_date` (specific date like '2024-01-15')

**Result:** The query likely returns empty, so it falls back to class-level times

### Problem 2: Query Should Use `schedule_date` Not `day_of_week`

The function should:
1. Get today's date
2. Query `schedule_blocks` where `schedule_date = today`
3. Match by `period` and `school_id`

## ✅ HOW IT SHOULD WORK

### For Each Period/Class:

1. **Check Admin Bell Schedule First** (`schedule_blocks` table):
   - Query: `schedule_date = today` AND `period = 'Period 1'` AND `school_id = X`
   - Use `start_time` and `end_time` from the schedule block
   - This is the **primary** source - what you set in Admin Schedule Page

2. **Fallback to Class Times** (`classes` table):
   - If no schedule block found for today
   - Use `class.start_time` and `class.end_time`
   - This is the **fallback** - set when creating/editing a class

3. **Demo Classes** (always active):
   - If `period = "demo"` OR no `start_time`/`end_time` set
   - Always considered "in class time"

## 🔧 WHAT NEEDS TO BE FIXED

### Fix 1: Update `get-current-restrictions` Edge Function

**Current (BROKEN):**
```typescript
.eq("day_of_week", dayOfWeek === 0 ? 7 : dayOfWeek)
```

**Should be:**
```typescript
// Get today's date in YYYY-MM-DD format
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// Query by schedule_date (today's date)
.eq("schedule_date", todayStr)
```

### Fix 2: Ensure `school_id` is Set in Schedule Blocks

Make sure when creating schedule blocks in Admin Schedule Page, the `school_id` is being set correctly.

## 📋 CURRENT FLOW

### When Student Clocks In:

1. Student scans QR code
2. `clock-in-via-qr` creates attendance record
3. Student calls `get-current-restrictions` to get allowed apps
4. Function checks:
   - ✅ Is student clocked in? (checks `attendance_records`)
   - ❌ Is it class time? (tries to check `schedule_blocks` but query is broken)
   - Falls back to class `start_time`/`end_time` or treats as always active

### What Happens Now:

- **If schedule block exists for today:** Should use it, but query is broken
- **If no schedule block:** Falls back to class `start_time`/`end_time`
- **If no class times:** Treated as demo class (always active)

## 🎯 RECOMMENDED SOLUTION

### Option 1: Fix the Query (Use `schedule_date`)

Update `get-current-restrictions/index.ts`:

```typescript
// Get today's date
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split('T')[0]; // "2024-01-15"

// Query schedule_blocks for today's date
const { data: scheduleBlocks, error: scheduleErr } = await supabase
  .from("schedule_blocks")
  .select("period, start_time, end_time, schedule_date")
  .eq("school_id", student.school_id)
  .eq("schedule_date", todayStr)  // ✅ Use schedule_date, not day_of_week
  .eq("period", classData.period);
```

### Option 2: Add `day_of_week` Column (Alternative)

If you want weekly recurring schedules instead of date-specific:

1. Add `day_of_week` column to `schedule_blocks`
2. Update Admin Schedule Page to set `day_of_week` when creating blocks
3. Keep current query logic

**Recommendation:** Use Option 1 (fix query) because:
- Schedule blocks are already date-specific
- More flexible (can have different schedules for different days)
- Matches current Admin Schedule Page implementation

## 📊 SUMMARY

| Component | Current State | Should Be |
|-----------|--------------|-----------|
| **Schedule Blocks Table** | Has `schedule_date` | ✅ Correct |
| **get-current-restrictions Query** | Queries `day_of_week` (doesn't exist) | ❌ Should query `schedule_date` |
| **Fallback Logic** | Uses class `start_time`/`end_time` | ✅ Correct |
| **Admin Schedule Page** | Creates blocks with `schedule_date` | ✅ Correct |

## ✅ NEXT STEPS

1. **Fix the edge function** to query by `schedule_date` instead of `day_of_week`
2. **Test** that periods read from bell schedule correctly
3. **Verify** that each period checks today's schedule block for its time range
4. **Confirm** restrictions apply only during class time from bell schedule

