import { format } from 'date-fns';
import { ScheduleBlock } from '@/context/ScheduleContext';

/**
 * Get schedule block times for a specific class period on a given date
 * Schedule blocks are already school-scoped via ScheduleContext
 */
export const getClassTimesFromSchedule = (
  classPeriod: string,
  scheduleBlocks: ScheduleBlock[],
  date?: string
): { startTime: string; endTime: string } | null => {
  const targetDate = date || format(new Date(), 'yyyy-MM-dd');
  const normalizedPeriod = classPeriod.trim();

  const matchingBlock = scheduleBlocks.find(
    (block) =>
      block.schedule_date === targetDate &&
      block.period.trim().toLowerCase() === normalizedPeriod.toLowerCase()
  );

  if (!matchingBlock) {
    return null;
  }

  return {
    startTime: matchingBlock.start_time,
    endTime: matchingBlock.end_time,
  };
};

/**
 * Get the day's time range (earliest start to latest end) from schedule blocks
 */
export const getDayTimeRange = (
  scheduleBlocks: ScheduleBlock[],
  date: string
): { startTime: string; endTime: string } | null => {
  const dayBlocks = scheduleBlocks.filter((block) => block.schedule_date === date);

  if (dayBlocks.length === 0) {
    return null;
  }

  // Parse times and find earliest start and latest end
  let earliestStart: string | null = null;
  let latestEnd: string | null = null;

  dayBlocks.forEach((block) => {
    if (!earliestStart || block.start_time < earliestStart) {
      earliestStart = block.start_time;
    }
    if (!latestEnd || block.end_time > latestEnd) {
      latestEnd = block.end_time;
    }
  });

  if (!earliestStart || !latestEnd) {
    return null;
  }

  return {
    startTime: earliestStart,
    endTime: latestEnd,
  };
};

/**
 * Parse time string (e.g., "1:00 PM") to minutes since midnight
 */
const parseTimeToMinutes = (timeStr: string): number => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    // Try 24-hour format
    const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);
      return hours * 60 + minutes;
    }
    return 0;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

/**
 * Check if current time is within a time range
 */
export const isWithinTimeRange = (
  currentTime: Date,
  startTime: string,
  endTime: string
): boolean => {
  const now = currentTime;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  // Handle case where end time is next day (e.g., 11 PM to 1 AM)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

/**
 * Check if current time is within the day's time range
 */
export const isWithinDayTimeRange = (
  currentTime: Date,
  dayRange: { startTime: string; endTime: string }
): boolean => {
  return isWithinTimeRange(currentTime, dayRange.startTime, dayRange.endTime);
};

/**
 * Get the currently active period based on current time
 */
export const getActivePeriodForTime = (
  currentTime: Date,
  scheduleBlocks: ScheduleBlock[],
  date: string
): string | null => {
  const dayBlocks = scheduleBlocks.filter((block) => block.schedule_date === date);

  for (const block of dayBlocks) {
    if (isWithinTimeRange(currentTime, block.start_time, block.end_time)) {
      return block.period;
    }
  }

  return null;
};

/**
 * Check if a specific period is currently active
 */
export const isPeriodCurrentlyActive = (
  period: string,
  scheduleBlocks: ScheduleBlock[],
  date: string
): boolean => {
  const activePeriod = getActivePeriodForTime(new Date(), scheduleBlocks, date);
  return activePeriod?.trim().toLowerCase() === period.trim().toLowerCase();
};

/**
 * Get the currently active period key (e.g. "period1", "period4") for URL/state.
 * Returns null if no period is active.
 */
export const getActivePeriodKey = (
  scheduleBlocks: ScheduleBlock[]
): string | null => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const activePeriod = getActivePeriodForTime(new Date(), scheduleBlocks, today);
  if (!activePeriod) return null;
  const num = activePeriod.replace(/\D/g, '');
  return num ? `period${num}` : null;
};

