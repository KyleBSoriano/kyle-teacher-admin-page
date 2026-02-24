import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TutorialBubbleProps {
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  targetRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  onSkip?: () => void;
  showSkipButton?: boolean;
}

export const TutorialBubble: React.FC<TutorialBubbleProps> = ({
  title,
  description,
  position,
  targetRect,
  onSkip,
  showSkipButton = false
}) => {
  const calculatePosition = () => {
    const bubbleWidth = 300;
    const bubbleHeight = 120;
    const offset = 30; // Increased offset to avoid blocking

    let left = 0;
    let top = 0;

    // Special positioning for form, dialog, and app management steps to avoid blocking
    if (title.includes('2/4') || title.includes('3/4') || title.includes('4/4')) {
      // For step 2/4 (form), position below the form area
      if (title.includes('2/4')) {
        left = targetRect.left + (targetRect.width / 2) - (bubbleWidth / 2);
        top = targetRect.top + targetRect.height + offset;
        
        // Ensure it doesn't go off screen
        left = Math.max(16, Math.min(left, window.innerWidth - bubbleWidth - 16));
      } else {
        // For steps 3/4 and 4/4, position to the right side with larger offset to avoid blocking
        left = targetRect.left + targetRect.width + offset + 20;
        top = targetRect.top + (targetRect.height / 2) - (bubbleHeight / 2);
        
        // If there's not enough space on the right, position to the left with larger offset
        if (left + bubbleWidth > window.innerWidth - 20) {
          left = targetRect.left - bubbleWidth - offset - 20;
        }
      }
    } else {
      // Original positioning logic for other steps
      switch (position) {
        case 'top':
          left = targetRect.left + (targetRect.width / 2) - (bubbleWidth / 2);
          top = targetRect.top - bubbleHeight - offset;
          break;
        case 'bottom':
          left = targetRect.left + (targetRect.width / 2) - (bubbleWidth / 2);
          top = targetRect.top + targetRect.height + offset;
          break;
        case 'left':
          left = targetRect.left - bubbleWidth - offset;
          top = targetRect.top + (targetRect.height / 2) - (bubbleHeight / 2);
          break;
        case 'right':
          left = targetRect.left + targetRect.width + offset;
          top = targetRect.top + (targetRect.height / 2) - (bubbleHeight / 2);
          break;
      }
    }

    // Ensure bubble stays within viewport
    const padding = 16;
    left = Math.max(padding, Math.min(left, window.innerWidth - bubbleWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - bubbleHeight - padding));

    return { left, top };
  };

  const { left, top } = calculatePosition();

  const getArrowClasses = () => {
    const baseClasses = "absolute w-0 h-0 border-solid";
    
    // For form, dialog, and app management steps, determine arrow direction based on actual position
    if (title.includes('2/4') || title.includes('3/4') || title.includes('4/4')) {
      // For step 2/4 (form), arrow points up since bubble is below
      if (title.includes('2/4')) {
        return `${baseClasses} border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-white bottom-full left-1/2 transform -translate-x-1/2`;
      } else {
        // For steps 3/4 and 4/4, determine arrow direction based on actual position
        if (left < targetRect.left) {
          // Bubble is on the left, arrow points right
          return `${baseClasses} border-t-[10px] border-b-[10px] border-l-[10px] border-t-transparent border-b-transparent border-l-white left-full top-1/2 transform -translate-y-1/2`;
        } else {
          // Bubble is on the right, arrow points left
          return `${baseClasses} border-t-[10px] border-b-[10px] border-r-[10px] border-t-transparent border-b-transparent border-r-white right-full top-1/2 transform -translate-y-1/2`;
        }
      }
    }
    
    // Original arrow logic for other positions
    switch (position) {
      case 'top':
        return `${baseClasses} border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-white top-full left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-white bottom-full left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} border-t-[10px] border-b-[10px] border-l-[10px] border-t-transparent border-b-transparent border-l-white left-full top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} border-t-[10px] border-b-[10px] border-r-[10px] border-t-transparent border-b-transparent border-r-white right-full top-1/2 transform -translate-y-1/2`;
      default:
        return '';
    }
  };

  return (
    <div
      className="absolute z-[10000] animate-fade-in"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: '300px',
      }}
    >
      <Card className="bg-white shadow-2xl border-2 border-blue-500 relative">
        <CardContent className="p-4">
          <h3 className="font-bold text-lg text-[#012D68] mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-3">{description}</p>
          {showSkipButton && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSkip}
                className="text-xs px-3 py-1 h-7"
              >
                Skip
              </Button>
            </div>
          )}
        </CardContent>
        <div className={getArrowClasses()} />
      </Card>
    </div>
  );
};