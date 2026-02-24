# Supabase Database Usage Analysis

## Tables Currently Being Used ✅

### 1. **classes** - ✅ ACTIVELY USED
- **Used in**: AppContext, ClassesPage, CreateClassDialog, Edge Functions
- **Columns Used**:
  - `id` ✅
  - `subject` ✅
  - `period` ✅
  - `code` ✅
  - `school_id` ✅
  - `start_time` ✅
  - `end_time` ✅
  - `active_template_id` ✅
  - `created_at` ✅
  - `updated_at` ✅
- **Columns NOT Used** (can be removed):
  - `description` ❌ (referenced in types but not in actual queries)
  - `room_number` ❌ (referenced in types but not in actual queries)

### 2. **students** - ✅ ACTIVELY USED
- **Used in**: AppContext, AuthContext (Edge Functions), AdminStudentsPage, StudentsPage
- **Columns Used**:
  - `id` ✅
  - `name` ✅
  - `email` ✅
  - `school_id` ✅
  - `grade` ✅
  - `device_id` ✅
- **All columns appear to be used**

### 3. **enrollments** - ✅ ACTIVELY USED
- **Used in**: AppContext, Edge Functions
- **Columns Used**:
  - `id` ✅
  - `class_id` ✅
  - `student_id` ✅
- **All columns appear to be used**

### 4. **class_apps** - ✅ ACTIVELY USED
- **Used in**: AppContext
- **Columns Used**:
  - `id` ✅
  - `class_id` ✅
  - `app_id` ✅
  - `created_at` ✅
- **All columns appear to be used**

### 5. **app_templates** - ✅ ACTIVELY USED
- **Used in**: ClassesPage, CreateClassDialog, CreateClassPage, AdminAppsPage, useAppTemplates hook
- **Columns Used**:
  - `id` ✅
  - `name` ✅
  - `description` ✅
  - `apps` ✅
  - `period` ✅
  - `class_id` ✅
  - `school_id` ✅
  - `is_custom` ✅
  - `created_at` ✅ (needs to be added - causing errors)
  - `updated_at` ✅ (needs to be added - causing errors)
- **All columns are used**

### 6. **app_catalog** - ✅ ACTIVELY USED
- **Used in**: useAppCatalog hook, AppPickerDialog
- **Columns Used**:
  - `key` ✅
  - `display_name` ✅
  - `ios_bundle_id` ✅
  - `aliases` ✅
- **All columns appear to be used**

### 7. **attendance_records** - ✅ ACTIVELY USED
- **Used in**: AppContext, AdminDashboard, AdminSettingsPage, StudentsPage, useRealTimeAttendance, AdminSchedulePage
- **Columns Used**:
  - `id` ✅
  - `class_id` ✅
  - `student_id` ✅
  - `student_name` ✅
  - `status` ✅
  - `timestamp` ✅
  - `clocked_out_at` ✅
  - `period` ✅ (needs to be added - causing errors)
  - `created_at` ✅
- **Columns NOT Used** (can be removed):
  - `school_id` ❌ (referenced in types but removed from queries - doesn't exist in actual table)

### 8. **schools** - ✅ ACTIVELY USED
- **Used in**: AuthContext, useSchoolAllowedApps, Edge Functions
- **Columns Used**:
  - `id` ✅
  - `name` ✅
  - `code` ✅
  - `allowed_apps` ✅ (JSONB column - stores array of app_catalog keys)
- **Columns NOT Used** (can be removed):
  - `address` ❌ (exists in types but not used in code)
  - `district` ❌ (exists in types but not used in code)
  - `created_at` ❓ (exists in types, might be auto-managed)
  - `updated_at` ❓ (exists in types, might be auto-managed)

### 9. **profiles** - ✅ ACTIVELY USED
- **Used in**: AuthContext, AdminSettingsPage, SettingsPage
- **Columns Used**:
  - `id` ✅
  - `first_name` ✅
  - `last_name` ✅
  - `preferred_title` ✅
  - `email` ✅
  - `school_name` ✅
  - `created_at` ✅
  - `updated_at` ✅
- **Columns NOT Used** (might exist but not referenced):
  - `school_id` ❓ (referenced in AuthContext signUp but might not exist in table)

### 10. **user_roles** - ✅ ACTIVELY USED
- **Used in**: AuthContext
- **Columns Used**:
  - `id` ✅
  - `user_id` ✅
  - `school_id` ✅
  - `role` ✅
  - `created_at` ✅
- **All columns appear to be used**

### 11. **schedule_blocks** - ✅ ACTIVELY USED
- **Used in**: ScheduleContext, AdminSchedulePage
- **Columns Used**: (need to verify specific columns)
- **Used for**: Bell schedule management

### 12. **schedule_presets** - ✅ ACTIVELY USED
- **Used in**: AdminSchedulePage
- **Columns Used**: (need to verify specific columns)
- **Used for**: Schedule preset management

---

## Tables That Might NOT Be Used ❓

### 1. **student_emails** - ❓ POTENTIALLY UNUSED
- **Found in**: Migration file `20250911230048_669f6ebf-08d5-47f4-935a-0d117cc25b96.sql`
- **Purpose**: Store emails from QR code confirmations
- **Status**: No references found in codebase grep search
- **Recommendation**: Check if this is for mobile app or legacy feature. If unused, can be removed.

---

## Columns That Need to Be Added (Causing Errors)

1. **app_templates.created_at** - ❌ MISSING (causing template fetch errors)
2. **app_templates.updated_at** - ❌ MISSING (causing template fetch errors)
3. **attendance_records.period** - ❌ MISSING (causing attendance errors)

---

## Columns That Can Be Removed (Not Used)

1. **classes.description** - ❌ Not used in any queries
2. **classes.room_number** - ❌ Not used in any queries
3. **attendance_records.school_id** - ❌ Referenced in types but doesn't exist in actual table (already removed from queries)
4. **schools.address** - ❌ Not used in any queries
5. **schools.district** - ❌ Not used in any queries

---

## Summary

### Keep These Tables:
- ✅ classes (remove unused columns: description, room_number)
- ✅ students
- ✅ enrollments
- ✅ class_apps
- ✅ app_templates (add missing: created_at, updated_at)
- ✅ app_catalog
- ✅ attendance_records (add missing: period, remove school_id reference from types)
- ✅ schools (remove unused columns: address, district)
- ✅ profiles
- ✅ user_roles
- ✅ schedule_blocks
- ✅ schedule_presets

### Investigate/Remove:
- ❓ student_emails (no code references found - likely unused)

### Fix Required:
1. Add `created_at` and `updated_at` to `app_templates` ✅ (SQL created - fix_template_schema.sql)
2. Add `period` to `attendance_records` ✅ (SQL created - fix_template_schema.sql)
3. Remove `description` and `room_number` from `classes` table (or keep if planning to use)
4. Remove `school_id` reference from `attendance_records` types (already removed from queries)
5. Verify `profiles.school_id` exists or remove from signUp code
6. Remove `address` and `district` from `schools` table (if not planning to use)
7. Remove or verify `student_emails` table usage (no code references found)

## SQL Cleanup Script

To clean up unused columns, you can run:

```sql
-- Remove unused columns (OPTIONAL - only if you're sure you won't need them)
-- ALTER TABLE public.classes DROP COLUMN IF EXISTS description;
-- ALTER TABLE public.classes DROP COLUMN IF EXISTS room_number;
-- ALTER TABLE public.schools DROP COLUMN IF EXISTS address;
-- ALTER TABLE public.schools DROP COLUMN IF EXISTS district;

-- Remove unused table (OPTIONAL - verify first that student_emails isn't used by mobile app)
-- DROP TABLE IF EXISTS public.student_emails CASCADE;
```

