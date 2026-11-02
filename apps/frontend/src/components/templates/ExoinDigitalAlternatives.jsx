import React, { useState } from 'react';
import { Layout, Instagram, MonitorPlay, Barcode, Wifi, Battery, Share2, MessageCircle, Heart } from 'lucide-react';
import { Logo } from './Logo';

const ExoinDigitalAlternatives = () => {
  const [activeOption, setActiveOption] = useState('option2'); // Default to B (Cinematic)

  // --- REUSABLE LOGO ---
  const CardLogo = ({ variant = 'dark', scale = 1, iconOnly = false }) => {
    return <Logo variant={variant === 'light' ? 'default' : variant} scale={scale} iconOnly={iconOnly} />;
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Digital Presence</h2>
        <p className="text-slate-500 text-sm">Social Media & Presentation Assets</p>
      </div>

      {/* Switcher */}
      <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-200 mb-12 flex gap-1">
        <button
          onClick={() => setActiveOption('option1')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeOption === 'option1' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Option A: The Data Stream
        </button>
        <button
          onClick={() => setActiveOption('option2')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeOption === 'option2' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Option B: Cinematic Noir
        </button>
      </div>

      {/* --- OPTION A: THE DATA STREAM (HUD/Tech) --- */}
      {activeOption === 'option1' && (
        <div className="flex flex-col gap-12 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* 1. LINKEDIN BANNER */}
           <div className="w-[800px] h-[200px] bg-[#0F172A] rounded-xl shadow-2xl relative overflow-hidden border border-slate-800 flex items-center">
              {/* Scrolling Data Background */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/circuit.png')]"></div>
              <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-orange-500/20 to-transparent"></div>
              
              <div className="p-12 z-10 flex items-center justify-between w-full">
                 <div>
                    <div className="mb-2">
                       <CardLogo variant="dark" scale={1.5} />
                    </div>
                    <p className="text-xs font-mono text-orange-400 tracking-widest uppercase">Next-Gen Enterprise Architecture</p>
                 </div>
                 
                 <div className="text-right font-mono text-[10px] text-slate-500 border-l border-slate-700 pl-6">
                    <p>STATUS: ONLINE</p>
                    <p>LOC: NAIROBI_KE</p>
                    <p>VER: 2.4.0</p>
                 </div>
              </div>

              {/* Decorative HUD Elements */}
              <div className="absolute top-2 left-2 flex gap-1">
                 <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                 <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                 <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
              </div>
           </div>

           {/* 2. INSTAGRAM POST */}
           <div className="w-[400px] h-[400px] bg-slate-900 rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-8 border border-slate-800">
              <div className="flex justify-between items-center">
                 <CardLogo variant="dark" scale={0.8} />
                 <span className="text-[9px] font-mono text-slate-500">SYS_ANNOUNCE</span>
              </div>

              {/* Center Graphic */}
              <div className="my-auto relative flex flex-col items-center justify-center">
                 <div className="w-32 h-32 rounded-full border border-orange-500/30 flex items-center justify-center relative">
                    <div className="absolute inset-0 border border-t-orange-500 rounded-full animate-spin"></div>
                    <div className="w-24 h-24 rounded-full bg-slate-800/50 backdrop-blur-sm flex items-center justify-center">
                       <span className="text-2xl font-black text-white">99.9%</span>
                    </div>
                 </div>
                 <p className="text-xs font-bold text-white uppercase tracking-widest mt-4">Uptime Guaranteed</p>
                 <p className="text-[10px] text-slate-400">Mission-critical infrastructure</p>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                 <div className="flex gap-2">
                    <Heart size={14} className="text-slate-600" />
                    <MessageCircle size={14} className="text-slate-600" />
                    <Share2 size={14} className="text-slate-600" />
                 </div>
                 <Barcode size={24} className="text-slate-600" />
              </div>
           </div>

        </div>
      )}

      {/* --- OPTION B: CINEMATIC NOIR (Chosen Direction) --- */}
      {activeOption === 'option2' && (
        <div className="flex flex-col gap-12 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* 1. PRESENTATION TITLE SLIDE (16:9) */}
           <div className="w-[700px] h-[393px] bg-[#020617] rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-12 border border-slate-800">
              
              {/* Cinematic Background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/40 via-transparent to-orange-950/20"></div>
              {/* Subtle Grid */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

              {/* Slide Header */}
              <div className="flex justify-between items-start relative z-10">
                 <CardLogo variant="dark" />
                 <span className="text-[8px] font-mono text-slate-500 tracking-widest border border-slate-800 px-2 py-1 rounded">CONFIDENTIAL</span>
              </div>

              {/* Main Title Area */}
              <div className="relative z-10 max-w-lg">
                 <div className="w-12 h-1 bg-orange-500 mb-6"></div>
                 <h1 className="text-3xl font-black text-white tracking-tight leading-tight uppercase mb-2">
                    Infrastructure<br/>Expansion 2026
                 </h1>
                 <p className="text-xs text-slate-400 font-mono tracking-wider">
                    Q4 STRATEGIC DELIVERABLES & ARCHITECTURE
                 </p>
              </div>

              {/* Slide Footer */}
              <div className="flex justify-between items-end relative z-10 border-t border-slate-800/80 pt-4">
                 <div className="text-[8px] text-slate-600 font-mono">
                    EXOIN ENTERPRISE • NAIROBI
                 </div>
                 <div className="text-[8px] text-slate-600 font-mono">
                    01 / 24
                 </div>
              </div>

              {/* Glow Accent */}
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
           </div>

           {/* 2. SOCIAL STORY / MOBILE ASSET (9:16) */}
           <div className="flex gap-8 items-center">
              
              {/* Phone Mockup Frame */}
              <div className="w-[240px] h-[480px] bg-black rounded-[32px] p-2 shadow-2xl border-4 border-slate-800 relative">
                 {/* Screen */}
                 <div className="w-full h-full bg-[#050B14] rounded-[24px] overflow-hidden relative flex flex-col justify-between p-6">
                    
                    {/* Story Bars */}
                    <div className="flex gap-1 absolute top-3 left-4 right-4">
                       <div className="h-0.5 flex-1 bg-white rounded-full"></div>
                       <div className="h-0.5 flex-1 bg-white/30 rounded-full"></div>
                       <div className="h-0.5 flex-1 bg-white/30 rounded-full"></div>
                    </div>

                    {/* Top User Info */}
                    <div className="mt-4 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <CardLogo variant="dark" scale={0.8} iconOnly={true} />
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-white leading-none">exoin.africa</p>
                          <p className="text-[7px] text-slate-500">Sponsored</p>
                       </div>
                    </div>

                    {/* Impact Center */}
                    <div className="my-auto text-center">
                       <div className="scale-125 mb-4 inline-block">
                          <CardLogo variant="dark" scale={1.5} iconOnly={true} />
                       </div>
                       <h3 className="text-lg font-black text-white leading-tight uppercase">
                          Scale Without<br/>Limits.
                       </h3>
                       <p className="text-[9px] text-slate-400 mt-2 max-w-[160px] mx-auto">
                          Enterprise grade infrastructure designed for Africa's future.
                       </p>
                    </div>

                    {/* Swipe Up CTA */}
                    <div className="text-center pb-2 animate-bounce">
                       <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">Swipe Up</p>
                       <div className="w-1 h-1 border-b border-r border-orange-500 transform rotate-45 mx-auto mt-1"></div>
                    </div>

                 </div>
              </div>

              {/* Asset Description */}
              <div className="max-w-xs text-left">
                 <h4 className="text-sm font-bold text-slate-800 uppercase mb-2">Cinematic Mobile</h4>
                 <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    High contrast visuals optimized for OLED screens. The orange glow elements pop dramatically against true-black backgrounds, commanding attention in fast-scrolling feeds.
                 </p>
                 <div className="flex items-center gap-2 text-xs font-mono text-orange-600">
                    <MonitorPlay size={14} />
                    <span>9:16 VERTICAL FORMAT</span>
                 </div>
              </div>

           </div>

        </div>
      )}

      {/* Designer Notes */}
      <div className="mt-16 max-w-2xl text-center border-t border-slate-200 pt-8">
         <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Art Direction Note</h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            Option B (Cinematic Noir) gives Exoin an established, tier-one tech company presence. It rejects startup minimalism in favor of dramatic, high-budget corporate confidence.
         </p>
      </div>

    </div>
  );
};

export default ExoinDigitalAlternatives;
