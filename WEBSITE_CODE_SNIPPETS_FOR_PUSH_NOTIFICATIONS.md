# Website Code Snippets for Push Notifications Integration

## A) Teacher Clock-Out Flow

### Answer: **BOTH** (single student + clock out entire class)

---

### A1) Single Student Clock-Out

**File:** `src/pages/StudentsPage.tsx` (lines 286-309)

```typescript
const handleClockOutStudent = async (studentId: string, studentName: string) => {
  if (periodNumber !== 1) {
    toast({
      title: "Not available",
      description: "Individual clock-out is only available for Period 1.",
      variant: "destructive"
    });
    return;
  }

  try {
    await clockOutStudent(studentId);
    toast({
      title: "Student clocked out",
      description: `${studentName} has been clocked out successfully.`
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to clock out student. Please try again.",
      variant: "destructive"
    });
  }
};
```

**File:** `src/pages/admin/AdminDashboard.tsx` (lines 138-196)

```typescript
const handleClockOutStudent = async () => {
  if (!selectedStudent || !schoolId) {
    toast({
      title: "Error",
      description: "No student selected",
      variant: "destructive"
    });
    return;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Step 1: Update attendance_records - mark all today's records as clocked out
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .update({ 
        status: 'clocked_out',
        clocked_out_at: new Date().toISOString()
      })
      .eq('student_id', selectedStudent.id)
      .eq('status', 'in')
      .is('clocked_out_at', null)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString());

    if (attendanceError) {
      console.error('Error updating attendance records:', attendanceError);
      // Continue anyway - might not have attendance records
    }

    // Step 2: Update students table - set clocked_in = false
    const { error: studentsError } = await supabase
      .from('students')
      .update({ clocked_in: false })
      .eq('id', selectedStudent.id)
      .eq('school_id', schoolId);

    if (studentsError) throw studentsError;

    // Update local state
    setStudentStatus('CLocked Out');
    
    toast({
      title: "Student clocked out",
      description: `${selectedStudent.name} has been clocked out successfully.`,
    });
  } catch (error: any) {
    console.error('Error clocking out student:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to clock out student",
      variant: "destructive"
    });
  }
};
```

**What IDs are available:**
- `selectedStudent.id` (student_id)
- `selectedStudent.name` (student name)
- `schoolId` (from context)
- No class_id directly, but can be inferred from selected period

---

### A2) Clock Out Entire Class

**File:** `src/pages/StudentsPage.tsx` (lines 237-284)

```typescript
const resetAttendance = async () => {
  if (!selectedClass) return;
  
  try {
    // Get all students enrolled in this class
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('class_id', selectedClass.id);

    if (enrollError) {
      throw enrollError;
    }

    if (!enrollments || enrollments.length === 0) {
      toast({
        title: "No students enrolled",
        description: `No students are enrolled in ${selectedClass.period}.`
      });
      return;
    }

    const studentIds = enrollments.map(e => e.student_id);

    // Set clocked_in = false for all enrolled students
    const { error } = await supabase
      .from('students')
      .update({ clocked_in: false })
      .in('id', studentIds);
    
    if (error) {
      throw error;
    }
    
    toast({
      title: "All students clocked out",
      description: `All students in ${selectedClass.period} have been clocked out.`
    });
  } catch (error) {
    toast({
      title: "Error", 
      description: "Failed to clock out all students. Please try again.",
      variant: "destructive"
    });
  }
};
```

**File:** `src/pages/admin/AdminDashboard.tsx` (lines 198-300) - "Clock Out All Students" (entire school)

