import React from 'react';
import { Phone, Mail, Globe, MapPin, QrCode, Fingerprint, ShieldCheck, Barcode, Lock, Chip } from 'lucide-react';

const ExoinStationeryAlternatives = () => {
  // Option B is the chosen direction

  // --- REUSABLE LOGO ---
  const CardLogo = ({ variant = 'dark', scale = 1, iconOnly = false }) => {
    const isMonochrome = variant === 'monochrome';
    const fillColor = (variant === 'dark' || isMonochrome) ? '#FFFFFF' : '#1E3A8A';
    const accentColor = isMonochrome ? '#FFFFFF' : '#F97316';
    const textColor = (variant === 'dark' || isMonochrome) ? 'text-white' : 'text-slate-900';
    const lineColor = (variant === 'dark' || isMonochrome) ? 'bg-[#020617]' : 'bg-white';
    const subTextColor = (variant === 'dark' || isMonochrome) ? 'text-slate-400' : 'text-slate-500';

    return (
      <div className={`flex items-center ${iconOnly ? 'justify-center' : 'gap-3'}`} style={{ transform: `scale(${scale})` }}>
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
                <div className={`absolute top-[75%] left-0 w-full h-[1px] ${lineColor}`}></div>
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Stationery & Access</h2>
        <p className="text-slate-500 text-sm">ID Badges and Official Correspondence</p>
      </div>

      {/* --- OPTION B: SECURITY CLEARANCE (High-Tech/Dark) --- */}
        <div className="flex flex-col lg:flex-row gap-16 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* ID BADGE (Dark Mode/Holographic) */}
           <div className="relative w-[300px] h-[480px] bg-[#020617] rounded-xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col group">
              {/* Texture */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-900/20 to-transparent"></div>

              {/* Top Slot */}
              <div className="w-24 h-1 mx-auto mt-6 rounded-full bg-slate-800 border border-slate-700"></div>

              <div className="p-8 flex flex-col items-center relative z-10">
                 
                 {/* Photo with Holographic Ring */}
                 <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-orange-500 mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                    <div className="w-full h-full rounded-full bg-slate-900 border border-slate-700 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] text-slate-600 font-mono">IMG_8842</div>
                        {/* Scan Line Effect */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-orange-500/20 to-transparent opacity-50 animate-pulse"></div>
                    </div>
                 </div>

                 <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Jane Doe</h2>
                 
                 {/* UPDATED: ROLE DISPLAY & STATIC GREEN DOT */}
                 <div className="flex items-center gap-2">
                    {/* Green dot represents 'Active Status' in print */}
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Senior Engineer</p>
                 </div>

                 {/* Chip Element */}
                 <div className="w-12 h-10 mt-8 border border-yellow-600/50 rounded bg-yellow-600/10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit.png')] opacity-50"></div>
                    <div className="w-8 h-6 border border-yellow-500/50 rounded bg-yellow-500/20"></div>
                 </div>

              </div>

              {/* Bottom Data */}
              <div className="mt-auto relative z-10">
                 <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                 <div className="p-6 flex justify-between items-end">
                    <div className="text-left">
                       <p className="text-[8px] text-slate-500 font-bold uppercase">Clearance</p>
                       <p className="text-lg font-black text-white tracking-widest">LVL-4</p>
                    </div>
                    <div className="mb-1">
                       <CardLogo variant="monochrome" iconOnly={true} scale={0.8} />
                    </div>
                 </div>
                 <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-orange-600"></div>
              </div>
           </div>

           {/* LETTERHEAD (Modern/Tech) */}
           <div className="w-[420px] h-[594px] bg-white shadow-xl relative p-0 flex flex-col hidden lg:flex overflow-hidden border border-slate-200">
              
              {/* Top Bar Graphic */}
              <div className="h-2 w-full bg-[#020617] flex">
                 <div className="w-3/4 h-full bg-[#020617]"></div>
                 <div className="w-1/4 h-full bg-orange-500"></div>
              </div>

              {/* Header */}
              <div className="px-10 py-8 flex justify-between items-end">
                 <div className="scale-90 origin-bottom-left">
                    <CardLogo variant="light" />
                 </div>
                 <div className="text-[8px] font-bold tracking-widest text-slate-300 uppercase">
                    Internal Memo / External Comms
                 </div>
              </div>

              {/* Watermark Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-96 h-96 border-[20px] border-slate-50 rounded-full opacity-50"></div>
                 <div className="absolute w-64 h-64 border-[40px] border-slate-50 rounded-full opacity-50"></div>
              </div>

              {/* Content Body */}
              <div className="px-12 py-8 space-y-6 opacity-20 flex-grow relative z-10">
                 <div className="h-2 bg-slate-900 w-1/2 rounded"></div>
                 <div className="space-y-3 pt-8">
                    <div className="h-1.5 bg-slate-800 w-full rounded"></div>
                    <div className="h-1.5 bg-slate-800 w-full rounded"></div>
                    <div className="h-1.5 bg-slate-800 w-5/6 rounded"></div>
                    <div className="h-1.5 bg-slate-800 w-full rounded"></div>
                    <div className="h-1.5 bg-slate-800 w-4/5 rounded"></div>
                 </div>
              </div>

              {/* Tech Footer */}
              <div className="px-10 py-6 border-t border-slate-100 flex justify-between items-center">
                 <div className="flex gap-4 text-[7px] font-mono text-slate-400 uppercase tracking-wider">
                    <span>Nairobi HQ</span>
                    <span>•</span>
                    <span>Secure Doc</span>
                    <span>•</span>
                    <span>Exoin.Africa</span>
                 </div>
                 <QrCode size={20} className="text-slate-300" />
              </div>
           </div>

        </div>

      {/* Designer Notes */}
      <div className="mt-16 max-w-2xl text-center border-t border-slate-200 pt-8">
         <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Design Notes</h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            Option B is high-security and authoritative. The dark card implies 'Access' and 'Technology'. Best for HQ staff, engineers, and corporate entry points.
         </p>
      </div>

    </div>
  );
};

export default ExoinStationeryAlternatives;
