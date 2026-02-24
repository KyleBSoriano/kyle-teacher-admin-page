import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addWeeks, addDays, format, startOfWeek } from "date-fns";
import { useSchedule } from "@/context/ScheduleContext";
import { getDateForDayInWeek } from "@/lib/utils";
import HelpTooltip from "@/components/ui/HelpTooltip";

// Database schedule block structure
interface DatabaseScheduleBlock {
  id: string;
  period: string;
  start_time: string;
  end_time: string;
  schedule_date: string;
  block_type?: string;
  color?: string;
}

// Display schedule block structure (for static and dynamic blocks)
interface ScheduleBlock {
  period: string;
  startTime: string;
  endTime: string;
  type: 'period' | 'lunch' | 'break';
}

interface DaySchedule {
  scheduleType: string;
  scheduleColor: 'blue' | 'navy' | 'gray';
  blocks: ScheduleBlock[];
}

interface GoogleCalendarScheduleProps {
  title?: string;
  description?: string;
  showHeader?: boolean;
  className?: string;
  onBlockClick?: (block: ScheduleBlock, day: string, date: number) => void;
  currentWeek?: number;
  onWeekChange?: (week: number) => void;
  selectedDates?: string[];
  presets?: Array<{ id: string; name: string; schedule_blocks: any[] }>;
  onSavePreset?: (day: string, date: number) => void;
  onApplyPreset?: (presetName: string, day: string, date: number) => void;
  onClearDaySchedule?: (day: string, date: number) => void;
  onDeletePreset?: (presetId: string, presetName: string) => void;
  onEditClick?: () => void;
  /** Negative = move time labels (8 AM - 4 PM) and grid up by this many pixels */
  timeGridOffsetPx?: number;
  /** Show a vertical grey line from top to bottom of white section (dashboard) */
  showVerticalDivider?: boolean;
}

