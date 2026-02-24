import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  showHelpTooltips: boolean;
  toggleHelpTooltips: () => void;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  updateColors: (primary: string, secondary: string, tertiary: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'clocked-app-settings';

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [showHelpTooltips, setShowHelpTooltips] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#012D68');
  const [secondaryColor, setSecondaryColor] = useState('#8DCEE9');
  const [tertiaryColor, setTertiaryColor] = useState('#EAF1F3');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setShowHelpTooltips(parsed.showHelpTooltips ?? true);
        setPrimaryColor(parsed.primaryColor ?? '#012D68');
        setSecondaryColor(parsed.secondaryColor ?? '#8DCEE9');
        setTertiaryColor(parsed.tertiaryColor ?? '#EAF1F3');
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      showHelpTooltips,
      primaryColor,
      secondaryColor,
      tertiaryColor,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [showHelpTooltips, primaryColor, secondaryColor, tertiaryColor]);

  const toggleHelpTooltips = () => {
    setShowHelpTooltips(prev => !prev);
  };

  const updateColors = (primary: string, secondary: string, tertiary: string) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
    setTertiaryColor(tertiary);
  };

  return (
    <SettingsContext.Provider
      value={{
        showHelpTooltips,
        toggleHelpTooltips,
        primaryColor,
        secondaryColor,
        tertiaryColor,
        updateColors,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};