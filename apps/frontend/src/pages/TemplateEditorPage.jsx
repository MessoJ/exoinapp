import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Download, Share2, Mail, Printer, 
  ZoomIn, ZoomOut, Loader2, Link2, Copy, ExternalLink, Check, X, FileText
} from 'lucide-react';
import { documentsApi, pdfApi } from '../lib/api';

// Import all templates
import { LetterheadTemplate } from '../components/templates/ExoinLetterheadAlternatives';
import { InvoiceTemplate } from '../components/templates/ExoinInvoices';
import { QuotationTemplate } from '../components/templates/ExoinQuotations';
import ExoinBusinessCardAlternatives from '../components/templates/ExoinBusinessCardAlternatives';

// Template configurations
const TEMPLATE_CONFIG = {
  letterhead: {
    component: LetterheadTemplate,
    title: 'Letterhead',
    description: 'Official correspondence and letters',
    hasEditableContent: true,
  },
  invoice: {
    component: InvoiceTemplate,
    title: 'Invoice',
    description: 'Professional invoice template',
    hasEditableContent: true,
    hasItems: true,
  },
  quotation: {
    component: QuotationTemplate,
    title: 'Quotation',
    description: 'Sales proposal and quotation',
    hasEditableContent: true,
    hasItems: true,
  },
  'business-card': {
    component: ExoinBusinessCardAlternatives,
    title: 'Business Card',
    description: 'Professional business card design',
    hasEditableContent: false,
  },
};

