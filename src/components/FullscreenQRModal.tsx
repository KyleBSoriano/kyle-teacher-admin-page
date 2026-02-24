
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Users, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { useRealTimeAttendance } from "@/hooks/useRealTimeAttendance";
import { useQRRefresh } from "@/hooks/useQRRefresh";
import { toast } from "@/hooks/use-toast";
import AnimatedAttendanceCounter from "@/components/AnimatedAttendanceCounter";

interface FullscreenQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  hideSidebar?: boolean; // Hide the Check-In sidebar for admin use
}

const FullscreenQRModal = ({ open, onOpenChange, classId, hideSidebar = false }: FullscreenQRModalProps) => {
  const { getClassById } = useAppContext();
  const classData = getClassById(classId);
  
  // Get total students for current class - use actual enrolled count
  const totalStudents = classData ? (classData.students?.length || 0) : 0;
  
  // Extract period number from class period string (e.g., "Period 1" -> 1)
  const periodMatch = classData?.period?.match(/Period\s+(\d+)/i);
  const periodNumber = periodMatch ? parseInt(periodMatch[1]) : 1;
  
  // Use real-time attendance hook with actual student count and correct period
  const { attendanceCount, visualCount, addAttendance } = useRealTimeAttendance(
    classId, 
    totalStudents || 16, 
    periodNumber
  );
  
  // Local state for manual increments (hardcoded for testing)
  const [manualIncrement, setManualIncrement] = useState(0);
  
  // Reset manual increment when modal closes
  useEffect(() => {
    if (!open) {
      setManualIncrement(0);
    }
  }, [open]);
  
  // Generate static QR code (no rotation)
  const { generateQRValue } = useQRRefresh();
  const qrValue = generateQRValue(classId);
  
  const classTitle = classData ? classData.subject : "Class";
  const classPeriod = classData ? classData.period : "";
  
  // Handle clicking the attendance circle to increment attendance (hardcoded +1)
  const handleAttendanceClick = async () => {
    // Hardcode: just increment the manual counter by 1
    setManualIncrement(prev => prev + 1);
    
    toast({
      title: "Attendance added",
      description: "Student attendance has been recorded successfully.",
    });
  };
  
  // Calculate displayed count (real count + manual increments)
  const displayedCount = attendanceCount + manualIncrement;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 bg-gray-50 flex left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] border-0 shadow-none rounded-none [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0">

        {/* Left side - Check-In stats (hidden for admin) */}
        {!hideSidebar && (
          <div className="w-80 bg-white p-12 flex flex-col justify-center">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-8 text-[#012D68]">Check-In</h2>
                <AnimatedAttendanceCounter
                  count={displayedCount}
                  total={totalStudents || 16}
                  onCounterClick={handleAttendanceClick}
                  className="flex justify-center"
                />
                <p className="text-gray-500 mt-6 text-lg">of {totalStudents || 0} enrolled</p>
                
                {/* Small button to attendance page */}
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 text-sm py-2 h-9 px-4 rounded-lg"
                    asChild
                    onClick={() => onOpenChange(false)}
                  >
                    <Link to="/students">
                      <Users className="mr-2 h-4 w-4" />
                      View Attendance
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right side - Welcome and QR Code */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-12">
          <div className="flex flex-col items-center gap-12 max-w-2xl w-full">
            {/* Welcome Header */}
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold text-[#012D68]">Welcome to Class!</h1>
              <p className="text-2xl text-gray-600">Scan using the CLocked Mobile App</p>
            </div>

            {/* QR Code + Print button stacked with equal padding */}
            <div className="flex flex-col items-center gap-12">
              <div className="bg-white p-4 rounded-3xl shadow-lg">
                <div className="relative">
                  <QRCodeSVG 
                    value={qrValue}
                    size={420} 
                    level="H"
                    includeMargin={false}
                    fgColor="#012D68"
                    imageSettings={{
                      src: "/lovable-uploads/bed03e44-6800-40c2-b9ca-6b8e91a8aed6.png",
                      x: undefined,
                      y: undefined,
                      height: 48,
                      width: 48,
                      excavate: true,
                    }}
                  />
                </div>
              </div>
              <a
                href="/8.5x11-Printable-QR.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-9 rounded-md px-3 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print QR
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenQRModal;
