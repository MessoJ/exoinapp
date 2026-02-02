import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';

// --- UPDATED LOGO - Simple, consistent rendering for preview and PDF ---
export const InvoiceLogo = ({ scale = 1, forExport = false }) => {
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

export const InvoiceTemplate = ({
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
    total: 191400,
    notes: '',
    terms: '',
    bankName: 'Equity Bank Kenya',
    bankAccount: '0000-0000-0000',
    companyName: 'Exoin Africa Ltd.',
    companyAddress: 'Nairobi HQ • Westlands Tower',
    companyTaxId: 'VAT: P051...Z',
    ...data
  };

  const displayData = mode === 'edit' ? { ...defaultData, ...data } : defaultData;

  const handleClientChange = (field, value) => {
    onUpdate('client', { ...displayData.client, [field]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...displayData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    // Recalculate total for item
    if (field === 'qty' || field === 'rate') {
      newItems[index].total = newItems[index].qty * newItems[index].rate;
    }
    onUpdate('items', newItems);
  };

  const addItem = () => {
    onUpdate('items', [...displayData.items, { desc: "", qty: 1, rate: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = displayData.items.filter((_, i) => i !== index);
    onUpdate('items', newItems);
  };

  return (
    <div className="w-[595px] bg-white shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-500" style={{ height: '842px', minHeight: '842px', maxHeight: '842px', overflow: 'hidden' }}>
         
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.03] pointer-events-none"></div>
         <div className="h-2 w-full bg-orange-500 flex-shrink-0"></div>

         {/* Watermark - positioned within body area */}
         <div className="absolute top-[180px] bottom-[80px] left-0 right-0 flex items-center justify-center pointer-events-none opacity-[0.04] overflow-hidden print:opacity-[0.06]">
            <div className="transform -rotate-12">
               <InvoiceLogo scale={4} forExport={forExport} />
            </div>
         </div>

         {showHeader ? (
           <div className="p-12 pb-6 flex justify-between items-start relative z-10">
              <div>
                 <InvoiceLogo scale={1.2} forExport={forExport} />
                 <div className="mt-6 text-[9px] font-mono text-slate-500 uppercase tracking-wider space-y-1">
                    <p>{displayData.companyName}</p>
                    <p>{displayData.companyAddress}</p>
                    <p>{displayData.companyTaxId}</p>
                 </div>
              </div>
              
              <div className="text-right">
                 <div className="inline-block border border-slate-900 px-4 py-2 mb-4">
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">Invoice</h1>
                 </div>
                 <div className="text-xs font-mono text-slate-600 space-y-1">
                    <p><span className="text-slate-400">ID:</span> 
                      {mode === 'edit' ? (
                        <input 
                          className="bg-transparent border-b border-slate-300 w-24 text-right focus:outline-none focus:border-orange-500"
                          value={displayData.number}
                          onChange={(e) => onUpdate('number', e.target.value)}
                        />
                      ) : displayData.number}
                    </p>
                    <p><span className="text-slate-400">DT:</span> 
                      {mode === 'edit' ? (
                        <input 
                          className="bg-transparent border-b border-slate-300 w-24 text-right focus:outline-none focus:border-orange-500"
                          value={displayData.date}
                          onChange={(e) => onUpdate('date', e.target.value)}
                        />
                      ) : displayData.date}
                    </p>
                    <p><span className="text-slate-400">PG:</span> {page} / {totalPages}</p>
                 </div>
              </div>
           </div>
         ) : (
           <div className="p-12 pb-6 flex justify-end items-start relative z-10">
              <div className="text-right">
                 <div className="inline-block border border-slate-900 px-4 py-2 mb-4">
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">Invoice</h1>
                 </div>
                 <div className="text-xs font-mono text-slate-600 space-y-1">
                    <p><span className="text-slate-400">ID:</span> {displayData.number}</p>
                    <p><span className="text-slate-400">PG:</span> {page} / {totalPages}</p>
                 </div>
              </div>
           </div>
         )}

         {showHeader && (
           <div className="mx-12 p-6 bg-slate-50 border-l-4 border-[#0F172A] flex justify-between items-start relative z-10">
              <div className="w-1/2">
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billed Entity</p>
                 {mode === 'edit' ? (
                   <div className="space-y-1">
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-lg font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                       value={displayData.client.name}
                       onChange={(e) => handleClientChange('name', e.target.value)}
                       placeholder="Client Name"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-xs text-slate-600 focus:outline-none focus:border-orange-500"
                       value={displayData.client.contactPerson || ''}
                       onChange={(e) => handleClientChange('contactPerson', e.target.value)}
                       placeholder="Contact Person"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-xs text-slate-600 focus:outline-none focus:border-orange-500"
                       value={displayData.client.address}
                       onChange={(e) => handleClientChange('address', e.target.value)}
                       placeholder="Address"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-xs text-slate-600 focus:outline-none focus:border-orange-500"
                       value={displayData.client.phone || ''}
                       onChange={(e) => handleClientChange('phone', e.target.value)}
                       placeholder="Phone"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-xs text-slate-600 focus:outline-none focus:border-orange-500"
                       value={displayData.client.email || ''}
                       onChange={(e) => handleClientChange('email', e.target.value)}
                       placeholder="Email"
                     />
                   </div>
                 ) : (
                   <>
                     <h3 className="text-lg font-bold text-slate-900">{displayData.client.name}</h3>
                     {displayData.client.contactPerson && <p className="text-xs text-slate-600">Attn: {displayData.client.contactPerson}</p>}
                     {displayData.client.address && <p className="text-xs text-slate-600">{displayData.client.address}</p>}
                     {(displayData.client.phone || displayData.client.email) && (
                       <p className="text-xs text-slate-500">
                         {displayData.client.phone}{displayData.client.phone && displayData.client.email && ' • '}{displayData.client.email}
                       </p>
                     )}
                   </>
                 )}
              </div>
              <div className="text-right">
                 <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest mb-1">Payment Due</p>
                 {mode === 'edit' ? (
                   <input 
                     className="bg-transparent border-b border-slate-300 text-sm font-bold text-slate-900 text-right focus:outline-none focus:border-orange-500"
                     value={displayData.due}
                     onChange={(e) => onUpdate('due', e.target.value)}
                   />
                 ) : (
                   <p className="text-sm font-bold text-slate-900">{displayData.due}</p>
                 )}
              </div>
           </div>
         )}

         <div className="px-12 py-6 flex-grow relative z-10 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 border-b border-slate-900 pb-2 mb-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">
               <div className="col-span-6">Service Module {!showHeader && <span className="text-[8px] text-slate-400 font-normal lowercase">(continued)</span>}</div>
               <div className="col-span-2 text-right">Qty</div>
               <div className="col-span-2 text-right">Unit Rate</div>
               <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="space-y-3">
               {displayData.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 text-xs items-center border-b border-slate-100 pb-3 last:border-0 group">
                     <div className="col-span-6 font-medium text-slate-800">
                        {mode === 'edit' ? (
                          <input 
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500"
                            value={item.desc}
                            onChange={(e) => handleItemChange(i, 'desc', e.target.value)}
                            placeholder="Description"
                          />
                        ) : item.desc}
                     </div>
                     <div className="col-span-2 text-right font-mono text-slate-500">
                        {mode === 'edit' ? (
                          <input 
                            type="number"
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 text-right focus:outline-none focus:border-orange-500"
                            value={item.qty}
                            onChange={(e) => handleItemChange(i, 'qty', parseFloat(e.target.value) || 0)}
                          />
                        ) : item.qty}
                     </div>
                     <div className="col-span-2 text-right font-mono text-slate-500">
                        {mode === 'edit' ? (
                          <input 
                            type="number"
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 text-right focus:outline-none focus:border-orange-500"
                            value={item.rate}
                            onChange={(e) => handleItemChange(i, 'rate', parseFloat(e.target.value) || 0)}
                          />
                        ) : item.rate.toLocaleString()}
                     </div>
                     <div className="col-span-2 text-right font-mono font-bold text-slate-900 relative">
                        {item.total.toLocaleString()}
                        {mode === 'edit' && (
                          <button 
                            onClick={() => removeItem(i)}
                            className="absolute -right-8 top-0 text-red-500 opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
                        )}
                     </div>
                  </div>
               ))}
               {mode === 'edit' && (
                 <button 
                   onClick={addItem}
                   className="text-xs text-orange-600 font-bold hover:text-orange-700 mt-2"
                 >
                   + Add Item
                 </button>
               )}
            </div>

            {showTotals && (
              <div className="mt-4 flex flex-col">
                 {/* Notes & Terms */}
                 {(displayData.notes || displayData.terms) && (
                   <div className="mb-4 p-3 bg-slate-50 border-l-2 border-slate-300">
                     {displayData.notes && (
                       <div className="mb-2">
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                         <p className="text-[9px] text-slate-600 leading-relaxed whitespace-pre-wrap">{displayData.notes}</p>
                       </div>
                     )}
                     {displayData.terms && (
                       <div>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terms & Conditions</p>
                         <p className="text-[9px] text-slate-500 leading-relaxed whitespace-pre-wrap">{displayData.terms}</p>
                       </div>
                     )}
                   </div>
                 )}
                 
                 <div className="flex justify-end">
                   <div className="w-1/2 p-4 border-t-2 border-[#0F172A]">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                         <span>Subtotal</span>
                         <span className="font-mono">{displayData.subtotal.toLocaleString()}</span>
                      </div>
                      {displayData.taxable !== false && (
                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                           <span>Tax ({displayData.taxRate || 16}%)</span>
                           <span className="font-mono">{displayData.tax.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                         <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Total Due</span>
                         <div className="text-right">
                             <span className="text-[10px] text-slate-400 font-bold mr-1">KES</span>
                             <span className="text-xl font-black text-orange-600">{displayData.total.toLocaleString()}</span>
                         </div>
                      </div>
                      {signature && (
                        <div className="mt-4 flex flex-col items-end">
                          <img src={signature} alt="Signature" className="h-12 object-contain mb-1" />
                          <div className="w-40 border-t border-slate-300"></div>
                          <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">Authorized Signature</p>
                        </div>
                      )}
                   </div>
                 </div>
              </div>
            )}
         </div>

         {/* Footer - Fixed at bottom */}
         <div className="mt-auto px-12 py-3 border-t border-dashed border-slate-300 flex justify-between items-center relative z-10 flex-shrink-0">
            <div style={{ fontSize: 8, fontFamily: 'monospace', color: '#64748B' }}>
               <p><span style={{ fontWeight: 700 }}>BANK:</span> {(displayData.bankName || 'Equity Bank Kenya').toUpperCase()}</p>
               <p><span style={{ fontWeight: 700 }}>ACC:</span> {displayData.bankAccount || '0000-0000-0000'}</p>
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#CBD5E1' }}>
               System Generated • Page {page} of {totalPages}
            </div>
         </div>

    </div>
  );
};

const ExoinInvoices = () => {
  const [activeOption, setActiveOption] = useState('option2'); 

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Final Invoice Template</h2>
        <p className="text-slate-500 text-sm">Ready for Production • A4 Standard</p>
      </div>

      <InvoiceTemplate mode="view" />

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
