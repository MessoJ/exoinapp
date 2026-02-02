import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';

// --- UPDATED LOGO FOR QUOTE - Simple, consistent rendering for preview and PDF ---
export const QuoteLogo = ({ scale = 1, forExport = false }) => {
  const colors = {
      iconNavy: '#1E3A8A',
      iconOrange: '#F97316',
      text: '#0F172A',
      subText: '#64748B',
      dot: '#F97316',
  };

  // Dimensions
  const iconSize = 48;
  const fontSize = 30;
  const textWidth = 95;
  const textHeight = 35;

  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '12px',
      transform: `scale(${scale})`, 
      transformOrigin: 'left' 
    }}>
      {/* A. THE ICON */}
      <svg viewBox="0 0 100 100" fill="none" width={iconSize} height={iconSize} style={{ flexShrink: 0, display: 'block' }}>
        <path 
          d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" 
          fill={colors.iconNavy} 
        />
        <path 
          d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" 
          fill={colors.iconOrange} 
        />
      </svg>

      {/* B. THE TYPOGRAPHY SECTION - Using SVG for pixel-perfect PDF export */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
        
        {/* 1. EXOIN Main Text - SVG for consistent export (no cut line on white background) */}
        <svg 
          width={textWidth} 
          height={textHeight} 
          viewBox={`0 0 ${textWidth} ${textHeight}`}
          style={{ display: 'block' }}
        >
          {/* EXOIN text */}
          <text
            x="0"
            y={fontSize * 0.85}
            fill={colors.text}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 900,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            EXOIN
          </text>
        </svg>

        {/* 2. AFRICA Integration */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <div 
            style={{ 
              width: '5px', 
              height: '5px', 
              borderRadius: '50%',
              backgroundColor: colors.dot, 
            }}
          />
          <span 
            style={{ 
              fontSize: '8px', 
              fontWeight: 700, 
              letterSpacing: '0.25em', 
              textTransform: 'uppercase',
              color: colors.subText 
            }}
          >
            AFRICA
          </span>
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
    id: data.number || "QUO-XXXX",
    date: "October 27, 2025",
    expiry: "November 10, 2025", 
    client: {
      name: "Safaricom PLC",
      dept: "Facilities Management",
      address: "Waiyaki Way, HQ2",
      city: "Nairobi, Kenya"
    },
    scope: "Exoin Africa proposes the following autonomous hygiene solution tailored to your facility's specifications. This quote includes equipment deployment, software integration, and ongoing maintenance.",
    taxable: true, // Toggle for VAT/Tax
    taxRate: 16, // Tax rate percentage
    items: [
      { 
        name: "Scout S-1 Service",
        title: "Autonomous Floor Scrubbing (Lobby & Corridors)", 
        desc: "Deployment of Model S-1 'Scout' units for daily maintenance. Includes mapping and AI obstacle avoidance setup.",
        unit: "Month", qty: 12, rate: 85000, total: 1020000 
      },
      { 
        name: "Decontamination Service",
        title: "Data Center Decontamination (Tier 3)", 
        desc: "ISO 14644-1 Class 8 particulate removal. Anti-static protocols. Bi-annual service.",
        unit: "Service", qty: 2, rate: 120000, total: 240000 
      },
      { 
        name: "Supply Kit",
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
    onUpdate('items', [...displayData.items, { name: "", title: "", desc: "", unit: "Unit", qty: 1, rate: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = displayData.items.filter((_, i) => i !== index);
    onUpdate('items', newItems);
  };

  return (
    <div className="w-[595px] min-h-[842px] bg-white shadow-2xl relative flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 border-t-4 border-[#0F172A]" style={{ height: forExport ? '842px' : 'auto', overflow: forExport ? 'hidden' : 'visible' }}>
         
         {/* Watermark - positioned within body area */}
         <div className="absolute top-[150px] bottom-[80px] left-0 right-0 flex items-center justify-center pointer-events-none opacity-[0.04] overflow-hidden print:opacity-[0.06]">
            <div className="transform -rotate-12">
               <QuoteLogo scale={4} forExport={forExport} />
            </div>
         </div>

         {/* Header */}
         {showHeader ? (
           <div className="p-12 pb-6 flex justify-between items-start relative z-10">
              <div>
                 <QuoteLogo scale={1.2} forExport={forExport} />
                 <div className="mt-6 text-[9px] font-mono text-slate-500 uppercase tracking-wider space-y-1">
                    <p>{displayData.companyName || 'EXOIN AFRICA LTD'}</p>
                    <p>{displayData.companyAddress || 'Nairobi, Kenya'}</p>
                    {displayData.companyTaxId && <p>{displayData.companyTaxId}</p>}
                 </div>
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
                       value={displayData.client.contactPerson || ''}
                       onChange={(e) => handleClientChange('contactPerson', e.target.value)}
                       placeholder="Contact Person"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-slate-500 focus:outline-none focus:border-orange-500"
                       value={displayData.client.address}
                       onChange={(e) => handleClientChange('address', e.target.value)}
                       placeholder="Address"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-slate-500 focus:outline-none focus:border-orange-500"
                       value={displayData.client.phone || ''}
                       onChange={(e) => handleClientChange('phone', e.target.value)}
                       placeholder="Phone"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-slate-500 focus:outline-none focus:border-orange-500"
                       value={displayData.client.email || ''}
                       onChange={(e) => handleClientChange('email', e.target.value)}
                       placeholder="Email"
                     />
                   </>
                 ) : (
                   <>
                     <p className="font-bold text-slate-900">{displayData.client.name}</p>
                     {displayData.client.contactPerson && <p className="text-slate-600">Attn: {displayData.client.contactPerson}</p>}
                     {displayData.client.address && <p className="text-slate-500">{displayData.client.address}</p>}
                     {(displayData.client.phone || displayData.client.email) && (
                       <p className="text-slate-500">
                         {displayData.client.phone}{displayData.client.phone && displayData.client.email && ' • '}{displayData.client.email}
                       </p>
                     )}
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
            {/* Tax Toggle - Edit Mode Only */}
            {mode === 'edit' && showHeader && (
              <div className="mb-4 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={displayData.taxable !== false}
                    onChange={(e) => onUpdate('taxable', e.target.checked)}
                    className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <span className="text-xs text-slate-600 font-medium">Apply VAT/Tax</span>
                </label>
                {displayData.taxable !== false && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">Rate:</span>
                    <input 
                      type="number"
                      className="w-14 text-xs text-center bg-transparent border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:border-orange-500"
                      value={displayData.taxRate || 16}
                      onChange={(e) => onUpdate('taxRate', parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                )}
              </div>
            )}

            {/* FIXED TABLE LAYOUT */}
            <table className="w-full text-left text-xs mb-12 table-fixed">
               <thead className="bg-slate-50 text-slate-500">
                  <tr>
                     <th className="py-3 pl-4 pr-6 font-bold uppercase tracking-wider w-[20%]">Item {!showHeader && <span className="text-[10px] text-slate-400 font-normal">(cont.)</span>}</th>
                     <th className="py-3 pl-4 font-bold uppercase tracking-wider w-[30%]">Description</th>
                     <th className="py-3 text-right w-[18%]">Rate</th>
                     <th className="py-3 text-center w-[12%]">Qty</th>
                     <th className="py-3 pr-4 text-right w-[20%]">Total</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {displayData.items.map((item, i) => (
                     <tr key={i} className="group">
                        <td className="py-4 pl-4 pr-6 align-top">
                           {mode === 'edit' ? (
                             <input 
                               className="w-full font-bold text-slate-900 text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500"
                               value={item.name || ''}
                               onChange={(e) => handleItemChange(i, 'name', e.target.value)}
                               placeholder="Item Name"
                             />
                           ) : (
                             <p className="font-bold text-slate-900 text-xs leading-relaxed">{item.name}</p>
                           )}
                        </td>
                        <td className="py-4 pl-4 pr-4 align-top">
                           {mode === 'edit' ? (
                             <textarea 
                               className="w-full text-xs text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
                               value={item.desc || item.title || ''}
                               onChange={(e) => handleItemChange(i, 'desc', e.target.value)}
                               placeholder="Item description..."
                               rows={2}
                             />
                           ) : (
                             <p className="text-xs text-slate-600 leading-relaxed">{item.desc || item.title}</p>
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
                 {/* Totals Box */}
                 <div className="flex justify-end mb-6">
                   <div className="w-1/2 p-6 bg-slate-50 border-t-2 border-[#0F172A]">
                      <div className="flex justify-between text-xs text-slate-500 mb-2">
                         <span>Subtotal</span>
                         <span className="font-mono">{displayData.subtotal.toLocaleString()}</span>
                      </div>
                      {displayData.taxable !== false && (
                        <div className="flex justify-between text-xs text-slate-500 mb-4">
                           <span>Tax ({displayData.taxRate || 16}%)</span>
                           <span className="font-mono">{displayData.tax.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                         <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total</span>
                         <div className="text-right">
                             <span className="text-xs text-slate-400 font-bold mr-2">KES</span>
                             <span className="text-2xl font-black text-orange-600">{displayData.total.toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                 </div>

                 {/* Scope of Work - After Totals */}
                 {displayData.scope && (
                   <div className="mb-6">
                     <h3 className="text-sm font-bold text-[#0F172A] uppercase border-l-4 border-orange-500 pl-3 mb-2">Scope of Works</h3>
                     <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                       {displayData.scope}
                     </p>
                   </div>
                 )}

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
                 
                 {/* Signature */}
                 {signature && (
                   <div className="flex justify-end">
                     <div className="flex flex-col items-end">
                       <img src={signature} alt="Signature" className="h-16 object-contain mb-2" />
                       <div className="w-48 border-t border-slate-300"></div>
                       <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Authorized Signature</p>
                     </div>
                   </div>
                 )}
              </div>
            )}
         </div>

         {/* Footer - Fixed at bottom */}
         <div className="mt-auto px-12 py-4 bg-[#0F172A] text-white flex justify-between items-center relative z-10 flex-shrink-0" style={{ minHeight: '50px' }}>
            <div style={{ fontSize: 8, fontFamily: 'monospace', opacity: 0.7 }}>
               <p>{(displayData.companyName || 'EXOIN AFRICA LTD').toUpperCase()} • {(displayData.companyAddress || 'NAIROBI HQ').toUpperCase()}</p>
               <p>VALID FOR 14 DAYS • TERMS APPLY</p>
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F97316' }}>
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
