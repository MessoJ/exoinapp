'use client';

import React from 'react';
import { Logo } from './Logo';

export { Logo };

// --- LOGO SHOWCASE COMPONENT ---
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
