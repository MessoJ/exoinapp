import React from 'react';
import { Truck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

// Reusable DeliveryNoteLogo that uses the official brand Logo
export const DeliveryNoteLogo = ({ scale = 1, forExport = false }) => {
  return <Logo scale={scale} forExport={forExport} variant="default" />;
};

export const DeliveryNoteTemplate = ({
  mode = 'view',
  data = {},
  onUpdate = () => {},
  signature = null,
  page = 1,
  totalPages = 1,
  forExport = false,
  showHeader = true
}) => {
  const defaultData = {
    number: data.documentNumber || data.number || "DN-2026-0001",
    date: data.issueDate || data.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    deliveryDate: data.deliveryDate || data.dueDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    orderRef: data.scope || data.orderRef || "LPO-99120",
    carrier: data.carrier || data.vehicleReg || "Direct Dispatch",
    dispatchedBy: data.technicianName || data.dispatchedBy || "Peter Ochieng (Operations)",
    client: {
      name: data.clientName || data.client?.name || "Client Name",
      contactPerson: data.clientContactPerson || data.client?.contactPerson || "",
      address: data.clientAddress || data.client?.address || "Site Delivery Address",
      phone: data.clientPhone || data.client?.phone || "",
      email: data.clientEmail || data.client?.email || ""
    },
    items: data.items && data.items.length > 0 ? data.items : [
      { name: "Scout S-1 Autonomous Scrubber", desc: "Autonomous scrubbing unit with smart LiDAR mapping", qty: 2, deliveredQty: 2, unit: "Units", remarks: "Tested & Operational" },
      { name: "Power Scrub™ Chemical (20L)", desc: "Floor cleaning solution concentrated formula", qty: 10, deliveredQty: 10, unit: "Drums", remarks: "Factory Sealed" },
      { name: "Docking & Rapid Charging Base", desc: "48V industrial fast charge docking station", qty: 2, deliveredQty: 2, unit: "Units", remarks: "All Cables Included" },
      { name: "Operator Tool Kit & Spares", desc: "Brush set, squeegee replacements, manual", qty: 2, deliveredQty: 2, unit: "Kits", remarks: "Brand New" }
    ],
    notes: data.notes || "Please inspect packages upon handover. Report any transit damage or discrepancies within 24 hours.",
    terms: data.terms || "Received the above listed equipment and goods in good order, correct quantity, and acceptable condition.",
    companyName: "EXOIN AFRICA",
    companyAddress: "48706, 00100, Nairobi, Kenya",
    companyTaxId: "PIN: A015776087P",
    companyPhone: "0739443244",
    companyEmail: "info@exoin.africa",
    includeSeal: data.includeSeal !== false,
    ...data
  };

  const displayData = mode === 'edit' ? { ...defaultData, ...data } : defaultData;

  const handleClientChange = (field, value) => {
    onUpdate('client', { ...displayData.client, [field]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...displayData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate('items', newItems);
  };

  return (
    <div 
      className="w-[595px] bg-white shadow-2xl relative flex flex-col font-sans select-none" 
      style={{ 
        height: '842px', 
        minHeight: '842px', 
        maxHeight: '842px', 
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Top dual-color brand border */}
      <div className="flex h-2 w-full flex-shrink-0">
        <div className="w-2/3 bg-[#1E3A8A]"></div>
        <div className="w-1/3 bg-[#F97316]"></div>
      </div>

      {/* Watermark in background: subtle security seal / logo */}
      {displayData.includeSeal && (
        <div className="absolute top-[180px] bottom-[80px] left-0 right-0 flex items-center justify-center pointer-events-none opacity-[0.035] overflow-hidden">
          <div className="transform -rotate-12 flex flex-col items-center">
            <Logo scale={3.5} forExport={forExport} variant="default" />
            <div className="mt-4 border-2 border-[#1E3A8A] rounded-full px-6 py-1 text-center">
              <span className="text-[14px] font-black tracking-[0.3em] uppercase text-[#1E3A8A]">
                OFFICIAL DELIVERY SEAL
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {showHeader && (
        <div className="p-8 pb-3 flex justify-between items-start relative z-10">
          <div>
            {/* Exact Official Top Bar Logo */}
            <Logo scale={1.15} forExport={forExport} variant="default" />
            
            <div className="mt-3 text-[9px] font-mono text-slate-500 uppercase tracking-wider space-y-0.5">
              <p className="font-bold text-slate-800">{displayData.companyName || 'EXOIN AFRICA'}</p>
              <p>{displayData.companyAddress || '48706, 00100, Nairobi, Kenya'}</p>
              <p className="text-slate-700 font-semibold">{displayData.companyTaxId || 'PIN: A015776087P'}</p>
              <p className="text-slate-600">Tel: {displayData.companyPhone || '0739443244'} • {displayData.companyEmail || 'info@exoin.africa'}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="inline-block bg-[#1E3A8A] text-white px-3.5 py-1.5 mb-2 rounded-lg shadow-sm">
              <h1 className="text-base font-black tracking-widest uppercase">Delivery Note</h1>
            </div>
            <div className="text-xs font-mono text-slate-700 space-y-0.5">
              <p><span className="text-slate-400">DN NO:</span> <strong className="text-slate-900">{displayData.number}</strong></p>
              <p><span className="text-slate-400">DISPATCH DATE:</span> {displayData.date}</p>
              <p><span className="text-slate-400">DELIVERY DATE:</span> {displayData.deliveryDate || displayData.date}</p>
              {displayData.orderRef && (
                <p><span className="text-slate-400">REF/LPO:</span> {displayData.orderRef}</p>
              )}
              <p><span className="text-slate-400">PAGE:</span> {page} of {totalPages}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recipient & Dispatch Details Block */}
      {showHeader && (
        <div className="mx-8 p-3.5 bg-slate-50/90 border-l-4 border-[#1E3A8A] rounded-r-xl flex justify-between items-start relative z-10 text-xs">
          <div className="w-3/5 space-y-1">
            <p className="text-[8px] font-bold text-[#F97316] uppercase tracking-widest">Delivered To (Customer)</p>
            <p className="text-sm font-black text-slate-900 leading-tight">
              {displayData.client?.name || displayData.clientName || 'Customer / Client'}
            </p>
            {(displayData.client?.contactPerson || displayData.clientContactPerson) && (
              <p className="text-slate-700 font-medium text-[11px]">
                Attn: {displayData.client?.contactPerson || displayData.clientContactPerson}
              </p>
            )}
            <p className="text-slate-600 text-[11px] leading-snug">
              {displayData.client?.address || displayData.clientAddress || 'Delivery Address'}
            </p>
            {(displayData.client?.phone || displayData.client?.email || displayData.clientPhone) && (
              <p className="text-slate-500 font-mono text-[10px] pt-0.5">
                {[displayData.client?.phone || displayData.clientPhone, displayData.client?.email || displayData.clientEmail].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>

          <div className="w-2/5 text-right space-y-1 pl-4 border-l border-slate-200">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Dispatch & Carrier</p>
            <p className="text-slate-700 text-[11px]">
              <strong>Status:</strong> <span className="text-emerald-700 font-bold">Dispatched</span>
            </p>
            <p className="text-slate-600 text-[11px]">
              <strong>Carrier / Reg:</strong> {displayData.carrier || 'Direct Fleet'}
            </p>
            {displayData.dispatchedBy && (
              <p className="text-slate-600 text-[11px]">
                <strong>Officer:</strong> {displayData.dispatchedBy}
              </p>
            )}
            <p className="text-slate-500 text-[10px] font-mono">
              Transit Handover
            </p>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="mx-8 mt-3 flex-1 flex flex-col relative z-10">
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-[9px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-3">Item Description & Specifications</th>
                <th className="py-2.5 px-3 text-center w-16">Unit</th>
                <th className="py-2.5 px-3 text-center w-20">Qty Dispatched</th>
                <th className="py-2.5 px-3 text-center w-20">Qty Received</th>
                <th className="py-2.5 px-3 w-28 text-right">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {(displayData.items || []).map((item, index) => {
                const qty = item.qty || item.quantity || 1;
                const deliveredQty = item.deliveredQty || qty;
                const unit = item.unit || "Units";
                const itemName = item.name || item.desc || item.description || `Item #${index + 1}`;
                const itemDesc = item.desc || item.description;

                return (
                  <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[10px]">{index + 1}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900 leading-tight">{itemName}</p>
                      {itemDesc && itemDesc !== itemName && (
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{itemDesc}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-600">{unit}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">{qty}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/40">{deliveredQty}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[10px] text-slate-600">
                      {item.remarks || item.notes || 'Good Condition'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Special Instructions / Notes */}
        {displayData.notes && (
          <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950">
            <span className="font-bold text-[8px] uppercase tracking-wider block text-amber-800">Special Handling Instructions:</span>
            <p className="text-[10.5px] mt-0.5 leading-relaxed">{displayData.notes}</p>
          </div>
        )}

        {/* Goods Received Acknowledgment Declaration */}
        <div className="mt-2 p-2 bg-blue-50/70 border border-blue-200/70 rounded-xl text-center text-[10.5px] text-blue-950 italic">
          "{displayData.terms || 'Received the above listed goods and equipment in good order, correct quantity, and acceptable condition.'}"
        </div>

        {/* Dual Signatures Section */}
        <div className="mt-auto pt-2 pb-6 grid grid-cols-2 gap-3.5">
          {/* Dispatched By */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Dispatched By (Exoin Africa)</p>
              <p className="text-[11px] font-bold text-slate-900">{displayData.dispatchedBy || 'Authorized Logistics Officer'}</p>
            </div>
            
            <div className="my-1.5 h-12 flex items-center justify-center border-b border-dashed border-slate-300">
              {signature?.signatureUrl ? (
                <img src={signature.signatureUrl} alt="Signature" className="max-h-10 max-w-full object-contain" />
              ) : signature?.signatureHtml ? (
                <div dangerouslySetInnerHTML={{ __html: signature.signatureHtml }} />
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span className="text-[9px] font-mono">Digitally Authorized Dispatch</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-mono">
              <span>Date: {displayData.date}</span>
              <span className="text-emerald-600 font-bold">● Cargo Released</span>
            </div>
          </div>

          {/* Received By */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Received In Good Order (Client / Consignee)</p>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Receiver: __________________________</span>
              </div>
            </div>

            <div className="my-1.5 h-12 flex items-center justify-center border-b border-dashed border-slate-300">
              <span className="text-[9px] font-mono text-slate-400">Consignee Signature & Stamp</span>
            </div>

            <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-mono">
              <span>ID / Tel: ___________________</span>
              <span>Time: _________________</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="px-8 py-2 bg-slate-950 text-slate-400 text-[8.5px] flex justify-between items-center z-10 flex-shrink-0">
        <span className="tracking-wider uppercase font-semibold text-slate-300">
          EXOIN AFRICA • LOGISTICS & CLIENT HANDOVER
        </span>
        <span className="font-mono">
          0739443244 • info@exoin.africa • 48706, 00100, Nairobi, Kenya
        </span>
      </div>
    </div>
  );
};

export default DeliveryNoteTemplate;