```typescript
const handleCLockOutAll = async () => {
  if (!schoolId) {
    toast({
      title: "Error",
      description: "School ID not found",
      variant: "destructive"
    });
    return;
  }

  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Step 1: Get all class IDs for this school
    const { data: schoolClasses, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', schoolId);

    if (classesError) throw classesError;

    if (!schoolClasses || schoolClasses.length === 0) {
      toast({
        title: "Info",
        description: "No classes found for this school",
      });
      return;
    }

    const classIds = schoolClasses.map(c => c.id);

    // Step 2: Get all student IDs that are currently clocked in
    const { data: clockedInRecords, error: recordsError } = await supabase
      .from('attendance_records')
      .select('student_id')
      .in('class_id', classIds)
      .eq('status', 'in')
      .is('clocked_out_at', null)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString());

    if (recordsError) throw recordsError;

    // Get unique student IDs
    const studentIds = [...new Set(
      (clockedInRecords || [])
        .map(r => r.student_id)
        .filter((id): id is string => id !== null)
    )];

    if (studentIds.length === 0) {
      toast({
        title: "Info",
        description: "No students are currently clocked in",
      });
      setConfirmClockOutOpen(false);
      return;
    }

    // Step 3: Update attendance_records - mark all as clocked out
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .update({ 
        status: 'clocked_out',
        clocked_out_at: new Date().toISOString()
      })
      .in('class_id', classIds)
      .eq('status', 'in')
      .is('clocked_out_at', null)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString());

    if (attendanceError) throw attendanceError;

    // Step 4: Update ALL students in the school - set clocked_in = false
    // This ensures all students in the school are clocked out, not just those with attendance records
    const { error: studentsError } = await supabase
      .from('students')
      .update({ clocked_in: false })
      .eq('school_id', schoolId);

    if (studentsError) throw studentsError;

    toast({
      title: "Success",
      description: `All students in your school have been clocked out${studentIds.length > 0 ? ` (${studentIds.length} had active attendance records)` : ''}`,
    });
    
    setConfirmClockOutOpen(false);
  } catch (error: any) {
    console.error('Error clocking out students:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to clock out students",
      variant: "destructive"
    });
    setConfirmClockOutOpen(false);
  }
};
```

**What IDs are available:**
- `selectedClass.id` (class_id) - for class-level clock-out
- `studentIds` array (all student IDs enrolled in class)
- `schoolId` (for school-wide clock-out)
- `classIds` array (all class IDs in school)

---

## B) Template Change Flow

**File:** `src/pages/ClassesPage.tsx` (lines 218-242)

```typescript
const handleActivateTemplate = async (templateId: string) => {
  const selectedClass = classes.find((_, index) => selectedPeriod === `period${index + 1}`);
  if (!selectedClass) {
    toast({
      title: "Error",
      description: "No class selected. Please select a class first.",
      variant: "destructive"
    });
    return;
  }

  try {
    // Update the class's active_template_id in Supabase
    await updateClass(selectedClass.id, { activeTemplateId: templateId });
    // Success toast removed - template activation is visible in UI
  } catch (error) {
    console.error('Error activating template:', error);
    toast({
      title: "Error",
      description: "Failed to activate template. Please try again.",
      variant: "destructive"
    });
  }
};
```

**File:** `src/context/AppContext.tsx` (lines 468-530) - The actual updateClass function

```typescript
const updateClass = async (classId: string, updatedClass: Partial<Class>) => {
  if (!schoolId) throw new Error('School ID is required');

  try {
    // Log debug info
    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log('🔍 Updating class:', {
      classId: classId,
      userId: user?.id,
      authUid: authUser?.id,
      role: role,
      schoolId: schoolId,
      updates: Object.keys(updatedClass)
    });

    // Update class in database
    const updateData: any = {};
    if (updatedClass.subject !== undefined) updateData.subject = updatedClass.subject;
    if (updatedClass.period !== undefined) updateData.period = updatedClass.period;
    // description and room_number columns don't exist in database, so we skip them
    if (updatedClass.startTime !== undefined) updateData.start_time = updatedClass.startTime;
    if (updatedClass.endTime !== undefined) updateData.end_time = updatedClass.endTime;
    if (updatedClass.code !== undefined) updateData.code = updatedClass.code;
    if (updatedClass.activeTemplateId !== undefined) updateData.active_template_id = updatedClass.activeTemplateId;

    const { error: classError } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', classId)
      .eq('school_id', schoolId);

    if (classError) {
      console.error('❌ RLS Policy Error when updating class:', {
        code: classError.code,
        message: classError.message,
        details: classError.details,
        hint: classError.hint,
        classId: classId,
        userId: user?.id,
        authUid: authUser?.id,
        role: role,
        schoolId: schoolId
      });
      throw classError;
    }

    // Update allowed apps if provided
    if (updatedClass.allowedApps !== undefined) {
      // Delete existing apps
      await supabase
        .from('class_apps')
        .delete()
        .eq('class_id', classId);

      // Insert new apps
      if (updatedClass.allowedApps.length > 0) {
        const classAppsInserts = updatedClass.allowedApps.map(appId => ({
          class_id: classId,
          app_id: appId,
        }));

        await supabase
          .from('class_apps')
          .insert(classAppsInserts);
      }
    }

    // Optimized: Update state directly instead of full reload
    setClasses(prev => prev.map(cls => 
      cls.id === classId 
        ? { ...cls, ...updatedClass }
        : cls
    ));

    // Success toast removed - class update is visible in UI
  } catch (error: any) {
    console.error('Error updating class:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to update class',
      variant: 'destructive',
    });
    throw error;
  }
};
```

