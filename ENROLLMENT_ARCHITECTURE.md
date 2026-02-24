# Student Enrollment Architecture & Testing Guide

## Current Architecture Status

### ✅ What EXISTS and WORKS

#### 1. **Database Structure**
- **`enrollments` table** in Supabase:
  - `id` (UUID, primary key)
  - `class_id` (UUID, foreign key to `classes.id`)
  - `student_id` (UUID, foreign key to `students.id`)
  - `created_at` (timestamp)
  - This table tracks which students are enrolled in which classes

#### 2. **Edge Function for Mobile Enrollment**
- **`enroll-in-class`** Edge Function exists and works
- Mobile app can call this to enroll students using class codes
- Validates:
  - Student is authenticated
  - Class code exists
  - Class is in same school as student
  - Prevents duplicate enrollments

#### 3. **Backend Functions (AppContext)**
- **`addStudentToClass(classId, studentId)`** - Manually enroll a student
- **`removeStudentFromClass(classId, studentId)`** - Remove enrollment
- Both functions:
  - Check for existing enrollments
  - Insert/delete from `enrollments` table
  - Reload data after changes

#### 4. **Restrictions Logic**
- **`get-current-restrictions`** Edge Function checks enrollments:
  - Line 84-87: Queries `enrollments` table for student
  - Line 100: Only applies class template if student is enrolled AND has attendance record with `class_id`
  - This means: **Student must be enrolled + clocked in to get class restrictions**

### ❌ What DOESN'T EXIST (Yet)

#### 1. **UI for Manual Enrollment**
- No button/dialog on website to manually enroll students in classes
- Teachers/Admins can't use the UI to add students to classes
- **Workaround**: Use SQL directly (see below)

#### 2. **Bulk Enrollment**
- No way to enroll multiple students at once via UI

## How Enrollments Are Tracked

### Database Query
```sql
-- See all enrollments
SELECT 
  e.id,
  s.name as student_name,
  s.email as student_email,
  c.subject as class_subject,
  c.period as class_period,
  c.code as class_code
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN classes c ON c.id = e.class_id
ORDER BY c.period, s.name;
```

### In Code
- **AppContext** loads enrollments when loading classes:
  - Line 66-70: Fetches all enrollments for the school
  - Line 81-82: Maps enrollments to classes to populate `class.students` array

## How to Manually Enroll a Student

### Option 1: SQL (Recommended for Testing)

```sql
-- Step 1: Get student ID
SELECT id, name, email FROM students WHERE name = 'Kyle Soriano';

-- Step 2: Get class ID
SELECT id, subject, period, code FROM classes WHERE code = 'YOUR_CLASS_CODE';

-- Step 3: Create enrollment
INSERT INTO enrollments (class_id, student_id)
VALUES (
  'CLASS_ID_FROM_STEP_2',  -- Replace with actual class UUID
  'STUDENT_ID_FROM_STEP_1'  -- Replace with actual student UUID
);

-- Verify enrollment
SELECT * FROM enrollments 
WHERE class_id = 'CLASS_ID_FROM_STEP_2' 
AND student_id = 'STUDENT_ID_FROM_STEP_1';
```

### Option 2: Use AppContext Function (Programmatic)

If you have access to the browser console on the website:

```javascript
// In browser console on your website
// Get the AppContext (this is internal, but you can use it if exposed)
// Or use the Supabase client directly:

const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');

// Enroll student
const { data, error } = await supabase
  .from('enrollments')
  .insert({
    class_id: 'CLASS_ID',
    student_id: 'STUDENT_ID'
  });
```

## Testing Restrictions with Manual Enrollment

### Complete Test Flow

#### 1. **Setup**
```sql
-- Create/verify student exists
SELECT id, name, email, school_id FROM students WHERE name = 'Kyle Soriano';

-- Create/verify class exists (demo class with no start_time/end_time)
SELECT id, subject, period, code, start_time, end_time, active_template_id 
FROM classes 
WHERE code = 'YOUR_CLASS_CODE';

-- Verify template exists and is active
SELECT id, name, apps, period, class_id 
FROM app_templates 
WHERE class_id = 'YOUR_CLASS_ID';
```

#### 2. **Enroll Student**
```sql
INSERT INTO enrollments (class_id, student_id)
VALUES ('CLASS_ID', 'STUDENT_ID')
ON CONFLICT DO NOTHING;  -- Prevents duplicate if already enrolled
```

