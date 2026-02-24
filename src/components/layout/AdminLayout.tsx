import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { useAppContext } from "@/context/AppContext";
import { useSchedule } from "@/context/ScheduleContext";
import { useRealTimeAttendance } from "@/hooks/useRealTimeAttendance";
import AnimatedAttendanceCounter from "@/components/AnimatedAttendanceCounter";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Grid3X3,
  Settings, 
  HelpCircle,
  Menu
} from "lucide-react";
import Header from "./Header";
import { toast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { classes } = useAppContext();
  const { scheduleBlocks } = useSchedule();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePeriod, setActivePeriod] = useState<{ period: string; startTime: string; endTime: string } | null>(null);

  // Get current class (use the first class as an example)
  const currentClass = classes.length > 0 ? classes[0] : undefined;

  // Get total students for current class (fixed to 16)
  const totalStudents = 16;

  // Use real-time attendance hook with total students
  const { attendanceCount, visualCount, addAttendance } = useRealTimeAttendance(currentClass?.id || '', totalStudents);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Find currently active period from schedule blocks
  useEffect(() => {
    const findActivePeriod = () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todaySchedule = scheduleBlocks
        .filter(block => block.schedule_date === today)
        .sort((a, b) => {
          // Sort by start time - handle both "HH:MM" and "H:MM AM/PM" formats
          const parseTime = (timeStr: string): number => {
            if (!timeStr) return 0;
            // Try 24-hour format first (HH:MM)
            if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours * 60 + minutes;
            }
            // Try 12-hour format (H:MM AM/PM)
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

      const now = currentTime;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const block of todaySchedule) {
        if (!block.start_time || !block.end_time) continue;

        const parseTimeToMinutes = (timeStr: string): number => {
          // Try 24-hour format first (HH:MM)
          if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          }
          // Try 12-hour format (H:MM AM/PM)
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
          setActivePeriod({
            period: block.period,
            startTime: block.start_time,
            endTime: block.end_time
          });
          return;
        }
      }

      // No active period found
      setActivePeriod(null);
    };

    findActivePeriod();
  }, [scheduleBlocks, currentTime]);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Apps', href: '/admin/apps', icon: Grid3X3 },
    { name: 'Schedule', href: '/admin/schedule', icon: Calendar },
  ];

  const secondaryNavigation = [
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Help', href: '/admin/help', icon: HelpCircle },
  ];

  // Handle clicking the attendance circle to increment attendance
  const handleAttendanceClick = async () => {
    if (currentClass) {
      try {
        await addAttendance(`Manual Entry ${Date.now()}`);
        toast({
          title: "Attendance added",
          description: "Student attendance has been recorded successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add attendance. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Use the same Header component as teacher dashboard */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Admin Sidebar - matching teacher layout */}
      <aside className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-64px)] bg-[#8dc4e0] shadow-md transition-all duration-300",
        sidebarOpen ? "w-48" : "w-0"
      )}>
        {sidebarOpen && (
          <>
            <nav className="pt-6 px-3 space-y-2">
              {navigation.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/admin'}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[#012D68] text-white"
                          : "text-[#012D68] hover:bg-[#012D68]/10"
                      )
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span className="ml-3">{item.name}</span>
                  </NavLink>
                );
              })}
              
              {/* Divider with more spacing */}
              <div className="mx-auto my-6 w-3/4 border-t border-[#012D68]/20"></div>
              
              <div className="pt-2">
                {secondaryNavigation.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[#012D68] text-white"
                            : "text-[#012D68] hover:bg-[#012D68]/10"
                        )
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span className="ml-3">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </nav>
            
            {/* Clocked-in count at Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-2 bg-[#8dc4e0]">
              {/* Divider above count */}
              <div className="mx-auto mb-4 w-3/4 border-t border-[#012D68]/20"></div>
              
              <div className="text-center text-[#012D68] rounded-lg p-2">
                <p className="text-2xl font-bold text-[#012D68] mb-1">{attendanceCount}</p>
                <p className="text-sm font-medium text-[#012D68]">CLocked In</p>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Content - matching teacher layout */}
      <div className={cn("flex-1 transition-all duration-300 pt-16", sidebarOpen ? "ml-48" : "ml-0")}>
        <main className="p-6 h-[calc(100vh-64px)] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;