import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';

// --- UPDATED LOGO FOR QUOTE (Exact Match) ---
export const QuoteLogo = ({ scale = 1, forExport = false }) => {
  const colors = {
      iconNavy: '#1E3A8A',
      iconOrange: '#F97316',
      text: '#0F172A',
      subText: '#64748B',
      dot: '#F97316',
  };

  const fontSize = 30 * scale;
  const cutLineTopPreview = fontSize * 0.75;
  const cutLineTopExport = fontSize * 0.72; // Adjusted to match clip-path (72%)

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
          {!forExport ? (
            <h1 
              className="text-3xl font-black tracking-tighter leading-none m-0"
              style={{ 
                color: colors.text,
                fontFamily: 'sans-serif',
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 72%, 0% 72%, 0% 78%, 100% 78%, 100% 100%, 0% 100%)'
              }}
            >
              EXOIN
            </h1>
          ) : (
            <div className="relative" style={{ lineHeight: 0.8, marginTop: -4 * scale }}>
              <h1 
                className="text-3xl font-black tracking-tighter leading-none m-0"
                style={{ 
                  color: colors.text,
                  fontFamily: 'sans-serif',
                }}
              >
                EXOIN
              </h1>
              <div 
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: cutLineTopExport,
                  height: 2 * scale,
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          )}
        </div>

        {/* 2. AFRICA Integration */}
        <div className="relative h-3 w-full flex items-center justify-end gap-2" style={forExport ? { marginBottom: 10 * scale } : {}}>
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

