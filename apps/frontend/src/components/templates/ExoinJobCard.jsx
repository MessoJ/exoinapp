import React from 'react';

// --- OFFICIAL UNIVERSAL LOGO ---
import { Logo } from "./Logo";

export const JobCardLogo = ({ scale = 1, forExport = false }) => {
  return <Logo scale={scale} forExport={forExport} variant="default" />;
};

// --- SUBTLE WATERMARK SEAL (No Text Caption, Sits in Background) ---
export const ExoinOfficialSeal = ({ size = 115 }) => {
  const primaryNavy = '#1E3A8A';
  const accentOrange = '#F97316';

  return (
    <div className="pointer-events-none select-none opacity-15">
      <svg width={size} height={size} viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="74" fill="none" stroke={primaryNavy} strokeWidth="2" strokeDasharray="4 2" />
        <circle cx="80" cy="80" r="64" fill="none" stroke={accentOrange} strokeWidth="1.5" />
        <circle cx="80" cy="80" r="50" fill="none" stroke={primaryNavy} strokeWidth="1" />
        
        {/* Curved Seal Text */}
        <path id="sealPathOuter" d="M 80, 80 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" fill="none" />
        <text fontSize="7" fontWeight="700" fill={primaryNavy} letterSpacing="1.2">
          <textPath href="#sealPathOuter" startOffset="50%" textAnchor="middle">
            EXOIN AFRICA • SERVICE VERIFIED
          </textPath>
        </text>

        {/* Central Logo */}
        <g transform="translate(68, 65) scale(0.24)">
          <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill={primaryNavy} />
          <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill={accentOrange} />
        </g>
        
        <text x="80" y="105" fontSize="6" fontWeight="700" textAnchor="middle" fill={primaryNavy} letterSpacing="0.5">VERIFIED</text>
      </svg>
    </div>
  );
};

