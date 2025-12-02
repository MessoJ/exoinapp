import React, { useState } from 'react';
import { Lock, FileText, PenTool, Folder, Book, Mail, Scan, Fingerprint, Cpu, ShieldCheck, Wifi } from 'lucide-react';

const ExoinAccessoriesAlternatives = () => {
  const [activeOption, setActiveOption] = useState('option2'); // Defaulting to B

  // --- REUSABLE LOGO ---
  const CardLogo = ({ variant = 'dark', scale = 1, iconOnly = false, ghost = false }) => {
    const isMonochrome = variant === 'monochrome';
    // Ghost mode makes everything dark grey/black for "Black on Black" look
    const fillColor = ghost ? '#1e293b' : ((variant === 'dark' || isMonochrome) ? '#FFFFFF' : '#1E3A8A');
    const accentColor = ghost ? '#0f172a' : (isMonochrome ? '#FFFFFF' : '#F97316');
    const textColor = ghost ? '#334155' : ((variant === 'dark' || isMonochrome) ? 'text-white' : 'text-slate-900');
    const lineColor = ghost ? 'bg-slate-800' : ((variant === 'dark' || isMonochrome) ? 'bg-[#020617]' : 'bg-white');
    const subTextColor = ghost ? 'text-slate-700' : ((variant === 'dark' || isMonochrome) ? 'text-slate-400' : 'text-slate-500');

    return (
      <div className={`flex items-center ${iconOnly ? 'justify-center' : 'gap-3'}`} style={{ transform: `scale(${scale})` }}>
        <div className="h-12 w-12 relative flex-shrink-0 drop-shadow-lg">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill={fillColor} />
            <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill={accentColor} />
          </svg>
        </div>
        {!iconOnly && (
          <div className="flex flex-col justify-between h-11 py-0.5 w-full">
              <div className="relative leading-none">
                <h1 className={`text-3xl font-black tracking-tighter leading-none m-0 ${textColor}`} style={{ fontFamily: 'sans-serif' }}>
                    EXOIN
                </h1>
                <div className={`absolute top-[75%] left-0 w-full h-[1px] ${lineColor}`}></div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className={`w-1 h-1 rounded-full ${ghost ? 'bg-slate-800' : 'bg-orange-500'}`}></div>
                <span className={`text-[8px] font-bold tracking-[0.5em] uppercase ${subTextColor}`}>AFRICA</span>
              </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tangible Assets</h2>
        <p className="text-slate-500 text-sm">Presentation Folders, Notebooks, Envelopes</p>
      </div>

      {/* Switcher */}
      <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-200 mb-12 flex gap-1">
        <button
          onClick={() => setActiveOption('option2')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeOption === 'option2' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Option B: The Data Shell
        </button>
      </div>

      {/* --- OPTION B: THE DATA SHELL (Translucent/Tech) --- */}
      {activeOption === 'option2' && (
        <div className="flex flex-wrap justify-center gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* 1. FOLDER: Smoked Translucent Poly (Frosted) */}
           <div className="w-[400px] h-[550px] bg-slate-900/90 backdrop-blur-sm rounded-lg shadow-2xl relative flex flex-col items-center justify-center border border-white/10 overflow-hidden">
              
              {/* Schematic Overlay */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/circuit.png')]"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent"></div>

              {/* White Screenprint Logo */}
              <div className="scale-150 relative z-10">
                 <CardLogo variant="monochrome" />
              </div>

              {/* Technical Data Label */}
              <div className="absolute top-8 left-8 p-2 border border-white/20 rounded bg-black/20 backdrop-blur-md">
                 <div className="flex items-center gap-2 text-[8px] text-white/60 font-mono">
                    <Folder size={10} />
                    <span>DOC_TYPE: CONTRACT</span>
                 </div>
              </div>

              {/* Orange Pull Tab */}
              <div className="absolute top-1/2 right-0 w-3 h-16 bg-orange-500 rounded-l-md shadow-lg"></div>
           </div>

           <div className="flex flex-col gap-8">
              {/* 2. NOTEBOOK: Carbon Fiber & Polycarbonate */}
              <div className="w-[280px] h-[380px] rounded-r-lg shadow-2xl relative overflow-hidden flex flex-col border-l-4 border-l-orange-500 bg-[#111111]">
                 
                 {/* Carbon Fiber Texture */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-50"></div>
                 
                 {/* Transparent Polycarbonate Overlay with Data Pattern */}
                 <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-[1px] border-r border-white/10 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/circuit.png')] animate-pulse-slow"></div>
                    <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent"></div>
                 </div>

                 <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                    <div>
                       <CardLogo variant="monochrome" scale={0.8} iconOnly={true} />
                       <h3 className="text-sm font-bold text-white uppercase tracking-widest mt-4">Field Data Unit</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-orange-500">
                       <Cpu size={14} />
                       <span className="text-[8px] font-mono">SECURE LOGBOOK</span>
                    </div>
                 </div>
                 
                 {/* Glowing Data Edge */}
                 <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-blue-500 shadow-[0_0_10px_#3B82F6]"></div>
              </div>

              {/* 3. ENVELOPE: Smart Mailer with Digital Seal */}
              <div className="w-[320px] h-[140px] bg-slate-900 rounded shadow-lg relative flex items-center overflow-hidden border border-slate-800">
                 {/* Tech Texture */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 to-transparent"></div>
                 
                 {/* "Digital Display" Area */}
                 <div className="absolute top-4 right-4 w-24 h-12 bg-black/50 border border-blue-500/30 rounded-md flex flex-col items-center justify-center p-1 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                    <div className="flex items-center gap-1 text-blue-400 mb-0.5">
                       <Wifi size={8} />
                       <span className="text-[6px] font-bold uppercase tracking-wider">Encrypted</span>
                    </div>
                    <span className="text-[10px] font-mono text-white tracking-widest">ID: X-9942</span>
                 </div>

                 <div className="ml-8 flex-grow relative z-10">
                    <CardLogo variant="monochrome" scale={0.6} />
                 </div>
                 
                 {/* Bottom Orange Stripe */}
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500"></div>
              </div>
           </div>

        </div>
      )}

      {/* Designer Notes */}
      <div className="mt-16 max-w-2xl text-center border-t border-slate-200 pt-8">
         <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Material Science</h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            Option B focuses on Advanced Materials. We've redesigned the notebook with a carbon fiber and polycarbonate shell, and the envelope as a 'smart mailer' with a digital encryption seal simulation, emphasizing high-tech security.
         </p>
      </div>

    </div>
  );
};

export default ExoinAccessoriesAlternatives;
