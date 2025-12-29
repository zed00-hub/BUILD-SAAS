import React from 'react';

export const CoinIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-yellow-400 border-2 border-yellow-600 text-yellow-900 shadow-sm ${className}`}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[60%] h-[60%]">
        <path d="M12 4c-3.31 0-6 2.69-6 6 0 1.5.55 2.88 1.48 3.96-.28.89-.48 1.94-.48 3.04h10c0-1.1-.2-2.15-.48-3.04.93-1.08 1.48-2.46 1.48-3.96 0-3.31-2.69-6-6-6zm-3 5c.83 0 1.5.67 1.5 1.5S9.83 12 9 12s-1.5-.67-1.5-1.5S8.17 9 9 9zm6 0c.83 0 1.5.67 1.5 1.5S15.83 12 15 12s-1.5-.67-1.5-1.5S14.17 9 15 9zm-3 8c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z" />
      </svg>
    </div>
  );
};