export const JobCardTemplate = ({
  mode = 'view',
  data = {},
  onUpdate = () => {},
  signature = null,
  page = 1,
  totalPages = 1,
  forExport = false,
  showHeader = true
}) => {
  const displayData = { ...data };
  const clientInfo = displayData.client || {};
  const clientName = displayData.clientName || clientInfo.name || 'Client Premises';
  const clientAddress = displayData.clientAddress || clientInfo.address || clientInfo.addressLine1 || 'On-site';
  const clientContact = displayData.clientContactPerson || clientInfo.contactPerson || '';
  const clientPhone = displayData.clientPhone || clientInfo.phone || '';
  const clientEmail = displayData.clientEmail || clientInfo.email || '';
  const technician = displayData.technicianName || '';
  const scopeTitle = displayData.scope || 'Service Rendered';
  const showSeal = displayData.includeSeal !== false;
  const nextService = displayData.nextServiceDate || '';

  return (
    <div 
      className="w-[595px] bg-white shadow-xl relative flex flex-col font-sans select-none text-slate-800" 
      style={{ height: '842px', minHeight: '842px', maxHeight: '842px', overflow: 'hidden' }}
    >
      {/* Top subtle border */}
      <div className="h-1 w-full bg-slate-800 flex-shrink-0" />

      {/* Header */}
      {showHeader && (
        <div className="px-8 pt-6 pb-3 flex justify-between items-start border-b border-slate-200">
          <div>
            <JobCardLogo scale={1} forExport={forExport} />
            <div className="mt-2 text-[9px] text-slate-500 leading-tight space-y-0.5">
              <p className="font-bold text-slate-800">{displayData.companyName || 'EXOIN AFRICA LTD'}</p>
              <p className="font-mono"><strong>PIN:</strong> {displayData.companyTaxId?.replace('PIN: ', '') || 'A015776087P'}</p>
              <p>{displayData.companyAddress || '48706, 00100, Nairobi, Kenya'}</p>
              <p>{[displayData.companyPhone || '0739443244', displayData.companyEmail || 'info@exoinafrica.com'].filter(Boolean).join(' • ')}</p>
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-base font-extrabold tracking-wide uppercase text-slate-900">Service Job Card</h1>
            <div className="mt-2 text-xs font-mono space-y-0.5 text-slate-600">
              <p><span className="text-slate-400">JOB NO:</span> <strong className="text-slate-900">{displayData.number || displayData.documentNumber || 'JC-XXXX-XXXX'}</strong></p>
              <p><span className="text-slate-400">DATE:</span> {displayData.date || displayData.issueDate || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Client & Service Information - 2 Simple Balanced Cards */}
      <div className="px-8 py-3.5 grid grid-cols-2 gap-4">
        {/* Client & Site */}
        <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg text-xs space-y-1">
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1">
            Client & Site Details
          </p>
          <p className="font-bold text-slate-900 text-[13px] leading-snug">{clientName}</p>
          <p className="text-slate-600"><strong>Premises:</strong> {clientAddress}</p>
          {clientContact && <p className="text-slate-600"><strong>Contact Person:</strong> {clientContact}</p>}
          {(clientPhone || clientEmail) && (
            <p className="text-slate-500 font-mono text-[9.5px]">
              {[clientPhone, clientEmail].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>

        {/* Service Details */}
        <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg text-xs space-y-1">
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1">
            Service Details
          </p>
          <p className="text-slate-700"><strong>Service / Scope:</strong> <span className="font-bold text-slate-900">{scopeTitle}</span></p>
          {technician && <p className="text-slate-700"><strong>Technician:</strong> {technician}</p>}
          <p className="text-slate-700"><strong>Date of Service:</strong> {displayData.serviceDate || displayData.date || displayData.issueDate || '—'}</p>
          {nextService && (
            <p className="text-slate-700"><strong>Next Service:</strong> {nextService}</p>
          )}
        </div>
      </div>

      {/* Service / Work Done Table */}
      <div className="px-8 py-2">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2 px-3 w-8 text-center">#</th>
                <th className="py-2 px-3">Service / Work Description</th>
                <th className="py-2 px-3">Remarks / Details</th>
                <th className="py-2 px-3 text-center w-14">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(displayData.items || []).filter(item => item.name || item.description).length > 0 ? (
                (displayData.items || []).filter(item => item.name || item.description).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 text-center font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <p className="font-semibold text-slate-900 leading-tight">{item.name || item.description}</p>
                      {item.description && item.name && item.description !== item.name && (
                        <p className="text-[9.5px] text-slate-500 mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[10px] text-slate-600">
                      {item.notes || 'Completed as specified'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-medium text-slate-700">
                      {item.quantity || item.qty || 1}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 px-3 text-center font-mono text-slate-400 text-[10px]">1</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{scopeTitle}</td>
                  <td className="py-2 px-3 text-[10px] text-slate-600">Service completed on-site</td>
                  <td className="py-2 px-3 text-center font-mono font-medium text-slate-700">1</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes / Special Instructions (rendered only when provided) */}
      {displayData.notes && displayData.notes.trim() && (
        <div className="px-8 py-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <span className="font-bold uppercase tracking-wider text-[8px] text-slate-500 block mb-1">Notes / Instructions:</span>
            <p className="text-[10px] leading-relaxed">{displayData.notes}</p>
          </div>
        </div>
      )}

      {/* Sign-off Section with Optional Background Seal */}
      <div className="px-8 mt-auto pb-4 pt-2">
        <div className="relative">
          {/* Subtle Background Watermark Seal Centered (No text caption) */}
          {showSeal && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <ExoinOfficialSeal size={115} />
            </div>
          )}

          {/* 2 Balanced Sign-Off Cards */}
          <div className="grid grid-cols-2 gap-4 items-stretch relative z-10">
            {/* Technician Sign-Off */}
            <div className="p-3 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-lg flex flex-col justify-between text-xs min-h-[120px]">
              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Technician Sign-Off</p>
                <p className="font-bold text-slate-900 text-xs mt-1">{technician || 'Authorized Officer'}</p>
              </div>

              <div className="my-2 h-10 flex items-center justify-center border-b border-dashed border-slate-300">
                {(() => {
                  const activeSig = signature || displayData.signature || displayData.technicianSignature;
                  const sigImg = typeof activeSig === 'string' ? activeSig : (activeSig?.signatureUrl || activeSig?.dataUrl || null);
                  if (sigImg) {
                    return <img src={sigImg} alt="Technician Signature" className="max-h-9 max-w-full object-contain" />;
                  }
                  if (activeSig?.signatureHtml) {
                    return <div dangerouslySetInnerHTML={{ __html: activeSig.signatureHtml }} />;
                  }
                  return <span className="text-[8.5px] font-mono text-slate-400">Technician Signature</span>;
                })()}
              </div>

              <div className="text-[8px] font-mono text-slate-500">
                Date: {displayData.date || displayData.serviceDate || displayData.issueDate || '—'}
              </div>
            </div>

            {/* Client Confirmation & Stamp */}
            <div className="p-3 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-lg flex flex-col justify-between text-xs min-h-[120px]">
              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Client Confirmation</p>
                <p className="text-[9px] text-slate-600 italic mt-0.5 leading-snug">
                  "{displayData.terms || 'Work completed satisfactorily on-site as described.'}"
                </p>
                {clientContact && <p className="font-semibold text-slate-900 text-[10px] mt-1">{clientContact}</p>}
              </div>

              <div className="my-2 h-10 flex items-center justify-center border-b border-dashed border-slate-300">
                <span className="text-[8.5px] font-mono text-slate-400">Signature & Official Stamp</span>
              </div>

              <div className="flex justify-between items-center text-[8px] font-mono text-slate-500">
                <span>Date: ____________</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Minimalist Footer */}
      <div className="px-8 py-2.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-[8px] flex justify-between items-center flex-shrink-0">
        <span>{displayData.companyName || 'Exoin Africa Ltd'} • Service Completion Document</span>
        <span className="font-mono text-slate-400">exoin.africa</span>
      </div>
    </div>
  );
};

export default JobCardTemplate;