export const QuotationTemplate = ({
  mode = 'view', // 'view' or 'edit'
  data = {},
  onUpdate = () => {},
  showTotals = true,
  signature = null,
  page = 1,
  totalPages = 1,
  forExport = false,
  showHeader = true
}) => {
  const defaultData = {
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
    total: 1670400,
    notes: '',
    terms: '',
    companyName: 'Exoin Africa Ltd.',
    companyAddress: 'Nairobi HQ • Westlands Tower',
    ...data
  };

  const displayData = mode === 'edit' ? { ...defaultData, ...data } : defaultData;

  const handleClientChange = (field, value) => {
    onUpdate('client', { ...displayData.client, [field]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...displayData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    // Recalculate total
    if (field === 'qty' || field === 'rate') {
      newItems[index].total = newItems[index].qty * newItems[index].rate;
    }
    onUpdate('items', newItems);
  };

  const addItem = () => {
    onUpdate('items', [...displayData.items, { title: "", desc: "", unit: "Unit", qty: 1, rate: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = displayData.items.filter((_, i) => i !== index);
    onUpdate('items', newItems);
  };

  return (
    <div className="w-[595px] h-[842px] bg-white shadow-2xl relative flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 border-t-4 border-[#0F172A] overflow-hidden">
         
         {/* Watermark - positioned within body area */}
         <div className="absolute top-[150px] bottom-[80px] left-0 right-0 flex items-center justify-center pointer-events-none opacity-[0.04] overflow-hidden print:opacity-[0.06]">
            <div className="transform -rotate-12">
               <QuoteLogo scale={4} forExport={forExport} />
            </div>
         </div>

         {/* Header */}
         {showHeader ? (
           <div className="p-12 pb-6 flex justify-between items-end relative z-10">
              <div>
                 <QuoteLogo scale={1.2} forExport={forExport} />
              </div>
              <div className="text-right">
                 <h1 className="text-4xl font-light text-slate-300 uppercase tracking-widest leading-none">Quote</h1>
                 <p className="text-xs font-bold text-[#0F172A] mt-1">
                   REF: {mode === 'edit' ? (
                     <input 
                       className="bg-transparent border-b border-slate-300 w-24 text-right focus:outline-none focus:border-orange-500"
                       value={displayData.id}
                       onChange={(e) => onUpdate('id', e.target.value)}
                     />
                   ) : displayData.id}
                 </p>
                 <p className="text-[10px] text-slate-400 mt-1">Page {page} of {totalPages}</p>
              </div>
           </div>
         ) : (
           <div className="p-12 pb-6 flex justify-end items-end relative z-10">
              <div className="text-right">
                 <h1 className="text-4xl font-light text-slate-300 uppercase tracking-widest leading-none">Quote</h1>
                 <p className="text-xs font-bold text-[#0F172A] mt-1">REF: {displayData.id}</p>
                 <p className="text-[10px] text-slate-400 mt-1">Page {page} of {totalPages}</p>
              </div>
           </div>
         )}

         {/* Grid Data */}
         {showHeader && (
           <div className="mx-12 py-6 border-t border-b border-slate-100 flex justify-between relative z-10">
              <div className="text-xs space-y-1 w-1/2">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prepared For</p>
                 {mode === 'edit' ? (
                   <>
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                       value={displayData.client.name}
                       onChange={(e) => handleClientChange('name', e.target.value)}
                       placeholder="Client Name"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-slate-500 focus:outline-none focus:border-orange-500"
                       value={displayData.client.dept}
                       onChange={(e) => handleClientChange('dept', e.target.value)}
                       placeholder="Department"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-slate-500 focus:outline-none focus:border-orange-500"
                       value={displayData.client.address}
                       onChange={(e) => handleClientChange('address', e.target.value)}
                       placeholder="Address"
                     />
                   </>
                 ) : (
                   <>
                     <p className="font-bold text-slate-900">{displayData.client.name}</p>
                     <p className="text-slate-500">{displayData.client.dept}</p>
                     <p className="text-slate-500">{displayData.client.address}</p>
                   </>
                 )}
              </div>
              <div className="text-xs space-y-1 text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Validity</p>
                 <div className="flex items-center justify-end gap-2">
                    <span className="text-slate-500">Issued:</span>
                    {mode === 'edit' ? (
                      <input 
                        className="bg-transparent border-b border-slate-300 w-24 text-right focus:outline-none focus:border-orange-500 font-mono"
                        value={displayData.date}
                        onChange={(e) => onUpdate('date', e.target.value)}
                      />
                    ) : (
                      <span className="font-mono">{displayData.date}</span>
                    )}
                 </div>
                 <div className="flex items-center justify-end gap-2">
                    <span className="text-slate-500">Expires:</span>
                    {mode === 'edit' ? (
                      <input 
                        className="bg-transparent border-b border-slate-300 w-24 text-right focus:outline-none focus:border-orange-500 font-mono text-orange-600 font-bold"
                        value={displayData.expiry}
                        onChange={(e) => onUpdate('expiry', e.target.value)}
                      />
                    ) : (
                      <span className="font-mono text-orange-600 font-bold">{displayData.expiry}</span>
                    )}
                 </div>
              </div>
           </div>
         )}

         {/* Body */}
         <div className="p-12 flex-grow relative z-10">
            {showHeader && (
              <div className="mb-8">
                 <h3 className="text-sm font-bold text-[#0F172A] uppercase border-l-4 border-orange-500 pl-3 mb-2">Scope of Works</h3>
                 <p className="text-xs text-slate-500 leading-relaxed">
                    Exoin Africa proposes the following autonomous hygiene solution tailored to your facility's specifications. This quote includes equipment deployment, software integration, and ongoing maintenance.
                 </p>
              </div>
            )}

            {/* FIXED TABLE LAYOUT */}
            <table className="w-full text-left text-xs mb-12 table-fixed">
               <thead className="bg-slate-50 text-slate-500">
                  <tr>
                     <th className="py-3 pl-4 font-bold uppercase tracking-wider w-[50%]">Description {!showHeader && <span className="text-[10px] text-slate-400 font-normal">(continued)</span>}</th>
                     <th className="py-3 text-right w-[20%]">Rate</th>
                     <th className="py-3 text-center w-[10%]">Qty</th>
                     <th className="py-3 pr-4 text-right w-[20%]">Total</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {displayData.items.map((item, i) => (
                     <tr key={i} className="group">
                        <td className="py-4 pl-4 pr-4 align-top">
                           {mode === 'edit' ? (
                             <>
                               <input 
                                 className="w-full font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500"
                                 value={item.title}
                                 onChange={(e) => handleItemChange(i, 'title', e.target.value)}
                                 placeholder="Item Title"
                               />
                               <textarea 
                                 className="w-full text-[10px] text-slate-500 mt-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500 resize-none"
                                 value={item.desc}
                                 onChange={(e) => handleItemChange(i, 'desc', e.target.value)}
                                 placeholder="Description"
                                 rows={2}
                               />
                             </>
                           ) : (
                             <>
                               <p className="font-bold text-slate-800">{item.title}</p>
                               <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                             </>
                           )}
                        </td>
                        <td className="py-4 text-right font-mono text-slate-500 align-top">
                          {mode === 'edit' ? (
                            <input 
                              type="number"
                              className="w-full text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500"
                              value={item.rate}
                              onChange={(e) => handleItemChange(i, 'rate', parseFloat(e.target.value) || 0)}
                            />
                          ) : item.rate.toLocaleString()}
                        </td>
                        <td className="py-4 text-center font-mono text-slate-500 align-top">
                          {mode === 'edit' ? (
                            <input 
                              type="number"
                              className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500"
                              value={item.qty}
                              onChange={(e) => handleItemChange(i, 'qty', parseFloat(e.target.value) || 0)}
                            />
                          ) : item.qty}
                        </td>
                        <td className="py-4 pr-4 text-right font-mono font-bold text-slate-900 align-top relative">
                          {item.total.toLocaleString()}
                          {mode === 'edit' && (
                            <button 
                              onClick={() => removeItem(i)}
                              className="absolute -right-2 top-4 text-red-500 opacity-0 group-hover:opacity-100"
                            >
                              ×
                            </button>
                          )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {mode === 'edit' && (
              <button 
                onClick={addItem}
                className="text-xs text-orange-600 font-bold hover:text-orange-700 mb-8"
              >
                + Add Item
              </button>
            )}

            {/* Summary */}
            {showTotals && (
              <div className="flex flex-col">
                 {/* Notes & Terms */}
                 {(displayData.notes || displayData.terms) && (
                   <div className="mb-6 p-4 bg-slate-50 border-l-2 border-orange-500">
                     {displayData.notes && (
                       <div className="mb-3">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                         <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">{displayData.notes}</p>
                       </div>
                     )}
                     {displayData.terms && (
                       <div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terms & Conditions</p>
                         <p className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-wrap">{displayData.terms}</p>
                       </div>
                     )}
                   </div>
                 )}
                 
                 <div className="flex justify-end">
                   <div className="w-1/2 p-6 bg-slate-50 border-t-2 border-[#0F172A]">
                      <div className="flex justify-between text-xs text-slate-500 mb-2">
                         <span>Subtotal</span>
                         <span className="font-mono">{displayData.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mb-4">
                         <span>Tax (16%)</span>
                         <span className="font-mono">{displayData.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                         <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total</span>
                         <div className="text-right">
                             <span className="text-xs text-slate-400 font-bold mr-2">KES</span>
                             <span className="text-2xl font-black text-orange-600">{displayData.total.toLocaleString()}</span>
                         </div>
                      </div>
                      {signature && (
                        <div className="mt-8 flex flex-col items-end">
                          <img src={signature} alt="Signature" className="h-16 object-contain mb-2" />
                          <div className="w-48 border-t border-slate-300"></div>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Authorized Signature</p>
                        </div>
                      )}
                   </div>
                 </div>
              </div>
            )}
         </div>

         {/* Footer */}
         <div className="mt-auto px-12 py-6 bg-[#0F172A] text-white flex justify-between items-center relative z-10">
            <div className="text-[8px] font-mono opacity-70">
               <p>{(displayData.companyName || 'EXOIN AFRICA LTD').toUpperCase()} • {(displayData.companyAddress || 'NAIROBI HQ').toUpperCase()}</p>
               <p>VALID FOR 14 DAYS • TERMS APPLY</p>
            </div>
            <div className="text-[8px] font-bold tracking-widest uppercase text-orange-500">
               System Generated Quote
            </div>
         </div>

    </div>
  );
};

const ExoinQuotations = () => {
  const [activeOption, setActiveOption] = useState('option1'); // Option A selected

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sales Proposals</h2>
        <p className="text-slate-500 text-sm">Ready for Production • A4 Standard</p>
      </div>

      {/* --- OPTION A: THE TECHNICAL BLUEPRINT --- */}
      <QuotationTemplate mode="view" />

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
