import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { useRealTimeAttendance } from "@/hooks/useRealTimeAttendance";
import { Student } from "@/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import HelpTooltip from "@/components/ui/HelpTooltip";
import FullscreenQRModal from "@/components/FullscreenQRModal";
import { Users, Plus, Search, Download, Filter, LogOut, UserX, QrCode, Clock } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useClassStatusSubtitle } from "@/hooks/useClassStatus";

const AdminStudentsPage = () => {
  const {
    students,
    classes,
    addStudent,
    removeStudent
  } = useAppContext();
  const currentClass = classes.length > 0 ? classes[0] : undefined;

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Omit<Student, "id">>({
    name: "",
    email: "",
    grade: 9,
    classIds: []
  });

  // Get all students from database (admin sees all students in school)
  const periodStudents = students;
  const {
    attendanceCount,
    visualCount,
    clockOutStudent,
    forceRefresh
  } = useRealTimeAttendance(currentClass?.id || '', 16,
  // Keep original attendance tracking
  1 // Always use period 1
  );

  // Admin dashboard shows total students from database
  const totalStudentsAdmin = students.length;
  const displayAttendanceCount = attendanceCount;
  const displayVisualCount = visualCount;

  const classStatusSubtitle = useClassStatusSubtitle();

  // Get student attendance status
  const getStudentAttendanceStatus = (studentId: string, index: number) => {
    // Use the visual count to determine who should be "clocked in"
    // visualCount represents the current attendance (0-16)
    if (index < displayVisualCount) {
      return 'CLocked In';
    }
    return 'CLocked Out';
  };
  const resetAttendance = async () => {
    if (!currentClass) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const {
        error
      } = await supabase.from('attendance_records').delete().eq('class_id', currentClass.id).eq('period', 1).gte('timestamp', today).lt('timestamp', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]);
      if (error) {
        throw error;
      }

      // Force a page refresh to ensure all components update properly
      window.location.reload();
      toast({
        title: "All students clocked out",
        description: `Attendance has been reset to 0 for today. All students have been clocked out.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clock out all students. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleClockOutStudent = async (studentId: string, studentName: string) => {
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

  // Filter students to show CLocked In students - now depends on forceRefresh for real-time updates
  const clockedInStudents = useMemo(() => {
    const filtered = periodStudents.filter((student, index) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase());
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
  }, [periodStudents, searchTerm, displayVisualCount, forceRefresh]);

  // Get CLocked Out students - now depends on forceRefresh for real-time updates
  const clockedOutStudents = useMemo(() => {
    return periodStudents.filter((student, index) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getStudentAttendanceStatus(student.id, index);
      return matchesSearch && status === 'CLocked Out';
    });
  }, [periodStudents, searchTerm, displayVisualCount, forceRefresh]);
  const handleAddStudent = () => {
    if (newStudent.name && newStudent.email) {
      addStudent(newStudent);

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
    }
  };
  const getAttendanceStats = () => {
    // Use admin total (100) but keep real attendance count synced
    const totalStudents = totalStudentsAdmin;
    const clockedInCount = periodStudents.filter((s, index) => getStudentAttendanceStatus(s.id, index) === 'CLocked In').length;
    const clockedOutCount = totalStudents - displayVisualCount; // Use admin total minus actual attendance

    return {
      totalStudents,
      clockedInStudents: displayVisualCount,
      // Keep synced with teacher dashboard
      clockedOutStudents: clockedOutCount,
      clockedInOnly: clockedInCount
    };
  };

  // Recalculate stats whenever forceRefresh changes
  const stats = useMemo(() => getAttendanceStats(), [periodStudents, displayVisualCount, forceRefresh]);
  return <div className="space-y-6">
      <AdminPageHeader title="Admin Students" subtitle={classStatusSubtitle} />

        {/* Days of Week */}
        <div className="flex items-center gap-4 mt-8 mb-6">
          <div className="flex gap-2">
            <Button variant="default" size="sm" className="bg-[#012D68] hover:bg-[#011f4a] text-white border border-[#012D68] shadow-lg transition-all duration-200 hover:scale-105 w-12 px-0 py-2 text-base font-semibold">
              M
            </Button>
            <Button variant="outline" size="sm" className="border-[#012D68] text-[#012D68] hover:bg-[#012D68] hover:text-white w-12 px-0 py-2 text-base font-semibold">
              T
            </Button>
            <Button variant="outline" size="sm" className="border-[#012D68] text-[#012D68] hover:bg-[#012D68] hover:text-white w-12 px-0 py-2 text-base font-semibold">
              W
            </Button>
            <Button variant="outline" size="sm" className="border-[#012D68] text-[#012D68] hover:bg-[#012D68] hover:text-white w-12 px-0 py-2 text-base font-semibold">
              R
            </Button>
            <Button variant="outline" size="sm" className="border-[#012D68] text-[#012D68] hover:bg-[#012D68] hover:text-white w-12 px-0 py-2 text-base font-semibold">
              F
            </Button>
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
              <p className="text-gray-200 text-sm">Students who have checked in today</p>
            </div>
            <CardContent className="p-4">
              {/* Search Bar in Students Section */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input type="text" placeholder="Search Students..." className="pl-10 bg-white border-gray-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              {clockedInStudents.length > 0 ? <div className="space-y-1">
                   {clockedInStudents.map((student, index) => {
              const studentIndex = periodStudents.findIndex(s => s.id === student.id);
              const attendanceStatus = getStudentAttendanceStatus(student.id, studentIndex);
              const isEven = index % 2 === 0;
              return <div key={student.id} className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${isEven ? 'bg-blue-50/30' : 'bg-transparent'} hover:bg-blue-100/40 group`}>
                        <div className="flex-1 cursor-pointer" onClick={() => handleClockOutStudent(student.id, student.name)}>
                          <h3 className="font-medium text-[#012D68] text-lg">{student.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#012D68]">
                            CLocked In
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleClockOutStudent(student.id, student.name)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto">
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>;
            })}
                </div> : <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-[#012D68] mb-2">No students clocked in</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? 'No clocked in students match your search.' : 'No students have checked in yet.'}
                  </p>
                  <Button onClick={() => setAddStudentDialogOpen(true)} className="bg-[#012D68] hover:bg-[#011f4a]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                </div>}
            </CardContent>
          </Card>

          {/* Right Column - Attendance & Controls */}
          <div className="space-y-6">
            {/* Attendance Card */}
            <Card className="border-0 shadow-lg">
              <div className="bg-[#012D68] rounded-t-lg p-4">
                <div className="flex items-center mb-1">
                  <CardTitle className="text-xl font-bold text-white">Attendance</CardTitle>
                  <HelpTooltip content="Overall attendance statistics and percentage for today's class" />
                </div>
                <p className="text-gray-200 text-sm">Today's attendance summary</p>
              </div>
              <CardContent className="p-4">
                <div className="text-center space-y-4">
                  {/* Fraction Display */}
                  <div className="text-5xl font-bold text-[#012D68]">
                    {stats.clockedInStudents}/{stats.totalStudents}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-[#012D68] h-3 rounded-full transition-all duration-300" style={{
                  width: `${stats.clockedInStudents / stats.totalStudents * 100}%`
                }}></div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-lg font-medium text-[#012D68]">
                      CLocked In Today
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {stats.clockedInOnly} CLocked In - {stats.clockedOutStudents} CLocked Out
                    </div>
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
                <p className="text-gray-200 text-sm">Students who haven't checked in</p>
              </div>
              <CardContent className="p-4">
                {clockedOutStudents.length > 0 ? <div className="space-y-1">
                    {clockedOutStudents.map((student, index) => <div key={student.id} className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${index % 2 === 0 ? 'bg-blue-50/30' : 'bg-transparent'} hover:bg-blue-100/40`}>
                        <div className="flex-1">
                          <h3 className="font-medium text-[#012D68] text-lg">{student.name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-[#012D68]">
                            CLocked Out
                          </span>
                        </div>
                      </div>)}
                  </div> : <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-[#012D68] mb-2">All students are clocked in!</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'No clocked out students match your search.' : 'Great job! Everyone is present.'}
                    </p>
                  </div>}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Student Dialog */}
        <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" value={newStudent.name} onChange={e => setNewStudent({
              ...newStudent,
              name: e.target.value
            })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" value={newStudent.email} onChange={e => setNewStudent({
              ...newStudent,
              email: e.target.value
            })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade" className="text-right">
                  Grade
                </Label>
                <Select value={newStudent.grade.toString()} onValueChange={value => setNewStudent({
              ...newStudent,
              grade: parseInt(value)
            })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[9, 10, 11, 12].map(grade => <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddStudent} disabled={!newStudent.name || !newStudent.email} className="bg-[#012D68] hover:bg-[#011f4a]">
                Add Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>;
};
export default AdminStudentsPage;