**What table changes:**
- `classes.active_template_id` (UUID) - updated when template is activated

**How to get impacted students:**
```typescript
// Get all students enrolled in the class
const { data: enrollments } = await supabase
  .from('enrollments')
  .select('student_id')
  .eq('class_id', classId);

const studentIds = enrollments?.map(e => e.student_id) || [];
```

**What IDs are available:**
- `classId` (the class being updated)
- `templateId` (the template being activated)
- Can query `enrollments` to get `student_id[]` for that class

---

## C) Schema Information

### Enrollments Table

**Columns:**
- `id` (UUID, primary key)
- `class_id` (string, foreign key → classes.id)
- `student_id` (string, foreign key → students.id)
- `created_at` (timestamp, nullable)

**From types.ts:**
```typescript
enrollments: {
  Row: {
    class_id: string
    created_at: string | null
    id: string
    student_id: string
  }
}
```

**Query to get students in a class:**
```typescript
const { data: enrollments } = await supabase
  .from('enrollments')
  .select('student_id')
  .eq('class_id', classId);

const studentIds = enrollments?.map(e => e.student_id) || [];
```

---

### Classes Table

**Columns:**
- `id` (UUID, primary key)
- `school_id` (string, nullable, foreign key → schools.id)
- `teacher_id` (UUID, nullable, foreign key → auth.users.id)
- `period` (string) - e.g., "Period 1", "Period 2"
- `subject` (string)
- `active_template_id` (UUID, nullable, foreign key → app_templates.id) - **This is what changes when template is activated**
- `code` (string, nullable) - 6-digit class code
- `start_time` (string, nullable)
- `end_time` (string, nullable)
- `created_at` (timestamp, nullable)
- `updated_at` (timestamp, nullable)

**From types.ts:**
```typescript
classes: {
  Row: {
    active_template_id: string | null
    code: string | null
    created_at: string | null
    description: string | null
    end_time: string | null
    id: string
    period: string
    room_number: string | null
    school_id: string | null
    start_time: string | null
    subject: string
    updated_at: string | null
  }
}
```

---

### Students Table

**Columns (relevant for clock-out):**
- `id` (UUID, primary key)
- `school_id` (string, foreign key → schools.id)
- `clocked_in` (boolean) - **This is what gets set to false on clock-out**
- `name` (string)
- `email` (string)
- `grade` (number, nullable)
- `device_id` (string, nullable)

---

## Summary

### Clock-Out Triggers:

1. **Single Student:**
   - Handler: `handleClockOutStudent(studentId: string)`
   - Updates: `students.clocked_in = false` + `attendance_records.status = 'clocked_out'`
   - Available IDs: `student_id`, `school_id`

2. **Entire Class:**
   - Handler: `resetAttendance()` (in StudentsPage)
   - Updates: All enrolled students' `clocked_in = false`
   - Available IDs: `class_id`, `studentIds[]` (from enrollments)

3. **Entire School:**
   - Handler: `handleCLockOutAll()` (in AdminDashboard)
   - Updates: All students in school `clocked_in = false`
   - Available IDs: `schoolId`, `studentIds[]`, `classIds[]`

### Template Change Trigger:

- Handler: `handleActivateTemplate(templateId: string)`
- Calls: `updateClass(classId, { activeTemplateId: templateId })`
- Updates: `classes.active_template_id = templateId`
- Available IDs: `classId`, `templateId`
- To get impacted students: Query `enrollments` where `class_id = classId` → get `student_id[]`

### No Edge Functions Currently

**Important:** The website currently makes **direct Supabase client calls** (`supabase.from().update()`), NOT edge function calls. You'll need to either:

1. Create edge functions that the website calls, OR
2. Use database triggers that fire after the Supabase updates complete

