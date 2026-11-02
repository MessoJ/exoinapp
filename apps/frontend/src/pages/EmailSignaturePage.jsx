import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Save, 
  Loader2,
  User, 
  Phone, 
  MapPin, 
  Globe, 
  Building, 
  Eye, 
  Copy, 
  Check, 
  Moon, 
  Sun,
  ArrowLeft,
  Sparkles,
  Link2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signatureApi } from '../lib/api';
import { EmailSignatureTemplate } from '../components/templates/ExoinEmailSignatures';

const EmailSignaturePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileTab, setMobileTab] = useState('settings'); // 'settings' | 'preview'
  const signatureRef = useRef(null);

  const [signatureData, setSignatureData] = useState({
    signatureEnabled: true,
    firstName: 'Francis',
    lastName: 'Meso',
    email: 'mesofrancis@outlook.com',
    jobTitle: 'Managing Director',
    phone: '0739443244',
    location: 'Nairobi, Kenya',
    officeAddress: 'Westlands Tower, Waiyaki Way',
    linkedinUrl: 'https://linkedin.com/company/exoin-africa',
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
      if (response?.data) {
        setSignatureData(prev => ({ 
          ...prev, 
          ...response.data,
          phone: response.data.phone || prev.phone,
          email: response.data.email || prev.email,
          jobTitle: response.data.jobTitle || prev.jobTitle,
          firstName: response.data.firstName || prev.firstName,
          lastName: response.data.lastName || prev.lastName
        }));
      }
    } catch (error) {
      console.error('Failed to fetch signature settings, using defaults:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
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
      if (response?.data) {
        setSignatureData(prev => ({ ...prev, ...response.data }));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
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
    fullName: `${signatureData.firstName || ''} ${signatureData.lastName || ''}`.trim() || 'Francis Meso',
    email: signatureData.email || 'mesofrancis@outlook.com',
    jobTitle: signatureData.jobTitle || 'Managing Director',
    phone: signatureData.phone || '0739443244',
    location: signatureData.location || 'Nairobi, Kenya',
    address: signatureData.officeAddress || 'Westlands Tower, Waiyaki Way',
    website: 'www.exoin.africa',
    linkedinUrl: signatureData.linkedinUrl,
    twitterUrl: signatureData.twitterUrl,
    instagramUrl: signatureData.instagramUrl,
    photoUrl: signatureData.photoUrl
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-3 font-medium">Loading email signature...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 antialiased text-slate-800">
      {/* Apple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all active:scale-95"
            title="Back"
          >
            <ArrowLeft size={17} />
          </button>
          
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/25">
            <Mail size={18} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Email Signature</h1>
            <p className="text-xs text-slate-500">The Executive Link • Corporate HTML Insignia</p>
          </div>
        </div>

        {/* Action Controls & Mobile Segmented Switcher */}
        <div className="flex items-center gap-2">
          {/* Mobile view switch */}
          <div className="flex sm:hidden bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setMobileTab('settings')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                mobileTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                mobileTab === 'preview' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Preview
            </button>
          </div>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border transition-all active:scale-95 ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-white shadow-sm' 
                : 'bg-white border-slate-200/80 text-slate-700 shadow-xs'
            }`}
            title="Toggle Preview Light/Dark Mode"
          >
            {darkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-500" />}
            <span className="hidden md:inline">{darkMode ? 'Light View' : 'Dark View'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-orange-500/20'
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : savedSuccess ? <Check size={14} /> : <Save size={14} />}
            <span>{savedSuccess ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Settings Side */}
        <div className={`space-y-4 ${mobileTab === 'preview' ? 'hidden sm:block' : 'block'}`}>
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/60 space-y-5">
            {/* Enable Toggle Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Signature Attachment
                </label>
                <p className="text-[11px] text-slate-400">Append corporate insignia to outgoing mail</p>
              </div>
              <button
                onClick={() => handleInputChange('signatureEnabled', !signatureData.signatureEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                  signatureData.signatureEnabled ? 'bg-orange-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    signatureData.signatureEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Readonly Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name (Account)
                </label>
                <input
                  type="text"
                  value={`${signatureData.firstName} ${signatureData.lastName}`}
                  disabled
                  className="w-full bg-slate-100/70 border border-slate-200/60 rounded-xl px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={signatureData.email}
                  disabled
                  className="w-full bg-slate-100/70 border border-slate-200/60 rounded-xl px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Coordinates Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Job Designation
                </label>
                <input
                  type="text"
                  value={signatureData.jobTitle || ''}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  placeholder="e.g. Managing Director"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Direct Phone Number
                </label>
                <input
                  type="tel"
                  value={signatureData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="0739443244"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Territory / City
                </label>
                <input
                  type="text"
                  value={signatureData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Nairobi, Kenya"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Premises / Building
                </label>
                <input
                  type="text"
                  value={signatureData.officeAddress || ''}
                  onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                  placeholder="Westlands Tower"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Social Coordinates */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Corporate Social Handle
              </h3>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={signatureData.linkedinUrl || ''}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/company/exoin-africa"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Mail Simulation Preview */}
        <div className={`space-y-4 ${mobileTab === 'settings' ? 'hidden sm:block' : 'block'}`}>
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Live Client Mail Simulation</h2>
                <p className="text-xs text-slate-400">Renders exactly as seen in Gmail, Outlook & Apple Mail</p>
              </div>

              {signatureData.signatureEnabled && (
                <button
                  onClick={handleCopyHtml}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                    copied 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                  }`}
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'HTML Copied' : 'Copy HTML'}</span>
                </button>
              )}
            </div>

            {/* Simulated Mail Window */}
            <div className={`rounded-2xl border overflow-hidden transition-colors duration-200 ${
              darkMode ? 'bg-[#18181B] border-slate-800' : 'bg-slate-50/60 border-slate-200/70'
            }`}>
              {/* Window Bar */}
              <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${
                darkMode ? 'bg-[#27272A] border-slate-800' : 'bg-white border-slate-200/70'
              }`}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
                <span className={`text-[10px] font-mono ml-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  New Message • Exoin Client Mail
                </span>
              </div>

              {/* Mail Body Simulation */}
              <div className="p-6 min-h-[300px] flex flex-col justify-between">
                <div className={`space-y-2 text-xs leading-relaxed ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <p>Dear Valued Client,</p>
                  <p>Please find attached our official service job card and corresponding invoice for your review.</p>
                  <p>Warm regards,</p>
                </div>

                {!signatureData.signatureEnabled ? (
                  <div className="py-8 text-center text-slate-400">
                    <Mail size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold">Signature currently disabled</p>
                  </div>
                ) : (
                  <div ref={signatureRef} className="pt-6 border-t border-slate-200/50 mt-4">
                    <EmailSignatureTemplate data={previewData} darkMode={darkMode} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSignaturePage;
