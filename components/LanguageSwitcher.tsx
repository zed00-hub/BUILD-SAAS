import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageCode } from '../translations';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇩🇿' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-3 py-2 hover:bg-white transition-all text-sm font-medium text-slate-700 shadow-sm min-w-[120px] justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{currentLang.flag}</span>
          <span>{currentLang.label}</span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`
                w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors
                ${language === lang.code ? 'text-indigo-600 font-medium bg-indigo-50/50' : 'text-slate-600'}
              `}
            >
              <span className="text-lg leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
              {language === lang.code && <span className="ml-auto text-indigo-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
