import { useState, useEffect } from "react";
import { useSchedule } from "@/context/ScheduleContext";

function isDaylightSavingTime(date: Date): boolean {
  const year = date.getFullYear();
  const march = new Date(year, 2, 1);
  const november = new Date(year, 10, 1);
  let secondSundayMarch = march;
  let sundayCount = 0;
  while (sundayCount < 2) {
    if (secondSundayMarch.getDay() === 0) sundayCount++;
    if (sundayCount < 2) secondSundayMarch = new Date(secondSundayMarch.getTime() + 86400000);
  }
  let firstSundayNovember = november;
  while (firstSundayNovember.getDay() !== 0) {
    firstSundayNovember = new Date(firstSundayNovember.getTime() + 86400000);
  }
  return date >= secondSundayMarch && date < firstSundayNovember;
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === "PM";
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return 0;
}

export function useClassStatus() {
  const { scheduleBlocks } = useSchedule();
  const [currentClassStatus, setCurrentClassStatus] = useState("No Currently Active Class");
  const [minutesUntilNextClass, setMinutesUntilNextClass] = useState<number | null>(null);

  useEffect(() => {
    const updateClassStatus = () => {
      const now = new Date();
      const isDST = isDaylightSavingTime(now);
      const pstOffset = -8 * 60;
      const actualOffset = isDST ? -7 * 60 : pstOffset;
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const pstTime = new Date(utcTime + actualOffset * 60000);
      const today = new Date(pstTime);
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const todaySchedule = scheduleBlocks
        .filter((block) => block.schedule_date === todayStr)
        .sort((a, b) => parseTimeToMinutes(a.start_time || "") - parseTimeToMinutes(b.start_time || ""));
      const currentMinutes = pstTime.getHours() * 60 + pstTime.getMinutes();

      for (const block of todaySchedule) {
        if (!block.start_time || !block.end_time) continue;
        const startMinutes = parseTimeToMinutes(block.start_time);
        const endMinutes = parseTimeToMinutes(block.end_time);
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          const minutesRemaining = endMinutes - currentMinutes;
          setMinutesUntilNextClass(null);
          setCurrentClassStatus(`Current Class: ${block.period} - Active (${minutesRemaining} min left)`);
          return;
        }
      }

      setCurrentClassStatus("No Currently Active Class");
      const nextBlock = todaySchedule.find(
        (block) => block.start_time && parseTimeToMinutes(block.start_time) > currentMinutes
      );
      if (nextBlock && nextBlock.start_time) {
        setMinutesUntilNextClass(parseTimeToMinutes(nextBlock.start_time) - currentMinutes);
      } else {
        setMinutesUntilNextClass(null);
      }
    };

    updateClassStatus();
    const interval = setInterval(updateClassStatus, 60000);
    return () => clearInterval(interval);
  }, [scheduleBlocks]);

  return { currentClassStatus, minutesUntilNextClass };
}

/** Returns a single subtitle string matching teacher dashboard format (for admin pages). */
export function useClassStatusSubtitle(): string {
  const { currentClassStatus, minutesUntilNextClass } = useClassStatus();
  if (currentClassStatus === "No Currently Active Class" && minutesUntilNextClass != null) {
    return `No Currently Active Class — Next class starts in ${minutesUntilNextClass} min`;
  }
  return currentClassStatus;
}