// Share Modal Component
const ShareModal = ({ isOpen, onClose, documentId, documentTitle }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/documents/${documentId}/view`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Share Document</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        
        <p className="text-sm text-slate-500 mb-4">Share "{documentTitle}" with others</p>
        
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Link2 size={18} className="text-slate-400" />
          <input type="text" value={shareUrl} readOnly className="flex-1 bg-transparent text-sm text-slate-600 focus:outline-none" />
          <button onClick={handleCopy} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => window.open(`mailto:?subject=${encodeURIComponent(documentTitle)}&body=${encodeURIComponent(shareUrl)}`, '_blank')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Mail size={18} /> Email
          </button>
          <button onClick={() => window.open(shareUrl, '_blank')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ExternalLink size={18} /> Open
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
  const [zoom, setZoom] = useState(100);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedDocId, setSavedDocId] = useState(documentId);

  // Letterhead state
  const [letterContent, setLetterContent] = useState('');
  const [recipientData, setRecipientData] = useState({
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    recipientName: '',
    company: '',
    address: '',
    city: '',
    subject: '',
    senderName: '',
    senderTitle: '',
  });

  // Invoice state
  const [invoiceData, setInvoiceData] = useState({
    number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    client: { name: '', address: '', city: '', contact: '' },
    items: [{ desc: '', qty: 1, rate: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    total: 0
  });

  // Quotation state
  const [quoteData, setQuoteData] = useState({
    id: `Q-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    client: { name: '', dept: '', address: '', city: '' },
    scope: 'Exoin Africa proposes the following autonomous hygiene solution tailored to your facility\'s specifications.',
    items: [{ title: '', desc: '', unit: 'Month', qty: 1, rate: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    total: 0
  });

  const config = TEMPLATE_CONFIG[type];

  // Load existing document if editing
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId]);

  // Calculate totals for Invoice
  useEffect(() => {
    if (type === 'invoice') {
      const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0);
      const tax = subtotal * 0.16;
      const total = subtotal + tax;
      setInvoiceData(prev => ({ ...prev, subtotal, tax, total }));
    }
  }, [invoiceData.items, type]);

  // Calculate totals for Quotation
  useEffect(() => {
    if (type === 'quotation') {
      const subtotal = quoteData.items.reduce((sum, item) => sum + (item.total || 0), 0);
      const tax = subtotal * 0.16;
      const total = subtotal + tax;
      setQuoteData(prev => ({ ...prev, subtotal, tax, total }));
    }
  }, [quoteData.items, type]);

  const loadDocument = async (id) => {
    setLoading(true);
    try {
      const response = await documentsApi.getById(id);
      const doc = response.data;
      
      if (type === 'letterhead') {
        setLetterContent(doc.content || '');
        if (doc.metadata) {
          setRecipientData(prev => ({ ...prev, ...doc.metadata }));
        }
      } else if (type === 'invoice') {
        if (doc.metadata) {
          setInvoiceData(prev => ({ ...prev, ...doc.metadata }));
        }
      } else if (type === 'quotation') {
        if (doc.metadata) {
          setQuoteData(prev => ({ ...prev, ...doc.metadata }));
        }
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let documentData = {
        type: type.toUpperCase(),
        status: 'DRAFT',
      };

      if (type === 'letterhead') {
        documentData.content = letterContent;
        documentData.metadata = recipientData;
        documentData.title = recipientData.subject || 'Untitled Letter';
      } else if (type === 'invoice') {
        documentData.metadata = invoiceData;
        documentData.title = `Invoice ${invoiceData.number}`;
        documentData.items = invoiceData.items;
        documentData.clientName = invoiceData.client.name;
      } else if (type === 'quotation') {
        documentData.metadata = quoteData;
        documentData.title = `Quotation ${quoteData.id}`;
        documentData.items = quoteData.items.map(item => ({
          description: item.title,
          quantity: item.qty,
          unitPrice: item.rate,
        }));
        documentData.clientName = quoteData.client.name;
      }

      let response;
      if (savedDocId) {
        response = await documentsApi.update(savedDocId, documentData);
      } else {
        response = await documentsApi.create(documentData);
        setSavedDocId(response.data.id);
      }
      
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!savedDocId) {
      alert('Please save the document first');
      return;
    }
    
    try {
      const response = await pdfApi.generate(savedDocId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${savedDocId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('template-preview');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print ${config?.title || 'Document'}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                #template-preview { box-shadow: none !important; }
              }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendEmail = () => {
    if (!savedDocId) {
      alert('Please save the document first');
      return;
    }
    // Navigate to mail with attachment reference
    navigate(`/mail?attach=${savedDocId}&attachType=${type}`);
  };

  const handleUpdate = (field, value) => {
    if (type === 'letterhead') {
      if (field === 'content') {
        setLetterContent(value);
      } else if (field === 'recipient') {
        setRecipientData(value);
      }
    } else if (type === 'invoice') {
      setInvoiceData(prev => ({ ...prev, [field]: value }));
    } else if (type === 'quotation') {
      setQuoteData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Template Not Found</h2>
          <p className="text-slate-500 mb-4">The requested template type doesn't exist.</p>
          <button onClick={() => navigate('/documents')} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const TemplateComponent = config.component;

  // Prepare data for the template
  let templateData = {};
  if (type === 'letterhead') {
    templateData = { content: letterContent, recipient: recipientData };
  } else if (type === 'invoice') {
    templateData = invoiceData;
  } else if (type === 'quotation') {
    templateData = quoteData;
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{config.title}</h1>
            <p className="text-sm text-slate-500">{config.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1 hover:bg-slate-200 rounded">
              <ZoomOut size={16} />
            </button>
            <span className="text-sm text-slate-600 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="p-1 hover:bg-slate-200 rounded">
              <ZoomIn size={16} />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200" />

          {/* Action Buttons */}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save
          </button>

          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Download size={18} />
            PDF
          </button>

          <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Share2 size={18} />
            Share
          </button>

          <button onClick={handleSendEmail} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Mail size={18} />
            Email
          </button>

          <button onClick={handlePrint} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto bg-slate-100 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="flex justify-center" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
            <div id="template-preview">
              <TemplateComponent 
                mode="edit" 
                data={templateData} 
                onUpdate={handleUpdate} 
              />
            </div>
          </div>
        )}
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
