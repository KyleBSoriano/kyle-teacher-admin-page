import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useSchedule } from "@/context/ScheduleContext";
import { format } from "date-fns";

interface TodaysScheduleProps {
  className?: string;
}

const TodaysSchedule: React.FC<TodaysScheduleProps> = ({ className = "" }) => {
  const { getScheduleForDate, loading } = useSchedule();
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const todaysBlocks = getScheduleForDate(today);

  // Sort blocks by start time
  const sortedBlocks = todaysBlocks.sort((a, b) => {
    const timeA = new Date(`1970-01-01 ${a.start_time}`);
    const timeB = new Date(`1970-01-01 ${b.start_time}`);
    return timeA.getTime() - timeB.getTime();
  });

  const getCurrentStatus = () => {
    const now = new Date();
    const currentTime = format(now, 'h:mm a');
    
    for (const block of sortedBlocks) {
      const startTime = new Date(`1970-01-01 ${block.start_time}`);
      const endTime = new Date(`1970-01-01 ${block.end_time}`);
      const currentTimeObj = new Date(`1970-01-01 ${currentTime}`);
      
      if (currentTimeObj >= startTime && currentTimeObj <= endTime) {
        return { isActive: true, currentBlock: block };
      }
    }
    
    return { isActive: false, currentBlock: null };
  };

  const { isActive, currentBlock } = getCurrentStatus();

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="bg-[#012D68] text-white">
          <CardTitle className="text-lg font-bold">Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-gray-500">Loading schedule...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="bg-[#012D68] text-white">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <CardTitle className="text-lg font-bold">Today's Schedule</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {sortedBlocks.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No schedule blocks for today
          </div>
        ) : (
          <div className="space-y-3">
            {/* Current Active Block */}
            {isActive && currentBlock && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Currently Active</span>
                </div>
                <div className="font-semibold text-green-900">{currentBlock.period}</div>
                <div className="text-sm text-green-700">
                  {currentBlock.start_time} - {currentBlock.end_time}
                </div>
              </div>
            )}
            
            {/* All Schedule Blocks */}
            {sortedBlocks.slice(0, 6).map((block) => (
              <div
                key={block.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                  isActive && currentBlock?.id === block.id
                    ? 'bg-green-50 border border-green-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="font-medium text-gray-900">{block.period}</div>
                  <div className="text-sm text-gray-500">
                    {block.start_time} - {block.end_time}
                  </div>
                </div>
                {isActive && currentBlock?.id === block.id && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
            ))}
            
            {sortedBlocks.length > 6 && (
              <div className="text-center py-2">
                <span className="text-sm text-gray-500">
                  +{sortedBlocks.length - 6} more blocks
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysSchedule;