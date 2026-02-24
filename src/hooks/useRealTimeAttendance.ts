
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

interface AttendanceRecord {
  id: string;
  class_id: string;
  student_name: string | null;
  student_id: string | null;
  status: string;
  timestamp: string;
  created_at: string;
  period: number;
  clocked_out_at: string | null;
}

export const useRealTimeAttendance = (classId: string, totalStudents: number = 16, period: number = 1, dateFilter?: string) => {
  const { schoolId } = useAuthContext();
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(0);
  const channelRef = useRef<any>(null);

  // Use dateFilter if provided, otherwise use today
  const queryDate = dateFilter || new Date().toISOString().split('T')[0];

  // Load initial attendance count - count enrolled students who are clocked in
  useEffect(() => {
    const loadInitialCount = async () => {
      if (!classId) {
        setAttendanceCount(0);
        setIsLoading(false);
        return;
      }

      try {
        // Get students enrolled in this class
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', classId);

        if (enrollError) {
          console.error('Error loading enrollments:', enrollError);
          setAttendanceCount(0);
          setIsLoading(false);
          return;
        }

        if (!enrollments || enrollments.length === 0) {
          setAttendanceCount(0);
          setIsLoading(false);
          return;
        }

        const studentIds = enrollments.map(e => e.student_id);

        // Count students with clocked_in = true (matching StudentsPage logic)
        const { data: clockedInStudents, error } = await supabase
          .from('students')
          .select('id')
          .in('id', studentIds)
          .eq('clocked_in', true);

        if (error) {
          console.error('Error loading clocked-in students:', error);
          setAttendanceCount(0);
        } else {
          const count = clockedInStudents?.length || 0;
          console.log('📊 Initial attendance count loaded:', count);
          setAttendanceCount(count);
        }
      } catch (error) {
        console.error('Error in loadInitialCount:', error);
        setAttendanceCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialCount();
  }, [classId, period, forceRefresh, queryDate]);

  // Poll for attendance updates periodically - count enrolled students who are clocked in
  useEffect(() => {
    if (!classId) return;

    const pollInterval = setInterval(async () => {
      try {
        // Get students enrolled in this class
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', classId);

        if (enrollError) {
          console.error('Polling error loading enrollments:', enrollError);
          return;
        }

        if (!enrollments || enrollments.length === 0) {
          setAttendanceCount(0);
          return;
        }

        const studentIds = enrollments.map(e => e.student_id);

        // Count students with clocked_in = true
        const { data: clockedInStudents, error } = await supabase
          .from('students')
          .select('id')
          .in('id', studentIds)
          .eq('clocked_in', true);

        if (!error && clockedInStudents) {
          const currentCount = clockedInStudents.length;
          setAttendanceCount(prev => {
            if (prev !== currentCount) {
              console.log('🔄 Polling detected count change from', prev, 'to', currentCount);
              return currentCount;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds for faster updates

    return () => clearInterval(pollInterval);
  }, [classId, period, queryDate]);

  // Set up real-time subscription to students table for clocked_in changes
  useEffect(() => {
    if (!classId || !schoolId) return;

    // Cleanup any existing channel first
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing channel before creating new one');
      channelRef.current.unsubscribe();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('🔄 Setting up realtime subscription for class:', classId, 'period:', period);
    
    // Create a unique channel name
    const channelName = `attendance-${classId}-${period}-${Math.random().toString(36).substring(7)}`;
    
    // Cache enrolled student IDs for this class
    let enrolledStudentIds: string[] = [];
    const loadEnrolledIds = async () => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId);
      enrolledStudentIds = enrollments?.map(e => e.student_id) || [];
      console.log('📋 Cached enrolled student IDs:', enrolledStudentIds.length);
    };
    loadEnrolledIds();

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'students',
          filter: `school_id=eq.${schoolId}`
        },
        (payload) => {
          console.log('🔥 Real-time UPDATE received on students table:', payload);
          const updatedStudent = payload.new as { id: string; clocked_in: boolean };
          
          // Check if this student is enrolled in our class
          if (!enrolledStudentIds.includes(updatedStudent.id)) {
            return; // Not enrolled in this class, ignore
          }

          // If student clocked in, increment count
          if (updatedStudent.clocked_in === true) {
            console.log('✅ Student clocked in detected, incrementing count');
            setAttendanceCount(prev => {
              const newCount = prev + 1;
              console.log('📊 Updating attendance count from', prev, 'to', newCount);
              return newCount;
            });
            setForceRefresh(prev => prev + 1);
          } 
          // If student clocked out, decrement count
          else if (updatedStudent.clocked_in === false) {
            console.log('👋 Student clocked out detected, decrementing count');
            setAttendanceCount(prev => {
              const newCount = Math.max(0, prev - 1);
              console.log('Student clocked out, updating attendance count from', prev, 'to', newCount);
              return newCount;
            });
            setForceRefresh(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enrollments',
          filter: `class_id=eq.${classId}`
        },
        () => {
          // Reload enrolled IDs when new enrollment is added
          loadEnrolledIds();
        }
      );

    // Store the channel reference
    channelRef.current = channel;

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('📡 Realtime subscription status:', status, 'for channel:', channelName);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to realtime updates for students table');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to realtime channel');
      }
    });

    return () => {
      console.log('🧹 Cleaning up realtime subscription');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [classId, period, schoolId]);

  const addAttendance = async (studentName?: string, studentId?: string) => {
    if (!classId) {
      console.error('❌ No classId provided for attendance');
      return;
    }

    console.log('🎯 Adding attendance for class:', classId, 'period:', period, 'student:', studentName || 'Anonymous');
    
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          class_id: classId,
          student_name: studentName || null,
          student_id: studentId || null,
          status: 'in',  // Changed from 'present' to 'in' to match clock-in system
          period: period,
          clocked_out_at: null  // Not clocked out
        })
        .select();

      if (error) {
        console.error('❌ Error adding attendance:', error);
        throw error;
      }
      
      console.log('✅ Attendance added successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to add attendance:', error);
      throw error;
    }
  };

  const clockOutStudent = async (studentId: string) => {
    console.log('Clocking out student:', studentId);
    
    if (!schoolId) {
      throw new Error('School ID not found');
    }
    
    try {
      // Call edge function to clock out student and send push notification
      const { data, error } = await supabase.functions.invoke("admin-clock-out-student", {
        body: { 
          student_id: studentId, 
          school_id: schoolId 
        },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.ok) {
        throw new Error(data?.error || "Failed to clock out student");
      }

      console.log('Student clocked out successfully');
      return { success: true, message: 'Student clocked out successfully' };
    } catch (error) {
      console.error('Failed to clock out student:', error);
      throw error;
    }
  };

  // Calculate visual count using modulo 17 logic
  const visualCount = attendanceCount % 17;

  return {
    attendanceCount, // Full backend count
    visualCount, // Visual count (0-16)
    isLoading,
    addAttendance,
    clockOutStudent, // New clock-out function
    forceRefresh // Export force refresh for external triggers
  };
};
