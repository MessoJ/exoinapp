import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Download, Share2, Mail, Printer, 
  ZoomIn, ZoomOut, Loader2, Link2, Copy, ExternalLink, Check, X, FileText,
  ClipboardCheck, Truck, Receipt, Sparkles
} from 'lucide-react';
import { documentsApi, pdfApi } from '../lib/api';

// Official Exoin templates
import { LetterheadTemplate } from '../components/templates/ExoinLetterheadAlternatives';
import { InvoiceTemplate } from '../components/templates/ExoinInvoices';
import { QuotationTemplate } from '../components/templates/ExoinQuotations';
import { JobCardTemplate } from '../components/templates/ExoinJobCard';
import { DeliveryNoteTemplate } from '../components/templates/ExoinDeliveryNote';
import ExoinBusinessCardAlternatives from '../components/templates/ExoinBusinessCardAlternatives';

// Template configurations
const TEMPLATE_CONFIG = {
  job_card: {
    component: JobCardTemplate,
    title: 'Service Job Card',
    description: 'Autonomous hygiene & field service verification',
    icon: ClipboardCheck,
    hasEditableContent: true,
  },
  delivery_note: {
    component: DeliveryNoteTemplate,
    title: 'Delivery Note',
    description: 'Consumables, chemicals & equipment dispatch',
    icon: Truck,
    hasEditableContent: true,
  },
  invoice: {
    component: InvoiceTemplate,
    title: 'Tax Invoice',
    description: 'Corporate billing with KRA VAT breakdown',
    icon: Receipt,
    hasEditableContent: true,
  },
  quotation: {
    component: QuotationTemplate,
    title: 'Formal Quotation',
    description: 'Scope proposal and commercial pricing',
    icon: FileText,
    hasEditableContent: true,
  },
  letterhead: {
    component: LetterheadTemplate,
    title: 'Official Letterhead',
    description: 'Executive corporate correspondence',
    icon: FileText,
    hasEditableContent: true,
  },
  'business-card': {
    component: ExoinBusinessCardAlternatives,
    title: 'Business Card',
    description: 'Contactless digital & print insignia',
    icon: Sparkles,
    hasEditableContent: false,
  },
};

// Apple Share Modal Component
const ShareModal = ({ isOpen, onClose, documentId, documentTitle }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/documents/${documentId || 'preview'}/view`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Share2 size={18} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Share Document</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Anyone with this private link can view {documentTitle ? `"${documentTitle}"` : 'this official document'}.
        </p>
        
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/80 mb-5">
          <Link2 size={16} className="text-slate-400 ml-2 shrink-0" />
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            className="flex-1 bg-transparent text-xs text-slate-600 focus:outline-none truncate px-1" 
          />
          <button 
            onClick={handleCopy} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
              copied 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.open(`mailto:?subject=${encodeURIComponent(documentTitle || 'Document')}&body=${encodeURIComponent(shareUrl)}`, '_blank')} 
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl transition-all active:scale-95"
          >
            <Mail size={15} /> Send via Mail
          </button>
          <button 
            onClick={() => window.open(shareUrl, '_blank')} 
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-2xl transition-all active:scale-95 shadow-sm"
          >
            <ExternalLink size={15} /> Open Preview
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Template Editor Page
const TemplateEditorPage = () => {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const documentId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1);
  const [autoScale, setAutoScale] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedDocId, setSavedDocId] = useState(documentId);

  // Dynamic mobile scale calculation
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        const s = Math.min(1, Math.max(0.46, (width - 32) / 595));
        setAutoScale(s);
        setScale(s);
      } else {
        setAutoScale(1);
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generic document payload
  const [docPayload, setDocPayload] = useState({
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    number: `EXO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
    client: { 
      name: 'KRA Western Region Office', 
      address: 'Lake Hub Mall Kisumu', 
      city: 'Kisumu, Kenya', 
      contact: '0722856810',
      email: 'callcenter@kra.go.ke'
    },
    items: [
      { 
        description: 'Fumigation and Pest Control Service AT KRA WEBUYE RRU', 
        name: 'Pest Control & Fumigation',
        title: 'Specialized Sanitation',
        quantity: 1, 
        qty: 1, 
        unitPrice: 9850, 
        rate: 9850, 
        total: 9850 
      }
    ],
    scope: 'Specialized hygiene treatment and barrier fumigation applied across facility coordinates.',
    taxable: true,
    taxRate: 16,
    subtotal: 8491.38,
    tax: 1358.62,
    total: 9850.00
  });

  const config = TEMPLATE_CONFIG[type] || TEMPLATE_CONFIG.job_card;
  const TemplateComponent = config.component;

  const handleUpdate = (field, value) => {
    setDocPayload(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        type: (type || 'job_card').toUpperCase(),
        title: `${config.title} ${docPayload.number}`,
        clientName: docPayload.client?.name || 'Exoin Client',
        metadata: docPayload,
        items: docPayload.items,
        subtotal: docPayload.subtotal,
        tax: docPayload.tax,
        total: docPayload.total,
        status: 'DRAFT'
      };

      let res;
      if (savedDocId) {
        res = await documentsApi.update(savedDocId, payload);
      } else {
        res = await documentsApi.create(payload);
        if (res?.data?.id) setSavedDocId(res.data.id);
      }
      alert('Document saved successfully!');
    } catch (err) {
      console.error('Failed to save document:', err);
      alert('Failed to save document.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    navigate('/mail?compose=true');
  };

  const Icon = config.icon || FileText;

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] antialiased text-slate-800 overflow-hidden">
      {/* Frosted Glass Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-6 py-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all active:scale-95"
            title="Go back"
          >
            <ArrowLeft size={17} />
          </button>
          
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/25">
            <Icon size={18} />
          </div>

          <div>
            <h1 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">{config.title}</h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">{config.description}</p>
          </div>
        </div>

        {/* Zoom Controls & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom Pill */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button 
              onClick={() => setScale(s => Math.max(0.4, Number((s - 0.1).toFixed(2))))} 
              className="w-7 h-7 rounded-xl hover:bg-white flex items-center justify-center text-slate-600 active:scale-95"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <button 
              onClick={() => setScale(autoScale)}
              className="px-2 text-[11px] font-semibold text-slate-700 hover:text-orange-600"
              title="Reset fit"
            >
              {Math.round(scale * 100)}%
            </button>
            <button 
              onClick={() => setScale(s => Math.min(1.4, Number((s + 0.1).toFixed(2))))} 
              className="w-7 h-7 rounded-xl hover:bg-white flex items-center justify-center text-slate-600 active:scale-95"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save</span>
          </button>

          <button 
            onClick={() => setShowShareModal(true)} 
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all active:scale-95"
            title="Share"
          >
            <Share2 size={16} />
          </button>

          <button 
            onClick={handlePrint} 
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all active:scale-95"
            title="Print"
          >
            <Printer size={16} />
          </button>
        </div>
      </header>

      {/* Editor & Preview Workspace */}
      <div className="flex-1 overflow-auto bg-slate-100/70 p-4 md:p-8 flex flex-col items-center">
        <div 
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: scale < 1 ? `${(1 - scale) * -842}px` : '0px'
          }}
          className="transition-transform duration-200"
        >
          <TemplateComponent 
            mode="edit" 
            data={docPayload} 
            onUpdate={handleUpdate} 
          />
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentId={savedDocId}
        documentTitle={config.title}
      />
    </div>
  );
};

export default TemplateEditorPage;
