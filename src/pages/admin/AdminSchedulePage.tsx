import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Plus, Trash2, QrCode, Clock, Bookmark, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleCalendarSchedule from "@/components/GoogleCalendarSchedule";
import { addWeeks, addDays, format, startOfWeek } from "date-fns";
import { useSchedule } from "@/context/ScheduleContext";
import FullscreenQRModal from "@/components/FullscreenQRModal";
import { useAppContext } from "@/context/AppContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import PresetManagementModal from "@/components/PresetManagementModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getDateForDayInWeek } from "@/lib/utils";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { useClassStatusSubtitle } from "@/hooks/useClassStatus";
import { useLocation } from "react-router-dom";

const AdminSchedulePage = () => {
  const location = useLocation();
  const { classes } = useAppContext();
  const { schoolId } = useAuthContext();
  const currentClass = classes.length > 0 ? classes[0] : undefined;
  const { addScheduleBlock, updateScheduleBlock, deleteScheduleBlock, getScheduleForWeek, scheduleBlocks, refreshSchedule, currentWeek, setCurrentWeek } = useSchedule();
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const classStatusSubtitle = useClassStatusSubtitle();
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endPeriod, setEndPeriod] = useState("AM");

  // Auto-detect AM/PM based on time values crossing noon
  useEffect(() => {
    if (startTime && endTime) {
      const [startHour] = startTime.split(':').map(Number);
      const [endHour] = endTime.split(':').map(Number);
      
      // If start time is before noon (11:00 or earlier) and end time is 12:00 or after
      // This indicates crossing noon, so end time should be PM
      if (startHour < 12 && endHour >= 12 && startPeriod === 'AM') {
        setEndPeriod('PM');
      }
      
      // If end hour is less than start hour, it likely crosses noon
      // For example: 11:42 to 12:31 should be 11:42 AM to 12:31 PM
      if (startHour >= 11 && endHour === 12 && startPeriod === 'AM' && endPeriod === 'AM') {
        setEndPeriod('PM');
      }
    }
  }, [startTime, endTime, startPeriod]);
  const [selectedDate, setSelectedDate] = useState<string[]>(["22"]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [savingPresetForDay, setSavingPresetForDay] = useState<{day: string, date: number} | null>(null);
  const [showPresetManagement, setShowPresetManagement] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [confirmClockOutOpen, setConfirmClockOutOpen] = useState(false);

  // Apply navigation state when coming from dashboard (clicked a time block)
  const appliedDashboardNavRef = React.useRef(false);
  useEffect(() => {
    const state = location.state as { fromDashboardBlock?: boolean; currentWeek?: number; date?: number; period?: string; startTime?: string; endTime?: string } | null;
    if (!state?.fromDashboardBlock || state.date == null || state.currentWeek == null) {
      appliedDashboardNavRef.current = false;
      return;
    }
    if (appliedDashboardNavRef.current) return;
    appliedDashboardNavRef.current = true;

    const parseTimeString = (timeStr: string) => {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) return { time: '', period: 'AM' as const };
      return { time: `${timeMatch[1]}:${timeMatch[2]}`, period: timeMatch[3].toUpperCase() as 'AM' | 'PM' };
    };

    setCurrentWeek(state.currentWeek);
    setSelectedDate([String(state.date)]);
    setSelectedPeriod(state.period ?? '');
    if (state.startTime) {
      const startTimeData = parseTimeString(state.startTime);
      setStartTime(startTimeData.time);
      setStartPeriod(startTimeData.period);
    }
    if (state.endTime) {
      const endTimeData = parseTimeString(state.endTime);
      setEndTime(endTimeData.time);
      setEndPeriod(endTimeData.period);
    }

    const today = new Date();
    const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
    const currentWeekStart = addWeeks(currentWeekMonday, state.currentWeek);
    let dayIndex = -1;
    for (let i = 0; i < 5; i++) {
      const d = addDays(currentWeekStart, i);
      if (format(d, 'd') === String(state.date)) {
        dayIndex = i;
        break;
      }
    }
    if (dayIndex >= 0) {
      const scheduleDate = addDays(currentWeekStart, dayIndex);
      const scheduleDateStr = format(scheduleDate, 'yyyy-MM-dd');
      const correspondingBlock = scheduleBlocks.find(
        (sb) =>
          sb.period === state.period &&
          sb.schedule_date === scheduleDateStr &&
          sb.start_time === state.startTime &&
          sb.end_time === state.endTime
      );
      setSelectedBlockId(correspondingBlock?.id ?? null);
    }
  }, [location.state, scheduleBlocks]);

  const handleCLockOutAll = async () => {
    if (!schoolId) {
      toast({
        title: "Error",
        description: "School ID not found",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call edge function to clock out all students and send push notifications
      const { data, error } = await supabase.functions.invoke("admin-clock-out-school", {
        body: { 
          school_id: schoolId 
        },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.ok) {
        throw new Error(data?.error || "Failed to clock out all students");
      }

      toast({
        title: "Success",
        description: data.message || `All students in your school have been clocked out${data.clocked_out_count > 0 ? ` (${data.clocked_out_count} students)` : ''}`,
      });
      setConfirmClockOutOpen(false);
    } catch (error: any) {
      console.error('Error clocking out students:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clock out students",
        variant: "destructive"
      });
      setConfirmClockOutOpen(false);
    }
  };

  // Load presets from database on mount
  useEffect(() => {
    loadPresets();
  }, [schoolId]);

  const loadPresets = async () => {
    if (!schoolId) {
      setPresets([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('schedule_presets')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        console.log('📚 Loaded presets from database:', data);
        
        // Validate and parse schedule_blocks JSONB for each preset
        const validatedPresets = data.map(preset => {
          let blocks = preset.schedule_blocks;
          
          // Handle JSONB parsing - Supabase should auto-parse, but ensure it's valid
          if (typeof blocks === 'string') {
            try {
              blocks = JSON.parse(blocks);
            } catch (e) {
              console.error(`❌ Error parsing schedule_blocks for preset "${preset.name}":`, e);
              blocks = [];
            }
          }
          
          // Ensure blocks is an array
          if (!Array.isArray(blocks)) {
            console.warn(`⚠️ Preset "${preset.name}" has non-array schedule_blocks, converting...`);
            blocks = blocks ? [blocks] : [];
          }
          
          console.log(`📚 Preset "${preset.name}":`, {
            id: preset.id,
            schedule_blocks_type: typeof blocks,
            schedule_blocks_isArray: Array.isArray(blocks),
            schedule_blocks_length: Array.isArray(blocks) ? blocks.length : 'N/A',
            schedule_blocks_sample: Array.isArray(blocks) && blocks.length > 0 ? blocks[0] : null
          });
          
          return {
            ...preset,
            schedule_blocks: blocks
          };
        });
        
        setPresets(validatedPresets);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
      toast({
        title: "Error",
        description: "Failed to load presets",
        variant: "destructive"
      });
    }
  };

  // Set current week to 0 (current week) when component mounts
  useEffect(() => {
    setCurrentWeek(0);
  }, [setCurrentWeek]);

  const periods = [
    "Period 0", "Period 1", "Period 2", "Period 3", "Period 4",
    "Period 5", "Period 6", "Period 7", "Period 8"
  ];

  // Normalize day labels (short and long) to a 0-4 index (Mon-Fri)
  const getDayIndexFromLabel = (dayLabel: string) => {
    const map: Record<string, number> = {
      Monday: 0, Mon: 0,
      Tuesday: 1, Tues: 1, Tue: 1,
      Wednesday: 2, Wed: 2,
      Thursday: 3, Thur: 3, Thu: 3,
      Friday: 4, Fri: 4,
    };
    return map[dayLabel] ?? 0;
  };

  // Generate current week's dates
  const today = new Date();
  const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekStart = addWeeks(currentWeekMonday, currentWeek);
  const dates = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return format(date, 'd');
  });

  const handleBlockClick = (block: any, day: string, date: number) => {
    console.log('Block clicked:', block, 'Day:', day, 'Date:', date);
    
    // Parse the time string to extract time and period
    const parseTimeString = (timeStr: string) => {
      console.log('Parsing time string:', timeStr);
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) {
        console.log('No match found for time string:', timeStr);
        return { time: '', period: 'AM' };
      }
      
      const time = `${timeMatch[1]}:${timeMatch[2]}`;
      const period = timeMatch[3].toUpperCase();
      
      console.log('Parsed time:', { time, period });
      return { time, period };
    };

    const startTimeData = parseTimeString(block.startTime);
    const endTimeData = parseTimeString(block.endTime);
    
    console.log('Start time data:', startTimeData);
    console.log('End time data:', endTimeData);

    // Find the corresponding schedule block from database
    const dayIndex = dates.findIndex(d => d === date.toString());
    const today = new Date();
    const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
    const currentWeekStart = addWeeks(currentWeekMonday, currentWeek);
    const scheduleDate = addDays(currentWeekStart, dayIndex);
    const scheduleDateStr = scheduleDate.toISOString().split('T')[0];
    
    console.log('Looking for block with date:', scheduleDateStr);
    console.log('Available schedule blocks:', scheduleBlocks);
    
    // Improved matching logic - find exact match by period, date, and times
    const correspondingBlock = scheduleBlocks.find(sb => {
      const matchesPeriod = sb.period === block.period;
      const matchesDate = sb.schedule_date === scheduleDateStr;
      const matchesStartTime = sb.start_time === block.startTime;
      const matchesEndTime = sb.end_time === block.endTime;
      
      console.log('Checking block:', sb.id, {
        matchesPeriod,
        matchesDate,
        matchesStartTime,
        matchesEndTime,
        actualStartTime: sb.start_time,
        expectedStartTime: block.startTime,
        actualEndTime: sb.end_time,
        expectedEndTime: block.endTime
      });
      
      return matchesPeriod && matchesDate && matchesStartTime && matchesEndTime;
    });
    
    console.log('Found corresponding block:', correspondingBlock);

    // Update form with clicked block data
    setSelectedDate([date.toString()]);
    setSelectedPeriod(block.period);
    setStartTime(startTimeData.time);
    setEndTime(endTimeData.time);
    setStartPeriod(startTimeData.period);
    setEndPeriod(endTimeData.period);
    setSelectedBlockId(correspondingBlock?.id || null);
    
    console.log('Form updated with:', {
      selectedDate: [date.toString()],
      selectedPeriod: block.period,
      startTime: startTimeData.time,
      endTime: endTimeData.time,
      startPeriod: startTimeData.period,
      endPeriod: endTimeData.period,
      selectedBlockId: correspondingBlock?.id || null
    });
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (time: string, period: string): number => {
    let [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    return hour24 * 60 + (minutes || 0);
  };

  // Validation function
  const validateTimeBlock = () => {
    const errors = [];
    
    // Check if at least one date is selected
    if (selectedDate.length === 0) {
      errors.push("Please select at least one date");
    }
    
    // Check if period is selected
    if (!selectedPeriod) {
      errors.push("Please select a time block title");
    }
    
    // Check if start and end times are provided
    if (!startTime || !endTime) {
      errors.push("Please enter both start and end times");
    }
    
    // Validate time range (7:00 AM to 5:00 PM)
    if (startTime && endTime) {
      const validateTimeRange = (time: string, period: string) => {
        const timeInMinutes = timeToMinutes(time, period);
        const minTime = 7 * 60; // 7:00 AM
        const maxTime = 17 * 60; // 5:00 PM
        
        return timeInMinutes >= minTime && timeInMinutes <= maxTime;
      };
      
      if (!validateTimeRange(startTime, startPeriod)) {
        errors.push("Start time must be between 7:00 AM and 5:00 PM");
      }
      
      if (!validateTimeRange(endTime, endPeriod)) {
        errors.push("End time must be between 7:00 AM and 5:00 PM");
      }
      
      // Check if start time is before end time
      const startMinutes = timeToMinutes(startTime, startPeriod);
      const endMinutes = timeToMinutes(endTime, endPeriod);
      
      if (startMinutes >= endMinutes) {
        errors.push("Start time must be before end time");
      }
    }
    
    return errors;
  };

  // Check for overlapping blocks
  const checkOverlap = (dateStr: string): boolean => {
    const newStartMinutes = timeToMinutes(startTime, startPeriod);
    const newEndMinutes = timeToMinutes(endTime, endPeriod);
    
    // Get all blocks for the specific date
    const blocksForDate = scheduleBlocks.filter(block => {
      // Skip the block being edited
      if (selectedBlockId && block.id === selectedBlockId) {
        return false;
      }
      return block.schedule_date === dateStr;
    });
    
    // Check each existing block for overlap
    for (const block of blocksForDate) {
      // Parse existing block times
      const startMatch = block.start_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      const endMatch = block.end_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      
      if (!startMatch || !endMatch) continue;
      
      const existingStartMinutes = timeToMinutes(
        `${startMatch[1]}:${startMatch[2]}`,
        startMatch[3]
      );
      const existingEndMinutes = timeToMinutes(
        `${endMatch[1]}:${endMatch[2]}`,
        endMatch[3]
      );
      
      // Check for overlap (allowing adjacent blocks with same start/end time)
      // Overlap occurs if: new block starts before existing ends AND new block ends after existing starts
      // BUT we allow them to share the exact same start/end time (adjacent blocks)
      const overlaps = (
        newStartMinutes < existingEndMinutes && 
        newEndMinutes > existingStartMinutes
      );
      
      if (overlaps) {
        console.log('Overlap detected with block:', {
          existingBlock: block,
          newBlock: { start: newStartMinutes, end: newEndMinutes },
          existingTimes: { start: existingStartMinutes, end: existingEndMinutes }
        });
        return true;
      }
    }
    
    return false;
  };

  const handleCreateTimeBlock = async () => {
    console.log('handleCreateTimeBlock called, selectedBlockId:', selectedBlockId);
    
    // Validate input
    const validationErrors = validateTimeBlock();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join('\n'),
        variant: "destructive"
      });
      return;
    }
    
    // Check for overlapping blocks on each selected date
    const overlapDates: string[] = [];
    for (const date of selectedDate) {
      const dayIndex = dates.findIndex(d => d === date);
      const scheduleDateStr = getDateForDayInWeek(currentWeek, dayIndex);
      
      if (checkOverlap(scheduleDateStr)) {
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        overlapDates.push(dayNames[dayIndex]);
      }
    }
    
    if (overlapDates.length > 0) {
      toast({
        title: "Scheduling Conflict",
        description: `This time block overlaps with existing blocks on: ${overlapDates.join(', ')}. Please adjust the time or remove conflicting blocks.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Auto-correct AM/PM for times crossing noon
      let correctedStartPeriod = startPeriod;
      let correctedEndPeriod = endPeriod;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      // Convert to 24-hour format for comparison
      let start24 = startHour;
      if (startPeriod === 'PM' && startHour !== 12) start24 += 12;
      if (startPeriod === 'AM' && startHour === 12) start24 = 0;
      
      let end24 = endHour;
      if (endPeriod === 'PM' && endHour !== 12) end24 += 12;
      if (endPeriod === 'AM' && endHour === 12) end24 = 0;
      
      // If end time is before start time and both are marked AM, likely crossing noon
      if (startPeriod === 'AM' && endPeriod === 'AM' && end24 < start24) {
        // If end hour is 12, it should be PM (noon)
        if (endHour === 12) {
          correctedEndPeriod = 'PM';
          console.log('Auto-corrected: End time 12:xx AM → 12:xx PM (crossing noon)');
        }
      }
      
      // Specific case: times like 11:xx AM to 12:xx should always be PM
      if (startHour >= 10 && startHour < 12 && endHour === 12 && startPeriod === 'AM' && endPeriod === 'AM') {
        correctedEndPeriod = 'PM';
        console.log('Auto-corrected: Times crossing noon - end period set to PM');
      }
      
      // Update the state to reflect the correction
      if (correctedEndPeriod !== endPeriod) {
        setEndPeriod(correctedEndPeriod);
      }
      
      if (selectedBlockId) {
        // Update existing block
        console.log('Updating existing block with ID:', selectedBlockId);
        console.log('Update data:', {
           period: selectedPeriod,
           start_time: `${startTime} ${correctedStartPeriod}`,
           end_time: `${endTime} ${correctedEndPeriod}`,
           startTime,
           endTime,
           startPeriod: correctedStartPeriod,
           endPeriod: correctedEndPeriod,
         });
         
         await updateScheduleBlock(selectedBlockId, {
           period: selectedPeriod,
           start_time: `${startTime} ${correctedStartPeriod}`,
           end_time: `${endTime} ${correctedEndPeriod}`,
        });
        console.log('Successfully updated block');
      } else {
        // Create new blocks for all selected dates
        console.log('🆕 Creating new blocks for dates:', selectedDate);
        console.log('🆕 Current week:', currentWeek);
        console.log('🆕 Time values:', {
          startTime,
          endTime,
          startPeriod: correctedStartPeriod,
          endPeriod: correctedEndPeriod,
          formattedStartTime: `${startTime} ${correctedStartPeriod}`,
          formattedEndTime: `${endTime} ${correctedEndPeriod}`
        });
        
        for (const date of selectedDate) {
          const dayIndex = dates.findIndex(d => d === date);
          const scheduleDateStr = getDateForDayInWeek(currentWeek, dayIndex);
          
          console.log('🆕 Creating block for date:', date, 'Index:', dayIndex, 'Schedule date:', scheduleDateStr);
          
          await addScheduleBlock({
            period: selectedPeriod,
            start_time: `${startTime} ${correctedStartPeriod}`,
            end_time: `${endTime} ${correctedEndPeriod}`,
            schedule_date: scheduleDateStr,
            block_type: 'regular',
            color: 'blue'
          });
          
          console.log('🆕 Block created for', scheduleDateStr);
        }
        console.log('✅ All blocks created successfully');
      }
      
      console.log('✅ Block operation completed, refreshing schedule...');
      // Force refresh the schedule data to ensure immediate update
      await refreshSchedule();
      
      // Small delay to ensure state propagates
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Reset form
      setSelectedPeriod("");
      setStartTime("");
      setEndTime("");
      setStartPeriod("AM");
      setEndPeriod("AM");
      setSelectedBlockId(null);
      setSelectedDate([]);
    } catch (error) {
      console.error('Error creating/updating schedule block:', error);
      alert('Error creating/updating schedule block. Please try again.');
    }
  };

  const handleDeleteTimeBlock = async (id: string) => {
    console.log('Attempting to delete block with ID:', id);
    try {
      await deleteScheduleBlock(id);
      console.log('Successfully deleted block');
      
      // Reset form immediately after deletion
      setSelectedPeriod("");
      setStartTime("");
      setEndTime("");
      setSelectedBlockId(null);
      setSelectedDate([]);
      
      // Force refresh the schedule data to ensure immediate update
      await refreshSchedule();
    } catch (error) {
      console.error('Error deleting schedule block:', error);
    }
  };

  const getSelectedDay = () => {
    const firstSelectedDate = selectedDate[0];
    const selectedDateIndex = dates.findIndex(date => date === firstSelectedDate);
    if (selectedDateIndex === -1) return "Monday";
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return days[selectedDateIndex] || "Monday";
  };


  const handleFormReset = () => {
    setSelectedPeriod("");
    setStartTime("");
    setEndTime("");
    setSelectedBlockId(null);
    setSelectedDate([]);
  };

  const handleDateToggle = (date: string) => {
    setSelectedDate(prev => {
      if (prev.includes(date)) {
        // Remove date if already selected
        return prev.filter(d => d !== date);
      } else {
        // Add date if not selected
        return [...prev, date];
      }
    });
  };

  const handleSavePreset = (day: string, date: number) => {
    setSavingPresetForDay({day, date});
    setShowPresetInput(true);
  };

  const confirmSavePreset = async () => {
    if (!presetName.trim() || !savingPresetForDay) return;
    
    // Check if preset name already exists
    if (presets.some(p => p.name === presetName.trim())) {
      toast({
        title: "Preset exists",
        description: "A preset with this name already exists. Please choose a different name.",
        variant: "destructive"
      });
      return;
    }
    
    // Force refresh to ensure we have the latest data
    console.log('💾 Refreshing schedule before saving preset...');
    await refreshSchedule();
    
    // Wait longer and verify state has updated
    let retries = 0;
    const maxRetries = 5;
    const initialBlockCount = scheduleBlocks.length;
    
    while (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Check if state has potentially updated by checking if we can access scheduleBlocks
      // Note: We can't directly check if state updated, but we can ensure we wait enough
      retries++;
    }
    
    // Get all blocks for this specific day from current week
    const dayIndex = getDayIndexFromLabel(savingPresetForDay.day);
    const dayDateStr = getDateForDayInWeek(currentWeek, dayIndex);
    
    console.log('💾 Saving preset for day:', savingPresetForDay.day, 'Date:', dayDateStr);
    console.log('💾 Current scheduleBlocks count:', scheduleBlocks.length);
    
    // Fetch blocks directly from database to ensure we have the latest data
    let dayBlocks: any[] = [];
    try {
      const { data: freshBlocks, error: fetchError } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('school_id', schoolId)
        .eq('schedule_date', dayDateStr)
        .order('start_time');
      
      if (fetchError) {
        console.warn('⚠️ Error fetching fresh blocks, using state:', fetchError);
        // Fallback to state-based filtering
        dayBlocks = scheduleBlocks.filter(block => {
          const matches = block.schedule_date === dayDateStr;
          console.log('💾 Checking block:', block.id, 'schedule_date:', block.schedule_date, 'target:', dayDateStr, 'matches:', matches);
          return matches;
        });
      } else {
        dayBlocks = freshBlocks || [];
        console.log('💾 Fetched', dayBlocks.length, 'blocks directly from database for date:', dayDateStr);
      }
    } catch (error) {
      console.warn('⚠️ Error fetching blocks, using state:', error);
      // Fallback to state-based filtering
      dayBlocks = scheduleBlocks.filter(block => {
        const matches = block.schedule_date === dayDateStr;
        console.log('💾 Checking block:', block.id, 'schedule_date:', block.schedule_date, 'target:', dayDateStr, 'matches:', matches);
        return matches;
      });
    }
    
    console.log('💾 Found', dayBlocks.length, 'blocks for this day');

    if (dayBlocks.length === 0) {
      toast({
        title: "No blocks to save",
        description: "There are no time blocks on this day to save as a preset.",
        variant: "destructive"
      });
      return;
    }

    // Clean the blocks - only save the essential fields, not id or dates
    const cleanedBlocks = dayBlocks.map(block => ({
      period: block.period,
      start_time: block.start_time,
      end_time: block.end_time,
      block_type: block.block_type || 'regular',
      description: block.description || null,
      color: block.color || 'blue'
    }));

    console.log('💾 Cleaned blocks to save:', cleanedBlocks);

    // Save to database
    try {
      if (!schoolId) {
        throw new Error('School ID is required to save presets');
      }

      const { error } = await supabase
        .from('schedule_presets')
        .insert({
          name: presetName.trim(),
          schedule_blocks: cleanedBlocks as any,
          description: `${cleanedBlocks.length} time block${cleanedBlocks.length !== 1 ? 's' : ''} for ${savingPresetForDay.day}`,
          school_id: schoolId
        } as any);

      if (error) throw error;

      toast({
        title: "Preset Saved",
        description: `"${presetName.trim()}" has been saved successfully.`
      });

      // Reload presets
      await loadPresets();
    } catch (error) {
      console.error('Error saving preset:', error);
      toast({
        title: "Error",
        description: "Failed to save preset",
        variant: "destructive"
      });
    }
    
    // Reset state
    setPresetName("");
    setShowPresetInput(false);
    setSavingPresetForDay(null);
  };

  const cancelSavePreset = () => {
    setPresetName("");
    setShowPresetInput(false);
    setSavingPresetForDay(null);
  };

  const handleApplyPreset = async (presetName: string, day: string, date: number) => {
    console.log('🎯 Applying preset:', presetName, 'to', day, date);
    const preset = presets.find(p => p.name === presetName);
    if (!preset) {
      console.error('❌ Preset not found:', presetName);
      toast({
        title: "Error",
        description: "Preset not found",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ Preset found:', preset.name);
    console.log('📦 Preset schedule_blocks:', preset.schedule_blocks);
    console.log('📊 Number of blocks in preset:', preset.schedule_blocks?.length || 0);
    
    try {
      // Calculate the date for this day using the shared utility
      const dayIndex = getDayIndexFromLabel(day);
      const targetDateStr = getDateForDayInWeek(currentWeek, dayIndex);
      
      console.log('🎯 Target date:', targetDateStr, 'Day:', day, 'Day Index:', dayIndex);
      
      // Remove existing blocks for this specific date using direct Supabase call
      const existingBlocks = scheduleBlocks.filter(block => block.schedule_date === targetDateStr);
      console.log('Existing blocks to delete:', existingBlocks.length);
      
      if (existingBlocks.length > 0) {
        const { error: deleteError } = await supabase
          .from('schedule_blocks')
          .delete()
          .in('id', existingBlocks.map(b => b.id));
        
        if (deleteError) throw deleteError;
      }
      
      // Apply preset blocks to this date using direct Supabase call
      console.log('📋 Raw preset.schedule_blocks:', JSON.stringify(preset.schedule_blocks, null, 2));
      console.log('📋 Type:', typeof preset.schedule_blocks);
      console.log('📋 Is Array:', Array.isArray(preset.schedule_blocks));
      
      // Validate preset blocks structure
      if (!preset.schedule_blocks || (Array.isArray(preset.schedule_blocks) && preset.schedule_blocks.length === 0)) {
        toast({
          title: "Invalid Preset",
          description: "This preset has no schedule blocks to apply.",
          variant: "destructive"
        });
        return;
      }

      // Ensure schedule_blocks is an array
      const scheduleBlocksArray = Array.isArray(preset.schedule_blocks) 
        ? preset.schedule_blocks 
        : [preset.schedule_blocks];
      
      console.log('📋 After ensuring array:', scheduleBlocksArray.length, 'blocks');
      
      // Validate each block has required fields
      const validBlocks = scheduleBlocksArray.filter((block, index) => {
        const isValid = block && 
          typeof block.period === 'string' && 
          typeof block.start_time === 'string' && 
          typeof block.end_time === 'string';
        if (!isValid) {
          console.warn(`⚠️ Block ${index} is invalid:`, block);
        }
        return isValid;
      });

      if (validBlocks.length === 0) {
        toast({
          title: "Invalid Preset",
          description: "This preset has no valid schedule blocks to apply.",
          variant: "destructive"
        });
        return;
      }

      if (!schoolId) {
        toast({
          title: "Error",
          description: "School ID is required to apply presets",
          variant: "destructive"
        });
        return;
      }

      const blocksToInsert = validBlocks.map((block, index) => {
        console.log(`📋 Processing block ${index}:`, block);
        return {
          period: block.period,
          start_time: block.start_time,
          end_time: block.end_time,
          schedule_date: targetDateStr,
          block_type: block.block_type || 'regular',
          description: block.description || null,
          color: block.color || 'blue',
          school_id: schoolId
        };
      });
      
      console.log('Blocks to insert:', blocksToInsert);
      
      if (blocksToInsert.length > 0) {
        const { data, error: insertError } = await supabase
          .from('schedule_blocks')
          .insert(blocksToInsert)
          .select();
        
        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
        
        console.log('Inserted blocks:', data);
      }

      console.log('🔄 Refreshing schedule...');
      
      // Force multiple refreshes to ensure state updates
      await refreshSchedule();
      await new Promise(resolve => setTimeout(resolve, 300));
      await refreshSchedule();
      
      console.log('✅ Schedule refreshed, current block count:', scheduleBlocks.length);
      
      toast({
        title: "Preset Applied",
        description: `"${presetName}" applied ${blocksToInsert.length} blocks to ${day}.`
      });
    } catch (error) {
      console.error('Error applying preset:', error);
      toast({
        title: "Error",
        description: "Failed to apply preset",
        variant: "destructive"
      });
    }
  };


  const handleClearDaySchedule = async (day: string, date: number) => {
    try {
      console.log('🗑️ Clear day schedule:', day, 'Date number:', date);
      
      // Calculate the date for this day using the shared utility
      const dayIndex = getDayIndexFromLabel(day);
      const targetDateStr = getDateForDayInWeek(currentWeek, dayIndex);
      
      console.log('🗑️ Target date:', targetDateStr, 'Day index:', dayIndex, 'Current week:', currentWeek);
      console.log('🗑️ Current scheduleBlocks count:', scheduleBlocks.length);
      
      // Remove all existing blocks for this specific date
      const existingBlocks = scheduleBlocks.filter(block => {
        const matches = block.schedule_date === targetDateStr;
        if (matches) {
          console.log('🗑️ Found block to delete:', block.period, block.start_time, '-', block.end_time);
        }
        return matches;
      });
      
      console.log('🗑️ Total blocks to clear:', existingBlocks.length);
      
      if (existingBlocks.length === 0) {
        toast({
          title: "No blocks to clear",
          description: "This day has no time blocks.",
        });
        return;
      }

      console.log('🗑️ Deleting blocks from database...');
      // Delete all blocks in one operation using direct Supabase call
      const { error: deleteError } = await supabase
        .from('schedule_blocks')
        .delete()
        .in('id', existingBlocks.map(b => b.id));
      
      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        throw deleteError;
      }

      console.log('✅ Blocks deleted, refreshing...');
      // Force multiple refreshes to ensure UI updates
      await refreshSchedule();
      await new Promise(resolve => setTimeout(resolve, 300));
      await refreshSchedule();

      toast({
        title: "Day Cleared",
        description: `Removed ${existingBlocks.length} time blocks from ${day}.`
      });
    } catch (error) {
      console.error('❌ Error clearing day schedule:', error);
      toast({
        title: "Error",
        description: "Failed to clear day schedule",
        variant: "destructive"
      });
    }
  };


  const handleDeletePreset = async (presetId: string, presetName: string) => {
    try {
      const { error } = await supabase
        .from('schedule_presets')
        .delete()
        .eq('id', presetId);

      if (error) throw error;

      toast({
        title: "Preset Deleted",
        description: `"${presetName}" has been deleted successfully.`
      });

      // Reload presets
      await loadPresets();
    } catch (error) {
      console.error('Error deleting preset:', error);
      toast({
        title: "Error",
        description: "Failed to delete preset",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Admin Schedule" 
        subtitle={classStatusSubtitle}
        onClockOutAllClick={() => setConfirmClockOutOpen(true)}
      />

      {/* Preset Name Input Modal */}
      {showPresetInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#012D68] mb-2">
              Save Schedule as Preset
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Save this day's schedule to reuse it later on other days
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., Regular Monday, Minimum Day"
                  className="mt-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && presetName.trim()) {
                      confirmSavePreset();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={confirmSavePreset}
                  disabled={!presetName.trim()}
                  className="flex-1 bg-[#012D68] hover:bg-[#011f4a]"
                >
                  Save Preset
                </Button>
                <Button 
                  onClick={cancelSavePreset}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preset Management Modal */}
      <PresetManagementModal
        isOpen={showPresetManagement}
        onClose={() => setShowPresetManagement(false)}
        presets={presets}
        onDeletePreset={handleDeletePreset}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left subsection - Create Time Block (match Dashboard) */}
        <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg rounded-lg overflow-hidden w-full">
            <div className="bg-[#012D68] rounded-t-lg p-4">
              <div className="flex items-center mb-1">
                <CardTitle className="text-xl font-bold text-white">Create a Time Block</CardTitle>
                <HelpTooltip content="Create time blocks for different periods in your school schedule" />
              </div>
              <p className="text-gray-200 text-sm">Set the time blocks for student app use</p>
            </div>
            <CardContent className="bg-white p-4 rounded-b-lg">
              <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                {/* Date Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium text-[#012D68]">Date</Label>
                    {selectedDate.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFormReset}
                        className="text-gray-500 hover:text-gray-700 h-auto p-1 text-xs"
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                  <div className="flex w-full gap-2">
                    {dates.map((date) => (
                      <Button
                        key={date}
                        variant={selectedDate.includes(date) ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 min-w-0 h-12 rounded-lg ${
                          selectedDate.includes(date) 
                            ? "bg-[#012D68] text-white" 
                            : "text-gray-600"
                        }`}
                        onClick={() => handleDateToggle(date)}
                      >
                        {date}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Block Title Selection */}
                <div className="space-y-2">
                  <Label className="text-base font-medium text-[#012D68]">Select Time Block Title</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Time Block Title" />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="bg-white z-50">
                      {periods.map((period, index) => (
                        <SelectItem
                          key={period}
                          value={period}
                          className={index < periods.length - 1 ? "border-b border-gray-200" : ""}
                        >
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-[#012D68]">Start Time</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="--:--"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          // Auto-adjust end period based on start time and period
                          if (e.target.value && startPeriod === "AM") {
                            const [hours] = e.target.value.split(':').map(Number);
                            if (hours >= 11) {
                              setEndPeriod("PM");
                            }
                          }
                        }}
                        className="flex-1"
                      />
                      <div className="flex">
                        <Button
                          variant={startPeriod === "AM" ? "default" : "outline"}
                          size="sm"
                          className={`px-3 py-1 text-xs rounded-l-md rounded-r-none ${
                            startPeriod === "AM" ? "bg-[#8DCEE9] hover:bg-[#7BC3E3] text-white" : ""
                          }`}
                          onClick={() => {
                            setStartPeriod("AM");
                            // Smart default: if start is AM and time is late morning, set end to PM
                            if (startTime) {
                              const [hours] = startTime.split(':').map(Number);
                              if (hours >= 11) {
                                setEndPeriod("PM");
                              } else {
                                setEndPeriod("AM");
                              }
                            }
                          }}
                        >
                          AM
                        </Button>
                         <Button
                           variant={startPeriod === "PM" ? "default" : "outline"}
                           size="sm"
                           className={`px-3 py-1 text-xs rounded-r-md rounded-l-none ${
                             startPeriod === "PM" ? "bg-[#8DCEE9] hover:bg-[#7BC3E3] text-white" : ""
                           }`}
                           onClick={() => {
                             setStartPeriod("PM");
                             setEndPeriod("PM"); // If start is PM, end should also be PM
                           }}
                         >
                          PM
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-[#012D68]">End Time</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="--:--"
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          // Auto-adjust end period based on start period and times
                          if (e.target.value && startTime) {
                            const [startHours] = startTime.split(':').map(Number);
                            const [endHours] = e.target.value.split(':').map(Number);
                            
                            // If start is PM, end should be PM
                            if (startPeriod === "PM") {
                              setEndPeriod("PM");
                            } 
                            // If start is late AM (11 or 12), and end is earlier hour, it's PM
                            else if (startPeriod === "AM" && startHours >= 11 && endHours < startHours) {
                              setEndPeriod("PM");
                            }
                            // If start is AM and times cross noon
                            else if (startPeriod === "AM" && startHours === 11 && endHours === 12) {
                              setEndPeriod("PM");
                            }
                          }
                        }}
                        className="flex-1"
                      />
                      <div className="flex">
                        <Button
                          variant={endPeriod === "AM" ? "default" : "outline"}
                          size="sm"
                          className={`px-3 py-1 text-xs rounded-l-md rounded-r-none ${
                            endPeriod === "AM" ? "bg-[#8DCEE9] hover:bg-[#7BC3E3] text-white" : ""
                          }`}
                          onClick={() => setEndPeriod("AM")}
                        >
                          AM
                        </Button>
                        <Button
                          variant={endPeriod === "PM" ? "default" : "outline"}
                          size="sm"
                          className={`px-3 py-1 text-xs rounded-r-md rounded-l-none ${
                            endPeriod === "PM" ? "bg-[#8DCEE9] hover:bg-[#7BC3E3] text-white" : ""
                          }`}
                          onClick={() => setEndPeriod("PM")}
                        >
                          PM
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      console.log('Delete button clicked, selectedBlockId:', selectedBlockId);
                      if (selectedBlockId) {
                        handleDeleteTimeBlock(selectedBlockId);
                      }
                    }}
                    disabled={!selectedBlockId}
                    className={`shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-600 border-blue-200 transition-opacity ${
                      selectedBlockId ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    className="flex-1 bg-[#012D68] hover:bg-[#011f4a]"
                    onClick={handleCreateTimeBlock}
                    disabled={selectedDate.length === 0 || !selectedPeriod || !startTime || !endTime}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {selectedBlockId ? "Update Time Block" : "Create Time Block"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right subsection - Bell Schedule (match Dashboard) */}
        <div className="lg:col-span-3" onClick={handleFormReset}>
            <GoogleCalendarSchedule 
              title={(() => {
                const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), currentWeek);
                const weekEnd = addDays(weekStart, 4);
                return `${format(weekStart, 'MMMM do')}-${format(weekEnd, 'do')}`;
              })()}
              description="This Week's Bell Schedule"
              showHeader={true}
              className="rounded-lg border-0 shadow-lg"
              onBlockClick={handleBlockClick}
              currentWeek={currentWeek}
              onWeekChange={setCurrentWeek}
              selectedDates={selectedDate}
              presets={presets}
              onSavePreset={handleSavePreset}
              onApplyPreset={handleApplyPreset}
              onClearDaySchedule={handleClearDaySchedule}
              onDeletePreset={handleDeletePreset}
              timeGridOffsetPx={-45}
            />
          </div>
        </div>
      
      {/* QR Code Modal */}
      <FullscreenQRModal 
        open={qrDialogOpen} 
        onOpenChange={setQrDialogOpen} 
        classId={currentClass?.id || ''} 
        hideSidebar={true}
      />

      {/* Clock Out All Confirmation Dialog */}
      <AlertDialog open={confirmClockOutOpen} onOpenChange={setConfirmClockOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#012D68]">Clock Out All Students?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to clock out all students in your school? This action will clock out all currently clocked-in students and remove their app restrictions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCLockOutAll}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              Clock Out All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSchedulePage;