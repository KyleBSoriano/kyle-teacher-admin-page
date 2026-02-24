import { cn } from "@/lib/utils";
import { School, Settings, User, HelpCircle } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { useSchedule } from "@/context/ScheduleContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar = ({
  open,
  setOpen
}: SidebarProps) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const periodParam = searchParams.get('period') || 'period1';
  const { classes } = useAppContext();
  const { scheduleBlocks } = useSchedule();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePeriod, setActivePeriod] = useState<{ period: string; startTime: string; endTime: string } | null>(null);

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

  const navItems = [
    {
      name: "Dashboard",
      path: `/?period=${periodParam}`,
      icon: <School className="h-5 w-5" />
    },
    {
      name: "Students",
      path: `/students?period=${periodParam}`,
      icon: <User className="h-5 w-5" />
    }
  ];

  const bottomNavItems = [
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5" />
    },
    {
      name: "Help",
      path: "/help",
      icon: <HelpCircle className="h-5 w-5" />
    }
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-16 z-40 h-[calc(100vh-64px)] bg-[#8dc4e0] shadow-md transition-all duration-300",
      open ? "w-48" : "w-0"
    )}>
      {open && (
        <>
          <nav className="pt-6 px-3 space-y-2">
            {navItems.map(item => {
              const pathBase = item.path.split('?')[0];
              return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  location.pathname === pathBase
                    ? "bg-[#012D68] text-white"
                    : "text-[#012D68] hover:bg-[#012D68]/10"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            );
            })}
            
            {/* Divider with more spacing */}
            <div className="mx-auto my-6 w-3/4 border-t border-[#012D68]/20"></div>
            
            <div className="pt-2">
              {bottomNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-[#012D68] text-white"
                    : "text-[#012D68] hover:bg-[#012D68]/10"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
