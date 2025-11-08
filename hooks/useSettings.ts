import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export interface AppSettings {
  companyName: string;
  logo: string | null; // base64 string
}

interface SettingsContextType {
  settings: AppSettings;
  setLogo: (logo: string | null) => void;
  setCompanyName: (name: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'crm_settings';

const getInitialSettings = (): AppSettings => {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    const defaultSettings: AppSettings = { companyName: 'My Company', logo: null };
    return item ? { ...defaultSettings, ...JSON.parse(item) } : defaultSettings;
  } catch (error) {
    console.error('Error reading settings from localStorage', error);
    return { companyName: 'My Company', logo: null };
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error writing settings to localStorage', error);
    }
  }, [settings]);
  
  const setLogo = useCallback((logo: string | null) => {
      setSettings(prev => ({...prev, logo}));
  }, []);

  const setCompanyName = useCallback((name: string) => {
      setSettings(prev => ({...prev, companyName: name}));
  }, []);

  const value = useMemo(() => ({ settings, setLogo, setCompanyName }), [settings, setLogo, setCompanyName]);

  return React.createElement(SettingsContext.Provider, { value }, children);
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
