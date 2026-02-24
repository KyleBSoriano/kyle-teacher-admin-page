import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: () => void;
  startTutorialAtStep: (step: number) => void;
  endTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  getCurrentStep: () => TutorialStep | null;
  advanceToStep: (stepIndex: number) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const tutorialSteps: TutorialStep[] = [
  {
    id: 'create-class-button',
    title: '1/4: Click here to create a new class!',
    description: 'Start by creating your first class to get familiar with the system.',
    targetSelector: '[data-tutorial="create-class-button"]',
    position: 'bottom'
  },
  {
    id: 'fill-class-details',
    title: '2/4: Fill in your class details',
    description: 'Enter your class period, subject, start time, and end time. All fields are required to create your class.',
    targetSelector: '[data-tutorial="class-form"]',
    position: 'right'
  },
  {
    id: 'class-created-success',
    title: '3/4: Great! You\'ve Created a class!',
    description: 'Give the code and share with students to allow them to enroll.',
    targetSelector: '[data-tutorial="set-app-access"]',
    position: 'top'
  },
  {
    id: 'choose-app-template',
    title: '4/4: Now Choose an App Template!',
    description: 'Start with a recommended template by your district, and edit to your liking.',
    targetSelector: '[data-tutorial="app-template-dialog"]',
    position: 'top'
  }
];

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const location = useLocation();

  // Auto-advance tutorial based on page navigation and actions
  useEffect(() => {
    if (!isActive) return;
    
    const currentPath = location.pathname;
    
    // If user navigated to create class page and we're on step 0 (1/4), advance to step 1 (2/4)
    if (currentPath === '/classes/new' && currentStep === 0) {
      setTimeout(() => setCurrentStep(1), 100);
    }
  }, [location.pathname, isActive, currentStep]);

  // Add method to advance to specific step
  const advanceToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < tutorialSteps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const startTutorialAtStep = (step: number) => {
    setIsActive(true);
    setCurrentStep(step);
  };

  const endTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCurrentStep = () => {
    return tutorialSteps[currentStep] || null;
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        steps: tutorialSteps,
        startTutorial,
        startTutorialAtStep,
        endTutorial,
        nextStep,
        previousStep,
        getCurrentStep,
        advanceToStep
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};