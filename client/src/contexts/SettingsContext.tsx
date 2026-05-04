import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsState {
  // Mobile View
  mobileView: boolean;
  mobilePreviewMode: 'phone' | 'tablet' | 'desktop';
  
  // Theme Settings
  theme: 'light' | 'dark' | 'auto';
  highContrast: boolean;
  
  // Icon & Density
  iconSize: 'small' | 'medium' | 'large';
  uiDensity: 'compact' | 'comfortable';
  
  // Typography
  fontSize: 'small' | 'normal' | 'large';
  lineSpacing: boolean;
  
  // Diagnostic UI Controls
  showTop5Only: boolean;
  autoCollapseLowPriority: boolean;
  enableFocusQuestions: boolean;
  
  // Advanced Features
  enableAIChat: boolean;
  enableVoiceInput: boolean;
  enableOfflineMode: boolean;
  enableDataSync: boolean;
}

interface SettingsContextType {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsState = {
  mobileView: false,
  mobilePreviewMode: 'phone',
  theme: 'auto',
  highContrast: false,
  iconSize: 'medium',
  uiDensity: 'comfortable',
  fontSize: 'normal',
  lineSpacing: false,
  showTop5Only: true,
  autoCollapseLowPriority: false,
  enableFocusQuestions: true,
  enableAIChat: true,
  enableVoiceInput: false,
  enableOfflineMode: false,
  enableDataSync: true
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(() => {
    const savedSettings = localStorage.getItem('healthCompassSettings');
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Apply settings effects when they change
  useEffect(() => {
    localStorage.setItem('healthCompassSettings', JSON.stringify(settings));
    
    // Apply mobile view class to body
    if (settings.mobileView) {
      document.body.classList.add('mobile-view');
      // Apply preview mode class
      if (settings.mobilePreviewMode === 'tablet') {
        document.body.classList.remove('desktop-preview');
        document.body.classList.add('tablet-preview');
      } else if (settings.mobilePreviewMode === 'desktop') {
        document.body.classList.remove('tablet-preview');
        document.body.classList.add('desktop-preview');
      } else { // phone mode
        document.body.classList.remove('tablet-preview', 'desktop-preview');
      }
    } else {
      document.body.classList.remove('mobile-view', 'tablet-preview', 'desktop-preview');
    }
    
    // Apply font size
    document.documentElement.style.setProperty('--app-font-size', 
      settings.fontSize === 'small' ? '12px' : 
      settings.fontSize === 'large' ? '16px' : '14px'
    );
    
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Apply high contrast
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('healthCompassSettings');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}