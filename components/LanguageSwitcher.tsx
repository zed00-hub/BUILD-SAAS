
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageCode } from '../translations';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇩🇿' },
  ];

  return (
    <div className={`flex items-center gap-2 bg-white/50 backdrop-blur border border-slate-200 rounded-lg p-1 ${className}`}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${language === lang.code 
              ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
          `}
        >
          <span className="mr-1.5">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
          <span className="sm:hidden uppercase">{lang.code}</span>
        </button>
      ))}
    </div>
  );
};
