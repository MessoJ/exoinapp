import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { documentsApi, clientsApi, companyApi } from '../lib/api';
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  Save,
  Send,
  Eye,
  Edit3,
  Receipt,
  FileSpreadsheet,
  Truck,
  ClipboardCheck,
  Building,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { InvoiceTemplate } from '../components/templates/ExoinInvoices';
import { QuotationTemplate } from '../components/templates/ExoinQuotations';
import { DeliveryNoteTemplate } from '../components/templates/ExoinDeliveryNote';
import { JobCardTemplate } from '../components/templates/ExoinJobCard';

const DocumentCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [clients, setClients] = useState([]);
  const [company, setCompany] = useState(null);
  
  // Mobile / Tab View State: 'form' vs 'preview'
  const [activeTab, setActiveTab] = useState('form');
  const [previewScale, setPreviewScale] = useState(1);

  const [formData, setFormData] = useState({
    type: searchParams.get('type') || 'INVOICE',
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    scope: '',
    technicianName: '',
    items: [
      { description: 'Pest Control & Fumigation Service', quantity: 1, unitPrice: 8500 }
    ]
  });

  // Calculate dynamic auto-fit scale on mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          const avail = window.innerWidth - 32;
          const scale = Math.min(1, Math.max(0.42, avail / 595));
          setPreviewScale(scale);
        } else if (window.innerWidth < 1024) {
          setPreviewScale(0.75);
        } else {
          setPreviewScale(0.55);
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
        const [clientsRes, companyRes] = await Promise.all([
          clientsApi.getAll().catch(() => ({ data: { clients: [] } })),
          companyApi.get().catch(() => ({ data: null }))
        ]);
        setClients(clientsRes.data?.clients || []);
        setCompany(companyRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0));
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.16; // 16% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const selectedClientObj = clients.find(c => c.id === formData.clientId);

  // Template Data for Live High-Fidelity Preview
  const previewTemplateData = {
    number: `${formData.type.slice(0, 3)}-${new Date().getFullYear()}-0001`,
    date: formData.date || new Date().toISOString().split('T')[0],
    due: formData.dueDate || formData.date,
    expiry: formData.dueDate,
    orderRef: formData.scope || 'Standard Service Call',
    deliveryDate: formData.date,
    dispatchedBy: company?.name || 'Exoin Africa Authorized Representative',
    technicianName: formData.technicianName || 'Field Technician',
    scope: formData.scope || 'On-site Inspection, Fumigation and Treatment',
    companyPhone: company?.phone || '0739443244',
    companyEmail: company?.email || 'info@exoinafrica.com',
    client: {
      name: selectedClientObj?.name || 'Client Name / Organization',
      contactPerson: selectedClientObj?.contactPerson || 'Attn: Management',
      address: selectedClientObj?.addressLine1 || selectedClientObj?.city || 'Nairobi, Kenya',
      phone: selectedClientObj?.phone || '+254 700 000 000',
      email: selectedClientObj?.email || 'client@example.com'
    },
    items: formData.items.map(item => ({
      name: item.description || 'Service Line Item',
      description: item.description || 'Professional service rendered',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
    })),
    subtotal: calculateSubtotal(),
    taxAmount: calculateTax(),
    total: calculateTotal(),
    taxRate: 16,
    includeSeal: true,
    notes: formData.notes || (formData.type === 'JOB_CARD' 
      ? 'Safe for re-entry after 2 hours. Client satisfied with service delivery.' 
      : 'Payment due within 14 days of invoice issuance.')
  };

  const handleSubmit = async (e, sendEmail = false) => {
    e.preventDefault();
    setLoading(true);
    if (sendEmail) setSendingEmail(true);

    try {
      const submitData = {
        ...formData,
        clientId: formData.clientId || null,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      };

      const response = await documentsApi.create(submitData);
      
      if (sendEmail && formData.clientId) {
        const selectedClient = clients.find(c => c.id === formData.clientId);
        if (selectedClient?.email) {
          const docType = formData.type.charAt(0) + formData.type.slice(1).toLowerCase();
          const subject = encodeURIComponent(`${docType} #${response.data.documentNumber} from ${company?.name || 'Exoin Africa'}`);
          const body = encodeURIComponent(
            `Dear ${selectedClient.name},\n\n` +
            `Please find attached your ${docType.toLowerCase()} #${response.data.documentNumber}.\n\n` +
            `Amount: ${formatCurrency(calculateTotal())}\n` +
            (formData.dueDate ? `Due Date: ${new Date(formData.dueDate).toLocaleDateString()}\n` : '') +
            `\nThank you for your business.\n\n` +
            `Best regards,\n${company?.name || 'Exoin Africa'}`
          );
          navigate(`/mail?compose=true&to=${encodeURIComponent(selectedClient.email)}&subject=${subject}&body=${body}&attachDoc=${response.data.id}`);
          return;
        }
      }
      
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert(error.response?.data?.error || 'Failed to create document');
    } finally {
      setLoading(false);
      setSendingEmail(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 antialiased">
      {/* 1. Apple-style Header with Type Selector & Mobile Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
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
                Create {formData.type === 'JOB_CARD' ? 'Job Card' : formData.type === 'DELIVERY_NOTE' ? 'Delivery Note' : formData.type === 'INVOICE' ? 'Invoice' : 'Quotation'}
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                Live Preview
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Interactive document composer with real-time A4 preview
            </p>
          </div>
        </div>

        {/* Mobile View Toggle Segmented Control (Form vs Live Preview) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="lg:hidden flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'form' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Edit3 size={15} />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'preview' 
                  ? 'bg-white text-orange-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye size={15} />
              <span>Preview</span>
            </button>
          </div>

          <Link
            to={`/finance?type=${formData.type.toLowerCase()}`}
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ExternalLink size={14} />
            <span>Advanced Template Studio</span>
          </Link>
        </div>
      </div>

      {/* 2. Apple Split Grid: Form Editor & Real-time Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Editor (Visible on Desktop OR when activeTab === 'form' on mobile) */}
        <div className={`lg:col-span-6 space-y-5 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Card A: Document Classification & Client */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Document Specifications
                </h2>
                <span className="text-[11px] font-medium text-slate-400">Step 1 of 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Document Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                  >
                    <option value="JOB_CARD">Service Job Card</option>
                    <option value="DELIVERY_NOTE">Delivery Note</option>
                    <option value="INVOICE">Tax Invoice</option>
                    <option value="QUOTATION">Quotation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Client / Organization</label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Issue Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    {formData.type === 'JOB_CARD' ? 'Next Service Date (Optional)' : 'Due / Validity Date'}
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              {formData.type === 'JOB_CARD' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Technician Name</label>
                    <input
                      type="text"
                      name="technicianName"
                      value={formData.technicianName}
                      onChange={handleChange}
                      placeholder="e.g. Francis Meso"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Service Location / Site</label>
                    <input
                      type="text"
                      name="scope"
                      value={formData.scope}
                      onChange={handleChange}
                      placeholder="e.g. Webuye RRU Complex"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card B: Line Items */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Items & Quantities
                  </h2>
                  <p className="text-[11px] text-slate-400">Add service or item descriptions</p>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold active:scale-95 transition-all touch-manipulation"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="e.g. Cockroach Gel Baiting & Inspection"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-white disabled:opacity-30 transition-colors mt-4"
                        title="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-center text-slate-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Unit Rate
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-right text-slate-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Subtotal
                        </label>
                        <div className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-black text-right text-slate-800">
                          {formatCurrency((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Summary Card */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>VAT (16%)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(calculateTax())}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-orange-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            {/* Card C: Notes & Instructions */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Notes & Terms
              </h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder={formData.type === 'JOB_CARD' ? "e.g. Safety re-entry instructions: allow 2 hours aeration before occupancy." : "Add any payment terms, warranty or special instructions..."}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none resize-none transition-all"
              />
            </div>

            {/* Mobile View CTA: Switch to Preview */}
            <div className="lg:hidden flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-slate-900/10"
              >
                <Eye size={16} /> View Document Preview
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Link
                to="/documents"
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-semibold text-slate-600 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={16} />
                {loading && !sendingEmail ? 'Saving...' : 'Save Document'}
              </button>
              {formData.clientId && selectedClientObj?.email && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send size={16} />
                  {sendingEmail ? 'Creating...' : 'Save & Send'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Interactive Real-time Document Preview */}
        <div className={`lg:col-span-6 space-y-3 ${activeTab === 'form' ? 'hidden lg:block' : 'block'}`}>
          {/* Preview Card Container */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm sticky top-20">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Eye size={15} className="text-orange-500" />
                  Live Document Render
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  A4 595px
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewScale(prev => Math.max(0.35, parseFloat((prev - 0.08).toFixed(2))))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-600 w-10 text-center">
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewScale(prev => Math.min(1.4, parseFloat((prev + 0.08).toFixed(2))))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            </div>

            {/* Document Render Canvas Viewport */}
            <div className="bg-slate-100/70 rounded-2xl p-2 sm:p-4 overflow-x-auto flex justify-center items-start min-h-[420px] max-h-[75vh] overflow-y-auto no-scrollbar">
              <div 
                className="transition-transform duration-200 shadow-xl rounded-sm origin-top bg-white"
                style={{
                  transform: `scale(${previewScale})`,
                  width: '595px',
                  minHeight: '842px',
                  marginBottom: `${(1 - previewScale) * -420}px`
                }}
              >
                {formData.type === 'JOB_CARD' ? (
                  <JobCardTemplate 
                    data={previewTemplateData}
                    signature={null}
                    showTotals={true}
                    page={1}
                    totalPages={1}
                  />
                ) : formData.type === 'DELIVERY_NOTE' ? (
                  <DeliveryNoteTemplate 
                    data={previewTemplateData}
                    signature={null}
                    showTotals={true}
                    page={1}
                    totalPages={1}
                  />
                ) : formData.type === 'QUOTATION' ? (
                  <QuotationTemplate 
                    data={previewTemplateData}
                    signature={null}
                    showTotals={true}
                    page={1}
                    totalPages={1}
                  />
                ) : (
                  <InvoiceTemplate 
                    data={previewTemplateData}
                    signature={null}
                    showTotals={true}
                    page={1}
                    totalPages={1}
                  />
                )}
              </div>
            </div>

            {/* Mobile Switch Back to Edit Button */}
            <div className="lg:hidden mt-3">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold active:scale-95 transition-all"
              >
                <Edit3 size={15} /> Back to Editor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCreatePage;