const GoogleCalendarSchedule: React.FC<GoogleCalendarScheduleProps> = ({
  title = "View your Bell Schedule",
  description = "Description here",
  showHeader = true,
  className = "",
  onBlockClick,
  currentWeek: externalCurrentWeek,
  onWeekChange: externalOnWeekChange,
  selectedDates = [],
  presets = [],
  onSavePreset,
  onApplyPreset,
  onClearDaySchedule,
  onDeletePreset,
  onEditClick,
  timeGridOffsetPx = 0,
  showVerticalDivider = false,
}) => {
  const { scheduleBlocks } = useSchedule();
  
  // Log when scheduleBlocks changes
  React.useEffect(() => {
    console.log('📅 GoogleCalendarSchedule: scheduleBlocks updated, count:', scheduleBlocks?.length || 0);
  }, [scheduleBlocks]);
  
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);
  const [openPresetDayIndex, setOpenPresetDayIndex] = useState<number | null>(null);
  
  // Base date: Monday, September 22, 2025
  const baseDate = new Date(2025, 8, 22); // Month is 0-indexed, so 8 = September
  
  // Constants for layout - MUST BE BEFORE getCurrentTimePosition (reduced so 8hrs fit without scroll)
  const GRID_START_Y = 48; // Day header row height - fits date circle (40px) + day name with no overlap to preset row
  const PRESET_ROW_HEIGHT = 44; // Preset row with even padding; less gap to calendar
  const PRESET_ROW_TOP_GAP = 20; // Gap below date row so Use Preset buttons don't overlap circle
  const hasPresetUI = !!(onSavePreset || onApplyPreset);
  const headerTotalY = GRID_START_Y + (hasPresetUI ? PRESET_ROW_TOP_GAP + PRESET_ROW_HEIGHT : 0); // Total header above calendar grid
  const contentStartY = Math.max(0, headerTotalY + timeGridOffsetPx); // When timeGridOffsetPx < 0, time labels and grid move up (clamped)
  const HOUR_HEIGHT = 50; // Height per hour - fits 8am-4pm in ~496px without scrolling
  const TIME_COLUMN_WIDTH = 80; // Width of the time column
  
  // Calculate the current week offset from base date
  const calculateCurrentWeek = () => {
    const today = new Date();
    const diffTime = today.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
  };
  
  const [internalCurrentWeek, setInternalCurrentWeek] = useState(calculateCurrentWeek());
  
  // Use external state if provided, otherwise use internal state
  const currentWeek = externalCurrentWeek !== undefined ? externalCurrentWeek : internalCurrentWeek;
  const setCurrentWeek = externalOnWeekChange || setInternalCurrentWeek;

  // Displayed week range (Monday–Friday) for date calculations
  const weekStartDate = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), currentWeek);
  const weekEndDate = addDays(weekStartDate, 4);

  // Get current time position for red line (8 AM = 0)
  const getCurrentTimePosition = (): number | null => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    if (currentHour < 8 || currentHour >= 16) return null;
    const minutesFromStart = (currentHour - 8) * 60 + currentMinutes;
    return minutesFromStart * HOUR_HEIGHT / 60;
  };

  const currentTimePosition = getCurrentTimePosition();
  const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const days = ["Mon", "Tues", "Wed", "Thur", "Fri"];
  
  // Time slots from 8 AM to 4 PM (no 7:30; early blocks squeeze into first row)
  const timeSlots = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  const getScheduleColor = (color: 'blue' | 'navy' | 'gray') => {
    switch (color) {
      case 'blue': return 'bg-blue-100 border-blue-300';
      case 'navy': return 'bg-blue-900 border-blue-700 text-white';
      case 'gray': return 'bg-gray-100 border-gray-300';
      default: return 'bg-blue-100 border-blue-300';
    }
  };

  // Function to convert time string to pixel position
  const getTimePosition = (timeStr: string): number => {
    // Parse time like "8:30 AM", "12:41 PM", "8:30AM", "12:41PM"
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return 0;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format - Fixed logic for 12 PM
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    // Note: 12 PM stays as 12 (noon), and 12 AM becomes 0 (midnight)
    
    // 8 AM = 0px; blocks before 8 AM (e.g. 7:30) squeeze in at top (clamped to 0)
    const startHour = 8;
    const hoursFromStart = hours - startHour;
    const minutesFromStart = minutes;
    return Math.max(0, (hoursFromStart * HOUR_HEIGHT) + (minutesFromStart * HOUR_HEIGHT / 60));
  };

  // Helper function to format time correctly for display
  const formatTimeDisplay = (timeStr: string): string => {
    // Times are already in "HH:MM AM/PM" format from the database
    // Just ensure consistent spacing and capitalization
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return timeStr;
    
    const hours = timeMatch[1];
    const minutes = timeMatch[2];
    const period = timeMatch[3].toUpperCase();
    
    // Return the time in consistent format
    return `${hours}:${minutes} ${period}`;
  };

  // Helper function to get dynamic font sizes based on block height (time slightly smaller than title relative to block)
  const getFontSizes = (blockHeight: number) => {
    if (blockHeight < 20) {
      return { title: '0.45rem', time: '0.3rem' };
    } else if (blockHeight < 25) {
      return { title: '0.5rem', time: '0.35rem' };
    } else if (blockHeight < 35) {
      return { title: '0.6rem', time: '0.45rem' };
    } else if (blockHeight < 50) {
      return { title: '0.7rem', time: '0.55rem' };
    } else if (blockHeight < 70) {
      return { title: '0.8rem', time: '0.6rem' };
    } else {
      return { title: '0.875rem', time: '0.7rem' };
    }
  };

  return (
    <Card className={`w-full border-0 shadow-lg rounded-lg overflow-hidden ${className}`}>
      {showHeader && (
        <div className="bg-[#012D68] rounded-t-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div>
                <div className="flex items-center mb-0.5">
                  <CardTitle className="text-xl font-bold text-white">{title}</CardTitle>
                  <HelpTooltip content="View and manage your weekly bell schedule with time blocks for each day" />
                </div>
                <p className="text-gray-200 text-sm">{description}</p>
              </div>
            </div>
            {externalOnWeekChange && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentWeek(currentWeek - 1)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-white hover:bg-white/10 transition-colors"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentWeek(currentWeek + 1)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-white hover:bg-white/10 transition-colors"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <CardContent className="p-0 relative rounded-b-lg overflow-hidden">
        <div className="relative rounded-b-lg overflow-hidden">
          <div className={`relative bg-white ${externalOnWeekChange ? 'pt-2' : ''}`}>
            {/* Thick grey vertical line from top to bottom of white section (dashboard) */}
            {showVerticalDivider && (
              <div
                className="absolute top-0 bottom-0 bg-gray-300 z-10"
                style={{ left: `${TIME_COLUMN_WIDTH}px`, width: 2 }}
              />
            )}
            {/* Day headers row - same as dashboard whenever week nav is used */}
            {externalOnWeekChange && (
              <div
                className="flex bg-white"
                style={{ height: `${GRID_START_Y}px` }}
              >
                <div style={{ width: `${TIME_COLUMN_WIDTH}px` }} className="shrink-0" />
                <div className="grid grid-cols-5 gap-0 flex-1">
                  {days.map((day, dayIndex) => {
                    const today = new Date();
                    const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
                    const currentWeekStart = addWeeks(currentWeekMonday, currentWeek);
                    const currentDate = addDays(currentWeekStart, dayIndex);
                    const date = parseInt(format(currentDate, 'd'));
                    const isToday = currentDate.toDateString() === today.toDateString();
                    return (
                      <div
                        key={day}
                        className="flex flex-col items-center justify-center gap-1 py-1"
                      >
                        <div className="text-xs font-semibold text-[#012D68]">{day}</div>
                        <div className="text-lg font-bold text-[#012D68] flex items-center justify-center">
                          {isToday ? (
                            <div className="w-10 h-10 bg-[#012D68] rounded-full flex items-center justify-center text-white text-lg">
                              {date}
                            </div>
                          ) : (
                            date
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Preset row - same width/columns as calendar; z-20 so it stays above calendar grid (negative margin) and remains clickable */}
            {externalOnWeekChange && hasPresetUI && (
              <div
                className="relative z-20 flex bg-white items-center pt-2 pb-2"
                style={{ height: `${PRESET_ROW_HEIGHT}px`, minHeight: `${PRESET_ROW_HEIGHT}px`, marginTop: `${PRESET_ROW_TOP_GAP}px` }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ width: `${TIME_COLUMN_WIDTH}px` }} className="shrink-0" />
                <div
                  className="grid grid-cols-5 gap-0 min-w-0"
                  style={{ width: `calc(100% - ${TIME_COLUMN_WIDTH}px)` }}
                >
                  {days.map((day, dayIndex) => {
                    const currentWeekMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
                    const currentWeekStart = addWeeks(currentWeekMonday, currentWeek);
                    const currentDate = addDays(currentWeekStart, dayIndex);
                    const date = parseInt(format(currentDate, 'd'));
                    return (
                      <div key={day} className="flex items-center justify-center min-w-0 px-0.5">
                        <Select
                          value=""
                          open={openPresetDayIndex === dayIndex}
                          onOpenChange={(open) => setOpenPresetDayIndex(open ? dayIndex : null)}
                          onValueChange={async (value) => {
                            if (value.startsWith("apply-")) {
                              const presetName = value.replace("apply-", "");
                              await onApplyPreset?.(presetName, day, date);
                            } else if (value.startsWith("delete-")) {
                              const presetId = value.replace("delete-", "");
                              const preset = presets.find(p => p.id === presetId);
                              if (preset && onDeletePreset) {
                                await onDeletePreset(presetId, preset.name);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-full bg-gray-200 hover:bg-gray-300 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg [&>span]:text-sm [&>span]:font-semibold">
                            <SelectValue placeholder="Use Preset" />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            {presets.length > 0 && onApplyPreset && (
                              <>
                                {presets.map((preset) => (
                                  <div
                                    key={preset.id}
                                    className="relative group"
                                    onMouseEnter={() => setHoveredPresetId(preset.id)}
                                    onMouseLeave={() => setHoveredPresetId(null)}
                                  >
                                    <SelectItem
                                      value={`apply-${preset.name}`}
                                      className="pr-8"
                                    >
                                      <span className="font-medium">Apply: {preset.name}</span>
                                    </SelectItem>
                                    {hoveredPresetId === preset.id && onDeletePreset && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeletePreset(preset.id, preset.name);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-50 rounded transition-colors z-10"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </>
                            )}
                            {/* Save and Clear as last row - side by side */}
                            {(onSavePreset || onClearDaySchedule) && (
                              <div className="flex gap-2 p-2 border-t border-gray-200 mt-1 pt-2">
                                {onClearDaySchedule && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border border-[#012D68] bg-white text-[#012D68] hover:bg-gray-50 hover:border-[#012D68]"
                                    onClick={() => {
                                      onClearDaySchedule(day, date);
                                      setOpenPresetDayIndex(null);
                                    }}
                                  >
                                    Clear
                                  </Button>
                                )}
                                {onSavePreset && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="flex-1 bg-[#012D68] hover:bg-[#011f4a] text-white"
                                    onClick={() => {
                                      onSavePreset(day, date);
                                      setOpenPresetDayIndex(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                )}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Calendar Grid Container - timeGridOffsetPx moves this whole block up (dashboard -50, schedule -200) */}
            <div className="relative" style={{ marginTop: timeGridOffsetPx }}>
              {/* Time Column */}
              <div 
                className="absolute left-0 top-0 bg-white z-10"
                style={{ width: `${TIME_COLUMN_WIDTH}px` }}
              >
                {/* Header space for time column - day row + optional preset row */}
                <div className="bg-white" style={{ height: `${contentStartY}px` }}></div>
                
                {/* Time slots - align with grid rows (no negative margin to avoid misalignment) */}
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="text-xs font-semibold text-[#012D68] border-b border-gray-200 flex items-center justify-center relative bg-white"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <span className="bg-white px-2 relative z-20">{time}</span>
                  </div>
                ))}
              </div>

              {/* Horizontal grid lines - align with time labels */}
              <div className="absolute left-0 w-full" style={{ top: `${contentStartY}px` }}>
                {timeSlots.map((_, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200"
                    style={{ 
                      height: `${HOUR_HEIGHT}px`,
                      marginLeft: `${TIME_COLUMN_WIDTH}px`
                    }}
                  />
                ))}
              </div>

              {/* Vertical grid lines - between days */}
              <div className="absolute top-0 flex" style={{ marginLeft: `${TIME_COLUMN_WIDTH}px` }}>
                {days.map((_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`border-r border-gray-200 ${dayIndex === days.length - 1 ? 'border-r-0' : ''}`}
                    style={{ 
                      width: `calc((100% - ${TIME_COLUMN_WIDTH}px) / 5)`,
                      height: `${contentStartY + timeSlots.length * HOUR_HEIGHT}px`
                    }}
                  />
                ))}
              </div>

              {/* Days header and content - same width/columns as preset row for alignment */}
              <div className="grid grid-cols-5 gap-0 border-t-0 min-w-0" style={{ marginLeft: `${TIME_COLUMN_WIDTH}px`, width: `calc(100% - ${TIME_COLUMN_WIDTH}px)` }}>
              {days.map((day, dayIndex) => {
                  // Use the shared date calculation utility
                  const currentDateStr = getDateForDayInWeek(currentWeek, dayIndex);
                  const today = new Date();
                  const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
                  const currentWeekStart = addWeeks(currentWeekMonday, currentWeek);
                  const currentDate = addDays(currentWeekStart, dayIndex);
                  const date = parseInt(format(currentDate, 'd'));
                  const isDateSelected = selectedDates.includes(date.toString());
                  
                  console.log(`📅 Rendering ${day} (${currentDateStr}), date number: ${date}`);
                  
                  // Check if this is today (using the 'today' variable already declared above)
                  const isToday = currentDate.toDateString() === today.toDateString();

                  return (
                    <div key={day} className="relative min-w-0">
                      {/* Spacer so day blocks align with time column (uses contentStartY when time grid is offset) */}
                      {externalOnWeekChange && (
                        <div style={{ height: `${contentStartY}px` }} />
                      )}

                      {/* Day Content - Schedule Blocks */}
                      <div className="relative" style={{ height: `${timeSlots.length * HOUR_HEIGHT}px` }}>
                        {/* Render database schedule blocks for this date */}
                        {(() => {
                          const blocksForDay = scheduleBlocks?.filter(block => {
                            const matches = block.schedule_date === currentDateStr;
                            if (matches) {
                              console.log(`✅ Block matches ${day} (${currentDateStr}):`, block.period, block.start_time);
                            }
                            return matches;
                          });
                          
                          console.log(`📊 ${day} (${currentDateStr}): ${blocksForDay?.length || 0} blocks`);
                          
                          return blocksForDay?.map((block) => {
                          const blockData = {
                            period: block.period,
                            startTime: block.start_time,
                            endTime: block.end_time,
                            type: 'period' as const
                          };

                          const topPosition = getTimePosition(blockData.startTime);
                          const endPosition = getTimePosition(blockData.endTime);
                          const blockHeight = Math.max(endPosition - topPosition, 20);
                          const fontSizes = getFontSizes(blockHeight);

                          return (
                            <div
                              key={block.id}
                              className="absolute left-1 right-1 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors z-20 overflow-hidden flex flex-col"
                              style={{
                                top: `${topPosition}px`,
                                height: `${blockHeight}px`,
                                padding: blockHeight < 35 ? '0.125rem 0.25rem' : blockHeight < 50 ? '0.25rem' : '0.5rem'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onBlockClick?.(blockData, day, date);
                              }}
                            >
                              <div 
                                className="font-semibold text-[#012D68] truncate leading-tight"
                                style={{ 
                                  fontSize: fontSizes.title,
                                  lineHeight: blockHeight < 35 ? '1' : '1.2'
                                }}
                              >
                                {blockData.period}
                              </div>
                              <div 
                                className="text-gray-600 leading-tight overflow-hidden min-w-0 whitespace-nowrap"
                                style={{ 
                                  fontSize: fontSizes.time,
                                  lineHeight: blockHeight < 35 ? '1' : '1.2'
                                }}
                                title={`${formatTimeDisplay(blockData.startTime)} – ${formatTimeDisplay(blockData.endTime)}`}
                              >
                                {formatTimeDisplay(blockData.startTime)} – {formatTimeDisplay(blockData.endTime)}
                              </div>
                            </div>
                          );
                        })})()}
                        
                        
                        {/* Current Time Indicator - Red Line (only for today) */}
                        {isToday && currentTimePosition !== null && (
                          <div
                            className="absolute left-0 right-0 z-30 pointer-events-none"
                            style={{ top: `${currentTimePosition}px` }}
                          >
                            <div className="relative">
                              <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                              <div className="h-0.5 bg-red-500 shadow-md" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSchedule;