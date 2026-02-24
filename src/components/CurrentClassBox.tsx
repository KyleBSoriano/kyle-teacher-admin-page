
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Asterisk } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CurrentClassBoxProps {
  currentClass: {
    id: string;
    period: string;
    subject?: string;
    allowedApps: string[];
  } | undefined;
}

const CurrentClassBox = ({ currentClass }: CurrentClassBoxProps) => {
  const { students, apps, attendanceData, getStudentsForClass, updateClass } = useAppContext();
  const [originalAllowedApps, setOriginalAllowedApps] = useState<string[]>([]);
  const [isTestModeActive, setIsTestModeActive] = useState(false);

  if (!currentClass) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-[#0a2558] mb-4">No Current Class</h2>
        <p className="text-gray-500">You don't have any active classes at the moment.</p>
        <div className="mt-4">
          <Button className="bg-[#0a2558] hover:bg-[#153a7a]" asChild>
            <Link to="/classes/new">Create a Class</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get students for this class
  const classStudents = getStudentsForClass(currentClass.id);
  
  // Get latest attendance for this class
  const classAttendance = attendanceData
    .filter(data => data.classId === currentClass.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
  // Get attendance records
  const attendanceRecords = classAttendance?.records || [];
  
  // Calculate attendance stats
  const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
  const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
  const tardyCount = attendanceRecords.filter(record => record.status === 'tardy').length;

  // Sort students alphabetically by last name
  const sortedStudents = [...classStudents].sort((a, b) => {
    const aLastName = a.name.split(' ').pop() || '';
    const bLastName = b.name.split(' ').pop() || '';
    return aLastName.localeCompare(bLastName);
  });
  
  // Sort allowed apps alphabetically
  const allowedAppsList = apps
    .filter(app => currentClass.allowedApps.includes(app.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Test mode activation
  const activateTestMode = async () => {
    try {
      // Before activating test mode, save current allowed apps
      setOriginalAllowedApps([...currentClass.allowedApps]);
      
      // Test mode allows only specific apps
      const testModeApps = ["clock", "findmy", "settings", "emergency sos", "digital wellness", "health"];
      
      // Find the IDs of the apps that should be allowed in test mode
      const testModeAppIds = apps
        .filter(app => testModeApps.includes(app.name.toLowerCase()))
        .map(app => app.id);
      
      // Update the class with the test mode apps
      await updateClass(currentClass.id, {
        allowedApps: testModeAppIds
      });
      
      setIsTestModeActive(true);
      
      // Show toast message
      toast({
        title: "Test Mode Activated",
        description: "Only essential apps are now allowed in this class."
      });
    } catch (error) {
      console.error('Error activating test mode:', error);
      // Error is already handled by updateClass
    }
  };

  // Class mode activation
  const activateClassMode = async () => {
    try {
      // Restore original apps
      await updateClass(currentClass.id, {
        allowedApps: originalAllowedApps
      });
      
      setIsTestModeActive(false);
      
      // Show toast message
      toast({
        title: "Class Mode Activated",
        description: "Restored original app permissions for this class."
      });
    } catch (error) {
      console.error('Error activating class mode:', error);
      // Error is already handled by updateClass
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[#0a2558]">
          Current Class - {currentClass.period}
        </h2>
        {currentClass.subject && (
          <p className="text-[#0a2558]/70 mt-1">{currentClass.subject}</p>
        )}
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-[#0a2558] mb-3 text-center">Allowed Apps</h3>
            <ScrollArea className="h-[180px] w-full pr-4 border border-gray-100 rounded-md">
              <div className="space-y-2 px-1">
                {allowedAppsList.length > 0 ? (
                  allowedAppsList.map(app => (
                    <div key={app.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center">
                        <p className="text-[#0a2558]">{app.name}</p>
                      </div>
                      <Switch checked={true} className="data-[state=checked]:bg-[#0a2558]" />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No apps configured</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[#0a2558] mb-3 text-center">Attendance</h3>
            <ScrollArea className="h-[180px] border border-gray-100 rounded-md">
              <div className="space-y-2 p-1">
                {sortedStudents.length > 0 ? (
                  sortedStudents.map(student => {
                    const record = attendanceRecords.find(record => record.studentId === student.id);
                    const status = record?.status || 'absent';
                    
                    return (
                      <div key={student.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center">
                          <p className="text-[#0a2558]">{student.name}</p>
                          {status === 'tardy' && (
                            <Asterisk className="ml-1 h-3 w-3 text-[#0a2558]" />
                          )}
                        </div>
                        <div 
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            status === 'present' ? "bg-[#0a2558] text-white" :
                            status === 'tardy' ? "bg-[#0a2558] text-white" :
                            "bg-white border border-gray-300 text-gray-700"
                          )}
                        >
                          {status === 'present' ? 'Present' :
                           status === 'tardy' ? 'Tardy' :
                           'Absent'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8">No students in this class.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-[#0a2558]/30 text-[#0a2558] hover:bg-[#0a2558]/10"
              asChild
            >
              <Link to={`/classes/${currentClass.id}/apps`}>
                Update allowed apps
              </Link>
            </Button>
            
            {isTestModeActive ? (
              <Button 
                className="bg-[#0a2558] hover:bg-[#153a7a] text-white"
                onClick={activateClassMode}
              >
                Class Mode
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-[#33C3F0] hover:bg-[#33C3F0]/80 text-white">
                    Test Mode
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Activate Test Mode?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restrict all apps except for the essential ones: Clock, Find My, Settings, Emergency SOS, Digital Wellness, and Health.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={activateTestMode}>Activate</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <Button 
            className="bg-[#0a2558] hover:bg-[#153a7a]"
            asChild
          >
            <Link to="/students">View students</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CurrentClassBox;
