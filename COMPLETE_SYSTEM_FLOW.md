# Complete System Flow - How Everything Works Together

## Overview

This document explains the complete end-to-end flow of how students interact with the system, from enrollment to clock-in to restrictions.

---

## Day 1: Student Enrollment

### What Happens:
1. **Student opens iOS app** and scans a 6-digit class code OR uses "Enroll in Class" button
2. **App calls `enroll-in-class` edge function** with:
   - Student's auth token
   - 6-digit class code
3. **System creates enrollment record** in `enrollments` table linking student to class
4. **Student is now enrolled** in that class for all future days

### Result:
- Student is enrolled in their classes
- No clock-in yet - just enrollment

---

## Every Day After: Student Clock-In

### Step 1: Teacher Displays QR Code
1. **Teacher clicks "View QR"** button on dashboard
2. **QR code displays** with URL: `https://your-domain.com/confirm-attendance/{classId}?t={timestamp}`
3. **QR code refreshes every 5 seconds** (new timestamp)

### Step 2: Student Scans QR Code
1. **Student opens iOS app** and uses in-app QR scanner
2. **App detects URL** (not 6-digit code)
3. **App extracts `classId`** from URL path: `/confirm-attendance/{classId}`
4. **App automatically calls `clock-in-via-qr` edge function** with:
   - Student's auth token (from `SessionStore.shared.accessToken`)
   - `class_id` from QR code
5. **Edge function:**
   - Verifies student is authenticated
   - Verifies student is enrolled in the class
   - Creates attendance record with `status: 'in'` in `attendance_records` table
   - Sets `clocked_out_at: null`
6. **Student is now clocked in** ✅

### Result:
- Student has active attendance record
- Status: "in" (clocked in)
- Applies to the class they scanned

---

## Restrictions Flow (Automatic)

### How Restrictions Are Applied:

The iOS app periodically calls `get-current-restrictions` edge function to get allowed apps.

### Step 1: Check If Clocked In
- ✅ **If clocked in:** Continue to time checks
- ❌ **If not clocked in:** Return empty restrictions

### Step 2: Get Today's Bell Schedule
- Queries `schedule_blocks` table for today's date
- Gets ALL periods for the day
- Calculates **admin day range**: earliest start to latest end

### Step 3: Check Current Time

#### Scenario A: During Active Period (e.g., 8:00 AM - 9:00 AM, Period 1)
1. **System checks:** Is current time within Period 1's time range?
2. **If yes:**
   - Checks if student is enrolled in Period 1 class
   - Gets that class's `active_template_id`
   - Returns class template apps
3. **Result:** Student gets **class-specific restrictions** (e.g., only educational apps for that class)

#### Scenario B: Between Periods (e.g., 9:00 AM - 10:00 AM)
1. **System checks:** Is current time within admin day range but NOT in any period?
2. **If yes:**
   - Returns baseline/admin template apps
   - Or school's `allowed_apps` if no baseline template
3. **Result:** Student gets **baseline/admin restrictions** (general school restrictions)

#### Scenario C: Before First Period (e.g., 7:00 AM)
1. **System checks:** Is current time before admin day start?
2. **If yes:**
   - Returns empty restrictions
3. **Result:** No restrictions applied yet

#### Scenario D: After Last Period Ends (e.g., 3:30 PM)
1. **System checks:** Is current time past admin day end?
2. **If yes:**
   - Returns empty restrictions
   - **This is auto clock-out** - restrictions automatically lifted
3. **Result:** All restrictions removed, student effectively clocked out

---

## Complete Timeline Example

**Bell Schedule:**
- Period 1: 8:00 AM - 9:00 AM
- Period 2: 10:00 AM - 11:00 AM
- Period 3: 1:00 PM - 2:00 PM

**Admin Day:** 8:00 AM - 2:00 PM (first period start to last period end)

### Timeline:

| Time | Status | Restrictions Applied |
|------|--------|---------------------|
| 7:30 AM | Clocked in | ❌ None (before admin day) |
| 8:00 AM | Clocked in | ✅ Period 1 class template |
| 9:00 AM | Clocked in | ✅ Baseline/admin (between periods) |
| 10:00 AM | Clocked in | ✅ Period 2 class template |
| 11:00 AM | Clocked in | ✅ Baseline/admin (between periods) |
| 1:00 PM | Clocked in | ✅ Period 3 class template |
| 2:00 PM | Clocked in | ❌ None (auto clock-out after admin day) |
| 3:00 PM | Clocked in | ❌ None (past admin day) |

---

## Key Points

### 1. Universal QR Code
- **One QR code** works for all students
- Student doesn't need to scan a specific class QR
- System uses the class they're enrolled in based on current time

### 2. Automatic Restrictions
- **No manual action needed** - restrictions apply automatically based on:
  - Current time
  - Bell schedule (from Admin Schedule Page)
  - Student's enrollments

### 3. Auto Clock-Out
- **No manual clock-out needed**
- Restrictions automatically lift after last period ends
- Happens when `get-current-restrictions` returns empty `keys`

### 4. Real-Time Updates
- iOS app calls `get-current-restrictions` periodically
- Restrictions update automatically as periods change
- No app restart needed

---

## What Teachers See

### On Dashboard (Students Page):
1. **"View QR" button** → Opens fullscreen QR code
2. **"CLocked In" section** → Shows students who are currently clocked in
3. **Real-time updates** → List updates every 5 seconds as students clock in
4. **Period selection** → Can view clocked-in students by period

### What Happens:
- When student scans QR → They appear in "CLocked In" section within 5 seconds
- List shows students who have `status: 'in'` in `attendance_records` table
- Filtered by period and today's date

---

## What Students Experience

### iOS App:
1. **Day 1:** Enroll in classes using 6-digit codes
2. **Every day:** Scan universal QR code to clock in
3. **Automatic:** Restrictions apply/change based on:
   - Current time
   - Active period
   - Bell schedule
4. **End of day:** Restrictions automatically lift (no action needed)

### Restrictions:
- **During class period:** Only apps from class template allowed
- **Between periods:** Baseline/admin apps allowed
- **After school:** All restrictions lifted

---

## Database Tables Involved

1. **`enrollments`** - Links students to classes (created on Day 1)
2. **`attendance_records`** - Clock-in records (created when scanning QR)
3. **`schedule_blocks`** - Bell schedule times (from Admin Schedule Page)
4. **`classes`** - Class information and `active_template_id`
5. **`app_templates`** - Templates with allowed apps
6. **`students`** - Student information and `school_id`

---

## Edge Functions Used

1. **`enroll-in-class`** - Enrolls student in class (Day 1)
2. **`clock-in-via-qr`** - Clocks student in when scanning QR
3. **`get-current-restrictions`** - Returns allowed apps based on time/period

---

## Summary

**The Complete Flow:**
1. ✅ Student enrolls in classes (Day 1)
2. ✅ Student scans universal QR code (every day)
3. ✅ System automatically applies restrictions based on:
   - Current time
   - Bell schedule (admin day)
   - Active periods
   - Student enrollments
4. ✅ Restrictions automatically lift after last period ends

**No manual intervention needed** - everything is automatic! 🎉

