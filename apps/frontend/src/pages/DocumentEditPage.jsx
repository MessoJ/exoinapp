import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  AlertCircle, 
  FileText, 
  Receipt, 
  Calculator,
  Calendar,
  Building,
  Coins,
  Percent,
  ShieldCheck,
  Check
} from 'lucide-react';
import { documentsApi, clientsApi } from '../lib/api';

const CURRENCY_CONFIG = {
  KES: { label: 'KES - Kenyan Shilling', symbol: 'KES', locale: 'en-KE' },
  USD: { label: 'USD - US Dollar', symbol: '$', locale: 'en-US' },
  EUR: { label: 'EUR - Euro', symbol: '€', locale: 'de-DE' },
  GBP: { label: 'GBP - British Pound', symbol: '£', locale: 'en-GB' },
};

const DocumentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    type: 'INVOICE',
    clientId: '',
    dueDate: '',
    notes: '',
    scope: '',
    technicianName: '',
    includeSeal: true,
    currency: 'KES',
    taxable: true,
    taxRate: 16,
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docResponse, clientsResponse] = await Promise.all([
        documentsApi.getById(id),
        clientsApi.getAll(),
      ]);
      
      const doc = docResponse.data;
      const parsedContent = typeof doc.content === 'string' ? JSON.parse(doc.content) : (doc.content || {});
      
      setFormData({
        title: doc.title || doc.documentNumber || '',
        type: doc.type || 'INVOICE',
        clientId: doc.clientId || '',
        dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString().split('T')[0] : '',
        notes: doc.notes || parsedContent?.notes || '',
        scope: doc.scope || '',
        technicianName: doc.technicianName || '',
        includeSeal: doc.includeSeal !== false,
        currency: doc.currency || parsedContent?.currency || 'KES',
        taxable: doc.taxable !== false,
        taxRate: doc.taxRate !== undefined ? Number(doc.taxRate) : (parsedContent?.taxRate !== undefined ? Number(parsedContent.taxRate) : 16),
        items: (doc.items && doc.items.length > 0) ? doc.items.map(it => ({
          description: it.description || it.name || '',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        })) : [{ description: '', quantity: 1, unitPrice: 0 }],
      });
      
      setClients(clientsResponse.data?.clients || clientsResponse.data || []);
    } catch (err) {
      setError('Failed to load document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0);
  };

  const calculateTax = () => {
    if (!formData.taxable) return 0;
    const rate = Number(formData.taxRate) || 16;
    return calculateSubtotal() * (rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatCurrency = (amount) => {
    const curr = formData.currency || 'KES';
    const cfg = CURRENCY_CONFIG[curr] || CURRENCY_CONFIG.KES;
    try {
      return new Intl.NumberFormat(cfg.locale, { 
        style: 'currency', 
        currency: curr,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount || 0);
    } catch (e) {
      return `${curr} ${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title) {
      setError('Title / reference is required');
      return;
    }
    
    if (formData.items.some(item => !item.description)) {
      setError('All items must have a description');
      return;
    }

    try {
      setSaving(true);
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTax();
      const total = calculateTotal();
      
      const documentData = {
        title: formData.title,
        type: formData.type,
        clientId: formData.clientId || null,
        dueDate: formData.dueDate || null,
        notes: formData.notes,
        scope: formData.scope,
        technicianName: formData.technicianName,
        includeSeal: formData.includeSeal,
        currency: formData.currency || 'KES',
        taxable: formData.taxable,
        taxRate: formData.taxable ? (Number(formData.taxRate) || 16) : 0,
        subtotal,
        taxAmount,
        total,
        items: formData.items.map(item => ({
          name: item.description,
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
        })),
        content: JSON.stringify({
          items: formData.items,
          notes: formData.notes,
          scope: formData.scope,
          technicianName: formData.technicianName,
          currency: formData.currency,
          taxable: formData.taxable,
          taxRate: formData.taxable ? (Number(formData.taxRate) || 16) : 0,
          subtotal,
          tax: taxAmount,
          total,
        }),
      };

      await documentsApi.update(id, documentData);
      navigate(`/documents/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-400">Loading document editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-36 sm:pb-24 antialiased">
      {/* 1. Header */}
      <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <Link 
          to={`/documents/${id}`}
          className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 active:scale-95 transition-all touch-manipulation"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Edit Document
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Modify specifications, multi-currency, tax calculation & line items
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Card 1: Details */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Document Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Document Title / Number *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Document Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
              >
                <option value="INVOICE">Tax Invoice</option>
                <option value="QUOTATION">Commercial Quotation</option>
                <option value="DELIVERY_NOTE">Delivery Note</option>
                <option value="JOB_CARD">Service Job Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assigned Client</label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
              />
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Coins size={13} className="text-slate-400" />
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
              >
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
              </select>
            </div>

            {/* Tax Treatment */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Percent size={13} className="text-slate-400" />
                Tax Treatment
              </label>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, taxable: !p.taxable }))}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-2xl text-xs font-bold transition-all ${
                  formData.taxable 
                    ? 'bg-blue-50/70 border-blue-200 text-blue-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span>{formData.taxable ? '16% VAT (KRA Standard Rate)' : 'Zero-Rated / Tax Exempt (0%)'}</span>
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  formData.taxable ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                }`}>
                  {formData.taxable && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </span>
              </button>
            </div>

            {/* Type Specific Fields */}
            {formData.type === 'JOB_CARD' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Technician Name</label>
                  <input
                    type="text"
                    name="technicianName"
                    value={formData.technicianName}
                    onChange={handleChange}
                    placeholder="e.g. Francis Meso"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>
              </>
            )}

            {/* Seal Toggle */}
            <div className="sm:col-span-2 pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="includeSealEdit"
                name="includeSeal"
                checked={formData.includeSeal}
                onChange={handleChange}
                className="w-4 h-4 text-orange-600 rounded-md focus:ring-orange-500 cursor-pointer"
              />
              <label htmlFor="includeSealEdit" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <ShieldCheck size={14} className="text-orange-500" />
                Include Official Company Seal & Watermark
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Line Items */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Line Items
              </h2>
              <p className="text-[11px] text-slate-400">Modify description, rate, and quantity</p>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold active:scale-95 transition-all touch-manipulation"
            >
              <Plus size={14} /> Add Line Item
            </button>
          </div>

          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-white disabled:opacity-30 transition-colors mt-4"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-center text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Rate ({formData.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-right text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total</label>
                    <div className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-black text-right text-slate-800">
                      {formatCurrency(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">{formatCurrency(calculateSubtotal())}</span>
            </div>
            {formData.taxable ? (
              <div className="flex justify-between text-slate-500">
                <span>VAT ({formData.taxRate || 16}%)</span>
                <span className="font-semibold text-slate-800">{formatCurrency(calculateTax())}</span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-400">
                <span>VAT (Zero-Rated / Exempt)</span>
                <span className="font-semibold">{formatCurrency(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Updated Total</span>
              <span className="text-orange-600">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Notes */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Notes & Terms
          </h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none resize-none transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to={`/documents/${id}`}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-semibold text-slate-600 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-50 touch-manipulation"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Updating...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentEditPage;
