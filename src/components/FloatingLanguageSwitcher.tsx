'use client';

import React, { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function FloatingLanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  const label = useMemo(() => (language === 'en' ? 'EN' : 'HI'), [language]);
  const title = useMemo(() => (
    language === 'en' ? 'Switch to Hindi' : 'English par le jaye'
  ), [language]);

  const handleClick = () => {
    console.log('Language switcher clicked! Current language:', language);
    toggleLanguage();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end space-y-2">
      {/* Language indicator */}
      <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-75">
        Current: {language === 'en' ? 'English' : 'Hindi'}
      </div>
      
      {/* Language toggle button */}
      <button
        onClick={handleClick}
        title={title}
        aria-label="Toggle language"
        className="rounded-full w-12 h-12 flex items-center justify-center shadow-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all duration-200 hover:scale-110"
        style={{
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
        }}
      >
        {label}
      </button>
    </div>
  );
}


