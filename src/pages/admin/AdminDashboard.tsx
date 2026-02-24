import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAppContext } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { useSchedule } from "@/context/ScheduleContext";
import { Search, HelpCircle, Calendar, ChevronLeft, ChevronRight, User, QrCode, Clock, LogOut } from "lucide-react";
import { ScheduleModal } from "@/components/ScheduleModal";
import { ViewScheduleModal } from "@/components/ViewScheduleModal";
import GoogleCalendarSchedule from "@/components/GoogleCalendarSchedule";
import FullscreenQRModal from "@/components/FullscreenQRModal";
import { useClassStatusSubtitle } from "@/hooks/useClassStatus";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { Student } from "@/types";
import { addWeeks, addDays, format, startOfWeek } from "date-fns";

const AdminDashboard = () => {
  const { students, classes } = useAppContext();
  const currentClass = classes.length > 0 ? classes[0] : undefined;
  const { user, schoolId } = useAuthContext();
  const { currentWeek, setCurrentWeek } = useSchedule();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchResultIndex, setSearchResultIndex] = useState(0);
  const [studentStatus, setStudentStatus] = useState<'CLocked In' | 'CLocked Out'>('CLocked Out');
  const [scheduleType, setScheduleType] = useState("MTWF");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [confirmClockOutOpen, setConfirmClockOutOpen] = useState(false);

  const classStatusSubtitle = useClassStatusSubtitle();

  // Set current week to 0 (current week) when component mounts
  useEffect(() => {
    setCurrentWeek(0);
  }, [setCurrentWeek]);

  // Load student attendance status from database
  useEffect(() => {
    const loadStudentStatus = async () => {
      if (!selectedStudent || !schoolId) {
        setStudentStatus('CLocked Out');
        return;
      }

      try {
        // First check the students table for clocked_in status (most reliable)
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('clocked_in')
          .eq('id', selectedStudent.id)
          .eq('school_id', schoolId)
          .single();

        if (studentError) {
          console.error('Error loading student clocked_in status:', studentError);
        }

        // If student is not clocked in, they're clocked out
        if (!studentData?.clocked_in) {
          setStudentStatus('CLocked Out');
          return;
        }

        // Student is clocked in
        setStudentStatus('CLocked In');
      } catch (error) {
        console.error('Error loading student status:', error);
        setStudentStatus('CLocked Out');
      }
    };

    loadStudentStatus();
  }, [selectedStudent, currentClass, schoolId]);

  // Handle search functionality - search all students in school (can return multiple matches)
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const searchLower = searchTerm.toLowerCase().trim();

      if (!searchLower) {
        setSearchResults([]);
        setSearchResultIndex(0);
        setSelectedStudent(null);
        return;
      }

      const matches = students.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(searchLower);
        const emailMatch = s.email?.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch;
      });

      setSearchResults(matches);
      setSearchResultIndex(0);
      if (matches.length > 0) {
        setSelectedStudent(matches[0]);
      } else {
        setSelectedStudent(null);
        toast({
          title: "Student not found",
          description: "No student found matching your search.",
          variant: "destructive"
        });
      }
    }
  };

  const hasMultipleResults = searchResults.length > 1;
  const goToPrevResult = () => {
    if (!hasMultipleResults || searchResultIndex <= 0) return;
    const nextIndex = searchResultIndex - 1;
    setSearchResultIndex(nextIndex);
    setSelectedStudent(searchResults[nextIndex]);
  };
  const goToNextResult = () => {
    if (!hasMultipleResults || searchResultIndex >= searchResults.length - 1) return;
    const nextIndex = searchResultIndex + 1;
    setSearchResultIndex(nextIndex);
    setSelectedStudent(searchResults[nextIndex]);
  };

  // Get student initials for avatar
  const getStudentInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle clock out individual student
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
      // Call edge function to clock out student and send push notification
      const { data, error } = await supabase.functions.invoke("admin-clock-out-student", {
        body: { 
          student_id: selectedStudent.id, 
          school_id: schoolId 
        },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.ok) {
        throw new Error(data?.error || "Failed to clock out student");
      }

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
      // Call edge function to clock out all students and send push notifications
      const { data, error } = await supabase.functions.invoke("admin-clock-out-school", {
        body: { 
          school_id: schoolId 
        },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.ok) {
        throw new Error(data?.error || "Failed to clock out all students");
      }

      toast({
        title: "Success",
        description: data.message || `All students in your school have been clocked out${data.clocked_out_count > 0 ? ` (${data.clocked_out_count} students)` : ''}`,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#012D68] mb-1">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-base">{classStatusSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setConfirmClockOutOpen(true)}
            variant="outline"
            className="bg-white border border-[#012D68] text-[#012D68] hover:bg-gray-50 hover:border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <LogOut className="mr-3 h-6 w-6" /> Clock Out All
          </Button>
          <Button 
            onClick={() => setQrDialogOpen(true)}
            className="bg-[#012D68] hover:bg-[#011f4a] text-white border-2 border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <QrCode className="mr-3 h-6 w-6" /> View QR
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left subsection - same layout as schedule page, different content */}
        <div className="lg:col-span-2">
          {/* Individual Student Profiles */}
          <Card className="border-0 shadow-lg rounded-lg overflow-hidden">
            <div className="bg-[#012D68] rounded-t-lg p-4">
              <div className="flex items-center mb-1">
                <CardTitle className="text-xl font-bold text-white">
                  Individual Student Profiles
                </CardTitle>
                <HelpTooltip content="Search for students to view their profiles, CLocked status, and manage IEP accommodations" />
              </div>
              <p className="text-gray-200 text-sm">CLock In/Out Individual Students</p>
            </div>
            <CardContent className="p-6">
              {/* Search Bar - inside subsection; (1/N) when multiple matches */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#012D68] w-5 h-5 z-10" />
                <Input
                  type="text"
                  placeholder="Search Students..."
                  className={`pl-10 py-2 text-base bg-white border border-[#012D68] rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 text-[#012D68] placeholder:text-[#012D68]/60 ${hasMultipleResults ? 'pr-14' : 'pr-4'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                />
                {hasMultipleResults && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#012D68]/80 text-sm font-medium">
                    ({searchResultIndex + 1}/{searchResults.length})
                  </span>
                )}
              </div>
              {selectedStudent ? (
                <div>
                  <div className="pt-0 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                        <div className="bg-gray-200 text-[#012D68] font-semibold text-sm w-12 h-12 rounded-full flex items-center justify-center">
                          {getStudentInitials(selectedStudent.name)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <h3 className="text-2xl font-bold text-[#012D68]">{selectedStudent.name}</h3>
                        <p className="text-gray-600 text-base">
                          {selectedStudent.email || 'No email provided'}
                        </p>
                        <Badge variant="outline" className={`w-fit px-4 py-1 ${
                          studentStatus === 'CLocked Out'
                            ? 'text-gray-800 border-gray-300 bg-gray-50'
                            : 'text-blue-800 border-blue-200 bg-blue-50'
                        }`}>
                          {studentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-9 w-9 shrink-0 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 ${hasMultipleResults ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                        onClick={goToPrevResult}
                        disabled={!hasMultipleResults || searchResultIndex <= 0}
                        aria-label="Previous result"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-9 w-9 shrink-0 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 ${hasMultipleResults ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                        onClick={goToNextResult}
                        disabled={!hasMultipleResults || searchResultIndex >= searchResults.length - 1}
                        aria-label="Next result"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      className="bg-[#012D68] hover:bg-[#011f4a] text-white px-6 py-1.5 text-sm"
                      onClick={handleClockOutStudent}
                      disabled={studentStatus === 'CLocked Out'}
                    >
                      CLock Student Out
                    </Button>
                  </div>
                </div>
              ) : (
                /* Default Student Profile with Low Opacity */
                <div className="opacity-40">
                  <div className="py-6">
                    <div className="flex items-start gap-6">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <h3 className="text-2xl font-bold text-[#A8B3C7]">Student Profile</h3>
                        <p className="text-gray-400 text-base">Email</p>
                        <Badge variant="outline" className="text-gray-400 border-gray-300 bg-gray-50 w-fit px-4 py-1">
                          Status
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 border border-gray-300 bg-white text-gray-400 opacity-40 cursor-not-allowed"
                        disabled
                        aria-label="Previous result"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 border border-gray-300 bg-white text-gray-400 opacity-40 cursor-not-allowed"
                        disabled
                        aria-label="Next result"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      className="bg-[#A8B3C7] text-white px-6 py-1.5 text-sm cursor-not-allowed"
                      disabled
                    >
                      CLock Student Out
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right subsection - same as schedule page; schedule page adds preset row below dates */}
        <div className="lg:col-span-3">
          <GoogleCalendarSchedule 
            title={(() => {
              const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), currentWeek);
              const weekEnd = addDays(weekStart, 4);
              return `${format(weekStart, 'MMMM do')}-${format(weekEnd, 'do')}`;
            })()}
            description="This Week's Bell Schedule"
            onEditClick={() => navigate('/admin/schedule')}
            onBlockClick={(block, _day, date) => {
              navigate('/admin/schedule', {
                state: {
                  fromDashboardBlock: true,
                  currentWeek,
                  date,
                  period: block.period,
                  startTime: block.startTime,
                  endTime: block.endTime,
                },
              });
            }}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            timeGridOffsetPx={-10}
            showVerticalDivider={true}
          />
        </div>
      </div>

      {/* View Schedule Modal */}
      <ViewScheduleModal 
        isOpen={isViewScheduleModalOpen} 
        onClose={() => setIsViewScheduleModalOpen(false)} 
      />
      
      {/* Schedule Creation Modal */}
      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
      />

      {/* QR Code Modal */}
      <FullscreenQRModal 
        open={qrDialogOpen} 
        onOpenChange={setQrDialogOpen} 
        classId={currentClass?.id || ''} 
        hideSidebar={true}
      />

      {/* Student Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-md p-0">
          <div className="bg-[#012D68] rounded-t-lg p-4">
            <div className="flex items-center mb-1">
              <DialogTitle className="text-xl font-bold text-white">Student Profile</DialogTitle>
            </div>
            <p className="text-gray-200 text-sm">View student details and attendance status</p>
          </div>
          {selectedStudent ? (
            <div className="space-y-6 px-6 py-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="bg-gray-200 text-[#012D68] font-semibold text-lg w-16 h-16 rounded-full flex items-center justify-center">
                    {getStudentInitials(selectedStudent.name)}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#012D68]">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.email || 'No email provided'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <Badge variant="outline" className={`${
                      studentStatus === 'CLocked Out' 
                        ? 'text-gray-800 border-gray-300 bg-gray-50' 
                        : 'text-blue-800 border-blue-200 bg-blue-50'
                    }`}>
                      {studentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setProfileModalOpen(false)}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Close
                </Button>
                <Button
                  className="bg-[#012D68] hover:bg-[#011f4a] text-white"
                  onClick={() => {
                    handleClockOutStudent();
                    setProfileModalOpen(false);
                  }}
                  disabled={studentStatus === 'CLocked Out'}
                >
                  CLock Student Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 px-6 py-6">
              <p className="text-gray-600 text-center">No student selected</p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setProfileModalOpen(false)}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clock Out All Confirmation Dialog */}
      <AlertDialog open={confirmClockOutOpen} onOpenChange={setConfirmClockOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#012D68]">Clock Out All Students?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to clock out all students in your school? This action will clock out all currently clocked-in students and remove their app restrictions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCLockOutAll}
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

export default AdminDashboard;
