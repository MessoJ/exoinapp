import React, { useState } from 'react';
import { ShieldCheck, Globe, Hash, Calendar, MapPin, Lock } from 'lucide-react';

const ExoinLetterheadAlternatives = () => {
  const [activeOption, setActiveOption] = useState('option2'); // Default to B

  // --- REUSABLE LOGO ---
  const CardLogo = ({ variant = 'dark', scale = 1 }) => {
    const fillColor = variant === 'dark' ? '#FFFFFF' : '#1E3A8A';
    const accentColor = '#F97316';
    const textColor = variant === 'dark' ? 'text-white' : 'text-slate-900';
    const lineColor = variant === 'dark' ? 'bg-[#020617]' : 'bg-white';
    const subTextColor = variant === 'dark' ? 'text-slate-400' : 'text-slate-500';

    return (
      <div className="flex items-center gap-3" style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
        <div className="h-8 w-8 relative flex-shrink-0 drop-shadow-sm">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill={fillColor} />
            <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill={accentColor} />
          </svg>
        </div>
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Official Correspondence</h2>
        <p className="text-slate-500 text-sm">Select the format for contracts and official letters</p>
      </div>

      {/* Switcher */}
      <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-200 mb-12 flex gap-1">
        <button
          onClick={() => setActiveOption('option2')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeOption === 'option2' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Option B: The Quantum Grid
        </button>
      </div>

      {/* --- OPTION B: THE QUANTUM GRID (Creative/Tech) --- */}
      {activeOption === 'option2' && (
        <div className="w-[595px] h-[842px] bg-white shadow-2xl relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-500">
           
           {/* Background: Engineering Grid */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.03] pointer-events-none"></div>
           
           {/* NEW WATERMARK: Monochrome Icon + CONQUEROR */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
              <div className="flex flex-col items-center gap-4 transform -rotate-12">
                 <svg viewBox="0 0 100 100" fill="none" className="w-64 h-64 text-slate-900">
                    <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="currentColor" />
                    <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="currentColor" />
                 </svg>
                 <span className="text-6xl font-serif font-bold tracking-widest text-slate-900 uppercase">CONQUEROR</span>
              </div>
           </div>

           {/* Header: Floating Tech Bar */}
           <div className="relative z-10 pt-12 px-12 pb-6">
              <div className="flex justify-between items-center">
                 <CardLogo variant="light" scale={1.3} />
              </div>
           </div>

           {/* Creative Element: The "Horizon Scan" Separator */}
           <div className="relative h-8 w-full overflow-hidden">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-[1px] bg-orange-500"></div>
           </div>

           {/* Body Content Area - READY FOR USE */}
           <div className="flex-grow px-12 py-8 relative text-slate-800 leading-relaxed z-10">
              
              {/* REALISTIC CONTENT EXAMPLE */}
              <div className="text-xs space-y-6">
                 {/* Date & Recipient */}
                 <div>
                    <p className="font-bold mb-4">October 26, 2025</p>
                    <p>To: [Recipient Name]</p>
                    <p>[Company Name]</p>
                    <p>[Address Line 1]</p>
                    <p>[City, Postal Code]</p>
                 </div>

                 {/* Subject Line */}
                 <p className="font-bold uppercase tracking-wider border-b border-slate-100 pb-2">
                    Subject: Strategic Implementation Proposal - Phase 3 Deployment
                 </p>

                 {/* Body Text */}
                 <div className="space-y-4">
                    <p>Dear [Recipient Name],</p>
                    <p>
                       Following our recent consultations regarding the deployment of autonomous hygiene systems across your facilities, we are pleased to submit this finalized proposal for Phase 3 implementation.
                    </p>
                    <p>
                       Our engineering team has completed the site assessments and calibrated the robotic units to match the specific environmental parameters of your logistics hubs. We are confident that this deployment will result in a 35% increase in operational cleanliness efficiency while significantly reducing manual labor requirements and associated risks.
                    </p>
                    <p>
                       Please review the attached documentation detailing the deployment schedule, technical specifications, and service level agreement. We look forward to initiating this next phase of our partnership.
                    </p>
                 </div>

                 {/* Closing */}
                 <div className="pt-8">
                    <p>Sincerely,</p>
                    {/* Simulated Signature Space */}
                    <div className="h-12 mb-2 mt-4 relative">
                       <p className="font-serif text-lg text-slate-900 italic opacity-80">John Doe</p>
                    </div>
                    <p className="font-bold">John Doe</p>
                    <p className="text-slate-500">Chief Operations Officer, Exoin Africa</p>
                 </div>
              </div>
           </div>

           {/* Footer: "The Tech Base" with CURVED EDGES */}
           <div className="bg-[#0F172A] text-white px-12 py-4 flex justify-between items-center relative overflow-hidden rounded-t-3xl mx-0">
              {/* Background Pattern in Footer */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              
              <div className="relative z-10 flex gap-6 text-[8px] font-mono text-slate-400">
                 <div className="flex items-center gap-2">
                    <Globe size={10} className="text-orange-500"/> www.exoin.africa
                 </div>
                 <div className="flex items-center gap-2">
                    <MapPin size={10} className="text-orange-500"/> Nairobi, Kenya
                 </div>
              </div>

              {/* Monochrome White Icon */}
              <div className="relative z-10 h-6 w-6 flex-shrink-0">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="white" />
                  <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="white" />
                </svg>
              </div>

              {/* Updated: Slogan Tag - No Border, Proper Font */}
              <div className="relative z-10 text-[10px] font-serif italic text-white tracking-wider opacity-90">
                 Beyond Clean
              </div>
           </div>
           
           {/* Orange Accent Line (Bottom of Page) */}
           <div className="h-1 w-full bg-gradient-to-r from-orange-600 to-orange-400"></div>

        </div>
      )}

      {/* Comparison Notes */}
      <div className="mt-16 max-w-2xl text-center border-t border-slate-200 pt-8">
         <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Design Breakdown</h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            Option B is modern innovation. Now featuring a custom 'Conqueror' style watermark for premium texture, curved footer architecture, and the 'Beyond Clean' slogan in an elegant serif.
         </p>
      </div>

    </div>
  );
};

export default ExoinLetterheadAlternatives;
