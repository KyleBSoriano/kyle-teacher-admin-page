import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addWeeks, addDays, startOfWeek } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the date for a specific day in a specific week
 * This ensures consistent date calculations across the app
 * @param weekOffset - The week offset from current week (0 = current week, 1 = next week, -1 = last week)
 * @param dayIndex - The day index (0 = Monday, 4 = Friday)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getDateForDayInWeek(weekOffset: number, dayIndex: number): string {
  // Get the Monday of the current week
  const today = new Date();
  const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
  
  // Add the week offset (0 = current week, 1 = next week, etc.)
  const targetWeek = addWeeks(currentWeekMonday, weekOffset);
  
  // Add the day offset
  const targetDate = addDays(targetWeek, dayIndex);
  
  // Return ISO date string
  return targetDate.toISOString().split('T')[0];
}
