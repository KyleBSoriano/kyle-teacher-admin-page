import { useEffect, useState } from 'react';
import { useSchedule } from '@/context/ScheduleContext';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

export const ActivePeriodIndicator = () => {
  const { scheduleBlocks } = useSchedule();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePeriod, setActivePeriod] = useState<{
    period: string;
    minutesRemaining: number;
  } | null>(null);

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
      // Helper to check if date is in daylight saving time (PST/PDT)
      const isDaylightSavingTime = (date: Date): boolean => {
        // DST in US Pacific: Second Sunday in March to First Sunday in November
        const year = date.getFullYear();
        const march = new Date(year, 2, 1); // March 1
        const november = new Date(year, 10, 1); // November 1
        
        // Find second Sunday in March
        let secondSundayMarch = march;
        let sundayCount = 0;
        while (sundayCount < 2) {
          if (secondSundayMarch.getDay() === 0) sundayCount++;
          if (sundayCount < 2) secondSundayMarch = new Date(secondSundayMarch.getTime() + 86400000);
        }
        
        // Find first Sunday in November
        let firstSundayNovember = november;
        while (firstSundayNovember.getDay() !== 0) {
          firstSundayNovember = new Date(firstSundayNovember.getTime() + 86400000);
        }
        
        return date >= secondSundayMarch && date < firstSundayNovember;
      };
      
      // Convert current time to PST/PDT
      const now = currentTime;
      const isDST = isDaylightSavingTime(now);
      const pstOffset = -8 * 60; // PST offset in minutes (UTC-8)
      const actualOffset = isDST ? -7 * 60 : pstOffset; // PDT is UTC-7
      
      // Get PST/PDT time
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pstTime = new Date(utcTime + (actualOffset * 60000));
      
      // Get today's date in PST
      const today = new Date(pstTime);
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0]; // "2024-01-15"
      
      const todaySchedule = scheduleBlocks
        .filter(block => block.schedule_date === todayStr)
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

      // Use PST time for comparison
      const currentMinutes = pstTime.getHours() * 60 + pstTime.getMinutes();

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
          const minutesRemaining = endMinutes - currentMinutes;
          setActivePeriod({
            period: block.period,
            minutesRemaining
          });
          return;
        }
      }

      // No active period found
      setActivePeriod(null);
    };

    findActivePeriod();
  }, [scheduleBlocks, currentTime]);

  if (!activePeriod) {
    return (
      <div className="bg-white border border-[#012D68] text-[#012D68] px-6 py-2 text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 w-fit">
        <Clock className="w-5 h-5" />
        No Current Class Active
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#012D68] text-[#012D68] px-6 py-2 text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 w-fit">
      <Clock className="w-5 h-5" />
      {activePeriod.period} - Active ({activePeriod.minutesRemaining} min left)
    </div>
  );
};

