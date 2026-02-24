import { useEffect, useState } from 'react';
import { useSchedule } from '@/context/ScheduleContext';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

export const CurrentClassStatus = () => {
  const { scheduleBlocks } = useSchedule();
  const [currentTime, setCurrentTime] = useState(new Date());

  // SIMULATION MODE: Simulating 8:35 AM with Period 1 active
  const SIMULATE_ACTIVE_CLASS = true;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulated active class for testing
  if (SIMULATE_ACTIVE_CLASS) {
    return (
      <div className="inline-flex items-center h-9 px-4 py-2 bg-white border border-[#012D68] text-[#012D68] rounded-md text-sm font-medium">
        <Clock className="mr-2 h-4 w-4" />
        <span>Period 1 - Active (52 min left)</span>
      </div>
    );
  }

  const getCurrentAndUpcomingClass = () => {
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
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Use PST time for comparison - convert to minutes since midnight PST
    const currentMinutesPST = pstTime.getHours() * 60 + pstTime.getMinutes();
    
    // Parse time string to minutes (same format as stored in DB: "1:05 PM")
    const parseTimeToMinutes = (timeStr: string): number => {
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

    for (const block of todaySchedule) {
      // Check if currently in this block using PST time comparison
      const startMinutes = parseTimeToMinutes(block.start_time);
      const endMinutes = parseTimeToMinutes(block.end_time);
      
      if (currentMinutesPST >= startMinutes && currentMinutesPST <= endMinutes) {
        const minutesRemaining = endMinutes - currentMinutesPST;

        return {
          type: 'current' as const,
          period: block.period,
          time: block.end_time,
          minutesRemaining
        };
      }
    }

    // Find upcoming class
    for (const block of todaySchedule) {
      const startMinutes = parseTimeToMinutes(block.start_time);
      
      if (currentMinutesPST < startMinutes) {
        const minutesUntil = startMinutes - currentMinutesPST;

        return {
          type: 'upcoming' as const,
          period: block.period,
          time: block.start_time,
          minutesUntil
        };
      }
    }

    return null;
  };

  const classStatus = getCurrentAndUpcomingClass();

  if (!classStatus) {
    return (
      <div className="inline-flex items-center h-9 px-4 py-2 bg-white border border-[#012D68] text-[#012D68] rounded-md text-sm font-medium">
        <Clock className="mr-2 h-4 w-4" />
        <span>No Active Class</span>
      </div>
    );
  }

  if (classStatus.type === 'current') {
    return (
      <div className="inline-flex items-center h-9 px-4 py-2 bg-white border border-[#012D68] text-[#012D68] rounded-md text-sm font-medium">
        <Clock className="mr-2 h-4 w-4" />
        <span>{classStatus.period} - Active ({classStatus.minutesRemaining} min left)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center h-9 px-4 py-2 bg-white border border-[#012D68] text-[#012D68] rounded-md text-sm font-medium">
      <Clock className="mr-2 h-4 w-4" />
      <span>{classStatus.period} - Starts in {classStatus.minutesUntil} min</span>
    </div>
  );
};
