import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader, Building, User, Mail, Phone, MapPin, Globe, FileText, AlertCircle, Send, Inbox, Clock, MessageSquare } from 'lucide-react';
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
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
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
      setEmailHistory(res.data.emails || []);
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
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || '',
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
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          to="/clients" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft size={18} />
          Back to Clients
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{formData.name || 'Edit Client'}</h1>
            <p className="text-slate-500 mt-1">{formData.email}</p>
          </div>
          {formData.email && (
            <Link
              to={`/mail?compose=true&to=${encodeURIComponent(formData.email)}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Send size={16} />
              Send Email
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'details' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User size={16} className="inline mr-1.5" />
          Details
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'emails' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare size={16} className="inline mr-1.5" />
          Email History
          {emailHistory.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-slate-100 rounded-full">{emailHistory.length}</span>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Email History Tab */}
      {activeTab === 'emails' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-500" />
              Email History with {formData.name}
            </h2>
            <Link
              to={`/mail?compose=true&to=${encodeURIComponent(formData.email)}`}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Send size={14} />
              New Email
            </Link>
          </div>
          
          {emailHistoryLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-orange-500" size={24} />
            </div>
          ) : emailHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No email history with this client yet</p>
              <Link
                to={`/mail?compose=true&to=${encodeURIComponent(formData.email)}`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                <Send size={14} />
                Send First Email
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {emailHistory.map((email) => (
                <Link
                  key={email.id}
                  to={`/mail?view=${email.id}`}
                  className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${email.direction === 'sent' ? 'bg-blue-50' : 'bg-green-50'}`}>
                    {email.direction === 'sent' ? (
                      <Send size={16} className="text-blue-500" />
                    ) : (
                      <Inbox size={16} className="text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${!email.isRead && email.direction === 'received' ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {email.direction === 'sent' ? 'To: ' : 'From: '}{email.from?.name || email.from?.address}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(email.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${!email.isRead && email.direction === 'received' ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                      {email.subject || '(No subject)'}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{email.snippet}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details Tab (Original Form) */}
      {activeTab === 'details' && (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="text-orange-500" size={20} />
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Company Ltd."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+254 123 456 789"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="text-orange-500" size={20} />
            Address
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Business Street"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Nairobi"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Kenya"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="text-orange-500" size={20} />
            Business Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tax ID / VAT Number
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="KE123456789"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://company.com"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this client..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to="/clients"
            className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default ClientEditPage;
