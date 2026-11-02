import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { documentsApi, pdfApi, companyApi } from '../lib/api';
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Printer, 
  Send,
  Receipt,
  FileSpreadsheet,
  FileText,
  Mail,
  Phone,
  MapPin,
  Truck,
  ClipboardCheck,
  Share2,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Calendar,
  Building
} from 'lucide-react';
import { InvoiceTemplate } from '../components/templates/ExoinInvoices';
import { QuotationTemplate } from '../components/templates/ExoinQuotations';
import { DeliveryNoteTemplate } from '../components/templates/ExoinDeliveryNote';
import { JobCardTemplate } from '../components/templates/ExoinJobCard';

const DocumentViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(1);

  // Auto-fit document scale on mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          const avail = window.innerWidth - 32;
          const fit = Math.min(1, Math.max(0.42, avail / 595));
          setScale(fit);
        } else if (window.innerWidth < 1024) {
          setScale(0.85);
        } else {
          setScale(1);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, companyRes] = await Promise.all([
          documentsApi.getById(id),
          companyApi.get().catch(() => ({ data: null }))
        ]);
        setDocData(docRes.data);
        setCompany(companyRes.data);
      } catch (error) {
        console.error('Failed to fetch document:', error);
        navigate('/documents');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await pdfApi.generate(id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docData.documentNumber}.pdf`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-400">Loading document...</p>
      </div>
    );
  }

  if (!docData) return null;

  const isInvoice = docData.type === 'INVOICE';
  const isQuotation = docData.type === 'QUOTATION';
  const isDeliveryNote = docData.type === 'DELIVERY_NOTE';
  const isJobCard = docData.type === 'JOB_CARD';

  // Map backend document to official template format
  const templateData = {
    number: docData.documentNumber,
    date: docData.issueDate ? new Date(docData.issueDate).toISOString().split('T')[0] : '',
    due: docData.dueDate ? new Date(docData.dueDate).toISOString().split('T')[0] : '',
    expiry: docData.dueDate ? new Date(docData.dueDate).toISOString().split('T')[0] : '',
    orderRef: docData.scope || 'Standard Service Order',
    deliveryDate: docData.issueDate ? new Date(docData.issueDate).toISOString().split('T')[0] : '',
    dispatchedBy: company?.name || 'Exoin Africa Authorized Representative',
    technicianName: docData.technicianName || 'Field Technician',
    scope: docData.scope || '',
    companyPhone: company?.phone || '0739443244',
    companyEmail: company?.email || 'info@exoinafrica.com',
    client: {
      name: docData.client?.name || 'Client Name',
      contactPerson: docData.client?.contactPerson || '',
      address: docData.client?.addressLine1 || docData.client?.address || docData.client?.city || 'Kenya',
      phone: docData.client?.phone || '',
      email: docData.client?.email || ''
    },
    items: (docData.items || []).map(item => ({
      name: item.description || '',
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      total: Number(item.total) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))
    })),
    subtotal: Number(docData.subtotal) || 0,
    taxAmount: Number(docData.taxAmount) || 0,
    total: Number(docData.total) || 0,
    taxRate: docData.taxRate || 16,
    includeSeal: true,
    notes: docData.notes || ''
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 antialiased">
      {/* 1. Apple-style Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <Link 
            to="/documents"
            className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 active:scale-95 transition-all touch-manipulation"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {docData.documentNumber}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isInvoice ? 'bg-orange-100 text-orange-700' :
                isDeliveryNote ? 'bg-emerald-100 text-emerald-700' :
                isJobCard ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {docData.type}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Client: <span className="font-semibold text-slate-800">{docData.client?.name || 'Private Client'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {docData.client?.email && (
            <Link
              to={`/mail?compose=true&to=${encodeURIComponent(docData.client.email)}&subject=${encodeURIComponent(`${docData.type}: ${docData.documentNumber} from Exoin Africa`)}&attachDoc=${docData.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Send size={14} /> Email
            </Link>
          )}

          <Link
            to={`/documents/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <Edit size={14} /> Edit
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <Printer size={14} /> Print
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download size={14} />
            <span>{downloading ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* 2. Document Scale & Preview Controls (Mobile Zoom) */}
      <div className="flex items-center justify-between px-2 print:hidden text-xs text-slate-500">
        <span className="font-semibold">Official Document View</span>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
          <button 
            type="button"
            onClick={() => setScale(prev => Math.max(0.35, parseFloat((prev - 0.08).toFixed(2))))} 
            className="p-1 hover:bg-slate-100 rounded-md text-slate-600"
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="font-mono font-bold text-slate-700 w-9 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            type="button"
            onClick={() => setScale(prev => Math.min(1.4, parseFloat((prev + 0.08).toFixed(2))))} 
            className="p-1 hover:bg-slate-100 rounded-md text-slate-600"
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      {/* 3. High-Fidelity A4 Document Canvas Viewport */}
      <div className="bg-slate-100/70 rounded-3xl p-3 sm:p-6 overflow-x-auto flex justify-center items-start min-h-[500px]">
        <div 
          className="transition-transform duration-200 shadow-2xl rounded-sm origin-top bg-white print:shadow-none print:transform-none"
          style={{
            transform: `scale(${scale})`,
            width: '595px',
            minHeight: '842px',
            marginBottom: `${(1 - scale) * -420}px`
          }}
        >
          {isJobCard ? (
            <JobCardTemplate 
              data={templateData}
              signature={docData.signature || null}
              showTotals={true}
              page={1}
              totalPages={1}
            />
          ) : isDeliveryNote ? (
            <DeliveryNoteTemplate 
              data={templateData}
              signature={docData.signature || null}
              showTotals={true}
              page={1}
              totalPages={1}
            />
          ) : isQuotation ? (
            <QuotationTemplate 
              data={templateData}
              signature={docData.signature || null}
              showTotals={true}
              page={1}
              totalPages={1}
            />
          ) : (
            <InvoiceTemplate 
              data={templateData}
              signature={docData.signature || null}
              showTotals={true}
              page={1}
              totalPages={1}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewPage;
