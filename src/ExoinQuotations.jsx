import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';

const ExoinQuotations = () => {
  const [activeOption, setActiveOption] = useState('option1'); // Option A selected

  const quoteData = {
    id: "Q-2025-089",
    date: "October 27, 2025",
    expiry: "November 10, 2025", 
    client: {
      name: "Safaricom PLC",
      dept: "Facilities Management",
      address: "Waiyaki Way, HQ2",
      city: "Nairobi, Kenya"
    },
    items: [
      { 
        title: "Autonomous Floor Scrubbing (Lobby & Corridors)", 
        desc: "Deployment of Model S-1 'Scout' units for daily maintenance. Includes mapping and AI obstacle avoidance setup.",
        unit: "Month", qty: 12, rate: 85000, total: 1020000 
      },
      { 
        title: "Data Center Decontamination (Tier 3)", 
        desc: "ISO 14644-1 Class 8 particulate removal. Anti-static protocols. Bi-annual service.",
        unit: "Service", qty: 2, rate: 120000, total: 240000 
      },
      { 
        title: "Tactical Supply Kit", 
        desc: "Power Scrub™ agents (200L) + consumables for on-site staff.",
        unit: "Quarterly", qty: 4, rate: 45000, total: 180000 
      },
    ],
    subtotal: 1440000,
    tax: 230400, // 16% VAT
    total: 1670400
  };

  // --- UPDATED LOGO FOR QUOTE (Exact Match) ---
  const QuoteLogo = ({ scale = 1 }) => {
    const colors = {
        iconNavy: '#1E3A8A',
        iconOrange: '#F97316',
        text: '#0F172A',
        subText: '#64748B',
        dot: '#F97316',
    };

    return (
      <div className="group relative inline-flex items-center gap-3 select-none" style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
        {/* A. THE ICON */}
        <div className="h-12 w-12 relative flex-shrink-0">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path 
              d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" 
              fill={colors.iconNavy} 
            />
            <path 
              d="M85 70 C85 78.2843 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" 
              fill={colors.iconOrange} 
            />
          </svg>
        </div>

        {/* B. THE TYPOGRAPHY SECTION */}
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sales Proposals</h2>
        <p className="text-slate-500 text-sm">Ready for Production • A4 Standard</p>
      </div>

      {/* --- OPTION A: THE TECHNICAL BLUEPRINT --- */}
      <div className="w-[595px] min-h-[842px] bg-white shadow-2xl relative flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 border-t-4 border-[#0F172A]">
           
           {/* Header */}
           <div className="p-12 pb-6 flex justify-between items-end">
              <div>
                 <QuoteLogo scale={1.2} />
              </div>
              <div className="text-right">
                 <h1 className="text-4xl font-light text-slate-300 uppercase tracking-widest leading-none">Quote</h1>
                 <p className="text-xs font-bold text-[#0F172A] mt-1">REF: {quoteData.id}</p>
              </div>
           </div>

           {/* Grid Data */}
           <div className="mx-12 py-6 border-t border-b border-slate-100 flex justify-between">
              <div className="text-xs space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prepared For</p>
                 <p className="font-bold text-slate-900">{quoteData.client.name}</p>
                 <p className="text-slate-500">{quoteData.client.dept}</p>
                 <p className="text-slate-500">{quoteData.client.address}</p>
              </div>
              <div className="text-xs space-y-1 text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Validity</p>
                 <div className="flex items-center justify-end gap-2">
                    <span className="text-slate-500">Issued:</span>
                    <span className="font-mono">{quoteData.date}</span>
                 </div>
                 <div className="flex items-center justify-end gap-2">
                    <span className="text-slate-500">Expires:</span>
                    <span className="font-mono text-orange-600 font-bold">{quoteData.expiry}</span>
                 </div>
              </div>
           </div>

           {/* Body */}
           <div className="p-12 flex-grow">
              <div className="mb-8">
                 <h3 className="text-sm font-bold text-[#0F172A] uppercase border-l-4 border-orange-500 pl-3 mb-2">Scope of Works</h3>
                 <p className="text-xs text-slate-500 leading-relaxed">
                    Exoin Africa proposes the following autonomous hygiene solution tailored to your facility's specifications. This quote includes equipment deployment, software integration, and ongoing maintenance.
                 </p>
              </div>

              {/* FIXED TABLE LAYOUT */}
              <table className="w-full text-left text-xs mb-12 table-fixed">
                 <thead className="bg-slate-50 text-slate-500">
                    <tr>
                       <th className="py-3 pl-4 font-bold uppercase tracking-wider w-[50%]">Description</th>
                       <th className="py-3 text-right w-[20%]">Rate</th>
                       <th className="py-3 text-center w-[10%]">Qty</th>
                       <th className="py-3 pr-4 text-right w-[20%]">Total</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {quoteData.items.map((item, i) => (
                       <tr key={i}>
                          <td className="py-4 pl-4 pr-4 align-top">
                             <p className="font-bold text-slate-800">{item.title}</p>
                             <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                          </td>
                          <td className="py-4 text-right font-mono text-slate-500 align-top">{item.rate.toLocaleString()}</td>
                          <td className="py-4 text-center font-mono text-slate-500 align-top">{item.qty}</td>
                          <td className="py-4 pr-4 text-right font-mono font-bold text-slate-900 align-top">{item.total.toLocaleString()}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>

              {/* Summary */}
              <div className="flex justify-end">
                 <div className="w-1/2">
                    <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                       <span className="text-slate-500">Subtotal</span>
                       <span className="font-mono text-slate-700">{quoteData.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                       <span className="text-slate-500">VAT (16%)</span>
                       <span className="font-mono text-slate-700">{quoteData.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm py-4">
                       <span className="font-bold text-[#0F172A]">Total Estimate</span>
                       <span className="font-mono font-black text-orange-600">KES {quoteData.total.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Footer */}
           <div className="px-12 py-8 bg-slate-50 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between items-center">
              <div>
                 This quotation is valid for 14 days. Terms & Conditions apply.
              </div>
              <div className="font-bold uppercase tracking-widest text-slate-300">Page 1 of 1</div>
           </div>
      </div>

      {/* Action Bar */}
      <div className="mt-8 flex gap-4">
         <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800">
            <Printer size={14} /> Print
         </button>
         <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50">
            <Download size={14} /> PDF
         </button>
      </div>

    </div>
  );
};

export default ExoinQuotations;
