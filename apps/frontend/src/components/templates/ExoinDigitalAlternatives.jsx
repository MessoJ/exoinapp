import React, { useState } from 'react';
import { Layout, Instagram, MonitorPlay, Barcode, Wifi, Battery, Share2, MessageCircle, Heart } from 'lucide-react';

const ExoinDigitalAlternatives = () => {
  const [activeOption, setActiveOption] = useState('option2'); // Default to B (Cinematic)

  // --- REUSABLE LOGO ---
  const CardLogo = ({ variant = 'dark', scale = 1, iconOnly = false }) => {
    const fillColor = variant === 'dark' ? '#FFFFFF' : '#1E3A8A';
    const accentColor = '#F97316';
    const textColor = variant === 'dark' ? 'text-white' : 'text-slate-900';
    const subTextColor = variant === 'dark' ? 'text-slate-400' : 'text-slate-500';

    return (
      <div className={`flex items-center ${iconOnly ? 'justify-center' : 'gap-3'}`} style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
        <div className="h-8 w-8 relative flex-shrink-0 drop-shadow-lg">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill={fillColor} />
            <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill={accentColor} />
          </svg>
        </div>
        {!iconOnly && (
          <div className="flex flex-col justify-between h-7 py-0.5">
              <div className="relative leading-none">
                <h1 className={`text-xl font-black tracking-tighter leading-none m-0 ${textColor}`} style={{ fontFamily: 'sans-serif' }}>
                    EXOIN
                </h1>
                {/* Split Horizon: True Cut simulation */}
                <div className={`absolute top-[75%] left-0 w-full h-[1px] ${variant === 'dark' ? 'bg-[#0F172A]' : 'bg-white'}`}></div>
              </div>
              <div className="flex items-center justify-end gap-1">
                <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                <span className={`text-[5px] font-bold tracking-[0.4em] uppercase ${subTextColor}`}>AFRICA</span>
              </div>
          </div>
        )}
      </div>
    );
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
              <div className="absolute inset-0 opacity-10 font-mono text-[8px] text-green-500 leading-none whitespace-pre overflow-hidden">
                 {`010101 SYSTEM READY 010101 HYGIENE PROTOCOL 8842 INITIALIZED 010101\n`.repeat(20)}
              </div>
              
              <div className="relative z-10 px-12 w-full flex justify-between items-end">
                 <div>
                    <CardLogo variant="dark" scale={1.5} />
                    <div className="mt-4 flex gap-4 text-[10px] font-mono text-blue-400">
                       <span className="border border-blue-500/30 px-2 py-1 rounded bg-blue-500/10">SYS: ONLINE</span>
                       <span className="border border-blue-500/30 px-2 py-1 rounded bg-blue-500/10">NET: SECURE</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-1">DATA-DRIVEN<br/>HYGIENE</h2>
                    <p className="text-[10px] text-slate-400 tracking-widest uppercase">Automated for Industry</p>
                 </div>
              </div>
           </div>

           {/* 2. INSTAGRAM POST */}
           <div className="w-[400px] h-[400px] bg-[#0F172A] rounded-xl shadow-2xl relative overflow-hidden border border-slate-800 p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div className="text-xs font-mono text-orange-500">/// UPDATE_V4.2</div>
                 <Wifi size={16} className="text-slate-600" />
              </div>
              
              <div className="text-center relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-dashed border-slate-600 rounded-full animate-spin-slow opacity-30"></div>
                 <h3 className="text-5xl font-black text-white mb-2">99.9%</h3>
                 <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">Pathogen Elimination</p>
              </div>

              <div className="flex justify-between items-end border-t border-slate-800 pt-4">
                 <CardLogo variant="dark" scale={0.8} />
                 <Barcode className="text-slate-600 h-6 w-24" />
              </div>
           </div>

        </div>
      )}


      {/* --- OPTION B: CINEMATIC NOIR (Premium/Atmosphere) --- */}
      {activeOption === 'option2' && (
        <div className="flex flex-col gap-12 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* 1. LINKEDIN BANNER */}
           <div className="w-[800px] h-[200px] bg-black rounded-xl shadow-2xl relative overflow-hidden border border-slate-900">
              {/* Atmospheric Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0F172A] to-black"></div>
              
              {/* Light Beam */}
              <div className="absolute top-0 right-1/3 w-32 h-full bg-gradient-to-b from-orange-500/20 to-transparent transform skew-x-12 blur-xl"></div>

              <div className="relative z-20 h-full flex items-center justify-between px-16">
                 <div className="scale-125">
                    <CardLogo variant="dark" />
                 </div>
                 
                 <div className="text-right">
                    <h1 className="text-4xl font-serif italic text-white tracking-wide opacity-90">
                       Beyond Clean.
                    </h1>
                 </div>
              </div>
           </div>

           {/* 2. INSTAGRAM POST (The "Movie Poster" Look) */}
           <div className="w-[400px] h-[400px] bg-black rounded-xl shadow-2xl relative overflow-hidden border border-slate-900 group">
              
              {/* Image Placeholder (Simulating the Drone Shot) */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                 {/* Simulated Spotlight */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-blue-500/10 to-transparent blur-2xl"></div>
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-between z-20">
                 <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="text-[8px] text-slate-500 tracking-[0.3em] uppercase">New Deployment</div>
                    <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                 </div>

                 <div className="text-center">
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-2">
                       The Future<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-500">Has Arrived</span>
                    </h2>
                 </div>

                 <div className="flex justify-center">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full">
                       <CardLogo variant="dark" scale={0.8} iconOnly={true} />
                    </div>
                 </div>
              </div>
           </div>

           {/* 3. PITCH DECK SLIDE (Minimalist) */}
           <div className="w-[640px] h-[360px] bg-[#020617] rounded-xl shadow-2xl relative overflow-hidden border border-slate-800 flex flex-col justify-center items-center text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(30,58,138,0.15),transparent_60%)]"></div>
              
              <div className="relative z-10">
                 <div className="mb-8">
                    <CardLogo variant="dark" scale={1.5} iconOnly={true} />
                 </div>
                 <h1 className="text-5xl font-black text-white tracking-tight mb-4">
                    INVESTOR MEMO
                 </h1>
                 <div className="h-[1px] w-16 bg-orange-500 mx-auto mb-4"></div>
                 <p className="text-[10px] font-serif italic text-slate-400 tracking-wider">
                    Strictly Confidential • Series A
                 </p>
              </div>
           </div>

        </div>
      )}

      {/* Designer Notes */}
      <div className="mt-16 max-w-2xl text-center border-t border-slate-200 pt-8">
         <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Design Strategy</h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            {activeOption === 'option1' 
              ? "Option A uses 'Data Density' to build trust. It looks like a system interface, implying that Exoin is a software/data company as much as a cleaning company."
              : "Option B uses 'Cinematic Minimalism'. It creates desire and mystery. It positions Exoin as a luxury/elite tech brand, using the new 'Beyond Clean' slogan in a sophisticated serif font."}
         </p>
      </div>

    </div>
  );
};

export default ExoinDigitalAlternatives;
