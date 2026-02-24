import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTutorial } from '@/context/TutorialContext';
import { TutorialBubble } from './TutorialBubble';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export const TutorialOverlay: React.FC = () => {
  const { isActive, getCurrentStep, endTutorial, advanceToStep } = useTutorial();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const location = useLocation();

  const currentStep = getCurrentStep();

  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetElement(null);
      return;
    }

    // Check if we're on the correct page for the current step
    const currentPath = location.pathname;
    
    // Step 1 should only show on dashboard
    if (currentStep.id === 'create-class-button' && currentPath !== '/') {
      setTargetElement(null);
      return;
    }
    
    // Step 2 should only show on the create class page
    if (currentStep.id === 'fill-class-details' && currentPath !== '/classes/new') {
      setTargetElement(null);
      return;
    }
    
    // Step 3 should show when class creation success dialog is open
    if (currentStep.id === 'class-created-success' && currentPath !== '/classes/new') {
      setTargetElement(null);
      return;
    }
    
    // Step 4 should show when app template dialog is open
    if (currentStep.id === 'choose-app-template') {
      // Look for the app template dialog
      const dialogElement = document.querySelector('[data-tutorial="app-template-dialog"]') as HTMLElement;
      if (dialogElement) {
        setTargetElement(dialogElement);
        updateSpotlight(dialogElement);
        return;
      } else {
        // Retry after a short delay
        setTimeout(() => {
          const retryElement = document.querySelector('[data-tutorial="app-template-dialog"]') as HTMLElement;
          if (retryElement) {
            setTargetElement(retryElement);
            updateSpotlight(retryElement);
          }
        }, 100);
        return;
      }
    }

    const findTarget = () => {
      const element = document.querySelector(currentStep.targetSelector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        updateSpotlight(element);
      } else {
        // Retry after a short delay in case the element isn't rendered yet
        setTimeout(findTarget, 100);
      }
    };

    // Wait a brief moment after navigation to ensure elements are rendered
    const delay = 300;
    const timeoutId = setTimeout(findTarget, delay);
    
    return () => clearTimeout(timeoutId);
  }, [isActive, currentStep, location.pathname]);

  const updateSpotlight = (element: HTMLElement) => {
    let rect = element.getBoundingClientRect();
    let padding = 12;
    
    // For the success dialog step, target the entire dialog container
    if (currentStep?.id === 'class-created-success') {
      const dialogContainer = element.closest('[role="dialog"]') as HTMLElement;
      if (dialogContainer) {
        rect = dialogContainer.getBoundingClientRect();
      }
      padding = 24;
    }
    
    // For app template step, target the entire dialog
    if (currentStep?.id === 'choose-app-template') {
      const dialogContainer = element.closest('[role="dialog"]') as HTMLElement;
      if (dialogContainer) {
        rect = dialogContainer.getBoundingClientRect();
        padding = 24;
      }
    }
    
    // For forms, we need more padding to ensure full visibility
    if (currentStep?.id === 'fill-class-details') {
      padding = 24;
    }
    
    setSpotlightStyle({
      left: rect.left - padding,
      top: rect.top - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2),
    });
  };

  // Remove the handleOverlayClick function since we're handling clicks inline

  if (!isActive || !currentStep || !targetElement) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark overlay with spotlight cutout - completely transparent in spotlight area */}
      <div
        className="absolute inset-0 bg-black/70 pointer-events-none"
        style={{
          clipPath: `polygon(0% 0%, 0% 100%, ${spotlightStyle.left}px 100%, ${spotlightStyle.left}px ${spotlightStyle.top}px, ${(spotlightStyle.left as number) + (spotlightStyle.width as number)}px ${spotlightStyle.top}px, ${(spotlightStyle.left as number) + (spotlightStyle.width as number)}px ${(spotlightStyle.top as number) + (spotlightStyle.height as number)}px, ${spotlightStyle.left}px ${(spotlightStyle.top as number) + (spotlightStyle.height as number)}px, ${spotlightStyle.left}px 100%, 100% 100%, 100% 0%)`
        }}
      />
      
      {/* Invisible click blocker only outside spotlight */}
      <div
        className="absolute inset-0 pointer-events-auto bg-transparent"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          clipPath: `polygon(0% 0%, 0% 100%, ${spotlightStyle.left}px 100%, ${spotlightStyle.left}px ${spotlightStyle.top}px, ${(spotlightStyle.left as number) + (spotlightStyle.width as number)}px ${spotlightStyle.top}px, ${(spotlightStyle.left as number) + (spotlightStyle.width as number)}px ${(spotlightStyle.top as number) + (spotlightStyle.height as number)}px, ${spotlightStyle.left}px ${(spotlightStyle.top as number) + (spotlightStyle.height as number)}px, ${spotlightStyle.left}px 100%, 100% 100%, 100% 0%)`
        }}
      />
      
      {/* Highlighted area with pulse animation - completely non-interactive */}
      <div
        className="absolute border-4 border-blue-500 rounded-lg shadow-lg animate-pulse pointer-events-none"
        style={{
          left: spotlightStyle.left,
          top: spotlightStyle.top,
          width: spotlightStyle.width,
          height: spotlightStyle.height,
          zIndex: -1, // Put behind everything to ensure no interference
        }}
      />

      {/* Tutorial Bubble */}
      <TutorialBubble
        title={currentStep.title}
        description={currentStep.description}
        position={currentStep.position}
        targetRect={{
          left: spotlightStyle.left as number,
          top: spotlightStyle.top as number,
          width: spotlightStyle.width as number,
          height: spotlightStyle.height as number,
        }}
        showSkipButton={false}
        onSkip={() => {}}
      />

      {/* Exit button - high z-index to ensure it's clickable */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 bg-white/90 hover:bg-white border-gray-300 z-[10000] focus-visible:ring-0 focus-visible:ring-offset-0"
        onClick={() => {
          console.log('Tutorial exit button clicked');
          endTutorial();
        }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};