# Complete System Flow - What's Working & What's Not

## 🎯 Overview

This document explains the **entire end-to-end flow** of your Clocked system, from student enrollment to app restrictions, and what's currently working vs. what needs attention.

---

## ✅ WHAT'S WORKING

### 1. **Student Enrollment (Day 1)**
**Status: ✅ WORKING**

**Flow:**
1. Student opens iOS app
2. Scans 6-digit class code OR uses "Enroll in Class" button
3. iOS app calls `enroll-in-class` edge function
4. System creates record in `enrollments` table linking student to class
5. Student is now enrolled for all future days

**Database:**
- Table: `enrollments`
- Fields: `student_id`, `class_id`
- One-time action per class

---

### 2. **Admin Bell Schedule Creation**
**Status: ✅ WORKING**

**Flow:**
1. Admin goes to Admin Schedule Page (`/admin/schedule`)
2. Selects day(s) of the week
3. Creates schedule blocks with:
   - Period name (e.g., "Period 1", "Period 2")
   - Start time (e.g., "1:35 AM")
   - End time (e.g., "1:37 AM")
   - Date (specific date like 2025-12-07)
4. Blocks saved to `schedule_blocks` table

**Database:**
- Table: `schedule_blocks`
- Fields: `period`, `start_time`, `end_time`, `schedule_date`, `school_id`
- Times stored as text: "1:35 AM", "1:37 AM" (interpreted as PST)

**What You Can Do:**
- Create blocks via Admin Schedule Page UI
- Create blocks via SQL script (`create-schedule-blocks.sql`)
- View blocks in the calendar view

---

### 3. **Student Clock-In (Every Day)**
**Status: ⚠️ PARTIALLY WORKING** (timezone issue)

**Flow:**
1. Teacher clicks "View QR" button on admin dashboard
2. QR code displays with URL: `https://your-domain.com/confirm-attendance/{classId}?t={timestamp}`
3. Student scans QR code with iOS app
4. iOS app extracts `classId` from URL
5. iOS app calls `clock-in-via-qr` edge function
6. Edge function:
   - Verifies student is authenticated
   - Verifies student is enrolled in class
   - **Checks if within admin day range (PST)** ⚠️ Currently uses UTC
   - Updates `students.clocked_in = true`
   - Creates attendance record in `attendance_records` table

**Database:**
- Table: `students` → `clocked_in` field set to `true`
- Table: `attendance_records` → New record with `status: 'in'`

**⚠️ ISSUE:** The `clock-in-via-qr` function is still using UTC time for validation. It should use PST to match the schedule blocks.

---

### 4. **App Restrictions (Automatic)**
**Status: ✅ WORKING** (now uses PST)

**Flow:**
1. iOS app periodically calls `get-current-restrictions` edge function
2. Function checks:
   - ✅ Is student clocked in? (`students.clocked_in = true`)
   - ✅ Gets today's schedule blocks (PST date)
   - ✅ Converts current time to PST
   - ✅ Compares PST time with schedule block times

**Time-Based Logic (All in PST):**

#### Scenario A: During Active Period
- **Example:** Current time is 1:36 AM PST, Period 1 is 1:35 AM - 1:37 AM PST
- **Action:** 
  - Finds student's Period 1 class
  - Gets class's `active_template_id`
  - Returns apps from that class template
- **Result:** Student gets class-specific app restrictions

#### Scenario B: Between Periods (Within Admin Day)
- **Example:** Current time is 1:38 AM PST (between Period 1 and Period 2)
- **Action:**
  - Checks if within admin day range (1:35 AM - 1:41 AM)
  - Returns baseline/admin template apps
  - Or school's `allowed_apps` if no baseline template
- **Result:** Student gets baseline restrictions

#### Scenario C: Before Admin Day Starts
- **Example:** Current time is 1:30 AM PST (before 1:35 AM)
- **Action:** Returns empty restrictions
- **Result:** No restrictions applied yet

#### Scenario D: After Admin Day Ends (Auto Clock-Out)
- **Example:** Current time is 1:42 AM PST (after 1:41 AM)
- **Action:** Returns empty restrictions
- **Result:** Restrictions automatically lifted (auto clock-out)

**Database Tables Used:**
- `schedule_blocks` - Bell schedule times
- `enrollments` - Which classes student is in
- `classes` - Class info and `active_template_id`
- `app_templates` - Templates with allowed apps
- `app_catalog` - App details (bundle IDs, etc.)

---

## ⚠️ WHAT NEEDS FIXING

### 1. **Clock-In Timezone Mismatch**
**Issue:** `clock-in-via-qr` function uses UTC time for validation, but schedule blocks are in PST.

**Current Code:**
```typescript
const currentTime = now.getUTCHours() * 60 + now.getUTCMinutes(); // UTC
```

**Should Be:**
```typescript
// Convert to PST (same logic as get-current-restrictions)
const pstTime = convertToPST(now);
const currentTime = pstTime.getHours() * 60 + pstTime.getMinutes(); // PST
```

**Impact:** Students might not be able to clock in at the correct times if there's a timezone mismatch.

---

## 📊 COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    DAY 1: ENROLLMENT                        │
└─────────────────────────────────────────────────────────────┘
Student iOS App
    ↓
Scans 6-digit class code
    ↓
enroll-in-class Edge Function
    ↓
enrollments table (student_id + class_id)
    ✅ ENROLLED

┌─────────────────────────────────────────────────────────────┐
│              EVERY DAY: CLOCK-IN & RESTRICTIONS            │
└─────────────────────────────────────────────────────────────┘