#### 3. **Clock In Student**
```sql
-- Create attendance record (clock in)
INSERT INTO attendance_records (student_id, class_id, status, timestamp)
VALUES (
  'STUDENT_ID',
  'CLASS_ID',
  'in',  -- or 'present'
  NOW()
);
```

#### 4. **Activate Template**
```sql
-- Set active template for class
UPDATE classes 
SET active_template_id = 'TEMPLATE_ID'
WHERE id = 'CLASS_ID';
```

#### 5. **Test Restrictions**
- Mobile app calls `get-current-restrictions` Edge Function
- Function checks:
  1. ✅ Student is clocked in (has attendance record)
  2. ✅ Student is enrolled (has enrollment record)
  3. ✅ Class has active_template_id
  4. ✅ If demo class (no start_time/end_time), always applies template
  5. ✅ Returns template apps as restrictions

## What Works vs. What Doesn't

### ✅ WORKS

1. **Manual Enrollment via SQL**
   - You can manually insert into `enrollments` table
   - Restrictions will apply once student is enrolled + clocked in

2. **Mobile Enrollment via Edge Function**
   - Mobile app can enroll using class code
   - Validates school matching

3. **Restrictions Based on Enrollment**
   - `get-current-restrictions` checks enrollments
   - Only enrolled students get class template restrictions

4. **Template Switching**
   - Changing `active_template_id` on class
   - Next poll from mobile app gets new restrictions

### ❌ DOESN'T WORK (Yet)

1. **UI for Manual Enrollment**
   - No button/dialog to enroll students from website
   - Must use SQL or mobile app

2. **Automatic Enrollment on Student Creation**
   - Creating a student doesn't auto-enroll them in any classes

3. **Bulk Operations**
   - Can't enroll multiple students at once via UI

## Quick Test SQL Script

```sql
-- ============================================
-- COMPLETE TEST: Enroll Student & Verify
-- ============================================

-- 1. Find student
SELECT id as student_id, name, email 
FROM students 
WHERE name ILIKE '%kyle%' 
LIMIT 1;

-- 2. Find class (demo class recommended)
SELECT id as class_id, subject, period, code, active_template_id
FROM classes 
WHERE start_time IS NULL AND end_time IS NULL  -- Demo class
LIMIT 1;

-- 3. Enroll student (replace IDs from steps 1 & 2)
INSERT INTO enrollments (class_id, student_id)
VALUES (
  'CLASS_ID_HERE',  -- From step 2
  'STUDENT_ID_HERE'  -- From step 1
)
ON CONFLICT DO NOTHING;

-- 4. Clock in student
INSERT INTO attendance_records (student_id, class_id, status, timestamp)
VALUES (
  'STUDENT_ID_HERE',
  'CLASS_ID_HERE',
  'in',
  NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Verify everything
SELECT 
  s.name as student,
  c.subject as class,
  c.code as class_code,
  t.name as active_template,
  t.apps as template_apps,
  ar.status as clock_status,
  ar.timestamp as clocked_in_at
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN classes c ON c.id = e.class_id
LEFT JOIN app_templates t ON t.id = c.active_template_id
LEFT JOIN attendance_records ar ON ar.student_id = s.id 
  AND ar.class_id = c.id 
  AND ar.status IN ('in', 'present')
  AND ar.clocked_out_at IS NULL
WHERE e.student_id = 'STUDENT_ID_HERE'
  AND e.class_id = 'CLASS_ID_HERE';
```

## Next Steps to Add UI Enrollment

If you want to add a UI for manual enrollment, you would need to:

1. **Add button on ClassesPage** (next to class name)
   - "Add Students" button
   - Opens dialog with student search/select

2. **Add button on StudentsPage** (in student card)
   - "Enroll in Class" button
   - Opens dialog with class selection

3. **Use existing `addStudentToClass` function**
   - Already implemented in AppContext
   - Just needs UI to call it

## Summary

**YES, you can manually enroll students via SQL and restrictions WILL apply!**

The architecture is fully set up:
- ✅ `enrollments` table tracks student-class relationships
- ✅ `get-current-restrictions` checks enrollments
- ✅ Manual SQL enrollment works immediately
- ✅ Template restrictions apply when student is enrolled + clocked in

**What's missing:**
- ❌ UI for manual enrollment (but SQL works fine for testing)

