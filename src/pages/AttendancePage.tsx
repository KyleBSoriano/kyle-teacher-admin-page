
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { Progress } from "@/components/ui/progress";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const AttendancePage = () => {
  const { classes, attendanceData, getStudentsForClass } = useAppContext();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  
  const classAttendance = attendanceData.filter(data => data.classId === selectedClassId);
  const latestAttendance = classAttendance[0]; // Most recent attendance record
  
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const students = getStudentsForClass(selectedClassId);
  const attendanceRecords = latestAttendance?.records || [];
  
  // Calculate student counts by status
  const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
  const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
  const tardyCount = attendanceRecords.filter(record => record.status === 'tardy').length;
  
  // Filter students by search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const renderStatusBadge = (status: 'present' | 'absent' | 'tardy') => {
    switch(status) {
      case 'present':
        return (
          <div className="bg-[#0a2558] text-white rounded-full px-4 py-1 text-center w-24">
            Present
          </div>
        );
      case 'absent':
        return (
          <div className="bg-white border border-gray-300 text-gray-700 rounded-full px-4 py-1 text-center w-24">
            Absent
          </div>
        );
      case 'tardy':
        return (
          <div className="bg-[#0a2558] text-white rounded-full px-4 py-1 text-center w-24">
            Tardy
          </div>
        );
      default:
        return null;
    }
  };
  
  // Get the status for a student
  const getStudentStatus = (studentId: string) => {
    const record = attendanceRecords.find(record => record.studentId === studentId);
    return record?.status || 'absent';
  };

  // Calculate attendance percentage
  const attendancePercentage = students.length > 0 
    ? Math.round((presentCount / students.length) * 100) 
    : 0;
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-[#0a2558]">Attendance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Class Selector */}
        <div className="md:col-span-1">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(classItem => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      {/* Class Info and Attendance Stats - In a column layout */}
      <div className="grid grid-cols-1 gap-6">
        {/* Attendance Chart - Now full width */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">{selectedClass?.period || "No Class Selected"}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedClass?.period ? `${selectedClass.period}` : ""}
            </p>
            
            <div className="flex justify-between items-center mb-2">
              <span>Attendance</span>
              <span className="font-medium">{presentCount} of {students.length}</span>
            </div>
            <Progress value={attendancePercentage} className="h-2 mb-6 bg-gray-200" style={{ 
              "--background": "#e6e6e6", 
              "--indicator": "linear-gradient(90deg, #0a2558, #1e40af)" 
            }} />
            
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <div className="font-bold text-[#0a2558] text-lg">{presentCount}</div>
                <div className="text-gray-600">Present</div>
              </div>
              <div>
                <div className="font-bold text-[#0a2558] text-lg">{tardyCount}</div>
                <div className="text-gray-600">Tardy</div>
              </div>
              <div>
                <div className="font-bold text-gray-500 text-lg">{absentCount}</div>
                <div className="text-gray-600">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Student List - Now full width below the attendance chart */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Student Status</h2>
            <div className="space-y-3">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const status = getStudentStatus(student.id);
                  const isLateArrival = status === 'tardy';
                  
                  return (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between border-b border-gray-100 py-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isLateArrival && <span className="text-[#0a2558] text-xl">*</span>}
                        {renderStatusBadge(status)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {searchQuery ? "No students match your search." : "No students in this class."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Utility function to get ordinal suffix
function getOrdinalSuffix(str: string): string {
  // Extract number if the string has a numeric part
  const match = str.match(/\d+/);
  if (!match) return "";
  
  const num = parseInt(match[0], 10);
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}

export default AttendancePage;
