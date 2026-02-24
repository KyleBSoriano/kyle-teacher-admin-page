# Admin Pages - Data Source Analysis

## What's Using Supabase vs What's Hardcoded/Local

---

## 1. Admin Dashboard (`AdminDashboard.tsx`)

### ✅ **READS FROM SUPABASE:**
- **Students** - Via `useAppContext().students` (from `students` table)
- **Classes** - Via `useAppContext().classes` (from `classes` table)
- **User Profile** - Via `useAuthContext().user` (from `profiles` table)

### ✅ **SAVES TO SUPABASE:**
- **Clock Out All** - Updates `attendance_records` table

### ❌ **HARDCODED/MOCK DATA:**
- **Student Search** - Uses hardcoded Kyle Soriano mock data (lines 60-68)
  - Only shows profile if you search for "kyle", "soriano", or "ks"
  - Should search real students from database instead
- **Student Status** - Local state only (`studentStatus`), not persisted

### 🔧 **NEEDS FIXING:**
- Replace mock student search with real student search from `useAppContext().students`
- Filter students by name/email based on search term
- Show real student profiles from database

---

## 2. Admin Settings (`AdminSettingsPage.tsx`)

### ✅ **READS FROM SUPABASE:**
- **User Profile** - Via `useAuthContext().user` (from `profiles` table)
- **Classes** - Via `useAppContext().classes` (from `classes` table)

### ✅ **SAVES TO SUPABASE:**
- **Clock Out All** - Updates `attendance_records` table

### ❌ **NOT SAVED TO SUPABASE:**
- **Account Settings** (First Name, Last Name, Email, School Name) - Line 32-37
  - `handleSaveSettings()` only shows toast, **DOES NOT SAVE** to database
  - Should update `profiles` table

### ⚠️ **LOCAL STORAGE:**
- **Display Settings** (Help Tooltips) - Saved to `SettingsContext` (localStorage)
- **Color Preferences** - Saved to `SettingsContext` (localStorage)

### 🔧 **NEEDS FIXING:**
- Save account settings to `profiles` table in Supabase

---

## 3. Admin Schedule (`AdminSchedulePage.tsx`)

### ✅ **FULLY INTEGRATED WITH SUPABASE:**
- **Schedule Blocks** - Reads from `schedule_blocks` table ✅
- **Schedule Presets** - Reads from `schedule_presets` table ✅
- **All CRUD Operations** - Save to Supabase ✅
  - Create time blocks → `schedule_blocks` table
  - Update time blocks → `schedule_blocks` table
  - Delete time blocks → `schedule_blocks` table
  - Save presets → `schedule_presets` table
  - Delete presets → `schedule_presets` table
  - Apply presets → `schedule_blocks` table
  - Clear day schedule → `schedule_blocks` table

### ✅ **NO HARDCODED DATA** - Everything uses Supabase!

---

## 4. Admin Apps (`AdminAppsPage.tsx`)

### ✅ **READS FROM SUPABASE:**
- **Default App Template** - Reads from `app_templates` table (line 36-42)
- **Apps List** - Via `useAppContext().apps` (from mockData, but that's OK - apps are reference data)

### ✅ **SAVES TO SUPABASE:**
- **Default Template Updates** - Saves to `app_templates` table (line 127-134)

### ❌ **HARDCODED:**
- **Allowed Apps List** - Line 23: Hardcoded array
  ```typescript
  const allowedAppIds = ["app24", "app1", "app27", "app25", "app5", "app8", "app11", "app16"];
  ```
  - Should read from `schools.allowed_apps` column
  - Should allow admin to edit and save to database

### 🔧 **NEEDS FIXING:**
- Read `allowed_apps` from `schools` table
- Allow admin to edit `allowed_apps` list
- Save changes to `schools.allowed_apps` column

---

## 5. Admin Students (`AdminStudentsPage.tsx`)

### ✅ **READS FROM SUPABASE:**
- **Students** - Via `useAppContext().students` (from `students` table) ✅
- **Classes** - Via `useAppContext().classes` (from `classes` table) ✅
- **Attendance Records** - Via `useRealTimeAttendance()` hook (from `attendance_records` table) ✅

### ✅ **SAVES TO SUPABASE:**
- **Add Student** - Saves to `students` table via `addStudent()`
- **Remove Student** - Deletes from `students` table via `removeStudent()`
- **Clock Out Student** - Updates `attendance_records` table
- **Reset Attendance** - Deletes from `attendance_records` table

### ❌ **HARDCODED/MOCK DATA:**
- **Student List Display** - Line 38: Uses `getStudentsByPeriod(1)` from mock data
  - Should use `useAppContext().students` instead
  - Should show ALL students in school (not just period 1)
- **Total Students Count** - Line 50: Hardcoded `100`
  - Should be actual count from database: `students.length`

### 🔧 **NEEDS FIXING:**
- Replace `getStudentsByPeriod(1)` with `useAppContext().students`
- Replace hardcoded `100` with actual student count
- Show all students in school (not filtered by period)

---

## 6. Admin Help (`AdminHelpPage.tsx`)

### ❌ **NO SUPABASE INTEGRATION:**
- **Contact Support** - Only shows toast, does not save to database
- **FAQs** - Hardcoded in component (lines 36-61)

### 🔧 **NEEDS FIXING:**
- Save support messages to `support_messages` table (if we create it)
- Store FAQs in database (optional)

---

## Summary: Admin Pages Data Sources

### ✅ **Fully Using Supabase:**
1. **Admin Schedule** - 100% integrated ✅

### ⚠️ **Partially Using Supabase:**
2. **Admin Apps** - Template saves, but allowed apps list is hardcoded
3. **Admin Students** - Saves work, but displays mock data
4. **Admin Dashboard** - Reads data, but search uses mock data
5. **Admin Settings** - Reads data, but account settings don't save

### ❌ **Not Using Supabase:**
6. **Admin Help** - No database integration

---

## Priority Fixes for Admin Pages

### HIGH PRIORITY:

1. **AdminStudentsPage** - Replace `getStudentsByPeriod()` with real students
   - Use `useAppContext().students` 
   - Show all students in school
   - Replace hardcoded `100` with `students.length`

2. **AdminAppsPage** - Store allowed apps in database
   - Read from `schools.allowed_apps`
   - Allow editing
   - Save to database

3. **AdminSettingsPage** - Save account settings
   - Update `profiles` table when saving

### MEDIUM PRIORITY:

4. **AdminDashboard** - Replace mock student search
   - Use real student search from database
   - Filter by name/email

### LOW PRIORITY:

5. **AdminHelp** - Save support messages to database

---

## Database Changes Needed

### 1. Add `allowed_apps` to `schools` table
```sql
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS allowed_apps JSONB 
DEFAULT '["app24", "app1", "app27", "app25", "app5", "app8", "app11", "app16"]'::jsonb;
```

### 2. (Optional) Create `support_messages` table
```sql
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  school_id UUID REFERENCES schools(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);
```

