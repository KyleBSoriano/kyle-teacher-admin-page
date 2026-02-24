
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedAttendanceCounterProps {
  count: number;
  total: number;
  onCounterClick?: () => void;
  className?: string;
}

const AnimatedAttendanceCounter = ({ 
  count, 
  total, 
  onCounterClick,
  className 
}: AnimatedAttendanceCounterProps) => {
  // Calculate visual count using modulo logic
  const visualCount = count % (total + 1);
  
  const [displayCount, setDisplayCount] = useState(visualCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPlusOne, setShowPlusOne] = useState(false);

  useEffect(() => {
    const newVisualCount = count % (total + 1);
    
    // Handle visual count changes
    if (newVisualCount !== displayCount) {
      setIsAnimating(true);
      
      // If visual count went from a higher number to a lower number (reset cycle)
      if (newVisualCount < displayCount) {
        // Show reset animation
        setDisplayCount(newVisualCount);
      } else {
        // Show increment animation
        setShowPlusOne(true);
        
        // Animate the counter increment
        setTimeout(() => {
          setDisplayCount(newVisualCount);
        }, 150);
        
        // Hide the +1 animation
        setTimeout(() => {
          setShowPlusOne(false);
        }, 1200);
      }
      
      // Reset animation state
      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    }
  }, [count, total, displayCount]);

  // Calculate percentage for circle progress based on visual count
  const percentage = total > 0 ? (displayCount / total) * 100 : 0;
  const circumference = 2 * Math.PI * 16; // radius is 16
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  // Handle click with reset logic
  const handleClick = () => {
    if (onCounterClick) {
      onCounterClick();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "relative w-40 h-40 cursor-pointer transition-all duration-500 ease-out",
          "hover:scale-105 hover:opacity-90",
          isAnimating && "scale-110 drop-shadow-lg"
        )}
        onClick={handleClick}
        title={displayCount >= total ? "Click to add attendance (will reset cycle)" : "Click to add attendance"}
      >
        <svg viewBox="0 0 40 40" className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle 
            cx="20" 
            cy="20" 
            r="16" 
            fill="none" 
            strokeWidth="3" 
            stroke="#E5E7EB" 
          />
          {/* Progress circle */}
          <circle 
            cx="20" 
            cy="20" 
            r="16" 
            fill="none" 
            strokeWidth="3" 
            stroke="#012D68" 
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            className={cn(
              "transition-all duration-700 ease-out",
              isAnimating && "stroke-sky-400 drop-shadow-sm"
            )}
            style={{
              filter: isAnimating ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))' : 'none'
            }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={cn(
              "text-4xl font-bold text-[#012D68] leading-none transition-all duration-500 ease-out",
              isAnimating && "scale-125 text-sky-500"
            )}
            style={{
              textShadow: isAnimating ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none'
            }}
          >
            {displayCount}
          </span>
          <span className={cn(
            "text-sm text-gray-600 leading-none transition-all duration-300",
            isAnimating && "text-sky-400"
          )}>
            present
          </span>
        </div>
        
        {/* +1 Animation */}
        {showPlusOne && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span 
              className="text-2xl font-bold text-sky-400 animate-bounce-up-fade"
              style={{
                textShadow: '0 0 16px rgba(56, 189, 248, 0.8)',
                filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))'
              }}
            >
              +1
            </span>
          </div>
        )}
        
        {/* Ripple effect */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-sky-300" />
        )}
      </div>
    </div>
  );
};

export default AnimatedAttendanceCounter;
