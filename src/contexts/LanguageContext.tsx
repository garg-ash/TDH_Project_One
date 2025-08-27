'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type SupportedLanguage = 'en' | 'hi';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? (localStorage.getItem('app_language') as SupportedLanguage | null) : null;
      if (saved === 'en' || saved === 'hi') {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      if (typeof window !== 'undefined') localStorage.setItem('app_language', lang);
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'hi' : 'en';
      try {
        if (typeof window !== 'undefined') localStorage.setItem('app_language', next);
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo(() => ({ language, setLanguage, toggleLanguage }), [language, setLanguage, toggleLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};


