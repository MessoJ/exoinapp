import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  FileText, 
  AlertCircle, 
  Send, 
  Inbox, 
  Clock, 
  MessageSquare,
  FileSpreadsheet,
  Receipt,
  Truck,
  ClipboardCheck,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { clientsApi, mailApi } from '../lib/api';

const ClientEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [emailHistory, setEmailHistory] = useState([]);
  const [emailHistoryLoading, setEmailHistoryLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Kenya',
    taxId: '',
    website: '',
    notes: '',
  });

  useEffect(() => {
    fetchClient();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'emails' && formData.email) {
      fetchEmailHistory();
    }
  }, [activeTab, formData.email]);

  const fetchEmailHistory = async () => {
    if (!formData.email) return;
    setEmailHistoryLoading(true);
    try {
      const res = await mailApi.getContactHistory(formData.email, { limit: 50 });
      setEmailHistory(res.data?.emails || []);
    } catch (err) {
      console.error('Failed to fetch email history:', err);
    } finally {
      setEmailHistoryLoading(false);
    }
  };

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await clientsApi.getById(id);
      const client = response.data;
      setFormData({
        name: client.name || '',
        companyName: client.companyName || '',
        contactPerson: client.contactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || client.addressLine1 || '',
        city: client.city || '',
        country: client.country || 'Kenya',
        taxId: client.taxId || '',
        website: client.website || '',
        notes: client.notes || '',
      });
    } catch (err) {
      setError('Failed to load client');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name) {
      setError('Client name is required');
      return;
    }
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    try {
      setSaving(true);
      await clientsApi.update(id, formData);
      navigate('/clients');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-400">Loading client profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 antialiased">
      {/* 1. Header with iOS Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link 
            to="/clients"
            className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 active:scale-95 transition-all touch-manipulation"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate max-w-sm sm:max-w-md">
              {formData.name || 'Client Details'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Update account credentials, address & communications
            </p>
          </div>
        </div>

        {/* iOS-style Segmented Controller */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'details'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building size={14} />
            <span>Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'emails'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail size={14} />
            <span>Email History</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'details' ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section A: Organization Details */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Organization Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Client / Organization Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tax PIN / Registration ID</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section B: Contact & Address */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Contact & Site Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Physical / Facility Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              to={`/documents?clientId=${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700"
            >
              <span>View Issued Documents</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/clients"
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
          </div>
        </form>
      ) : (
        /* Email History Tab */
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Communication Timeline</h2>
              <p className="text-xs text-slate-500">Emails dispatched to {formData.email}</p>
            </div>
            <Link
              to={`/mail?compose=true&to=${encodeURIComponent(formData.email)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Send size={13} /> Compose Email
            </Link>
          </div>

          {emailHistoryLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-400">Loading email logs...</p>
            </div>
          ) : emailHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Inbox size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-800">No sent emails recorded</p>
              <p className="text-xs text-slate-400 mt-0.5">Direct document dispatches will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {emailHistory.map((em, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{em.subject || '(No subject)'}</p>
                    <p className="text-slate-500 mt-0.5 line-clamp-1">{em.snippet || em.bodyText}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(em.sentAt || em.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientEditPage;
