'use client';

import React from 'react';

// --- 1. THE LOGO COMPONENT (FIXED POSITIONS) ---

export function Logo({ className = '', variant = 'default' }) {
  
  const isMonochrome = variant === 'monochrome';
  const isDark = variant === 'dark' || variant === 'monochrome';

  const colors = {
    iconNavy: isMonochrome ? '#FFFFFF' : '#1E3A8A',
    iconOrange: isMonochrome ? '#FFFFFF' : '#F97316',
    text: isDark ? '#FFFFFF' : '#0F172A',
    subText: isDark ? '#94A3B8' : '#64748B',
    dot: isMonochrome ? '#FFFFFF' : '#F97316', 
  };

  return (
    <div className={`group relative inline-flex items-center gap-3 select-none ${className}`}>
      {/* A. THE ICON */}
      {/* Height set to h-12 (48px) */}
      <div className="h-12 w-12 relative flex-shrink-0 drop-shadow-lg transition-transform duration-300 group-hover:scale-105">
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
      {/* UPDATED: Height increased to h-12 to perfectly match Icon height */}
      <div className="flex flex-col justify-between h-12 py-0.5 w-full">
        
        {/* 1. EXOIN Main Text */}
        <div className="relative leading-none">
          <h1 
            className="text-3xl font-black tracking-tighter leading-none m-0"
            style={{ 
              color: colors.text,
              fontFamily: 'sans-serif',
              // True transparency cut
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 72%, 0% 72%, 0% 78%, 100% 78%, 100% 100%, 0% 100%)'
            }}
          >
            EXOIN
          </h1>
        </div>

        {/* 2. AFRICA Integration */}
        <div className="relative h-3 w-full flex items-center justify-end gap-2">
          <div className="flex-shrink-0 flex items-center gap-1">
            <div 
              className="w-1 h-1 rounded-full" 
              style={{ backgroundColor: colors.dot, boxShadow: `0 0 5px ${colors.dot}` }}
            />
            <span 
              className="text-[8px] font-bold tracking-[0.5em] uppercase"
              style={{ color: colors.subText }}
            >
              AFRICA
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}


// --- 2. THE SHOWCASE PAGE ---
const ExoinLogoShowcase = () => {
  return (
    <div className="min-h-screen font-sans flex flex-col">
      
      {/* SECTION 1: Default (Light Mode) */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center border-b border-slate-100 p-12">
        <div className="mb-8 text-center">
            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Variant: 'default'</span>
            <p className="text-slate-500 text-sm mt-2">Standard Brand Colors on Light Background</p>
        </div>
        <div className="scale-150 p-8 border border-slate-100 rounded-xl">
            <Logo variant="default" />
        </div>
      </div>

      {/* SECTION 2: Dark (Website Header) */}
      <div className="flex-1 bg-[#020617] flex flex-col items-center justify-center border-b border-slate-800 p-12">
        <div className="mb-8 text-center">
            <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Variant: 'dark'</span>
            <p className="text-slate-400 text-sm mt-2">Standard Brand Colors on Dark Background</p>
        </div>
        <div className="scale-150 p-8 border border-white/5 rounded-xl bg-white/5">
            <Logo variant="dark" />
        </div>
      </div>

      {/* SECTION 3: Monochrome (Brand/Gradient) */}
      <div className="flex-1 bg-gradient-to-br from-blue-900 to-slate-900 flex flex-col items-center justify-center p-12">
        <div className="mb-8 text-center">
            <span className="text-xs font-bold text-blue-200/50 tracking-widest uppercase">Variant: 'monochrome'</span>
            <p className="text-blue-100 text-sm mt-2">All-White "No Color" Design for Colored Backgrounds</p>
        </div>
        <div className="scale-150 p-8 border border-white/10 rounded-xl bg-white/10 backdrop-blur-sm">
            <Logo variant="monochrome" />
        </div>
      </div>

    </div>
  );
};

export default ExoinLogoShowcase;
