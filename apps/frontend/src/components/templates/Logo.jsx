'use client';

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Universal Exoin Africa Brand Logo
 * 
 * Supports:
 * - variant: 'default' | 'dark' | 'monochrome' | 'white' | 'export'
 * - scale: number (e.g. 1, 1.15, 1.5, 4)
 * - iconOnly: boolean (renders ribbon mark only)
 * - asLink: boolean (wraps in Router Link or div)
 * - forExport: boolean (optimized for html2canvas / jspdf / print without clipPath dependency)
 * - bgColor: string (custom background color to match the cut slit through EXOIN)
 */
export function Logo({
  className = '',
  variant = 'default',
  scale = 1,
  iconOnly = false,
  asLink = false,
  href = '/',
  forExport = false,
  bgColor = null,
  style = {}
}) {
  const isMonochrome = variant === 'monochrome' || variant === 'white';
  const isDark = variant === 'dark' || isMonochrome;

  const colors = {
    // Ribbon Colors
    iconNavy: isMonochrome ? '#FFFFFF' : '#1E3A8A',
    iconOrange: isMonochrome ? '#FFFFFF' : '#F97316',
    
    // Typography Colors
    text: isDark ? '#FFFFFF' : '#0F172A',
    subText: isDark ? '#94A3B8' : '#64748B',
    
    // Accent Dot
    dot: isMonochrome ? '#FFFFFF' : '#F97316', 
  };

  const slitColor = bgColor || (isDark ? '#0A0A0A' : '#FFFFFF');

  const combinedStyle = {
    ...style,
    ...(scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'left center' } : {})
  };

  const content = (
    <div 
      className={`group relative inline-flex items-center gap-3 select-none ${className}`}
      style={combinedStyle}
    >
      {/* A. THE INTERTWINED RIBBON ICON */}
      <div className="h-10 w-10 sm:h-12 sm:w-12 relative flex-shrink-0 drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" style={{ display: 'block' }}>
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
      {!iconOnly && (
        <div className="inline-flex flex-col justify-between h-9 sm:h-11 py-0.5 w-fit">
          {/* 1. EXOIN Main Typography */}
          <div className="relative leading-none w-fit">
            {forExport ? (
              // Print & Canvas Safe SVG Text for 100% PDF Fidelity
              <svg width="76" height="30" viewBox="0 0 76 30" style={{ display: 'block' }}>
                <text
                  x="0"
                  y="24"
                  fill={colors.text}
                  style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.02em',
                  }}
                >
                  EXOIN
                </text>
                {/* Horizontal Slit Accent */}
                <line x1="0" y1="21" x2="76" y2="21" stroke={slitColor} strokeWidth="1.5" />
              </svg>
            ) : (
              // DOM / Screen Cut
              <h1 
                className="text-2xl sm:text-3xl font-black tracking-tighter leading-none m-0 whitespace-nowrap"
                style={{ 
                  color: colors.text,
                  fontFamily: 'var(--font-sans), system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 72%, 0% 72%, 0% 78%, 100% 78%, 100% 100%, 0% 100%)'
                }}
              >
                EXOIN
              </h1>
            )}
          </div>

          {/* 2. AFRICA Sub-Brand with Accent Dot - Ends exactly flush where EXOIN ends */}
          <div className="relative h-2.5 sm:h-3 w-full flex items-center justify-end gap-1.5 mt-0.5 pr-0">
            <div 
              className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: colors.dot, boxShadow: `0 0 5px ${colors.dot}` }}
            />
            <span 
              className="text-[6.5px] sm:text-[7.5px] font-bold tracking-[0.20em] uppercase leading-none -mr-[0.20em]"
              style={{ color: colors.subText }}
            >
              AFRICA
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to={href} className="inline-flex items-center text-inherit no-underline">
        {content}
      </Link>
    );
  }

  return content;
}

export const ExoinLogo = Logo;
export default Logo;
