'use client';

import React from 'react';

export function Logo({ className = '', variant = 'default' }) {
  
  const isMonochrome = variant === 'monochrome';
  const isDark = variant === 'dark' || variant === 'monochrome';

  const colors = {
    // Icon Colors
    iconNavy: isMonochrome ? '#FFFFFF' : '#1E3A8A',
    iconOrange: isMonochrome ? '#FFFFFF' : '#F97316',
    
    // Text Colors
    text: isDark ? '#FFFFFF' : '#0F172A',
    subText: isDark ? '#94A3B8' : '#64748B',
    
    // Dot Color
    dot: isMonochrome ? '#FFFFFF' : '#F97316', 
  };

  // NOTE: For your Next.js app, change <a> to <Link> and uncomment the import below
  // import Link from 'next/link';
  return (
    <a 
      href="/" 
      className={`group relative inline-flex items-center gap-3 select-none ${className}`}
    >
      {/* A. THE ICON */}
      <div className="h-10 w-10 sm:h-12 sm:w-12 relative flex-shrink-0 drop-shadow-lg transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path 
            d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" 
            fill={colors.iconNavy} 
          />
          <path 
            d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" 
            fill={colors.iconOrange} 
          />
        </svg>
      </div>

      {/* B. THE TYPOGRAPHY SECTION */}
      <div className="flex flex-col justify-between h-9 sm:h-11 py-0.5 w-full">
        
        {/* 1. EXOIN Main Text with True Transparent Cut */}
        <div className="relative leading-none">
          <h1 
            className="text-2xl sm:text-3xl font-black tracking-tighter leading-none m-0"
            style={{ 
              color: colors.text,
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              // Using clip-path creates a true transparent cut, working on ALL backgrounds
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 72%, 0% 72%, 0% 78%, 100% 78%, 100% 100%, 0% 100%)'
            }}
          >
            EXOIN
          </h1>
        </div>

        {/* 2. AFRICA Integration (Justify Right - Line Removed) */}
        <div className="relative h-2 sm:h-3 w-full flex items-center justify-end gap-2">
          {/* The Label + Dot */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <div 
              className="w-1 h-1 rounded-full" 
              style={{ backgroundColor: colors.dot, boxShadow: `0 0 5px ${colors.dot}` }}
            />
            <span 
              className="text-[6px] sm:text-[8px] font-bold tracking-[0.4em] uppercase"
              style={{ color: colors.subText }}
            >
              AFRICA
            </span>
          </div>
        </div>

      </div>
    </a>
  );
}

export default Logo;
