import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';

const ExoinInvoices = () => {
  const [activeOption, setActiveOption] = useState('option2'); 

  const invoiceData = {
    number: "INV-2025-0042",
    date: "October 26, 2025",
    due: "November 10, 2025",
    client: {
      name: "K-Logistics Ltd.",
      address: "Mombasa Road, Unit 4B",
      city: "Nairobi, Kenya",
      contact: "Accounts Payable"
    },
    items: [
      { desc: "Autonomous Floor Scrubbing (Zone A)", qty: 1, rate: 50000, total: 50000 },
      { desc: "High-Bay Drone Inspection", qty: 4, rate: 15000, total: 60000 },
      { desc: "Power Scrub™ Chemical Supply (20L)", qty: 10, rate: 4500, total: 45000 },
      { desc: "Technician Deployment (Supervisor)", qty: 2, rate: 5000, total: 10000 },
    ],
    subtotal: 165000,
    tax: 26400,
    total: 191400
  };

  // --- UPDATED LOGO (Exact Match to Provided Code) ---
  const InvoiceLogo = ({ scale = 1 }) => {
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
              d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" 
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Final Invoice Template</h2>
        <p className="text-slate-500 text-sm">Ready for Production • A4 Standard</p>
      </div>

      <div className="w-[595px] min-h-[842px] bg-white shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-500 overflow-hidden">
           
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.03] pointer-events-none"></div>
           <div className="h-2 w-full bg-orange-500"></div>

           <div className="p-12 pb-6 flex justify-between items-start">
              <div>
                 <InvoiceLogo scale={1.2} />
                 <div className="mt-6 text-[9px] font-mono text-slate-500 uppercase tracking-wider space-y-1">
                    <p>Exoin Africa Ltd.</p>
                    <p>Nairobi HQ • Westlands Tower</p>
                    <p>VAT: P051...Z</p>
                 </div>
              </div>
              
              <div className="text-right">
                 <div className="inline-block border border-slate-900 px-4 py-2 mb-4">
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">Invoice</h1>
                 </div>
                 <div className="text-xs font-mono text-slate-600 space-y-1">
                    <p><span className="text-slate-400">ID:</span> {invoiceData.number}</p>
                    <p><span className="text-slate-400">DT:</span> {invoiceData.date}</p>
                 </div>
              </div>
           </div>

           <div className="mx-12 p-6 bg-slate-50 border-l-4 border-[#0F172A] flex justify-between items-center">
              <div>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billed Entity</p>
                 <h3 className="text-lg font-bold text-slate-900">{invoiceData.client.name}</h3>
                 <p className="text-xs text-slate-600">{invoiceData.client.address}</p>
              </div>
              <div className="text-right">
                 <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest mb-1">Payment Due</p>
                 <p className="text-sm font-bold text-slate-900">{invoiceData.due}</p>
              </div>
           </div>

           <div className="p-12 flex-grow">
              <div className="grid grid-cols-12 gap-4 border-b border-slate-900 pb-2 mb-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                 <div className="col-span-6">Service Module</div>
                 <div className="col-span-2 text-right">Qty</div>
                 <div className="col-span-2 text-right">Unit Rate</div>
                 <div className="col-span-2 text-right">Total</div>
              </div>

              <div className="space-y-4">
                 {invoiceData.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 text-xs items-center border-b border-slate-100 pb-4 last:border-0">
                       <div className="col-span-6 font-medium text-slate-800">
                          {item.desc}
                       </div>
                       <div className="col-span-2 text-right font-mono text-slate-500">{item.qty}</div>
                       <div className="col-span-2 text-right font-mono text-slate-500">{item.rate.toLocaleString()}</div>
                       <div className="col-span-2 text-right font-mono font-bold text-slate-900">{item.total.toLocaleString()}</div>
                    </div>
                 ))}
              </div>

              <div className="mt-12 flex justify-end">
                 <div className="w-1/2 p-6 border-t-2 border-[#0F172A]">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                       <span>Subtotal</span>
                       <span className="font-mono">{invoiceData.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mb-4">
                       <span>Tax (16%)</span>
                       <span className="font-mono">{invoiceData.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                       <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total Due</span>
                       <div className="text-right">
                           <span className="text-xs text-slate-400 font-bold mr-2">KES</span>
                           <span className="text-2xl font-black text-orange-600">{invoiceData.total.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-auto px-12 py-6 border-t border-dashed border-slate-300 flex justify-between items-center">
              <div className="text-[8px] font-mono text-slate-500">
                 <p><span className="font-bold">BANK:</span> EQUITY BANK KENYA</p>
                 <p><span className="font-bold">ACC:</span> 0000-0000-0000</p>
              </div>
              <div className="text-[8px] font-bold tracking-widest uppercase text-slate-300">
                 System Generated
              </div>
           </div>

      </div>

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

export default ExoinInvoices;
