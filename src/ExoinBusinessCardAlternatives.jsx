import React from 'react';
import { Phone, Mail, Globe, MapPin, QrCode, ShieldCheck, Smartphone, Zap } from 'lucide-react';

const ExoinBusinessCardAlternatives = () => {
  // Option B is the chosen direction

  // --- SHARED LOGO COMPONENT (Updated to support iconOnly mode & Monochrome) ---
  const CardLogo = ({ variant = 'dark', scale = 1, iconOnly = false }) => {
    // Check for monochrome
    const isMonochrome = variant === 'monochrome';
    
    // Colors
    const fillColor = (variant === 'dark' || isMonochrome) ? '#FFFFFF' : '#1E3A8A';
    // Accent is White if Monochrome, otherwise Orange
    const accentColor = isMonochrome ? '#FFFFFF' : '#F97316';
    
    const textColor = (variant === 'dark' || isMonochrome) ? 'text-white' : 'text-slate-900';
    const lineColor = (variant === 'dark' || isMonochrome) ? 'bg-[#020617]' : 'bg-white';
    const subTextColor = (variant === 'dark' || isMonochrome) ? 'text-slate-400' : 'text-slate-500';

    return (
    <div className={`flex items-center ${iconOnly ? 'justify-center' : 'gap-3'}`} style={{ transform: `scale(${scale})` }}>
      <div className="h-10 w-10 relative flex-shrink-0 drop-shadow-lg">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill={fillColor} />
          <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill={accentColor} />
        </svg>
      </div>
      
      {!iconOnly && (
        <div className="flex flex-col justify-between h-9 py-0.5">
            <div className="relative leading-none">
            <h1 className={`text-2xl font-black tracking-tighter leading-none m-0 ${textColor}`} style={{ fontFamily: 'sans-serif' }}>
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
  )};

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Your Identity</h2>
        <p className="text-slate-500 text-sm">Comparing two premium design directions</p>
      </div>

      {/* --- OPTION B: NEURAL INTERFACE (THE "BETTER" ONE) --- */}
        <div className="flex flex-col xl:flex-row gap-16 items-center animate-in fade-in zoom-in duration-500">
          
          {/* FRONT: The "Black Mirror" Look */}
          <div className="relative w-[450px] h-[270px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-800 bg-black group">
             
             {/* Ambient Tech Glow */}
             <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-gradient-to-br from-blue-900/20 via-transparent to-orange-900/20 opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
             
             {/* The "Circuit" Grid */}
             <div className="absolute inset-0 opacity-20" 
                  style={{ backgroundImage: 'linear-gradient(#1E3A8A 1px, transparent 1px), linear-gradient(90deg, #1E3A8A 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
             </div>

             {/* Center Focus */}
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="scale-150 p-8 bg-black/40 backdrop-blur-md rounded-full border border-white/5 shadow-2xl">
                    <CardLogo variant="dark" />
                </div>
             </div>

             {/* Holographic Edge */}
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-white to-orange-500 opacity-50"></div>
          </div>

          {/* BACK: The "Data Key" Layout */}
          <div className="relative w-[450px] h-[270px] rounded-2xl shadow-2xl overflow-hidden bg-white flex">
             
             {/* Left: Dark Data Spine */}
             <div className="w-1/3 bg-[#0F172A] relative flex flex-col items-center justify-between border-r-4 border-orange-500 py-8">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                
                <div className="flex flex-col items-center">
                    {/* QR Code embedded in dark zone */}
                    <div className="bg-white p-2 rounded-lg shadow-lg mb-4">
                        <QrCode size={64} className="text-[#0F172A]" />
                    </div>
                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest text-center">Scan for<br/>Access</span>
                </div>

                {/* UPDATED: Monochrome Icon Alone (No Opacity for Pure White) */}
                <div className="">
                    <CardLogo variant="monochrome" iconOnly={true} scale={0.8} />
                </div>
             </div>

             {/* Right: Clean Info Area */}
             <div className="w-2/3 p-8 flex flex-col justify-center relative">
                {/* REMOVED: Lightning Icon */}

                <div className="mb-6">
                   <h3 className="text-2xl font-black text-slate-900 uppercase leading-none">John Doe</h3>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold uppercase rounded">Verified</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chief of Operations</span>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                         <Smartphone size={12} />
                      </div>
                      <span className="text-xs font-medium text-slate-700">+254 700 000 000</span>
                   </div>
                   <div className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                         <Mail size={12} />
                      </div>
                      <span className="text-xs font-medium text-slate-700">john@exoin.africa</span>
                   </div>
                   <div className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                         <Globe size={12} />
                      </div>
                      <span className="text-xs font-medium text-slate-700">exoin.africa</span>
                   </div>
                </div>
             </div>

          </div>
        </div>

      {/* Material Notes */}
      <div className="mt-16 max-w-2xl text-center border-t border-slate-200 pt-8">
         <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Designer's Note</h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            Option B uses a 'Dark Glass' aesthetic with a high-contrast vertical split. It feels like a piece of software hardware. Best for tech investors, innovators, and modern brands.
         </p>
      </div>

    </div>
  );
};

export default ExoinBusinessCardAlternatives;
