import React, { useState } from 'react';
import { Layers, Type, Palette, X as XIcon, LayoutGrid, Download, Shield } from 'lucide-react';

const ExoinBrandGuidelines = () => {
  const [activeOption, setActiveOption] = useState('option2'); // Default to B

  // --- UPDATED LOGO COMPONENT (Exact Match to provided Logo.tsx logic) ---
  const GuidelineLogo = ({ variant = 'dark', scale = 1 }) => {
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
      <div className="group relative inline-flex items-center gap-3 select-none" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {/* A. THE ICON (h-12) */}
        <div className="h-12 w-12 relative flex-shrink-0 drop-shadow-lg">
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

        {/* B. THE TYPOGRAPHY SECTION (h-11) */}
        <div className="flex flex-col justify-between h-11 py-0.5 w-full">
          
          {/* 1. EXOIN Main Text */}
          <div className="relative leading-none">
            <h1 
              className="text-3xl font-black tracking-tighter leading-none m-0"
              style={{ 
                color: colors.text,
                fontFamily: 'sans-serif',
                // True transparency cut using clip-path
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 72%, 0% 72%, 0% 78%, 100% 78%, 100% 100%, 0% 100%)'
              }}
            >
              EXOIN
            </h1>
          </div>

          {/* 2. AFRICA Integration (Justify Right - Line Removed) */}
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
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Brand Guidelines</h2>
        <p className="text-slate-500 text-sm">The "Bible" for consistency across all media</p>
      </div>

      {/* Switcher */}
      <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-200 mb-12 flex gap-1">
        <button
          onClick={() => setActiveOption('option1')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeOption === 'option1' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Option A: The System Core
        </button>
        <button
          onClick={() => setActiveOption('option2')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeOption === 'option2' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Option B: The Visual Manifesto
        </button>
      </div>

      {/* --- OPTION A: THE SYSTEM CORE (Documentation Style) --- */}
      {activeOption === 'option1' && (
        <div className="w-full max-w-5xl bg-white shadow-2xl rounded-xl overflow-hidden flex min-h-[800px] border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* Sidebar Navigation */}
           <div className="w-64 bg-slate-50 border-r border-slate-200 p-8 hidden md:block">
              <div className="mb-12 opacity-50">
                 <GuidelineLogo variant="light" scale={0.8} />
              </div>
              <div className="space-y-6">
                 <div className="flex items-center gap-3 text-orange-600 font-bold text-xs uppercase tracking-wider cursor-pointer">
                    <Layers size={14} /> Logo Logic
                 </div>
                 <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-slate-800">
                    <Palette size={14} /> Color Matrix
                 </div>
                 <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-slate-800">
                    <Type size={14} /> Typography
                 </div>
                 <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-slate-800">
                    <LayoutGrid size={14} /> Layouts
                 </div>
              </div>
              <div className="mt-auto pt-12">
                 <button className="flex items-center gap-2 text-[10px] font-bold text-slate-400 border border-slate-200 px-4 py-2 rounded hover:bg-white hover:text-slate-600 transition-colors">
                    <Download size={12} /> Download Assets
                 </button>
              </div>
           </div>

           {/* Content Area */}
           <div className="flex-grow p-12 bg-white">
              
              {/* 1. Construction */}
              <section className="mb-16">
                 <h3 className="text-2xl font-black text-[#0F172A] mb-6">01. Logo Construction</h3>
                 <div className="bg-slate-50 border border-slate-100 rounded-xl p-12 flex items-center justify-center relative">
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10"></div>
                    
                    {/* Safe Zone Markers */}
                    <div className="border border-dashed border-orange-300 p-8 relative">
                       <div className="absolute -top-6 left-0 text-[8px] font-mono text-orange-400">SAFE ZONE (x)</div>
                       <div className="absolute top-0 -left-6 text-[8px] font-mono text-orange-400 origin-center -rotate-90">PADDING</div>
                       <GuidelineLogo variant="light" scale={1.5} />
                    </div>
                 </div>
                 <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-lg">
                    The Exoin mark is constructed on a precise geometric grid. The "Split Horizon" in the typography must always remain clear. Maintain a minimum clear space of 'x' (height of the 'E') around the logo.
                 </p>
              </section>

              {/* 2. Color Usage */}
              <section>
                 <h3 className="text-2xl font-black text-[#0F172A] mb-6">02. Color Matrix</h3>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-lg bg-[#0F172A] text-white flex flex-col justify-between h-32 shadow-lg">
                       <span className="text-xs font-bold opacity-50">PRIMARY NAVY</span>
                       <div className="font-mono text-xs">
                          <p>HEX: #0F172A</p>
                          <p>CMYK: 90, 76, 50, 60</p>
                       </div>
                    </div>
                    <div className="p-6 rounded-lg bg-[#F97316] text-white flex flex-col justify-between h-32 shadow-lg">
                       <span className="text-xs font-bold opacity-50">SIGNAL ORANGE</span>
                       <div className="font-mono text-xs">
                          <p>HEX: #F97316</p>
                          <p>CMYK: 0, 60, 100, 0</p>
                       </div>
                    </div>
                 </div>
              </section>

           </div>
        </div>
      )}


      {/* --- OPTION B: THE VISUAL MANIFESTO (Editorial Style) --- */}
      {activeOption === 'option2' && (
        <div className="w-full max-w-5xl bg-[#020617] shadow-2xl rounded-xl overflow-hidden border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* Hero Cover */}
           <div className="h-[300px] relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-black to-orange-900/20"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
              
              <div className="text-center relative z-10">
                 <div className="scale-150 mb-6 origin-center inline-block">
                    <GuidelineLogo variant="dark" />
                 </div>
                 <h1 className="text-4xl font-serif italic text-white/80 tracking-wide">Brand Manifesto</h1>
                 <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.3em] mt-2">Version 4.3</p>
              </div>
           </div>

           {/* Content Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Card 1: The Logo */}
              <div className="p-12 border-r border-b border-slate-800/50 hover:bg-white/5 transition-colors group">
                 <div className="flex justify-between items-start mb-8">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">01. Identity</span>
                    <Shield className="text-slate-700 group-hover:text-orange-500 transition-colors" />
                 </div>
                 <div className="h-32 flex items-center justify-center">
                    <GuidelineLogo variant="dark" />
                 </div>
                 <p className="text-sm text-slate-400 mt-8 leading-relaxed">
                    Our symbol represents the intersection of security and growth. The geometric interlocking icon stands for robust infrastructure, while the "Split Horizon" typography signifies our vision "Beyond Clean."
                 </p>
              </div>

              {/* Card 2: Typography */}
              <div className="p-12 border-b border-slate-800/50 hover:bg-white/5 transition-colors group">
                 <div className="flex justify-between items-start mb-8">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">02. Typography</span>
                    <Type className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                 </div>
                 <div className="h-32 flex flex-col justify-center">
                    <h2 className="text-4xl font-black text-white leading-none">Aa Bb Cc</h2>
                    <p className="text-2xl font-serif italic text-slate-500 mt-2">Primary Headline</p>
                 </div>
                 <div className="flex gap-4 text-xs text-slate-400 font-mono mt-4">
                    <span>Sans-Serif: Inter</span>
                    <span className="text-orange-500">/</span>
                    <span>Serif: Playfair</span>
                 </div>
              </div>

              {/* Card 3: Palette */}
              <div className="p-12 border-r border-slate-800/50 hover:bg-white/5 transition-colors group">
                 <div className="flex justify-between items-start mb-8">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">03. Spectrum</span>
                    <Palette className="text-slate-700 group-hover:text-white transition-colors" />
                 </div>
                 <div className="flex gap-0 h-24 rounded-lg overflow-hidden shadow-2xl">
                    <div className="w-2/3 bg-[#0F172A] flex items-end p-3">
                       <span className="text-[8px] text-white font-mono">#0F172A</span>
                    </div>
                    <div className="w-1/3 bg-[#F97316] flex items-end p-3">
                       <span className="text-[8px] text-black font-mono font-bold">#F97316</span>
                    </div>
                 </div>
              </div>

              {/* Card 4: Do's & Don'ts */}
              <div className="p-12 hover:bg-white/5 transition-colors group">
                 <div className="flex justify-between items-start mb-8">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">04. Integrity</span>
                    <CheckCircle2 className="text-slate-700 group-hover:text-green-500 transition-colors" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black p-4 rounded border border-green-900/30 relative overflow-hidden">
                       <div className="absolute top-2 right-2 text-green-500"><Check size={12} /></div>
                       <div className="scale-75 origin-center"><GuidelineLogo variant="dark" /></div>
                    </div>
                    <div className="bg-white p-4 rounded border border-red-900/30 relative overflow-hidden flex items-center justify-center">
                       <div className="absolute top-2 right-2 text-red-500"><XIcon size={12} /></div>
                       {/* Bad Example: Stretched */}
                       <div className="scale-x-150 scale-y-75 origin-center blur-[1px] opacity-50">
                          <GuidelineLogo variant="light" />
                       </div>
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-500 mt-4 text-center">Never stretch, rotate, or recolor the logo.</p>
              </div>

           </div>
        </div>
      )}

    </div>
  );
};

// Icon Helper
const CheckCircle2 = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);
const Check = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

export default ExoinBrandGuidelines;
