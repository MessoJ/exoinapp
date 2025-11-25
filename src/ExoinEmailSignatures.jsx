import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, Moon, Sun } from 'lucide-react';

const ExoinEmailSignatures = () => {
  const [activeOption, setActiveOption] = useState('option1'); // Option A selected
  const [darkMode, setDarkMode] = useState(false); // State to simulate user environment

  // --- REUSABLE LOGO COMPONENT (Adaptive with Tighter Split) ---
  const SigLogo = ({ variant = 'light', scale = 1 }) => {
    const isDarkBg = variant === 'dark';

    const fillColor = isDarkBg ? '#FFFFFF' : '#1E3A8A';
    const accentColor = isDarkBg ? '#FFFFFF' : '#F97316';
    const textColor = isDarkBg ? 'text-white' : 'text-[#0F172A]';
    const subTextColor = isDarkBg ? 'text-slate-300' : 'text-slate-500';

    return (
      <div className="flex items-center gap-2" style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
        <div className="h-6 w-6 relative flex-shrink-0">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill={fillColor} />
            <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill={accentColor} />
          </svg>
        </div>
        <div className="flex flex-col justify-between h-5 py-0.5">
            <div className="relative leading-none">
              <h1 
                className={`text-sm font-black tracking-tighter leading-none m-0 ${textColor}`} 
                style={{ 
                    fontFamily: 'sans-serif',
                    // UPDATED SPLIT: Reduced gap size (73% to 78%) for a finer cut
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 73%, 0% 73%, 0% 78%, 100% 78%, 100% 100%, 0% 100%)'
                }}
              >
                  EXOIN
              </h1>
            </div>
            <div className="flex items-center justify-end gap-0.5">
              <div className={`w-0.5 h-0.5 rounded-full ${isDarkBg ? 'bg-white' : 'bg-orange-500'}`}></div>
              <span className={`text-[3px] font-bold tracking-[0.4em] uppercase ${subTextColor}`}>AFRICA</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Digital Signatures</h2>
        <p className="text-slate-500 text-sm">HTML-Ready Email Footers</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-8">
        {/* Switcher */}
        <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-200 flex gap-1">
            <button
            onClick={() => setActiveOption('option1')}
            className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                activeOption === 'option1' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
            }`}
            >
            Option A: The Executive Link
            </button>
            <button
            onClick={() => setActiveOption('option2')}
            className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                activeOption === 'option2' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
            }`}
            >
            Option B: The System Node
            </button>
        </div>

        {/* Dark Mode Simulator */}
        <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-sm transition-all ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600'
            }`}
        >
            {darkMode ? <Moon size={14} /> : <Sun size={14} />}
            <span className="text-xs font-bold uppercase">Simulate {darkMode ? 'Light' : 'Dark'} Mode</span>
        </button>
      </div>

      {/* --- PREVIEW CONTAINER (Simulates an Email Client Window) --- */}
      <div className={`w-full max-w-3xl rounded-xl shadow-2xl border overflow-hidden transition-colors duration-300 ${
          darkMode ? 'bg-[#1e1e1e] border-slate-700' : 'bg-white border-slate-200'
      }`}>
        {/* Fake Email Header */}
        <div className={`px-6 py-4 border-b flex gap-4 items-center ${
            darkMode ? 'bg-[#2d2d2d] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
            <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className={`h-2 w-64 rounded-full ml-4 ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
        </div>

        {/* Email Body */}
        <div className="p-12 min-h-[400px] flex flex-col">
            
            <div className={`space-y-4 text-sm mb-12 font-serif italic ${darkMode ? 'text-slate-500' : 'text-slate-400 opacity-50'}`}>
                <p>Dear Partner,</p>
                <p>Here are the updated schematics for the Phase 3 deployment. Our autonomous units are ready for site integration next week.</p>
                <p>Best regards,</p>
            </div>

            {/* --- OPTION A: THE EXECUTIVE LINK (Updated) --- */}
            {activeOption === 'option1' && (
                <div className={`mt-auto border-t-2 pt-6 animate-in fade-in duration-500 ${
                    darkMode ? 'border-orange-500' : 'border-orange-500'
                }`}>
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        
                        {/* Avatar */}
                        <div className={`w-16 h-16 rounded-full border-2 shadow-md overflow-hidden flex-shrink-0 relative ${
                            darkMode ? 'bg-slate-800 border-slate-600' : 'bg-slate-200 border-white'
                        }`}>
                             <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold opacity-50">PHOTO</div>
                        </div>

                        {/* Info Block */}
                        <div className="flex-grow">
                            <h3 className={`text-lg font-bold leading-none ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                John Doe
                            </h3>
                            <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mt-1 mb-4">Chief Operations Officer</p>
                            
                            {/* Contact Grid (UPDATED ORDER) */}
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs font-medium ${
                                darkMode ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                                <a href="#" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                        <Phone size={10} />
                                    </div>
                                    <span>+254 700 000 000</span>
                                </a>
                                <a href="#" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                        <Mail size={10} />
                                    </div>
                                    <span>john@exoin.africa</span>
                                </a>
                                {/* SWAPPED: MapPin (Location) now comes before Globe (Web) for better flow */}
                                <a href="#" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                        <MapPin size={10} />
                                    </div>
                                    <span>Nairobi, Kenya</span>
                                </a>
                                <a href="#" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                        <Globe size={10} />
                                    </div>
                                    <span>www.exoin.africa</span>
                                </a>
                            </div>
                            
                            {/* Address Line (Full) */}
                            <div className={`mt-2 text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Exoin Tower, Westlands Road
                            </div>
                        </div>

                        {/* Logo & Social Block */}
                        <div className={`hidden sm:flex flex-col items-end pl-6 border-l ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div className="scale-125 origin-right mb-4">
                                {/* LOGO SWITCHES COLOR AUTOMATICALLY HERE */}
                                <SigLogo variant={darkMode ? 'dark' : 'light'} />
                            </div>
                            
                            {/* MODERN SOCIAL ICONS (Custom SVGs with Updated LinkedIn) */}
                            <div className="flex gap-2">
                                {/* LinkedIn (Modern "In" Block) */}
                                <a href="#" className={`w-5 h-5 flex items-center justify-center transition-transform hover:scale-110`}>
                                    <svg viewBox="0 0 24 24" fill="currentColor" className={`w-full h-full ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-[#0077b5]'}`}>
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                    </svg>
                                </a>
                                
                                {/* X (Twitter) */}
                                <a href="#" className={`w-5 h-5 flex items-center justify-center transition-transform hover:scale-110`}>
                                    <svg viewBox="0 0 24 24" fill="currentColor" className={`w-full h-full ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'}`}>
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>

                                {/* Instagram */}
                                <a href="#" className={`w-5 h-5 flex items-center justify-center transition-transform hover:scale-110`}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-full h-full ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-[#E1306C]'}`}>
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                    </svg>
                                </a>
                            </div>
                        </div>

                    </div>
                    
                    <div className={`mt-6 text-[9px] leading-relaxed border-t pt-4 ${
                        darkMode ? 'text-slate-600 border-slate-800' : 'text-slate-400 border-slate-100'
                    }`}>
                        <strong className={darkMode ? 'text-slate-500' : 'text-slate-600'}>Confidentiality Notice:</strong> This email is intended only for the person to whom it is addressed. If you are not the intended recipient, you are not authorized to read, print, retain, copy, disseminate, distribute, or use this message or any part thereof.
                    </div>
                </div>
            )}

            {/* Option B preserved for code completeness */}
            {activeOption === 'option2' && <div>Option B content hidden for brevity</div>}

        </div>
      </div>

      {/* Strategy Notes */}
      <div className="mt-16 max-w-2xl text-center border-t border-slate-200 pt-8">
         <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Implementation Strategy</h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            For maximum compatibility, the logo in the signature should be hosted as a PNG with a transparent background. However, for Dark Mode users, it is safest to either use the "Dark Mode Ready" version (White Logo) if you can detect theme, or stick to Option B which forces a dark background container, ensuring the brand looks perfect 100% of the time regardless of the user's settings.
         </p>
      </div>

    </div>
  );
};

export default ExoinEmailSignatures;
