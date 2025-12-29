import React from 'react';

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "w-10 h-10", 
  textClassName = "text-xl",
  showText = true 
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${className} shrink-0`}>
         <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            {/* The 'C' Shape - Dark Blue */}
            <path 
              fillRule="evenodd"
              clipRule="evenodd"
              d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C60.362 90 69.8037 86.0664 76.9299 79.545L64.8329 67.448C60.9922 70.3015 55.7874 72 50 72C37.8497 72 28 62.1503 28 50C28 37.8497 37.8497 28 50 28C55.7874 28 60.9922 29.6985 64.8329 32.552L76.9299 20.455C69.8037 13.9336 60.362 10 50 10Z" 
              fill="#0F346C" 
            />
            
            {/* The 'K' Shape - Silver/Gray */}
            <path 
              d="M50 25L50 75H65L65 58L78 75H95L78 52L95 25H78L65 42L65 25H50Z" 
              fill="#A0A0A0" 
            />
         </svg>
      </div>
      
      {showText && (
        <span className={`font-extrabold text-slate-900 tracking-tight uppercase ${textClassName}`}>
          Creakits
        </span>
      )}
    </div>
  );
};