Step 1: Admin Creates Bell Schedule
Admin Schedule Page
    ↓
Creates schedule_blocks:
  - Period 1: 1:35 AM - 1:37 AM PST
  - Period 2: 1:39 AM - 1:41 AM PST
    ↓
schedule_blocks table
    ✅ SCHEDULE READY

Step 2: Student Clocks In
Teacher displays QR code
    ↓
Student scans QR code
    ↓
clock-in-via-qr Edge Function
    ↓
Checks: Within admin day? (PST) ⚠️ Currently UTC
    ↓
Updates students.clocked_in = true
Creates attendance_records entry
    ✅ CLOCKED IN

Step 3: Restrictions Apply (Automatic)
iOS app calls get-current-restrictions (every few seconds)
    ↓
Function checks:
  1. Is clocked_in = true? ✅
  2. Get today's schedule blocks (PST date) ✅
  3. Convert current time to PST ✅
  4. Compare PST time with block times ✅
    ↓
Returns allowed apps based on:
  - Active period → Class template apps
  - Between periods → Baseline apps
  - After admin day → Empty (auto clock-out)
    ✅ RESTRICTIONS APPLIED

Step 4: Auto Clock-Out
After last period ends (1:41 AM PST)
    ↓
get-current-restrictions returns empty
    ↓
iOS app removes all restrictions
    ✅ AUTO CLOCKED OUT
```

---

## 🗄️ DATABASE TABLES & THEIR PURPOSE

### 1. **`enrollments`**
- **Purpose:** Links students to classes (one-time enrollment)
- **Fields:** `student_id`, `class_id`
- **When Created:** Day 1 when student enrolls

### 2. **`schedule_blocks`**
- **Purpose:** Bell schedule times for specific dates
- **Fields:** `period`, `start_time`, `end_time`, `schedule_date`, `school_id`
- **When Created:** Admin creates via Admin Schedule Page or SQL script
- **Timezone:** Times stored as text, interpreted as PST

### 3. **`students`**
- **Purpose:** Student information and clock-in status
- **Fields:** `id`, `name`, `email`, `clocked_in`, `school_id`
- **When Updated:** When student clocks in (`clocked_in = true`)

### 4. **`attendance_records`**
- **Purpose:** Historical attendance records
- **Fields:** `student_id`, `class_id`, `status`, `timestamp`, `period`, `clocked_out_at`
- **When Created:** When student clocks in

### 5. **`classes`**
- **Purpose:** Class information and templates
- **Fields:** `id`, `period`, `subject`, `active_template_id`, `school_id`
- **Links To:** `app_templates` via `active_template_id`

### 6. **`app_templates`**
- **Purpose:** Templates with allowed apps
- **Fields:** `id`, `name`, `apps` (array), `school_id`, `period`, `class_id`
- **Types:** 
  - Class templates (`class_id` set)
  - Baseline templates (`period = 'baseline'`, `class_id = null`)

### 7. **`app_catalog`**
- **Purpose:** App details for iOS
- **Fields:** `key`, `display_name`, `ios_bundle_id`, `aliases`
- **Used By:** iOS app to block/allow apps

---

## 🔄 REAL-TIME FLOW

### Every Few Seconds (iOS App):
```
iOS App
    ↓
Calls get-current-restrictions
    ↓
Checks clocked_in status
    ↓
Gets current PST time
    ↓
Compares with schedule blocks (PST)
    ↓
Returns allowed apps
    ↓
iOS app applies restrictions
```

### When Student Scans QR:
```
QR Code Scan
    ↓
clock-in-via-qr function
    ↓
Validates time (should be PST, currently UTC) ⚠️
    ↓
Sets students.clocked_in = true
    ↓
Creates attendance_records entry
    ↓
Next get-current-restrictions call applies restrictions
```

---

## 🎯 KEY POINTS

### ✅ What's Working:
1. **Student enrollment** - One-time enrollment works
2. **Schedule block creation** - Admin can create blocks via UI or SQL
3. **Restrictions logic** - Uses PST timezone correctly
4. **Auto clock-out** - Works after admin day ends
5. **Period-based restrictions** - Class templates apply during periods
6. **Baseline restrictions** - Apply between periods

### ⚠️ What Needs Fixing:
1. **Clock-in timezone** - `clock-in-via-qr` uses UTC, should use PST
2. **Date calculation** - Should ensure consistent PST date across all functions

### 📝 Notes:
- **All times are now in PST** (after our recent updates)
- **Schedule blocks** are date-specific (one per day)
- **Restrictions update automatically** as periods change
- **No manual clock-out needed** - happens automatically after admin day

---

## 🧪 TESTING THE FLOW

### To Test Everything:

1. **Create Schedule Blocks:**
   ```sql
   -- Run create-schedule-blocks.sql in Supabase SQL Editor
   ```

2. **Student Clocks In:**
   - Teacher displays QR code
   - Student scans with iOS app
   - Should see `students.clocked_in = true`

3. **Check Restrictions:**
   - During Period 1 (1:35-1:37 AM PST): Should get Period 1 class template apps
   - Between periods (1:38 AM PST): Should get baseline apps
   - After Period 2 (after 1:41 AM PST): Should get empty restrictions (auto clock-out)

4. **Verify in Admin Dashboard:**
   - Student should appear in "CLocked In" section
   - Active period indicator should show current period

---

## 🔧 FIXES NEEDED

### Fix 1: Update clock-in-via-qr to use PST
The function needs to use the same PST conversion logic as `get-current-restrictions`.

Would you like me to fix the timezone issue in the clock-in function?

