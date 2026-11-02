import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';

// --- LOGO FOR QUOTE ---
import { Logo } from "./Logo";

export const QuoteLogo = ({ scale = 1, forExport = false }) => {
  return <Logo scale={scale} forExport={forExport} variant="default" />;
};

export const QuotationTemplate = ({
  mode = 'view',
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
    id: data.number || "INVYKBUXVU",
    date: "2026-10-22 11:22:23",
    expiry: "2026-11-22", 
    client: {
      name: "KRA WESTERN REGION OFFICE",
      dept: "Regional Administration",
      address: "Lake Hub Mall Kisumu",
      city: "Kisumu, Kenya",
      phone: "+254722856810",
      email: "callcenter@kra.go.ke",
      pin: ""
    },
    scope: "Exoin Africa proposes the following specialized hygiene and pest control solution tailored to your facility specifications.",
    taxable: true,
    taxRate: 16,
    items: [
      { 
        name: "Fumigation and Pest Control Service AT KRA WEBUYE RRU",
        title: "Fumigation and Pest Control Service AT KRA WEBUYE RRU", 
        desc: "Autonomous and targeted chemical barrier pest control service.",
        unit: "Service", qty: 1, rate: 9850, total: 9850 
      }
    ],
    subtotal: 8491.38,
    tax: 1358.62,
    total: 9850.00,
    paymentMethod: 'mpesa',
    notes: '',
    terms: '',
    companyName: 'EXOIN AFRICA',
    companyPin: 'A015776087P',
    companyEmail: 'mesofrancis@outlook.com',
    companyPhone: '0739443244',
    companyAddress: '48706, 00100, Nairobi, Kenya',
    ...data
  };

  const displayData = mode === 'edit' ? { ...defaultData, ...data } : defaultData;

  const handleClientChange = (field, value) => {
    onUpdate('client', { ...displayData.client, [field]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...displayData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'qty' || field === 'rate') {
      newItems[index].total = Number(newItems[index].qty || 0) * Number(newItems[index].rate || 0);
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
    <div className="w-[595px] min-h-[842px] bg-white shadow-2xl relative flex flex-col animate-in fade-in duration-500 border-t-4 border-[#1E3A8A]" style={{ height: forExport ? '842px' : 'auto', overflow: forExport ? 'hidden' : 'visible' }}>
         
         {/* Watermark */}
         <div className="absolute top-[150px] bottom-[80px] left-0 right-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden print:opacity-[0.05]">
            <div className="transform -rotate-12">
               <QuoteLogo scale={4} forExport={forExport} />
            </div>
         </div>

         {/* Header */}
         {showHeader ? (
           <div className="p-10 pb-5 flex justify-between items-start relative z-10 border-b border-slate-100">
              <div>
                 <QuoteLogo scale={1.15} forExport={forExport} />
                 <div className="mt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider space-y-0.5">
                    <p className="font-bold text-slate-800 text-[10px]">{displayData.companyName || 'EXOIN AFRICA'}</p>
                    <p>PIN: <span className="text-slate-900 font-bold">{displayData.companyPin || 'A015776087P'}</span></p>
                    <p>{displayData.companyEmail || 'mesofrancis@outlook.com'}</p>
                    <p>{displayData.companyPhone || '0739443244'}</p>
                    <p>{displayData.companyAddress || '48706, 00100, Nairobi, Kenya'}</p>
                 </div>
              </div>

              <div className="text-right">
                 <h1 className="text-3xl font-light text-slate-400 uppercase tracking-widest leading-none">Quotation</h1>
                 <p className="text-xs font-bold text-[#0F172A] mt-1.5 font-mono">
                   NO: {mode === 'edit' ? (
                     <input 
                       className="bg-transparent border-b border-slate-300 w-28 text-right focus:outline-none focus:border-orange-500"
                       value={displayData.id}
                       onChange={(e) => onUpdate('id', e.target.value)}
                     />
                   ) : displayData.id}
                 </p>
                 <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Date: {displayData.date}</p>
                 <p className="text-[9px] text-slate-400 mt-0.5">Page {page} of {totalPages}</p>
              </div>
           </div>
         ) : (
           <div className="p-10 pb-4 flex justify-end items-end relative z-10">
              <div className="text-right">
                 <h1 className="text-3xl font-light text-slate-400 uppercase tracking-widest leading-none">Quotation</h1>
                 <p className="text-xs font-bold text-[#0F172A] mt-1 font-mono">NO: {displayData.id}</p>
                 <p className="text-[9px] text-slate-400 mt-0.5">Page {page} of {totalPages}</p>
              </div>
           </div>
         )}

         {/* Client Coordinates */}
         {showHeader && (
           <div className="mx-10 py-4 border-b border-slate-100 flex justify-between relative z-10">
              <div className="text-xs space-y-1 w-1/2">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quotation To:</p>
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
                       value={displayData.client.address || ''}
                       onChange={(e) => handleClientChange('address', e.target.value)}
                       placeholder="Address"
                     />
                     <input 
                       className="w-full bg-transparent border-b border-slate-300 text-slate-500 focus:outline-none focus:border-orange-500"
                       value={displayData.client.phone || ''}
                       onChange={(e) => handleClientChange('phone', e.target.value)}
                       placeholder="Phone"
                     />
                   </>
                 ) : (
                   <>
                     <p className="font-bold text-slate-900">{displayData.client.name}</p>
                     {displayData.client.address && <p className="text-slate-600">{displayData.client.address}</p>}
                     {displayData.client.email && <p className="text-slate-500">{displayData.client.email}</p>}
                     {displayData.client.phone && <p className="text-slate-500">{displayData.client.phone}</p>}
                   </>
                 )}
              </div>

              <div className="text-xs space-y-1 text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terms & Validity</p>
                 <div className="flex items-center justify-end gap-2 text-slate-600 text-[11px]">
                    <span className="text-slate-400">Payment:</span>
                    <span className="font-semibold uppercase">{displayData.paymentMethod || 'mpesa / wire'}</span>
                 </div>
                 <div className="flex items-center justify-end gap-2 text-slate-600 text-[11px]">
                    <span className="text-slate-400">Validity:</span>
                    <span className="font-semibold text-orange-600">30 Calendar Days</span>
                 </div>
              </div>
           </div>
         )}

         {/* Items Table */}
         <div className="p-10 flex-grow relative z-10">
            <table className="w-full text-left text-xs mb-8 table-fixed">
               <thead className="bg-slate-50 text-slate-500 border-y border-slate-200/60">
                  <tr>
                     <th className="py-2.5 pl-3 pr-2 font-bold uppercase tracking-wider w-[45%]">Item & Scope</th>
                     <th className="py-2.5 text-center w-[12%]">Qty</th>
                     <th className="py-2.5 text-right w-[18%]">Price (KES)</th>
                     <th className="py-2.5 text-center w-[12%]">Tax</th>
                     <th className="py-2.5 pr-3 text-right w-[18%]">Total</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {displayData.items.map((item, i) => (
                     <tr key={i} className="group">
                        <td className="py-3 pl-3 pr-2 align-top">
                           {mode === 'edit' ? (
                             <input 
                               className="w-full font-bold text-slate-900 text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500"
                               value={item.name || item.title || ''}
                               onChange={(e) => handleItemChange(i, 'name', e.target.value)}
                               placeholder="Item Description"
                             />
                           ) : (
                             <div>
                               <p className="font-semibold text-slate-900 leading-snug">{item.name || item.title}</p>
                               {item.desc && item.desc !== item.name && (
                                 <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                               )}
                             </div>
                           )}
                        </td>

                        <td className="py-3 text-center font-mono text-slate-600 align-top">
                          {mode === 'edit' ? (
                            <input 
                              type="number"
                              className="w-12 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500"
                              value={item.qty}
                              onChange={(e) => handleItemChange(i, 'qty', parseFloat(e.target.value) || 0)}
                            />
                          ) : (
                            Number(item.qty || 1).toFixed(2)
                          )}
                        </td>

                        <td className="py-3 text-right font-mono text-slate-700 align-top">
                          {mode === 'edit' ? (
                            <input 
                              type="number"
                              className="w-full text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-orange-500"
                              value={item.rate}
                              onChange={(e) => handleItemChange(i, 'rate', parseFloat(e.target.value) || 0)}
                            />
                          ) : (
                            Number(item.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
                          )}
                        </td>

                        <td className="py-3 text-center text-slate-500 align-top text-[10px] font-mono">
                          B 16%
                        </td>

                        <td className="py-3 pr-3 text-right font-mono font-bold text-slate-900 align-top">
                          {Number(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>

            {mode === 'edit' && (
              <button 
                onClick={addItem}
                className="text-xs text-orange-600 font-bold hover:text-orange-700 mb-6 flex items-center gap-1"
              >
                + Add Item
              </button>
            )}

            {/* Calculations Breakdown */}
            {showTotals && (
              <div className="flex justify-end mb-6">
                <div className="w-64 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                   <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-mono">{Number(displayData.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                   <div className="flex justify-between text-slate-500">
                      <span>Total VAT (16%)</span>
                      <span className="font-mono">{Number(displayData.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                   <div className="flex justify-between text-slate-500">
                      <span>Total Discount</span>
                      <span className="font-mono">0.00</span>
                   </div>
                   <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-900 uppercase">Total Amount</span>
                      <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold mr-1">KES</span>
                          <span className="text-lg font-black text-orange-600">
                            {Number(displayData.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Optional Signature */}
            {signature && (
              <div className="flex justify-end mt-4">
                <div className="flex flex-col items-end">
                  <img src={signature} alt="Authorized Signature" className="h-12 object-contain mb-1" />
                  <div className="w-40 border-t border-slate-300"></div>
                  <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">Authorized Signature</p>
                </div>
              </div>
            )}
         </div>

         {/* Kenya Tax / eTIMS Verification Banner */}
         <div className="px-10 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase tracking-widest relative z-10">
            <span>ISSUED UNDER ECITIZEN & KENYA REVENUE AUTHORITY</span>
            <span className="text-orange-600 font-bold">ETIMS COMPLIANT</span>
         </div>

         {/* Official Navy Footer */}
         <div className="mt-auto px-10 py-3.5 bg-[#0F172A] text-white flex justify-between items-center relative z-10 flex-shrink-0">
            <div className="text-[8px] font-mono text-slate-400 uppercase">
               <span>EXOIN AFRICA • TEL: 0739443244 • WWW.EXOIN.AFRICA</span>
            </div>
            <div className="text-[8px] font-bold tracking-widest uppercase text-orange-500">
               Official Quotation
            </div>
         </div>
    </div>
  );
};

const ExoinQuotations = () => {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-10 px-4">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Commercial Quotation</h2>
        <p className="text-slate-500 text-xs">Standard A4 Format • eTIMS Compliant</p>
      </div>

      <QuotationTemplate mode="view" />
    </div>
  );
};

export default ExoinQuotations;
