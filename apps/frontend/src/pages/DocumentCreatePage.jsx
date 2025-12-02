import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { documentsApi, clientsApi, companyApi } from '../lib/api';
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  Save,
  Send,
  Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DocumentCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [clients, setClients] = useState([]);
  const [company, setCompany] = useState(null);

  const [formData, setFormData] = useState({
    type: searchParams.get('type') || 'INVOICE',
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    items: [
      { description: '', quantity: 1, unitPrice: 0 }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, companyRes] = await Promise.all([
          clientsApi.getAll(),
          companyApi.get()
        ]);
        setClients(clientsRes.data.clients);
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
      return sum + (item.quantity * item.unitPrice);
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
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleSubmit = async (e, sendEmail = false) => {
    e.preventDefault();
    setLoading(true);
    if (sendEmail) setSendingEmail(true);

    try {
      // Prepare data
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
      
      // If sendEmail is true and there's a client, redirect to mail compose
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/documents"
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            New {formData.type.charAt(0) + formData.type.slice(1).toLowerCase()}
          </h1>
          <p className="text-slate-500">Create a new document</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Type & Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Document Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="INVOICE">Invoice</option>
                <option value="QUOTATION">Quotation</option>
                <option value="LETTERHEAD">Letterhead</option>
                <option value="RECEIPT">Receipt</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* Items */}
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </p>
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    disabled={formData.items.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">VAT (16%)</span>
                <span className="font-medium">{formatCurrency(calculateTax())}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-lg text-orange-600">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Add any additional notes or payment terms..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/documents"
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {loading && !sendingEmail ? 'Creating...' : 'Save Draft'}
          </button>
          {formData.clientId && clients.find(c => c.id === formData.clientId)?.email && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Send size={18} />
              {sendingEmail ? 'Creating...' : 'Create & Send Email'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DocumentCreatePage;
