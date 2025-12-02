import React, { useState, useEffect } from 'react';
import { usersApi } from '../../lib/api';
import { 
  Mail, 
  Server,
  Shield,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

const EmailHostingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [domains, setDomains] = useState([]);
  const [formData, setFormData] = useState({
    defaultDomainId: '',
    emailFormat: 'firstname.lastname',
    autoProvisionEnabled: true,
    defaultQuotaMb: 5120,
    defaultMaxSendPerDay: 500,
    notifyOnProvision: true,
    requireStrongPassword: true,
    minPasswordLength: 8,
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getEmailHostingSettings();
      const { settings, availableDomains } = response.data;
      
      if (settings) {
        setFormData({
          defaultDomainId: settings.defaultDomainId || '',
          emailFormat: settings.emailFormat || 'firstname.lastname',
          autoProvisionEnabled: settings.autoProvisionEnabled ?? true,
          defaultQuotaMb: settings.defaultQuotaMb || 5120,
          defaultMaxSendPerDay: settings.defaultMaxSendPerDay || 500,
          notifyOnProvision: settings.notifyOnProvision ?? true,
          requireStrongPassword: settings.requireStrongPassword ?? true,
          minPasswordLength: settings.minPasswordLength || 8,
        });
        setSettings(settings);
      }
      setDomains(availableDomains || []);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load email hosting settings');
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

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await usersApi.updateEmailHostingSettings(formData);
      setSuccess('Email hosting settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const emailFormatPreview = () => {
    const formats = {
      'firstname.lastname': 'john.smith@domain.com',
      'firstnamelastname': 'johnsmith@domain.com',
      'firstname_lastname': 'john_smith@domain.com',
      'first.last': 'j.smith@domain.com',
      'flastname': 'jsmith@domain.com',
    };
    return formats[formData.emailFormat] || 'john.smith@domain.com';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Default Domain & Email Format */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Mail size={20} className="text-orange-600" />
            Email Account Defaults
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Domain</label>
              <select
                name="defaultDomainId"
                value={formData.defaultDomainId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a domain</option>
                {domains.map(domain => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain} {domain.isVerified ? '✓' : '(unverified)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Default domain for new mailbox creation</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Format</label>
              <select
                name="emailFormat"
                value={formData.emailFormat}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="firstname.lastname">firstname.lastname</option>
                <option value="firstnamelastname">firstnamelastname</option>
                <option value="firstname_lastname">firstname_lastname</option>
                <option value="first.last">first.last (initials)</option>
                <option value="flastname">flastname</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Preview: <code className="bg-slate-100 px-1 rounded">{emailFormatPreview()}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Auto Provisioning */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Settings size={20} className="text-orange-600" />
            Auto Provisioning
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="autoProvisionEnabled"
                checked={formData.autoProvisionEnabled}
                onChange={handleChange}
                className="w-5 h-5 mt-0.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
              />
              <div>
                <span className="font-medium text-slate-900">Enable Auto-Provisioning</span>
                <p className="text-sm text-slate-500">Automatically create email accounts when new team members are added</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notifyOnProvision"
                checked={formData.notifyOnProvision}
                onChange={handleChange}
                className="w-5 h-5 mt-0.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
              />
              <div>
                <span className="font-medium text-slate-900">Send Welcome Email</span>
                <p className="text-sm text-slate-500">Send email credentials to users when their mailbox is created</p>
              </div>
            </label>
          </div>
        </div>

        {/* Quotas & Limits */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Server size={20} className="text-orange-600" />
            Default Quotas & Limits
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Storage Quota</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="defaultQuotaMb"
                  value={formData.defaultQuotaMb}
                  onChange={handleNumberChange}
                  min={512}
                  max={51200}
                  step={512}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-slate-500">MB</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {(formData.defaultQuotaMb / 1024).toFixed(1)} GB per mailbox
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Daily Send Limit</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="defaultMaxSendPerDay"
                  value={formData.defaultMaxSendPerDay}
                  onChange={handleNumberChange}
                  min={50}
                  max={5000}
                  step={50}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-slate-500">emails/day</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Maximum emails per user per day</p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-orange-600" />
            Password Policy
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="requireStrongPassword"
                checked={formData.requireStrongPassword}
                onChange={handleChange}
                className="w-5 h-5 mt-0.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
              />
              <div>
                <span className="font-medium text-slate-900">Require Strong Passwords</span>
                <p className="text-sm text-slate-500">Must include uppercase, lowercase, numbers, and special characters</p>
              </div>
            </label>

            <div className="max-w-xs">
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Password Length</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="minPasswordLength"
                  value={formData.minPasswordLength}
                  onChange={handleNumberChange}
                  min={6}
                  max={32}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-slate-500">characters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Need to set up domains first?</p>
            <p className="mt-1">
              Before you can auto-provision mailboxes, make sure you have at least one verified domain configured in 
              the <a href="/email-hosting" className="underline hover:text-blue-900">Email Hosting</a> section.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailHostingSettings;
