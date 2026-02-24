import { mockApps, mockClasses, mockStudents, mockAttendance } from "@/data/mockData";
import { App, AttendanceData, Class, Student } from "@/types";
import { toast } from "@/hooks/use-toast";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "./AuthContext";

interface AppContextType {
  classes: Class[];
  students: Student[];
  apps: App[];
  attendanceData: AttendanceData[];
  addClass: (newClass: Omit<Class, "id">) => Promise<Class>;
  updateClass: (classId: string, updatedClass: Partial<Class>) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  addStudent: (newStudent: Omit<Student, "id">) => Promise<void>;
  updateStudent: (studentId: string, updatedStudent: Partial<Student>) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>; // Alias for deleteStudent
  addStudentToClass: (classId: string, studentId: string) => Promise<void>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<void>;
  toggleAppForClass: (classId: string, appId: string) => Promise<void>;
  getStudentsForClass: (classId: string) => Student[];
  getClassById: (classId: string) => Class | undefined;
  getStudentById: (studentId: string) => Student | undefined;
  addCustomApp: (newApp: Omit<App, "id" | "isCustom">) => App;
  markStudentPresent: (classId: string) => Promise<void>;
  attendanceCounter: number; // Add a counter to trigger re-renders
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId, user, role } = useAuthContext();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [apps, setApps] = useState<App[]>(mockApps);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [attendanceCounter, setAttendanceCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data from database (classes, enrollments, class_apps, students, attendance)
  const loadData = async () => {
    if (!schoolId) {
      setClasses([]);
      setStudents([]);
      setAttendanceData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('📦 Loading all data from database for school:', schoolId);

      // First, get all class IDs for this school (needed to filter enrollments and class_apps)
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .order('period', { ascending: true });

      if (classesError) throw classesError;

      const schoolClassIds = (classesData || []).map(c => c.id);

      // Load remaining data in parallel, filtered by class IDs from this school
      const [enrollmentsResult, classAppsResult, studentsResult] = await Promise.all([
        // Load enrollments filtered by class IDs (only enrollments for classes in this school)
        schoolClassIds.length > 0
          ? supabase
              .from('enrollments')
              .select('*')
              .in('class_id', schoolClassIds)
          : Promise.resolve({ data: [], error: null }),
        
        // Load class_apps filtered by class IDs (only apps for classes in this school)
        schoolClassIds.length > 0
          ? supabase
              .from('class_apps')
              .select('*')
              .in('class_id', schoolClassIds)
          : Promise.resolve({ data: [], error: null }),
        
        // Load students from database
        supabase
          .from('students')
          .select('*')
          .eq('school_id', schoolId)
          .order('name', { ascending: true })
      ]);

      const { data: enrollmentsData, error: enrollmentsError } = enrollmentsResult;
      const { data: classAppsData, error: classAppsError } = classAppsResult;
      const { data: studentsData, error: studentsError } = studentsResult;

      // Check for errors
      if (enrollmentsError) {
        console.error('❌ Error loading enrollments:', enrollmentsError);
        throw enrollmentsError;
      }
      if (classAppsError) throw classAppsError;
      if (studentsError) throw studentsError;
      
      console.log('📋 Loaded enrollments:', {
        total: enrollmentsData?.length || 0,
        enrollments: enrollmentsData?.map(e => ({ class_id: e.class_id, student_id: e.student_id })),
        targetEnrollment: enrollmentsData?.find(e => 
          e.student_id === '16440aa1-4e1c-4ef6-983a-4308c1df8eb3' && 
          e.class_id === '9608a350-bca6-4303-b84a-064100c90bd0'
        )
      });

      // Transform database classes to Class type
      const transformedClasses: Class[] = (classesData || []).map((dbClass) => {
        // Get students for this class from enrollments
        const classStudents = (enrollmentsData || [])
          .filter(e => e.class_id === dbClass.id)
          .map(e => e.student_id);

        // Debug logging for enrollment matching
        if (dbClass.id === '9608a350-bca6-4303-b84a-064100c90bd0') {
          console.log('🔍 Debugging class enrollment:', {
            classId: dbClass.id,
            classSubject: dbClass.subject,
            classPeriod: dbClass.period,
            totalEnrollments: enrollmentsData?.length || 0,
            enrollmentsForThisClass: (enrollmentsData || []).filter(e => e.class_id === dbClass.id).length,
            studentIds: classStudents,
            allEnrollments: (enrollmentsData || []).map(e => ({ class_id: e.class_id, student_id: e.student_id }))
          });
        }

        // Get allowed apps for this class
        const allowedApps = (classAppsData || [])
          .filter(ca => ca.class_id === dbClass.id)
          .map(ca => ca.app_id);

        return {
          id: dbClass.id,
          period: dbClass.period,
          subject: dbClass.subject,
          // description and room_number columns don't exist in database
          startTime: dbClass.start_time || undefined,
          endTime: dbClass.end_time || undefined,
          students: classStudents,
          allowedApps: allowedApps,
          code: dbClass.code || undefined,
          activeTemplateId: dbClass.active_template_id || undefined,
        };
      });

      setClasses(transformedClasses);
      console.log('✅ Loaded', transformedClasses.length, 'classes from database');
      
      // Debug: Log the specific class we're looking for
      const targetClass = transformedClasses.find(c => c.id === '9608a350-bca6-4303-b84a-064100c90bd0');
      if (targetClass) {
        console.log('🎯 Target class loaded:', {
          id: targetClass.id,
          subject: targetClass.subject,
          period: targetClass.period,
          studentIds: targetClass.students,
          studentCount: targetClass.students.length
        });
      } else {
        console.warn('⚠️ Target class NOT found in transformed classes');
      }

      // Transform database students to Student type (studentsData already loaded in parallel above)
      const transformedStudents: Student[] = (studentsData || []).map((dbStudent) => ({
        id: dbStudent.id,
        name: dbStudent.name,
        email: dbStudent.email || '',
        grade: dbStudent.grade || undefined,
        deviceId: dbStudent.device_id || undefined,
      }));

      setStudents(transformedStudents);
      console.log('✅ Loaded', transformedStudents.length, 'students from database');
      if (transformedStudents.length > 0) {
        console.log('📋 Sample students:', transformedStudents.slice(0, 3).map(s => ({ id: s.id, name: s.name, email: s.email })));
      } else {
        console.warn('⚠️ No students found in database for school_id:', schoolId);
      }
      
      // Debug: Check if target student is in the list
      const targetStudent = transformedStudents.find(s => s.id === '16440aa1-4e1c-4ef6-983a-4308c1df8eb3');
      if (targetStudent) {
        console.log('✅ Target student loaded:', {
          id: targetStudent.id,
          name: targetStudent.name,
          email: targetStudent.email
        });
      } else {
        console.warn('⚠️ Target student NOT found in students list. School ID filter might be excluding them.');
        console.log('🔍 All student IDs:', transformedStudents.map(s => s.id));
      }

      // Load attendance records for classes in this school
      // Get all class IDs for this school first
      const classIds = transformedClasses.map(c => c.id);
      
      // Load attendance records for these classes (only if we have classes)
      let attendanceData = null;
      let attendanceError = null;
      
      if (classIds.length > 0) {
        const result = await supabase
          .from('attendance_records')
          .select('*')
          .in('class_id', classIds)
          .order('timestamp', { ascending: false });
        attendanceData = result.data;
        attendanceError = result.error;
      }

      if (attendanceError) throw attendanceError;

      // Transform attendance records to AttendanceData format
      // Group by classId and date
      const attendanceMap = new Map<string, AttendanceData>();
      
      (attendanceData || []).forEach((record) => {
        const date = new Date(record.timestamp).toISOString().split('T')[0];
        const key = `${record.class_id}_${date}`;
        
        if (!attendanceMap.has(key)) {
          attendanceMap.set(key, {
            classId: record.class_id,
            date: new Date(record.timestamp).toISOString(),
            records: [],
          });
        }
        
        const attendance = attendanceMap.get(key)!;
        attendance.records.push({
          studentId: record.student_id || record.student_name || '',
          status: record.status as 'present' | 'absent' | 'tardy',
          timestamp: record.timestamp,
        });
      });

      setAttendanceData(Array.from(attendanceMap.values()));
      console.log('✅ Loaded', attendanceMap.size, 'attendance records from database');

    } catch (error: any) {
      console.error('Error loading data:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      
      // Set empty arrays on error so app can still function
      setClasses([]);
      setStudents([]);
      setAttendanceData([]);
      
      toast({
        title: 'Error Loading Data',
        description: error?.message || 'Failed to load data. Some features may not work.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Optimized function to reload only students (for real-time updates)
  const reloadStudentsOnly = async () => {
    if (!schoolId) return;
    
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .order('name', { ascending: true });

      if (studentsError) {
        console.error('Error reloading students:', studentsError);
        return;
      }

      const transformedStudents: Student[] = (studentsData || []).map((dbStudent) => ({
        id: dbStudent.id,
        name: dbStudent.name,
        email: dbStudent.email || '',
        grade: dbStudent.grade || undefined,
        deviceId: dbStudent.device_id || undefined,
      }));

      setStudents(transformedStudents);
      console.log('✅ Reloaded', transformedStudents.length, 'students (optimized)');
    } catch (error) {
      console.error('Error reloading students:', error);
    }
  };

  // Load all data when schoolId changes
  useEffect(() => {
    if (!schoolId) {
      setClasses([]);
      setStudents([]);
      setAttendanceData([]);
      setIsLoading(false);
      return;
    }

    loadData();

    // Subscribe to real-time changes for students table
    // This ensures new students who sign up via mobile app appear immediately in admin search
    // Debounce to prevent spam reloads
    let debounceTimer: NodeJS.Timeout | null = null;
    const studentsChannel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'students',
          filter: `school_id=eq.${schoolId}`
        },
        (payload) => {
          console.log('🔄 Student change detected:', payload.eventType);
          // Debounce: Wait 500ms before reloading to prevent spam
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          debounceTimer = setTimeout(() => {
            // Only reload students, not all data
            reloadStudentsOnly();
          }, 500);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or when schoolId changes
    return () => {
      supabase.removeChannel(studentsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, user?.id, role]);

  const addClass = async (newClass: Omit<Class, "id">) => {
    if (!schoolId) throw new Error('School ID is required');

    try {
      // Get user role and set teacher_id appropriately
      // For teachers: teacher_id MUST equal auth.uid() for RLS policy to pass
      // For admins: teacher_id can be NULL
      const teacherId = role === 'teacher' ? user?.id : null;

      // Log debug info
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('🔍 Creating class:', {
        userId: user?.id,
        authUid: authUser?.id,
        role: role,
        schoolId: schoolId,
        teacherId: teacherId,
        subject: newClass.subject,
        period: newClass.period
      });

      // Generate UUID for class
      const classId = crypto.randomUUID();

      // Generate class code if not provided
      let classCode = newClass.code;
      if (!classCode) {
        // Generate a 6-digit code
        classCode = Math.floor(100000 + Math.random() * 900000).toString();
      }

      // Create class in database
      const { data: dbClass, error: classError } = await supabase
        .from('classes')
        .insert({
          id: classId,
          subject: newClass.subject,
          period: newClass.period,
          // description and room_number columns don't exist in database, so we skip them
          start_time: newClass.startTime || null,
          end_time: newClass.endTime || null,
          code: classCode || null,
          school_id: schoolId,
          teacher_id: teacherId, // Explicitly set: user.id for teachers, null for admins
        } as any) // Type assertion needed until migration adds teacher_id to types
        .select()
        .single();

      if (classError) {
        console.error('❌ RLS Policy Error when creating class:', {
          code: classError.code,
          message: classError.message,
          details: classError.details,
          hint: classError.hint,
          userId: user?.id,
          authUid: authUser?.id,
          role: role,
          schoolId: schoolId,
          teacherId: teacherId
        });
        throw classError;
      }
      if (!dbClass) throw new Error('Failed to create class');

      // Add allowed apps to class_apps table
      if (newClass.allowedApps && newClass.allowedApps.length > 0) {
        const classAppsInserts = newClass.allowedApps.map(appId => ({
          class_id: classId,
          app_id: appId,
        }));

        const { error: appsError } = await supabase
          .from('class_apps')
          .insert(classAppsInserts);

        if (appsError) {
          console.error('Error adding apps to class:', appsError);
          // Continue anyway
        }
      }

      // Transform to Class type
      const createdClass: Class = {
        id: classId,
        period: dbClass.period,
        subject: dbClass.subject,
        // description and room_number columns don't exist in database
        startTime: dbClass.start_time || undefined,
        endTime: dbClass.end_time || undefined,
        students: [],
        allowedApps: newClass.allowedApps || [],
        code: dbClass.code || undefined,
        activeTemplateId: dbClass.active_template_id || undefined,
      };

      // Optimized: Update state directly instead of full reload
      setClasses(prev => [...prev, createdClass].sort((a, b) => {
        // Sort by period number
        const aNum = parseInt(a.period.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.period.match(/\d+/)?.[0] || '0');
        return aNum - bNum;
      }));

      // Success toast removed - user sees success dialog instead
      return createdClass;
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create class',
        variant: 'destructive',
      });
      throw error;
    }
  };

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

      // Handle activeTemplateId separately via edge function (for push notifications)
      if (updatedClass.activeTemplateId !== undefined) {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke("set-class-active-template", {
          body: { 
            class_id: classId, 
            template_id: updatedClass.activeTemplateId 
          },
        });

        if (edgeError) {
          throw edgeError;
        }

        if (!edgeData || !edgeData.ok) {
          throw new Error(edgeData?.error || "Failed to set class active template");
        }

        // Continue with other updates (but skip activeTemplateId in direct update)
      }

      // Update class in database (excluding activeTemplateId if it was updated via edge function)
      const updateData: any = {};
      if (updatedClass.subject !== undefined) updateData.subject = updatedClass.subject;
      if (updatedClass.period !== undefined) updateData.period = updatedClass.period;
      // description and room_number columns don't exist in database, so we skip them
      if (updatedClass.startTime !== undefined) updateData.start_time = updatedClass.startTime;
      if (updatedClass.endTime !== undefined) updateData.end_time = updatedClass.endTime;
      if (updatedClass.code !== undefined) updateData.code = updatedClass.code;
      // activeTemplateId is handled above via edge function, so skip it here

      // Only update if there are other fields to update
      if (Object.keys(updateData).length > 0) {
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
      } else if (updatedClass.activeTemplateId === undefined) {
        // If only activeTemplateId was updated (via edge function), we still need to update local state
        // But if no fields were updated at all, skip
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

  const deleteClass = async (classId: string) => {
    if (!schoolId) throw new Error('School ID is required');

    try {
      // Delete related records first
      await supabase
        .from('class_apps')
        .delete()
        .eq('class_id', classId);

      await supabase
        .from('enrollments')
        .delete()
        .eq('class_id', classId);

      // Delete class
      const { error: classError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
        .eq('school_id', schoolId);

      if (classError) throw classError;

      // Optimized: Remove from state directly instead of full reload
      setClasses(prev => prev.filter(cls => cls.id !== classId));

      // Success toast removed - class deletion is visible in UI
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete class',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const addStudent = async (newStudent: Omit<Student, "id">) => {
    if (!schoolId) {
      toast({
        title: "Error",
        description: "School ID is required to add students.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate UUID for student
      const studentId = crypto.randomUUID();

      const { data: dbStudent, error: studentError } = await supabase
        .from('students')
        .insert({
          id: studentId,
          name: newStudent.name,
          email: newStudent.email || null,
          grade: newStudent.grade || null,
          device_id: newStudent.deviceId || null,
          school_id: schoolId,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      const createdStudent: Student = {
        id: studentId,
        name: dbStudent.name,
        email: dbStudent.email || '',
        grade: dbStudent.grade || undefined,
        deviceId: dbStudent.device_id || undefined,
      };

      setStudents([...students, createdStudent]);
      toast({
        title: "Student added",
        description: `${newStudent.name} has been added successfully.`,
      });
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add student.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateStudent = async (studentId: string, updatedStudent: Partial<Student>) => {
    if (!schoolId) {
      toast({
        title: "Error",
        description: "School ID is required to update students.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: any = {};
      if (updatedStudent.name !== undefined) updateData.name = updatedStudent.name;
      if (updatedStudent.email !== undefined) updateData.email = updatedStudent.email;
      if (updatedStudent.grade !== undefined) updateData.grade = updatedStudent.grade;
      if (updatedStudent.deviceId !== undefined) updateData.device_id = updatedStudent.deviceId;

      const { error: studentError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', studentId)
        .eq('school_id', schoolId);

      if (studentError) throw studentError;

      setStudents(students.map((s) => (s.id === studentId ? { ...s, ...updatedStudent } : s)));
      toast({
        title: "Student updated",
        description: "The student has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update student.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (!schoolId) {
      toast({
        title: "Error",
        description: "School ID is required to delete students.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete enrollments first
      await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', studentId);

      // Delete student
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('school_id', schoolId);

      if (studentError) throw studentError;

      // Update local state
      setClasses(
        classes.map((c) => ({
          ...c,
          students: c.students.filter((id) => id !== studentId),
        }))
      );
      setStudents(students.filter((s) => s.id !== studentId));
      toast({
        title: "Student removed",
        description: "The student has been removed successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove student.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Alias for deleteStudent for backward compatibility
  const removeStudent = deleteStudent;

  const addStudentToClass = async (classId: string, studentId: string) => {
    try {
      // Check if enrollment already exists
      const { data: existing } = await supabase
        .from('enrollments')
        .select('*')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .single();

      if (existing) {
        // Already enrolled
        return;
      }

      // Create enrollment
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          class_id: classId,
          student_id: studentId,
        });

      if (enrollmentError) throw enrollmentError;

      // Reload data to get the latest from database
      await loadData();

      toast({
        title: "Student added to class",
        description: "The student has been added to the class successfully.",
      });
    } catch (error: any) {
      console.error('Error adding student to class:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add student to class',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeStudentFromClass = async (classId: string, studentId: string) => {
    try {
      // Delete enrollment
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);

      if (enrollmentError) throw enrollmentError;

      // Reload data to get the latest from database
      await loadData();

      toast({
        title: "Student removed from class",
        description: "The student has been removed from the class successfully.",
      });
    } catch (error: any) {
      console.error('Error removing student from class:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove student from class',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleAppForClass = async (classId: string, appId: string) => {
    try {
      const classObj = classes.find((c) => c.id === classId);
      if (!classObj) return;

      const hasApp = classObj.allowedApps.includes(appId);

      if (hasApp) {
        // Remove app
        await supabase
          .from('class_apps')
          .delete()
          .eq('class_id', classId)
          .eq('app_id', appId);
      } else {
        // Add app
        await supabase
          .from('class_apps')
          .insert({
            class_id: classId,
            app_id: appId,
          });
      }

      // Reload data to get the latest from database
      await loadData();
    } catch (error: any) {
      console.error('Error toggling app for class:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update app settings',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const addCustomApp = (newApp: Omit<App, "id" | "isCustom">) => {
    const id = `app${apps.length + 1}`;
    const customApp: App = { ...newApp, id, isCustom: true };
    setApps([...apps, customApp]);
    
    toast({
      title: "App added",
      description: `${newApp.name} has been added successfully.`,
    });
    
    return customApp;
  };

  const getStudentsForClass = (classId: string) => {
    const classObj = classes.find((c) => c.id === classId);
    if (!classObj) return [];
    return students.filter((student) => classObj.students.includes(student.id));
  };

  const getClassById = (classId: string) => {
    return classes.find((c) => c.id === classId);
  };

  const getStudentById = (studentId: string) => {
    return students.find((s) => s.id === studentId);
  };
  
  // Updated function to handle Period 1 default value and reset logic - saves to Supabase
  const markStudentPresent = async (classId: string) => {
    if (!schoolId) throw new Error('School ID is required');

    try {
      const today = new Date().toISOString().split('T')[0];
      const classObj = getClassById(classId);
      const isPeriod1 = classObj?.period === "Period 1";
      const totalStudents = getStudentsForClass(classId).length;
      
      // Check if we already have attendance data for today for this class
      const existingAttendanceIndex = attendanceData.findIndex(
        data => data.classId === classId && data.date.startsWith(today)
      );
      
      if (existingAttendanceIndex >= 0) {
        // Update existing attendance data
        const existingAttendance = attendanceData[existingAttendanceIndex];
        
        // Count current unique present students
        const currentPresentCount = new Set(
          existingAttendance.records
            .filter(record => record.status === 'present')
            .map(record => record.studentId)
        ).size;
        
        // If clicking would exceed total students, reset to 0
        if (currentPresentCount >= totalStudents) {
          // Delete all attendance records for today for this class
          const todayStart = new Date(today).toISOString();
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);
          
          await supabase
            .from('attendance_records')
            .delete()
            .eq('class_id', classId)
            .gte('timestamp', todayStart)
            .lte('timestamp', todayEnd.toISOString());
          
          // Reload data to get the latest from database
          await loadData();
          setAttendanceCounter(prev => prev + 1);
          
          toast({
            title: "Attendance reset",
            description: "Attendance count has been reset to 0."
          });
          return;
        }
        
        // Generate a unique student ID for this attendance record
        const newStudentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        
        // Create attendance record in database
        const { error: attendanceError } = await supabase
          .from('attendance_records')
          .insert({
            class_id: classId,
            // school_id column doesn't exist in attendance_records table
            student_id: newStudentId,
            student_name: newStudentId,
            status: 'present',
            timestamp: timestamp,
          });

        if (attendanceError) throw attendanceError;

        // Reload data to get the latest from database
        await loadData();
        setAttendanceCounter(prev => prev + 1);
      } else {
        // Create new attendance data for today
        const records = [];
        const timestamps = [];
        
        // For Period 1, start with 12 students present
        if (isPeriod1) {
          for (let i = 0; i < 12; i++) {
            const studentId = `student_default_${i}_${Date.now()}`;
            const timestamp = new Date().toISOString();
            
            await supabase
              .from('attendance_records')
              .insert({
                class_id: classId,
                // school_id column doesn't exist in attendance_records table
                student_id: studentId,
                student_name: studentId,
                status: 'present',
                timestamp: timestamp,
              });
            
            records.push({
              studentId: studentId,
              status: "present" as const,
              timestamp: timestamp
            });
          }
        }
        
        // Add one more student for this click
        const newStudentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        
        await supabase
          .from('attendance_records')
          .insert({
            class_id: classId,
            // school_id column doesn't exist in attendance_records table
            student_id: newStudentId,
            student_name: newStudentId,
            status: 'present',
            timestamp: timestamp,
          });
        
        records.push({
          studentId: newStudentId,
          status: "present" as const,
          timestamp: timestamp
        });
        
        // Reload data to get the latest from database
        await loadData();
        setAttendanceCounter(prev => prev + 1);
      }
      
      toast({
        title: "Attendance marked",
        description: "Student has been marked present for this class."
      });
    } catch (error: any) {
      console.error('Error marking student present:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark attendance',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        classes,
        students,
        apps,
        attendanceData,
        addClass,
        updateClass,
        deleteClass,
        addStudent,
        updateStudent,
        deleteStudent,
        removeStudent,
        addStudentToClass,
        removeStudentFromClass,
        toggleAppForClass,
        getStudentsForClass,
        getClassById,
        getStudentById,
        addCustomApp,
        markStudentPresent,
        attendanceCounter,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
