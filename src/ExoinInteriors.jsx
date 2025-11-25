import React, { useState } from 'react';
import { MapPin, Wifi, ShieldCheck, Battery, Activity, Users, Clock } from 'lucide-react';

const ExoinInteriors = () => {
  const [activeOption, setActiveOption] = useState('option2'); // Default to B

  // --- REUSABLE LOGO FOR SIGNAGE (Corrected Alignment) ---
  const SignageLogo = ({ variant = 'dark', scale = 1 }) => {
    const fillColor = variant === 'dark' ? '#FFFFFF' : '#1E3A8A';
    const accentColor = '#F97316';
    const textColor = variant === 'dark' ? 'text-white' : 'text-slate-900';
    const subTextColor = variant === 'dark' ? 'text-slate-400' : 'text-slate-500';

    return (
      <div className="flex items-center gap-4" style={{ transform: `scale(${scale})` }}>
        {/* Icon */}
        <div className="h-16 w-16 relative flex-shrink-0 drop-shadow-2xl">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill={fillColor} />
            <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill={accentColor} />
          </svg>
        </div>
        
        {/* Text Stack - Auto Width based on EXOIN */}
        <div className="flex flex-col justify-between h-14 py-1">
            {/* EXOIN defines the max width */}
            <div className="relative leading-none">
              <h1 className={`text-4xl font-black tracking-tighter leading-none m-0 ${textColor}`} 
                  style={{ 
                      fontFamily: 'sans-serif', 
                      clipPath: 'polygon(0% 0%, 100% 0%, 100% 72%, 0% 72%, 0% 78%, 100% 78%, 100% 100%, 0% 100%)' 
                  }}>
                  EXOIN
              </h1>
            </div>
            
            {/* Africa - Aligned to Right Edge of EXOIN */}
            <div className="flex items-center gap-2 self-end">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_#F97316]"></div>
              <span className={`text-[10px] font-bold tracking-[0.4em] uppercase ${subTextColor}`}>AFRICA</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">HQ Interior Design</h2>
        <p className="text-slate-500 text-sm">The physical manifestation of the brand</p>
      </div>

      {/* Switcher */}
      <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-200 mb-12 flex gap-1">
        <button
          onClick={() => setActiveOption('option1')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeOption === 'option1' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Option A: Corporate Sanctum
        </button>
        <button
          onClick={() => setActiveOption('option2')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeOption === 'option2' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Option B: Operations Command
        </button>
      </div>

      {/* --- OPTION A: CORPORATE SANCTUM (Bright/Clean) --- */}
      {activeOption === 'option1' && (
        <div className="w-full max-w-5xl aspect-video bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-slate-200 animate-in fade-in zoom-in duration-700">
           
           {/* Background: Marble & Light */}
           <div className="absolute inset-0 bg-slate-50">
              {/* Floor Reflection */}
              <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-slate-200/50 to-transparent"></div>
              {/* Light Streaks */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent transform skew-x-12"></div>
           </div>

           {/* RECEPTION DESK */}
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1/3 bg-white rounded-t-3xl shadow-xl border-t border-l border-r border-slate-100 flex items-center justify-center z-20">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#1E3A8A]"></div>
              <p className="text-xs font-bold text-slate-300 tracking-widest uppercase mt-8">Reception</p>
           </div>

           {/* 3D WALL LOGO */}
           <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              {/* Shadow for 3D effect */}
              <div className="absolute top-4 left-4 opacity-10 blur-sm scale-100">
                 <SignageLogo variant="light" scale={2} />
              </div>
              <div className="drop-shadow-2xl">
                 <SignageLogo variant="light" scale={2} />
              </div>
           </div>

           {/* Glass Meeting Rooms (Background) */}
           <div className="absolute top-1/4 right-12 w-64 h-64 border-l border-t border-white/80 bg-blue-50/20 backdrop-blur-sm rounded-tl-3xl">
              <div className="absolute top-1/2 left-4 text-[10px] text-slate-400 font-mono -rotate-90 origin-center">CONF ROOM A</div>
              {/* Frosting Pattern */}
              <div className="absolute bottom-0 left-0 w-full h-24 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           </div>

           {/* Plant Element (Biophilic) */}
           <div className="absolute bottom-0 left-12 w-32 h-48 bg-green-900/80 rounded-t-full blur-[2px]"></div>

        </div>
      )}


      {/* --- OPTION B: OPERATIONS COMMAND (Dark/Tech) --- */}
      {activeOption === 'option2' && (
        <div className="w-full max-w-5xl aspect-video bg-[#050505] rounded-2xl shadow-2xl overflow-hidden relative border border-slate-800 animate-in fade-in zoom-in duration-700">
           
           {/* Background: Dark Concrete & Mesh */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
           
           {/* Lighting: The "Orange Pulse" */}
           <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 shadow-[0_0_50px_#F97316]"></div>
           <div className="absolute bottom-0 right-0 w-1/2 h-64 bg-gradient-to-t from-blue-900/20 to-transparent blur-3xl"></div>

           {/* RECEPTION DESK (Monolith) */}
           <div className="absolute bottom-0 left-24 w-1/3 h-1/3 bg-[#0F172A] rounded-tr-[4rem] border-t border-r border-slate-700 z-20 overflow-hidden">
              {/* LED Strip */}
              <div className="absolute top-8 left-0 w-full h-0.5 bg-orange-500 shadow-[0_0_15px_#F97316]"></div>
              <div className="p-8 pt-12 text-slate-500 text-[10px] font-mono">
                 SYS: ONLINE<br/>SECURE ENTRY
              </div>
           </div>

           {/* WALL SIGNAGE (Backlit) */}
           <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              {/* The Glow Behind */}
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
              
              {/* The Logo (White Acrylic on Dark Wall) */}
              <div className="relative">
                 <SignageLogo variant="dark" scale={2.5} />
              </div>
           </div>

           {/* DIGITAL DATA WALL (Right Side) */}
           <div className="absolute top-24 right-24 w-64 h-48 border border-slate-800 bg-black/50 rounded-lg p-4 flex flex-col gap-2 opacity-80">
              <div className="flex justify-between text-[8px] text-slate-500 font-mono uppercase mb-2">
                 <span>Fleet Status</span>
                 <span className="text-green-500 flex items-center gap-1"><Wifi size={8}/> Live</span>
              </div>
              {/* Simulated Graphs */}
              <div className="flex gap-1 h-12 items-end">
                 <div className="w-2 h-4 bg-blue-900 rounded-sm"></div>
                 <div className="w-2 h-8 bg-blue-800 rounded-sm"></div>
                 <div className="w-2 h-6 bg-blue-900 rounded-sm"></div>
                 <div className="w-2 h-10 bg-orange-600 rounded-sm animate-pulse"></div>
                 <div className="w-2 h-5 bg-blue-900 rounded-sm"></div>
              </div>
              <div className="mt-auto pt-2 border-t border-slate-800 flex justify-between text-[8px] text-slate-400">
                 <span>Nairobi HQ</span>
                 <span>24°C</span>
              </div>
           </div>

           {/* Wayfinding on Floor */}
           <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-12 opacity-30">
              <div className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-2">
                 <MapPin size={12} /> Engineering
              </div>
              <div className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-2">
                 <Users size={12} /> Conference
              </div>
           </div>

        </div>
      )}

      {/* Materials Board */}
      <div className="mt-16 max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-200 pt-8">
         <div className="text-center md:text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">Primary Material</h4>
            <p className="text-xs text-slate-500">
               {activeOption === 'option1' ? 'Carrara White Marble' : 'Matte Charcoal Concrete'}
            </p>
         </div>
         <div className="text-center md:text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">Accent Lighting</h4>
            <p className="text-xs text-slate-500">
               {activeOption === 'option1' ? 'Natural Daylight (5000K)' : 'Volumetric Orange LED (Safety)'}
            </p>
         </div>
         <div className="text-center md:text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">Furniture Style</h4>
            <p className="text-xs text-slate-500">
               {activeOption === 'option1' ? 'Navy Velvet & Chrome' : 'Black Leather & Industrial Steel'}
            </p>
         </div>
      </div>

    </div>
  );
};

export default ExoinInteriors;
