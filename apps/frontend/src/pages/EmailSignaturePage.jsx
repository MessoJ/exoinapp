import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Save, 
  Loader,
  User,
  Phone,
  MapPin,
  Globe,
  Building,
  Eye,
  Copy,
  Check,
  Moon,
  Sun
} from 'lucide-react';
import { signatureApi } from '../lib/api';
import { EmailSignatureTemplate } from '../components/templates/ExoinEmailSignatures';

const EmailSignaturePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const signatureRef = useRef(null);
  const [signatureData, setSignatureData] = useState({
    signatureEnabled: true,
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    phone: '',
    location: '',
    officeAddress: '',
    linkedinUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    photoUrl: ''
  });

  useEffect(() => {
    fetchSignatureSettings();
  }, []);

  const fetchSignatureSettings = async () => {
    try {
      const response = await signatureApi.get();
      setSignatureData(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch signature settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await signatureApi.update({
        signatureEnabled: signatureData.signatureEnabled,
        linkedinUrl: signatureData.linkedinUrl,
        twitterUrl: signatureData.twitterUrl,
        instagramUrl: signatureData.instagramUrl,
        location: signatureData.location,
        officeAddress: signatureData.officeAddress,
        phone: signatureData.phone,
        jobTitle: signatureData.jobTitle,
      });
      setSignatureData(prev => ({ ...prev, ...response.data }));
      alert('Signature settings saved successfully!');
    } catch (error) {
      console.error('Failed to save signature settings:', error);
      alert('Failed to save signature settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyHtml = async () => {
    if (!signatureRef.current) return;
    try {
      await navigator.clipboard.writeText(signatureRef.current.innerHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setSignatureData(prev => ({ ...prev, [field]: value }));
  };

  const previewData = {
    fullName: `${signatureData.firstName || ''} ${signatureData.lastName || ''}`.trim() || 'John Doe',
    email: signatureData.email || 'john@exoin.africa',
    jobTitle: signatureData.jobTitle || 'Chief Operations Officer',
    phone: signatureData.phone || '+254 700 000 000',
    location: signatureData.location || 'Nairobi, Kenya',
    address: signatureData.officeAddress || 'Exoin Tower, Westlands Road',
    website: 'www.exoin.africa',
    linkedinUrl: signatureData.linkedinUrl,
    twitterUrl: signatureData.twitterUrl,
    instagramUrl: signatureData.instagramUrl,
    photoUrl: signatureData.photoUrl
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Signature</h1>
          <p className="text-slate-500 mt-1">Option A: The Executive Link</p>
        </div>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-sm transition-all ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          {darkMode ? <Moon size={16} /> : <Sun size={16} />}
          <span className="text-sm font-medium">Preview {darkMode ? 'Dark' : 'Light'} Mode</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-lg font-bold text-slate-900">Signature Settings</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <label className="font-medium text-slate-900">Enable Email Signature</label>
                <p className="text-sm text-slate-500">Add your signature to outgoing emails</p>
              </div>
              <button
                onClick={() => handleInputChange('signatureEnabled', !signatureData.signatureEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  signatureData.signatureEnabled ? 'bg-orange-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    signatureData.signatureEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Name (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <User size={14} className="inline mr-1.5" />
                Full Name
              </label>
              <input
                type="text"
                value={`${signatureData.firstName} ${signatureData.lastName}`}
                disabled
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
              />
              <p className="text-xs text-slate-400 mt-1">Name is set by admin and cannot be changed</p>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Mail size={14} className="inline mr-1.5" />
                Email Address
              </label>
              <input
                type="email"
                value={signatureData.email}
                disabled
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
              />
            </div>

            {/* Job Title (Editable) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Building size={14} className="inline mr-1.5" />
                Job Title
              </label>
              <input
                type="text"
                value={signatureData.jobTitle || ''}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="e.g., Chief Executive Officer"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Phone (Editable) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Phone size={14} className="inline mr-1.5" />
                Phone Number
              </label>
              <input
                type="tel"
                value={signatureData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+254 712 345 678"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Location (Editable) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <MapPin size={14} className="inline mr-1.5" />
                Location
              </label>
              <input
                type="text"
                value={signatureData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Nairobi, Kenya"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Office Address (Editable) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Building size={14} className="inline mr-1.5" />
                Office Address
              </label>
              <input
                type="text"
                value={signatureData.officeAddress || ''}
                onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                placeholder="123 Office Street, Building A"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Social Links Section */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Social Media Links</h3>
              
              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#0077b5]">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </span>
                </label>
                <input
                  type="url"
                  value={signatureData.linkedinUrl || ''}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Twitter/X */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X (Twitter)
                  </span>
                </label>
                <input
                  type="url"
                  value={signatureData.twitterUrl || ''}
                  onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#E1306C]">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    Instagram
                  </span>
                </label>
                <input
                  type="url"
                  value={signatureData.instagramUrl || ''}
                  onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Company Branding Info */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Company branding (logo, colors, company name) is automatically applied to your signature.
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 font-medium shadow-lg shadow-orange-500/25"
            >
              {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
              Save Signature Settings
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Preview</h2>
              <p className="text-sm text-slate-500">The Executive Link Style</p>
            </div>
            {signatureData.signatureEnabled && (
              <button
                onClick={handleCopyHtml}
                className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-xl transition-all ${
                  copied ? 'bg-green-50 border-green-200 text-green-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {copied ? <><Check size={16} className="text-green-500" /> Copied!</> : <><Copy size={16} /> Copy HTML</>}
              </button>
            )}
          </div>

          <div className="p-6">
            {/* Email Client Simulation */}
            <div className={`rounded-xl border overflow-hidden transition-colors duration-300 ${
              darkMode ? 'bg-[#1e1e1e] border-slate-700' : 'bg-white border-slate-200'
            }`}>
              {/* Fake Email Header */}
              <div className={`px-4 py-3 border-b flex gap-4 items-center ${
                darkMode ? 'bg-[#2d2d2d] border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                </div>
                <div className={`h-2 w-48 rounded-full ml-2 ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
              </div>

              {/* Email Body */}
              <div className="p-8 min-h-[350px] flex flex-col">
                <div className={`space-y-3 text-sm mb-8 font-serif italic ${
                  darkMode ? 'text-slate-500' : 'text-slate-400 opacity-50'
                }`}>
                  <p>Dear Partner,</p>
                  <p>Here are the updated details for the Phase 3 deployment...</p>
                  <p>Best regards,</p>
                </div>

                {!signatureData.signatureEnabled ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Mail size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Signature Disabled</p>
                    <p className="text-sm">Enable your signature to see a preview</p>
                  </div>
                ) : (
                  <div ref={signatureRef} className="mt-auto">
                    <EmailSignatureTemplate data={previewData} darkMode={darkMode} />
                  </div>
                )}
              </div>
            </div>

            {/* Usage Instructions */}
            {signatureData.signatureEnabled && (
              <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Eye size={16} className="text-orange-500" />
                  How to use your signature
                </h4>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    Your signature will be automatically added to emails sent from this platform
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    Click "Copy HTML" to use in other email clients (Outlook, Gmail, etc.)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    Use the dark/light mode toggle to preview how it looks in different clients
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSignaturePage;
