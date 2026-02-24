import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { useSchedule } from "@/context/ScheduleContext";
import { useRealTimeAttendance } from "@/hooks/useRealTimeAttendance";
import { Student } from "@/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import HelpTooltip from "@/components/ui/HelpTooltip";
import FullscreenQRModal from "@/components/FullscreenQRModal";
import { addDays, startOfWeek, format } from "date-fns";
import { getActivePeriodKey } from "@/utils/scheduleUtils";
import { 
  Users, 
  Plus, 
  Search, 
  Download,
  LogOut,
  QrCode
} from "lucide-react";

const StudentsPage = () => {
  const { students, classes, addStudent, removeStudent } = useAppContext();
  const { schoolId } = useAuthContext();
  const { scheduleBlocks } = useSchedule();
  const [currentClassStatus, setCurrentClassStatus] = useState("No Currently Active Class");
  const [minutesUntilNextClass, setMinutesUntilNextClass] = useState<number | null>(null);

  // State management
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get('period');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(periodParam || "period1");
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 1 : new Date().getDay()); // 1=Monday, 2=Tuesday, etc. Default to today
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [confirmClockOutOpen, setConfirmClockOutOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Omit<Student, "id">>({
    name: "",
    email: "",
    grade: 9,
    classIds: []
  });
  const [studentAttendanceMap, setStudentAttendanceMap] = useState<Map<string, { status: string; timestamp: string }>>(new Map());

  // Get the selected date based on day index - recalculate when selectedDayIndex changes
  const selectedDate = useMemo(() => {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 }); // Get Monday of current week
    return addDays(monday, selectedDayIndex - 1); // selectedDayIndex: 1=Mon, 2=Tue, etc.
  }, [selectedDayIndex]);

  // Extract period number from selectedPeriod
  const periodNumber = parseInt(selectedPeriod.replace('period', ''));
  
  // Get the class for the selected period
  const selectedClass = classes.find((c) => {
    const classPeriodNum = parseInt(c.period.replace('Period ', ''));
    return classPeriodNum === periodNumber;
  });
  
  // Get students enrolled in the selected period's class (or empty array if no class selected)
  const periodStudents = selectedClass 
    ? students.filter((student) => selectedClass.students?.includes(student.id))
    : []; // Show empty array if no class selected, not all students
  
  // Get total students for selected class - use actual enrolled count
  const totalStudents = selectedClass ? (selectedClass.students?.length || 0) : 0;
  
  // Debug logging for student filtering
  useEffect(() => {
    if (selectedClass?.id === '9608a350-bca6-4303-b84a-064100c90bd0') {
      console.log('🔍 StudentsPage Debug:', {
        selectedClassId: selectedClass.id,
        selectedClassSubject: selectedClass.subject,
        selectedClassPeriod: selectedClass.period,
        selectedClassStudentIds: selectedClass.students,
        totalStudents: students.length,
        periodStudentsCount: periodStudents.length,
        targetStudentId: '16440aa1-4e1c-4ef6-983a-4308c1df8eb3',
        targetStudentInList: students.some(s => s.id === '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'),
        targetStudentInClass: selectedClass.students?.includes('16440aa1-4e1c-4ef6-983a-4308c1df8eb3'),
        allStudentIds: students.map(s => s.id)
      });
    }
  }, [selectedClass, students, periodStudents]);
  
  // Format selected date for database query - recalculate when selectedDate changes
  const selectedDateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  
  const { attendanceCount, visualCount, forceRefresh } = useRealTimeAttendance(
    selectedClass?.id || '', 
    totalStudents || 16, 
    periodNumber,
    selectedDateStr
  );

  // For Period 1, show real attendance. For others, show 0.
  const displayAttendanceCount = periodNumber === 1 ? attendanceCount : 0;
  const displayVisualCount = periodNumber === 1 ? visualCount : 0;

  // Update current class status (same logic as ClassesPage)
  useEffect(() => {
    const updateClassStatus = () => {
      const isDaylightSavingTime = (date: Date): boolean => {
        const year = date.getFullYear();
        const march = new Date(year, 2, 1);
        const november = new Date(year, 10, 1);
        let secondSundayMarch = march;
        let sundayCount = 0;
        while (sundayCount < 2) {
          if (secondSundayMarch.getDay() === 0) sundayCount++;
          if (sundayCount < 2) secondSundayMarch = new Date(secondSundayMarch.getTime() + 86400000);
        }
        let firstSundayNovember = november;
        while (firstSundayNovember.getDay() !== 0) {
          firstSundayNovember = new Date(firstSundayNovember.getTime() + 86400000);
        }
        return date >= secondSundayMarch && date < firstSundayNovember;
      };
      const now = new Date();
      const isDST = isDaylightSavingTime(now);
      const pstOffset = -8 * 60;
      const actualOffset = isDST ? -7 * 60 : pstOffset;
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pstTime = new Date(utcTime + (actualOffset * 60000));
      const today = new Date(pstTime);
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      const todaySchedule = scheduleBlocks
        .filter(block => block.schedule_date === todayStr)
        .sort((a, b) => {
          const parseTime = (timeStr: string): number => {
            if (!timeStr) return 0;
            if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours * 60 + minutes;
            }
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (match) {
              let hours = parseInt(match[1]);
              const minutes = parseInt(match[2]);
              const isPM = match[3].toUpperCase() === 'PM';
              if (isPM && hours !== 12) hours += 12;
              if (!isPM && hours === 12) hours = 0;
              return hours * 60 + minutes;
            }
            return 0;
          };
          return parseTime(a.start_time || '') - parseTime(b.start_time || '');
        });
      const currentMinutes = pstTime.getHours() * 60 + pstTime.getMinutes();
      for (const block of todaySchedule) {
        if (!block.start_time || !block.end_time) continue;
        const parseTimeToMinutes = (timeStr: string): number => {
          if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          }
          const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (match) {
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const isPM = match[3].toUpperCase() === 'PM';
            if (isPM && hours !== 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
            return hours * 60 + minutes;
          }
          return 0;
        };
        const startMinutes = parseTimeToMinutes(block.start_time);
        const endMinutes = parseTimeToMinutes(block.end_time);
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          const minutesRemaining = endMinutes - currentMinutes;
          setMinutesUntilNextClass(null);
          setCurrentClassStatus(`Current Class: ${block.period} - Active (${minutesRemaining} min left)`);
          return;
        }
      }
      setCurrentClassStatus("No Currently Active Class");
      const parseTimeToMinutesForNext = (timeStr: string): number => {
        if (!timeStr) return 0;
        if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        }
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const isPM = match[3].toUpperCase() === 'PM';
          if (isPM && hours !== 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
          return hours * 60 + minutes;
        }
        return 0;
      };
      const nextBlock = todaySchedule.find(block => block.start_time && parseTimeToMinutesForNext(block.start_time) > currentMinutes);
      if (nextBlock) {
        setMinutesUntilNextClass(parseTimeToMinutesForNext(nextBlock.start_time) - currentMinutes);
      } else {
        setMinutesUntilNextClass(null);
      }
    };
    updateClassStatus();
    const interval = setInterval(updateClassStatus, 60000);
    return () => clearInterval(interval);
  }, [scheduleBlocks]);

  // Sync period from URL and default to active period when no period in URL (e.g. on login)
  useEffect(() => {
    if (periodParam) {
      setSelectedPeriod(periodParam);
      return;
    }
    const activeKey = getActivePeriodKey(scheduleBlocks);
    if (activeKey) {
      setSelectedPeriod(activeKey);
      setSearchParams({ period: activeKey });
    }
  }, [periodParam, scheduleBlocks]);

  // Export attendance data to CSV
  const exportAttendanceCSV = () => {
    const csvData = clockedInStudents.map((student, index) => {
      const studentIndex = periodStudents.findIndex(s => s.id === student.id);
      const status = getStudentAttendanceStatus(student.id, studentIndex);
      return {
        Name: student.name,
        Email: student.email,
        Status: status,
        Period: periodNumber,
        Date: format(selectedDate, 'yyyy-MM-dd')
      };
    });

    // Create CSV content
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-period${periodNumber}-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Attendance data exported for ${format(selectedDate, 'MMM d, yyyy')}`
    });
  };

  // Load clocked-in students from database
  useEffect(() => {
    const loadAttendanceRecords = async () => {
      if (!selectedClass) {
        setStudentAttendanceMap(new Map());
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');

        // Get students enrolled in this class who are clocked in
        const { data: enrolledStudents, error: enrollError } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', selectedClass.id);

        if (enrollError) {
          console.error('Error loading enrollments:', enrollError);
          return;
        }

        if (!enrolledStudents || enrolledStudents.length === 0) {
          setStudentAttendanceMap(new Map());
          return;
        }

        const studentIds = enrolledStudents.map(e => e.student_id);

        // Get clocked-in status for enrolled students
        const { data: students, error } = await supabase
          .from('students')
          .select('id, clocked_in, last_clock_in_at')
          .in('id', studentIds)
          .eq('clocked_in', true);

        if (error) {
          console.error('Error loading students:', error);
          return;
        }

        // Create map of student_id -> attendance status
        const attendanceMap = new Map<string, { status: string; timestamp: string }>();
        (students || []).forEach(student => {
          attendanceMap.set(student.id, {
            status: 'CLocked In',
            timestamp: student.last_clock_in_at || new Date().toISOString()
          });
        });

        setStudentAttendanceMap(attendanceMap);
        console.log('📊 Loaded clocked-in students:', {
          classId: selectedClass.id,
          period: periodNumber,
          clockedInCount: students?.length || 0,
          studentIds: Array.from(attendanceMap.keys())
        });
      } catch (error) {
        console.error('Error loading attendance:', error);
      }
    };

    loadAttendanceRecords();
    
    // Refresh every 5 seconds to get real-time updates
    const interval = setInterval(loadAttendanceRecords, 5000);
    return () => clearInterval(interval);
  }, [selectedClass, forceRefresh, periodNumber]);

  // Get student attendance status from actual database records
  const getStudentAttendanceStatus = (studentId: string, index: number) => {
    // Check actual attendance record from database
    const attendance = studentAttendanceMap.get(studentId);
    if (attendance) {
      return attendance.status; // 'CLocked In'
    }
    
    // Fallback to visual count for Period 1 (for backward compatibility)
    if (periodNumber === 1 && index < displayVisualCount) {
      if (index < Math.floor(displayVisualCount * 0.8)) return 'CLocked In';
      return 'CLocked In';
    }
    
    return 'CLocked Out';
  };

  const resetAttendance = async () => {
    if (!selectedClass || !schoolId) {
      toast({
        title: "Error",
        description: "Class or school ID not found",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Get all students enrolled in this class who are currently clocked in
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

      const studentIds = enrollments.map(e => e.student_id).filter((id): id is string => id !== null);

      // Get only clocked-in students
      const { data: clockedInStudents, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .in('id', studentIds)
        .eq('clocked_in', true)
        .eq('school_id', schoolId);

      if (studentsError) {
        throw studentsError;
      }

      if (!clockedInStudents || clockedInStudents.length === 0) {
        toast({
          title: "Info",
          description: "No students are currently clocked in for this class."
        });
        return;
      }

      // Clock out each student using the edge function (for push notifications)
      const clockOutPromises = clockedInStudents.map(student => 
        supabase.functions.invoke("admin-clock-out-student", {
          body: { 
            student_id: student.id, 
            school_id: schoolId 
          },
        })
      );

      // Wait for all clock-outs to complete
      const results = await Promise.allSettled(clockOutPromises);
      
      // Check if any failed
      const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
      
      if (failures.length > 0) {
        console.error('Some clock-outs failed:', failures);
        // Continue anyway - some may have succeeded
      }
      
      toast({
        title: "All students clocked out",
        description: `All ${clockedInStudents.length} clocked-in students in ${selectedClass.period} have been clocked out.`
      });
    } catch (error: any) {
      console.error('Error clocking out students:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to clock out all students. Please try again.",
        variant: "destructive"
      });
    }
  };


  // Filter students to show CLocked In students - now depends on forceRefresh for real-time updates
  const clockedInStudents = useMemo(() => {
    const filtered = periodStudents.filter((student, index) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getStudentAttendanceStatus(student.id, index);
      return matchesSearch && status === 'CLocked In';
    });
    
    // Sort by attendance status: CLocked In first
    return filtered.sort((a, b) => {
      const indexA = periodStudents.findIndex(s => s.id === a.id);
      const indexB = periodStudents.findIndex(s => s.id === b.id);
      const statusA = getStudentAttendanceStatus(a.id, indexA);
      const statusB = getStudentAttendanceStatus(b.id, indexB);
      
      if (statusA === 'CLocked In' && statusB === 'CLocked Out') return -1;
      if (statusA === 'CLocked Out' && statusB === 'CLocked In') return 1;
      return 0;
    });
  }, [periodStudents, searchTerm, displayVisualCount, periodNumber, forceRefresh, studentAttendanceMap]);

  // Get CLocked Out students - now depends on forceRefresh for real-time updates
  const clockedOutStudents = useMemo(() => {
    return periodStudents.filter((student, index) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getStudentAttendanceStatus(student.id, index);
      return matchesSearch && status === 'CLocked Out';
    });
  }, [periodStudents, searchTerm, displayVisualCount, periodNumber, forceRefresh, studentAttendanceMap]);

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email) {
      toast({
        title: "Error",
        description: "Student name and email are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addStudent(newStudent);
      
      // Reset form
      setNewStudent({
        name: "",
        email: "",
        grade: 9,
        classIds: []
      });
      
      setAddStudentDialogOpen(false);
      toast({
        title: "Student Added",
        description: `${newStudent.name} has been successfully added.`
      });
    } catch (error) {
      console.error("Error adding student:", error);
      // Error is already handled by addStudent
    }
  };

  const getAttendanceStats = () => {
    const totalStudents = periodStudents.length;
    // Count students with actual 'CLocked In' status from database
    const clockedInCount = periodStudents.filter((s, index) => getStudentAttendanceStatus(s.id, index) === 'CLocked In').length;
    const clockedOutCount = periodStudents.filter((s, index) => getStudentAttendanceStatus(s.id, index) === 'CLocked Out').length;
    
    // Use actual count from database (studentAttendanceMap) to match sidebar
    const actualClockedInCount = Array.from(studentAttendanceMap.keys()).length;
    
    return { 
      totalStudents, 
      clockedInStudents: actualClockedInCount, // Use actual count from database to match sidebar
      clockedOutStudents: totalStudents - actualClockedInCount,
      clockedInOnly: clockedInCount
    };
  };

  // Recalculate stats whenever attendance map or students change
  const stats = useMemo(() => getAttendanceStats(), [periodStudents, studentAttendanceMap, forceRefresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#012D68] mb-1">Students</h1>
            <p className="text-gray-600 text-base">
            {currentClassStatus.startsWith('Current Class: ') && currentClassStatus.includes(' - ') ? (
              <>
                Current Class: <span className="font-bold">{currentClassStatus.slice(15).split(' - ')[0]}</span>
                {' - ' + currentClassStatus.slice(15).split(' - ').slice(1).join(' - ')}
              </>
            ) : currentClassStatus.includes(' - ') ? (
              <>
                <span className="font-bold">{currentClassStatus.split(' - ')[0]}</span>
                {' - ' + currentClassStatus.split(' - ').slice(1).join(' - ')}
              </>
            ) : (
              <>
                {currentClassStatus}
                {currentClassStatus === "No Currently Active Class" && minutesUntilNextClass != null && (
                  <span className="text-gray-600"> — Next class starts in {minutesUntilNextClass} min</span>
                )}
              </>
            )}
          </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                if (selectedClass) setQrDialogOpen(true);
              }}
              disabled={!selectedClass || classes.length === 0}
              className={`bg-[#012D68] hover:bg-[#011f4a] text-white border-2 border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-200 ${!selectedClass || classes.length === 0 ? 'opacity-30' : ''}`}
            >
              <QrCode className="mr-3 h-6 w-6" /> View QR
            </Button>
          </div>
        </div>


        {/* Period Selection Row */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {classes.map((classItem, index) => {
              const period = index + 1;
              return (
                <Button
                  key={period}
                  variant={selectedPeriod === `period${period}` ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const key = `period${period}`;
                    setSelectedPeriod(key);
                    setSearchParams({ period: key });
                  }}
                  className={`transition-all duration-200 hover:scale-105 ${
                    selectedPeriod === `period${period}` 
                      ? "bg-[#012D68] hover:bg-[#011f4a] text-white shadow-lg" 
                      : "text-[#012D68] hover:bg-sky-100 hover:shadow-md"
                  }`}
                >
                  {classItem.period}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Students */}
          <Card className="border-0 shadow-lg">
            <div className="bg-[#012D68] rounded-t-lg p-4">
              <div className="flex items-center mb-1">
                <CardTitle className="text-xl font-bold text-white">CLocked In</CardTitle>
                <HelpTooltip content="Students who have checked in today" />
              </div>
              <p className="text-gray-200 text-sm">Students who are currently CLocked In</p>
            </div>
            <CardContent className="p-4">
              {/* Search Bar in Students Section */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  type="text"
                  placeholder="Search Students..."
                  className="pl-10 bg-white border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {clockedInStudents.length > 0 ? (
                 <div className="space-y-1">
                   {clockedInStudents.map((student, index) => {
                     const studentIndex = periodStudents.findIndex(s => s.id === student.id);
                     const attendanceStatus = getStudentAttendanceStatus(student.id, studentIndex);
                     const isEven = index % 2 === 0;
                    
                    return (
                      <div 
                        key={student.id} 
                        className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
                          isEven ? 'bg-blue-50/30' : 'bg-transparent'
                        } hover:bg-blue-100/40 group`}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-[#012D68] text-lg">{student.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-[#8dc4e0] bg-[#8dc4e0]/30 px-3 py-1 text-sm font-medium text-[#012D68]">
                            CLocked In
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Placeholder row showing where first student name will appear */}
                  <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-blue-50/30">
                    <div className="flex-1">
                      <span className="text-gray-400 text-lg">Student name will appear here</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-[#8dc4e0] bg-[#8dc4e0]/30 px-3 py-1 text-sm font-medium text-[#012D68] opacity-50">
                        CLocked In
                      </span>
                    </div>
                  </div>
                  <div className="text-center py-6">
                    <h3 className="text-lg font-medium text-[#012D68] mb-2">No Students CLocked In</h3>
                    <p className="text-gray-500 text-sm">
                      {searchTerm ? 'No clocked in students match your search.' : selectedClass ? `Use code ${selectedClass.code} to enroll in ${selectedClass.period} - ${selectedClass.subject}` : 'No students have checked in yet.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Attendance & Controls */}
          <div className="space-y-6">
            {/* Attendance Card */}
            <Card className="border-0 shadow-lg">
              <div className="bg-[#012D68] rounded-t-lg p-4">
                <div className="flex items-center mb-1">
                  <CardTitle className="text-xl font-bold text-white">Check-Ins</CardTitle>
                  <HelpTooltip content="Overall attendance statistics and percentage for today's class" />
                </div>
                <p className="text-gray-200 text-sm">Period {periodNumber} Check-In Summary</p>
              </div>
              <CardContent className="p-4">
                <div className="text-center space-y-4">
                  {/* Fraction Display */}
                  <div className="text-5xl font-bold text-[#012D68]">
                    {stats.clockedInStudents}/{stats.totalStudents}
                  </div>
                  <p className="text-sm font-medium text-[#012D68]">Students CLocked In</p>

                  {/* Progress bar and button in same-width wrapper so bar matches button */}
                  <div className="w-full space-y-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-[#012D68] h-3 rounded-full transition-all duration-300"
                        style={{ width: `${stats.totalStudents ? (stats.clockedInStudents / stats.totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <Button 
                      onClick={() => setConfirmClockOutOpen(true)}
                      variant="outline"
                      className="w-full border border-[#012D68] bg-white text-[#012D68] hover:bg-gray-50 hover:border-[#012D68] text-lg font-semibold shadow-lg transition-all duration-200"
                      disabled={clockedInStudents.length === 0}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Clock Out All Students
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CLocked Out Card */}
            <Card className="border-0 shadow-lg">
              <div className="bg-[#012D68] rounded-t-lg p-4">
                <div className="flex items-center mb-1">
                  <CardTitle className="text-xl font-bold text-white">CLocked Out</CardTitle>
                  <HelpTooltip content="Students who haven't checked in" />
                </div>
                <p className="text-gray-200 text-sm">Students who are currently CLocked Out</p>
              </div>
              <CardContent className="p-4">
                {clockedOutStudents.length > 0 ? (
                  <div className="space-y-1">
                    {clockedOutStudents.map((student, index) => (
                      <div 
                        key={student.id}
                        className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
                          index % 2 === 0 ? 'bg-blue-50/30' : 'bg-transparent'
                        } hover:bg-blue-100/40`}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-[#012D68] text-lg">{student.name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                            CLocked Out
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-[#012D68] font-medium">Everyone's here!</div>
                    <div className="text-sm text-gray-500 mt-1">All students are clocked in</div>
                  </div>
                )}
              </CardContent>
            </Card>

        </div>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                placeholder="Student name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                placeholder="student@school.edu"
              />
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={newStudent.grade.toString()} onValueChange={(value) => setNewStudent({...newStudent, grade: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {[9, 10, 11, 12].map(grade => (
                    <SelectItem key={grade} value={grade.toString()}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddStudent} className="bg-[#012D68] hover:bg-[#011f4a]">
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <FullscreenQRModal 
        open={qrDialogOpen} 
        onOpenChange={setQrDialogOpen}
        classId={selectedClass?.id || ''}
      />

      {/* Clock Out All Students Confirmation Dialog */}
      <AlertDialog open={confirmClockOutOpen} onOpenChange={setConfirmClockOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#012D68]">Clock Out All Students?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to clock out all students in {selectedClass?.period || 'this class'}? This action will clock out all currently clocked-in students in your class and remove their app restrictions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmClockOutOpen(false);
                await resetAttendance();
              }}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              Clock Out All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentsPage;