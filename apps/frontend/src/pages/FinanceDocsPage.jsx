import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  ArrowLeft, Save, Download, Share2, Eye, Edit3, Send,
  Plus, Trash2, Calculator, FileText, Receipt, FileSpreadsheet,
  Calendar, User, Building, Phone, Mail, MapPin,
  X, Check, Loader2, Copy, Link2, ExternalLink, Printer,
  ChevronRight, ChevronDown, DollarSign, Percent, Hash,
  AlertCircle, CheckCircle, Clock, PenTool
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { documentsApi, clientsApi, pdfApi } from '../lib/api';
import { InvoiceTemplate } from '../components/templates/ExoinInvoices';
import { QuotationTemplate } from '../components/templates/ExoinQuotations';
import SignaturePicker from '../components/common/SignaturePicker';
import useSignatures from '../hooks/useSignatures';

// Logo Component - Removed, using templates
// const DocLogo = ...

// Document Preview Component - Replaced by Templates
const DocumentPreview = ({ type, data, signature, showTotals, page, totalPages, showHeader = true, forExport = false }) => {
  const isInvoice = type === 'invoice';
  
  // Map data to template format
  const templateData = {
    number: data.documentNumber,
    date: data.issueDate,
    due: data.dueDate,
    expiry: data.dueDate, // For quotation
    client: {
      name: data.clientName,
      address: data.clientAddress,
      city: data.clientCity || '', 
      contact: data.clientEmail
    },
    items: (data.items || []).map(item => ({
      desc: item.description,
      title: item.description, // For quotation
      qty: item.quantity,
      rate: item.unitPrice,
      total: item.total,
      unit: 'Unit' // Default unit
    })),
    subtotal: data.subtotal,
    tax: data.taxAmount,
    total: data.total,
    notes: data.notes,
    terms: data.terms,
    bankName: data.bankName,
    bankAccount: data.bankAccount,
    companyName: data.companyName,
    companyAddress: data.companyAddress,
    companyTaxId: data.companyTaxId
  };

  if (isInvoice) {
    return <InvoiceTemplate data={templateData} signature={signature} showTotals={showTotals} page={page} totalPages={totalPages} showHeader={showHeader} forExport={forExport} />;
  } else {
    return <QuotationTemplate data={templateData} signature={signature} showTotals={showTotals} page={page} totalPages={totalPages} showHeader={showHeader} forExport={forExport} />;
  }
};


// Client Selector
const ClientSelector = ({ clients = [], selectedClient, onSelect, onCreateNew }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const safeClients = Array.isArray(clients) ? clients : [];

  const filteredClients = safeClients.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl hover:border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-left"
      >
        {selectedClient ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Building className="text-orange-600" size={18} />
            </div>
            <div>
              <p className="font-medium text-slate-900">{selectedClient.name}</p>
              <p className="text-xs text-slate-500">{selectedClient.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-slate-400">Select a client...</span>
        )}
        <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-20 max-h-80 overflow-hidden">
            <div className="p-3 border-b border-slate-100">
              <input 
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => { onSelect(client); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <Building className="text-slate-500" size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-500">{client.email}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { onCreateNew(); setIsOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Plus size={18} />
                <span className="font-medium">Add New Client</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Share Modal
const ShareModal = ({ isOpen, onClose, document }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/documents/${document?.id}/view`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Share Document</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-slate-500 mb-4">
          Share {document?.documentNumber || 'this document'} with your client
        </p>
        
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Link2 size={18} className="text-slate-400 flex-shrink-0" />
          <input type="text" value={shareUrl} readOnly className="flex-1 bg-transparent text-sm text-slate-600 focus:outline-none truncate" />
          <button onClick={handleCopy} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => window.open(`mailto:${document?.clientEmail}?subject=${encodeURIComponent(document?.documentNumber || 'Document')}&body=${encodeURIComponent(`Please find your document here: ${shareUrl}`)}`, '_blank')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Mail size={18} /> Email
          </button>
          <button onClick={() => window.open(shareUrl, '_blank')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50">
            <ExternalLink size={18} /> Preview
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Finance Docs Page
const FinanceDocsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const docType = searchParams.get('type') || 'invoice';
  const editId = searchParams.get('id');
  const { getDefaultSignature } = useSignatures();
  
  const documentRef = useRef(null);
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [savedDocument, setSavedDocument] = useState(null);
  const [signature, setSignature] = useState(null);

  // Load default signature on mount
  useEffect(() => {
    const defaultSig = getDefaultSignature();
    if (defaultSig && !signature) {
      setSignature(defaultSig.dataUrl);
    }
  }, []);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      type: docType.toUpperCase(),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: 16,
      companyName: 'Exoin Africa Ltd.',
      companyAddress: 'Nairobi HQ • Westlands Tower',
      companyTaxId: 'VAT: P051...Z',
      bankName: 'Equity Bank Kenya',
      bankAccount: '0000-0000-0000',
      notes: '',
      terms: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, notes: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');
  const watchTaxRate = watch('taxRate');

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const items = watchItems || [];
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
    const taxAmount = subtotal * ((watchTaxRate || 16) / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [watchItems, watchTaxRate]);

  const totals = calculateTotals();

  const handleSignatureSelect = (dataUrl) => {
    setSignature(dataUrl);
  };

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientsApi.getAll();
        // Backend returns { clients: [...] } object
        const clientsData = response.data?.clients || response.data || [];
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
        setClients([]);
      }
    };
    fetchClients();
  }, []);

  // Load existing document if editing
  useEffect(() => {
    if (editId) {
      const loadDocument = async () => {
        setLoading(true);
        try {
          const response = await documentsApi.getById(editId);
          const doc = response.data;
          setValue('issueDate', doc.issueDate?.split('T')[0]);
          setValue('dueDate', doc.dueDate?.split('T')[0]);
          setValue('taxRate', doc.taxRate);
          setValue('notes', doc.notes);
          setValue('items', doc.items || []);
          if (doc.client) setSelectedClient(doc.client);
          setSavedDocument(doc);
        } catch (error) {
          console.error('Failed to load document:', error);
        } finally {
          setLoading(false);
        }
      };
      loadDocument();
    }
  }, [editId, setValue]);

  // Generate preview data
  const getPreviewData = () => {
    const formData = watch();
    return {
      ...formData,
      documentNumber: savedDocument?.documentNumber || `${docType === 'invoice' ? 'INV' : 'QUO'}-${new Date().getFullYear()}-XXXX`,
      clientName: selectedClient?.name || 'Client Name',
      clientAddress: selectedClient?.address || 'Address',
      clientEmail: selectedClient?.email,
      items: watchItems.map(item => ({
        ...item,
        total: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
      })),
      ...totals
    };
  };

  // Submit form
  const onSubmit = async (data) => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    setSaving(true);
    try {
      const documentData = {
        type: docType.toUpperCase(),
        clientId: selectedClient.id,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        taxRate: parseFloat(data.taxRate),
        notes: data.notes,
        terms: data.terms,
        items: data.items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          notes: item.notes
        }))
      };

      let response;
      if (editId) {
        response = await documentsApi.update(editId, documentData);
      } else {
        response = await documentsApi.create(documentData);
      }

      setSavedDocument(response.data);
      setStep('preview');
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  // Download PDF - Capture each page separately for better quality
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const previewData = getPreviewData();
      const itemsPerPage = 8;
      const items = previewData.items || [];
      const totalPages = Math.ceil(items.length / itemsPerPage) || 1;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Create a temporary container for export rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.zIndex = '-1';
      tempContainer.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempContainer);

      for (let i = 0; i < totalPages; i++) {
        const pageItems = items.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
        const isLastPage = i === totalPages - 1;
        const isFirstPage = i === 0;
        
        const pageData = {
          ...previewData,
          items: pageItems
        };

        // Create a temporary div for this page
        const pageDiv = document.createElement('div');
        pageDiv.style.width = '595px';
        pageDiv.style.height = '842px';
        pageDiv.style.backgroundColor = '#ffffff';
        tempContainer.appendChild(pageDiv);

        // Render the component with forExport=true
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(pageDiv);
        
        await new Promise((resolve) => {
          root.render(
            <DocumentPreview 
              type={docType} 
              data={pageData} 
              signature={isLastPage ? signature : null}
              showTotals={isLastPage}
              page={i + 1}
              totalPages={totalPages}
              showHeader={isFirstPage}
              forExport={true}
            />
          );
          setTimeout(resolve, 1000); // Wait for render (increased for stability)
        });

        // Capture the page
        const canvas = await html2canvas(pageDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 595,
          windowHeight: 842
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        // Add new page for pages after the first
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        // Cleanup
        root.unmount();
        tempContainer.removeChild(pageDiv);
      }

      // Cleanup temp container
      document.body.removeChild(tempContainer);

      pdf.save(`${savedDocument?.documentNumber || 'Document'}.pdf`);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Print - with proper page breaks
  const handlePrint = () => {
    const printContainer = documentRef.current;
    if (printContainer) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${savedDocument?.documentNumber || 'Document'}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @media print { 
                body { margin: 0; padding: 0; }
                .shadow-2xl { 
                  box-shadow: none !important; 
                  page-break-after: always;
                  page-break-inside: avoid;
                }
                .shadow-2xl:last-child {
                  page-break-after: auto;
                }
              }
              @page { 
                size: A4;
                margin: 0;
              }
            </style>
          </head>
          <body>${printContainer.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // Send via email
  const handleSendEmail = () => {
    if (!savedDocument?.id) {
      alert('Please save the document first');
      return;
    }
    navigate(`/mail?compose=true&attach=${savedDocument.id}&to=${selectedClient?.email || ''}&subject=${encodeURIComponent(savedDocument.documentNumber)}`);
  };

  const isInvoice = docType === 'invoice';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => navigate('/documents')} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ArrowLeft size={18} className="sm:hidden" />
              <ArrowLeft size={20} className="hidden sm:block" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${isInvoice ? 'bg-orange-100' : 'bg-blue-100'}`}>
                {isInvoice ? <Receipt className="text-orange-600" size={16} /> : <FileSpreadsheet className="text-blue-600" size={16} />}
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900">
                  {editId ? 'Edit' : 'Create'} {isInvoice ? 'Invoice' : 'Quote'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                  {step === 'form' ? 'Fill in the details' : 'Preview and send'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {step === 'preview' && (
              <>
                <button onClick={() => setStep('form')} className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit">
                  <Edit3 size={18} />
                </button>
                <div className="hidden sm:block">
                  <SignaturePicker 
                    onSelect={handleSignatureSelect}
                    currentSignature={signature}
                    compact
                  />
                </div>
                <button onClick={handleDownloadPDF} disabled={downloading} className="p-1.5 sm:p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 text-slate-600" title="Download PDF">
                  {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>
                <button onClick={() => setShowShareModal(true)} className="p-1.5 sm:p-2 border border-slate-300 rounded-lg hover:bg-slate-100 hidden sm:block text-slate-600" title="Share">
                  <Share2 size={18} />
                </button>
                <button onClick={handleSendEmail} className="p-1.5 sm:p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600" title="Send Email">
                  <Send size={18} />
                </button>
                <button onClick={handlePrint} className="p-1.5 sm:p-2 border border-slate-300 rounded-lg hover:bg-slate-100 hidden sm:block text-slate-600" title="Print">
                  <Printer size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-8 bg-white p-1 rounded-xl border border-slate-200 w-full sm:w-fit overflow-x-auto">
          <button
            onClick={() => navigate('/finance?type=invoice')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all ${
              isInvoice ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Receipt size={16} className="sm:hidden" />
            <Receipt size={18} className="hidden sm:block" />
            Invoice
          </button>
          <button
            onClick={() => navigate('/finance?type=quotation')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all ${
              !isInvoice ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet size={16} className="sm:hidden" />
            <FileSpreadsheet size={18} className="hidden sm:block" />
            Quote
          </button>
        </div>

        {step === 'form' ? (
          <div className="grid lg:grid-cols-5 gap-4 sm:gap-8">
            {/* Form */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-2 lg:order-1">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                {/* Client Selection */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Building size={18} className="text-slate-400" />
                    Client Information
                  </h3>
                  <ClientSelector 
                    clients={clients}
                    selectedClient={selectedClient}
                    onSelect={setSelectedClient}
                    onCreateNew={() => navigate('/clients/new')}
                  />
                </div>

                {/* Document Details */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Building size={18} className="text-slate-400" />
                    Company Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Company Name</label>
                      <input 
                        {...register('companyName')}
                        type="text"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Address / Location</label>
                      <input 
                        {...register('companyAddress')}
                        type="text"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Tax ID / VAT</label>
                      <input 
                        {...register('companyTaxId')}
                        type="text"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 pt-4 border-t border-slate-100">
                    <Calendar size={18} className="text-slate-400" />
                    Document Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Issue Date</label>
                      <input 
                        {...register('issueDate')}
                        type="date"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                        {isInvoice ? 'Due Date' : 'Valid Until'}
                      </label>
                      <input 
                        {...register(isInvoice ? 'dueDate' : 'validUntil')}
                        type="date"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Tax Rate (%)</label>
                      <input 
                        {...register('taxRate')}
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-slate-400" />
                    Line Items
                  </h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {/* Desktop Header - Hidden on mobile */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider px-4">
                      <div className="col-span-5">Description</div>
                      <div className="col-span-2 text-right">Qty</div>
                      <div className="col-span-2 text-right">Rate</div>
                      <div className="col-span-2 text-right">Total</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Items */}
                    {fields.map((field, index) => {
                      const qty = parseFloat(watchItems[index]?.quantity) || 0;
                      const price = parseFloat(watchItems[index]?.unitPrice) || 0;
                      const itemTotal = qty * price;

                      return (
                        <div key={field.id} className="p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
                          {/* Mobile Layout */}
                          <div className="sm:hidden space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <input 
                                  {...register(`items.${index}.description`)}
                                  placeholder="Item description"
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => fields.length > 1 && remove(index)}
                                disabled={fields.length <= 1}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <input 
                              {...register(`items.${index}.notes`)}
                              placeholder="Additional notes (optional)"
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase">Qty</label>
                                <input 
                                  {...register(`items.${index}.quantity`)}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase">Rate</label>
                                <input 
                                  {...register(`items.${index}.unitPrice`)}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase">Total</label>
                                <div className="px-2 py-2 text-sm font-mono font-bold text-slate-900 text-center bg-white rounded-lg border border-slate-200">
                                  {itemTotal.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-5">
                              <input 
                                {...register(`items.${index}.description`)}
                                placeholder="Item description"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                              <input 
                                {...register(`items.${index}.notes`)}
                                placeholder="Additional notes (optional)"
                                className="w-full px-3 py-2 mt-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <input 
                                {...register(`items.${index}.quantity`)}
                                type="number"
                                min="0"
                                placeholder="0"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-right focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <input 
                                {...register(`items.${index}.unitPrice`)}
                                type="number"
                                min="0"
                                placeholder="0"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-right focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            <div className="col-span-2 py-2 text-right font-mono font-bold text-slate-900">
                              {itemTotal.toLocaleString()}
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => fields.length > 1 && remove(index)}
                                disabled={fields.length <= 1}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Item */}
                    <button
                      type="button"
                      onClick={() => append({ description: '', quantity: 1, unitPrice: 0, notes: '' })}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg sm:rounded-xl text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-colors text-sm sm:text-base"
                    >
                      <Plus size={18} />
                      Add Line Item
                    </button>
                  </div>
                </div>

                {/* Notes & Terms */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Notes & Terms</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                      <textarea
                        {...register('notes')}
                        rows={2}
                        placeholder="Add any notes or special instructions..."
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Terms & Conditions</label>
                      <textarea
                        {...register('terms')}
                        rows={2}
                        placeholder="Payment terms, conditions, disclaimers..."
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Bank Name</label>
                        <input 
                          {...register('bankName')}
                          type="text"
                          placeholder="e.g. Equity Bank"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Account Number</label>
                        <input 
                          {...register('bankAccount')}
                          type="text"
                          placeholder="e.g. 0000-0000-0000"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3.5 sm:py-4 text-white rounded-xl font-medium text-sm sm:text-base transition-all shadow-lg ${
                    isInvoice 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25'
                  } disabled:opacity-50`}
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? 'Saving...' : `Save ${isInvoice ? 'Invoice' : 'Quotation'}`}
                </button>
              </form>
            </div>

            {/* Live Preview & Totals */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1 lg:order-2">
              {/* Totals Card */}
              <div className={`bg-gradient-to-br ${isInvoice ? 'from-orange-500 to-orange-600' : 'from-blue-500 to-blue-600'} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white`}>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Calculator size={18} />
                  <h3 className="font-bold text-sm sm:text-base">Summary</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-white/80 text-sm sm:text-base">
                    <span>Subtotal</span>
                    <span className="font-mono">KES {totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-white/80 text-sm sm:text-base">
                    <span>VAT ({watchTaxRate}%)</span>
                    <span className="font-mono">KES {totals.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl sm:text-2xl font-bold pt-2 sm:pt-3 border-t border-white/20">
                    <span>Total</span>
                    <span className="font-mono">KES {totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Mini Preview - Hidden on mobile */}
              <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Eye size={18} className="text-slate-400" />
                    Preview
                  </h3>
                </div>
                <div className="bg-slate-100 rounded-xl p-4 overflow-y-auto max-h-[400px]">
                  <div className="transform scale-[0.3] origin-top-left space-y-4" style={{ width: '333%' }}>
                    {(() => {
                      const previewData = getPreviewData();
                      const itemsPerPage = 8;
                      const items = previewData.items || [];
                      const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
                      
                      return Array.from({ length: totalPages }).map((_, pageIndex) => {
                        const pageItems = items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);
                        const isLastPage = pageIndex === totalPages - 1;
                        const isFirstPage = pageIndex === 0;
                        
                        const pageData = {
                          ...previewData,
                          items: pageItems
                        };

                        return (
                          <div key={pageIndex} className="mb-4 shadow-lg">
                            <DocumentPreview 
                              type={docType} 
                              data={pageData}
                              signature={isLastPage ? signature : null}
                              showTotals={isLastPage}
                              page={pageIndex + 1}
                              totalPages={totalPages}
                              showHeader={isFirstPage}
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Preview Mode */
          <div className="flex flex-col items-center space-y-4 sm:space-y-8 pb-20 overflow-x-auto">
            {/* Mobile Signature Picker */}
            <div className="sm:hidden w-full flex justify-center">
              <SignaturePicker 
                onSelect={handleSignatureSelect}
                currentSignature={signature}
                compact
              />
            </div>
            
            {/* Mobile action buttons */}
            <div className="sm:hidden flex items-center gap-2 w-full justify-center">
              <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm text-slate-700 shadow-sm">
                <Share2 size={16} /> Share
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm text-slate-700 shadow-sm">
                <Printer size={16} /> Print
              </button>
            </div>
            
            <div ref={documentRef} className="space-y-4 sm:space-y-8 transform scale-[0.55] sm:scale-100 origin-top">
              {(() => {
                const previewData = getPreviewData();
                const itemsPerPage = 8;
                const items = previewData.items || [];
                const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
                
                return Array.from({ length: totalPages }).map((_, pageIndex) => {
                  const pageItems = items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);
                  const isLastPage = pageIndex === totalPages - 1;
                  const isFirstPage = pageIndex === 0;
                  
                  const pageData = {
                    ...previewData,
                    items: pageItems
                  };

                  return (
                    <div key={pageIndex} className="shadow-2xl mb-8">
                      <DocumentPreview 
                        type={docType} 
                        data={pageData} 
                        signature={isLastPage ? signature : null}
                        showTotals={isLastPage}
                        page={pageIndex + 1}
                        totalPages={totalPages}
                        showHeader={isFirstPage}
                      />
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        document={{ ...savedDocument, clientEmail: selectedClient?.email }}
      />
    </div>
  );
};

export default FinanceDocsPage;
