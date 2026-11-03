import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { companyApi, usersApi, smtpApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';
import EmailHostingSettings from '../components/settings/EmailHostingSettings';
import { 
  Building2, Mail, Phone, MapPin, CreditCard, Palette,
  Save, Server, ShieldCheck, Check, Sparkles, Globe,
  FileCheck2, Receipt, User, Key, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle, RefreshCw, Send, ChevronRight,
  Shield, CheckSquare, HelpCircle, Briefcase, ExternalLink
} from 'lucide-react';
import { ROLES_METADATA } from './UsersPage';

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const { user: currentUser, updateUser } = useAuth();
  const { hasPermission, isAdmin } = usePermission();

  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ success: '', error: '' });

  // Company Form State
  const [companyData, setCompanyData] = useState({
    name: 'Exoin Africa',
    tagline: 'Autonomous Hygiene & Specialized Facility Solutions',
    email: 'mesofrancis@outlook.com',
    phone: '0739443244',
    website: 'https://www.exoin.africa',
    addressLine1: '48706, 00100',
    addressLine2: 'Westlands Tower, Waiyaki Way',
    city: 'Nairobi',
    country: 'Kenya',
    bankName: 'Equity Bank Kenya',
    bankAccount: '0123456789012',
    bankBranch: 'Westlands Supreme Branch',
    swiftCode: 'EQBLKENA',
    primaryColor: '#1E3A8A',
    secondaryColor: '#F97316',
    vatNumber: 'A015776087P',
    registrationNumber: 'PVT-XXXXXX'
  });

  // User Profile Form State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    phone: '',
    location: '',
    officeAddress: '',
    newPassword: '',
    confirmPassword: '',
    currentPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'stalwart-mail',
    port: 465,
    secure: true,
    user: 'admin@exoinafrica.com',
    pass: 'jhoqEX3TrBmqrfi6',
    fromEmail: 'admin@exoinafrica.com',
    fromName: 'Exoin Africa'
  });
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [verifyingSmtp, setVerifyingSmtp] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  useEffect(() => {
    fetchInitialSettings();
  }, []);

  const fetchInitialSettings = async () => {
    try {
      setLoading(true);
      const [companyRes, smtpRes] = await Promise.all([
        companyApi.get().catch(() => ({ data: null })),
        smtpApi.verify().catch(() => ({ data: { success: false, message: 'SMTP check failed' } }))
      ]);

      if (companyRes?.data) {
        setCompanyData(prev => ({
          ...prev,
          ...companyRes.data,
        }));
      }

      if (currentUser) {
        setProfileData(prev => ({
          ...prev,
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          jobTitle: currentUser.jobTitle || '',
          phone: currentUser.phone || '',
          location: currentUser.location || 'Nairobi, Kenya',
          officeAddress: currentUser.officeAddress || 'Westlands Tower, Waiyaki Way',
        }));
        setTestEmailRecipient(currentUser.email || '');
      }

      setSmtpStatus(smtpRes.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSmtpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSmtpConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save Company Settings
  const handleSaveCompany = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await companyApi.update(companyData);
      window.dispatchEvent(new CustomEvent('exoin_company_updated', { detail: companyData }));
      setFeedback({ success: 'Organization settings saved and synchronized successfully', error: '' });
      setTimeout(() => setFeedback({ success: '', error: '' }), 3000);
    } catch (err) {
      setFeedback({ error: 'Failed to update company settings', success: '' });
    } finally {
      setSaving(false);
    }
  };

  // Save Profile Settings
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!currentUser?.id) return;

    if (profileData.newPassword) {
      if (profileData.newPassword !== profileData.confirmPassword) {
        setFeedback({ error: 'New password and confirmation do not match', success: '' });
        return;
      }
      if (profileData.newPassword.length < 6) {
        setFeedback({ error: 'Password must be at least 6 characters long', success: '' });
        return;
      }
    }

    setSaving(true);
    try {
      const updatePayload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        jobTitle: profileData.jobTitle,
        location: profileData.location,
        officeAddress: profileData.officeAddress,
      };
      if (profileData.newPassword) {
        updatePayload.password = profileData.newPassword;
      }

      const updatedUserRes = await usersApi.update(currentUser.id, updatePayload);
      
      // Immediately propagate updated user state to AuthContext, localStorage and Navbar
      const fName = updatePayload.firstName || currentUser.firstName || '';
      const lName = updatePayload.lastName || currentUser.lastName || '';
      const updatedUser = {
        ...currentUser,
        ...updatePayload,
        name: (fName + ' ' + lName).trim()
      };
      if (updateUser) {
        updateUser(updatedUser);
      } else {
        localStorage.setItem('exoin_user', JSON.stringify(updatedUser));
      }
      window.dispatchEvent(new CustomEvent('exoin_user_updated', { detail: updatedUser }));

      setFeedback({ success: 'Your profile has been updated and synchronized across all views', error: '' });
      setProfileData(prev => ({ ...prev, newPassword: '', confirmPassword: '', currentPassword: '' }));
      setTimeout(() => setFeedback({ success: '', error: '' }), 3000);
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to update profile', success: '' });
    } finally {
      setSaving(false);
    }
  };

  // Verify SMTP Connection
  const handleVerifySmtp = async () => {
    setVerifyingSmtp(true);
    try {
      const res = await smtpApi.verify();
      setSmtpStatus(res.data);
      if (res.data.success) {
        setFeedback({ success: res.data.message || 'SMTP connection verified successfully', error: '' });
      } else {
        setFeedback({ error: res.data.message || 'SMTP connection failed', success: '' });
      }
      setTimeout(() => setFeedback({ success: '', error: '' }), 4000);
    } catch (err) {
      setFeedback({ error: 'SMTP check request failed', success: '' });
    } finally {
      setVerifyingSmtp(false);
    }
  };

  // Save SMTP Settings
  const handleSaveSmtp = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await smtpApi.updateConfig(smtpConfig);
      setSmtpStatus({
        success: res.data.success,
        message: res.data.message,
        host: res.data.host,
        port: res.data.port
      });
      setFeedback({ success: 'SMTP Gateway settings updated & verified', error: '' });
      setTimeout(() => setFeedback({ success: '', error: '' }), 3500);
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to update SMTP settings', success: '' });
    } finally {
      setSaving(false);
    }
  };

  // Send Diagnostic Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      setFeedback({ error: 'Please enter a recipient email address', success: '' });
      return;
    }
    setSendingTestEmail(true);
    try {
      const res = await smtpApi.sendTestEmail(testEmailRecipient);
      if (res.data.success) {
        setFeedback({ success: `Diagnostic test email dispatched to ${testEmailRecipient}!`, error: '' });
      } else {
        setFeedback({ error: res.data.error || 'Failed to send test email', success: '' });
      }
      setTimeout(() => setFeedback({ success: '', error: '' }), 4500);
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Diagnostic email failed', success: '' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-3 font-medium">Loading settings...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'company', label: 'Organization', icon: Building2 },
    { id: 'tax-banking', label: 'Tax & Banking', icon: CreditCard },
    { id: 'smtp', label: 'Mail Gateway & SMTP', icon: Server },
    { id: 'branding', label: 'Branding & Colors', icon: Palette },
    { id: 'email-hosting', label: 'Domain Hosting', icon: Globe }
  ];

  const currentRoleMeta = ROLES_METADATA[currentUser?.role] || ROLES_METADATA.STAFF;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-36 sm:pb-16">
      {/* Toast Feedback */}
      {feedback.success && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{feedback.success}</span>
        </div>
      )}
      {feedback.error && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{feedback.error}</span>
        </div>
      )}

      {/* Header - Apple Glass Surface */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wider">
              <span>Workspace</span>
              <ChevronRight size={12} className="text-slate-400" />
              <span>Configuration & Preferences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              System Settings & User Profile
            </h1>
            <p className="text-sm text-slate-500">
              Configure personal profile credentials, official corporate entities, taxation coordinates, and SMTP mail transport.
            </p>
          </div>

          {activeTab !== 'email-hosting' && (
            <button
              onClick={activeTab === 'profile' ? handleSaveProfile : (activeTab === 'smtp' ? handleSaveSmtp : handleSaveCompany)}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          )}
        </div>

        {/* iOS Segmented Navigation Pill Switcher */}
        <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 mt-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-98 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-orange-500' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: MY PROFILE & SECURITY                               */}
      {/* ========================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Identity & Role Badge Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${currentRoleMeta.gradient} flex items-center justify-center text-white font-bold text-xl shadow-md`}>
                  {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-xs text-slate-500">{profileData.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentRoleMeta.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentRoleMeta.dot}`}></span>
                      <span>{currentRoleMeta.label}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {currentUser?.company?.name || 'Exoin Africa'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-600 max-w-sm">
                <p className="font-semibold text-slate-800">Role Capabilities:</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{currentRoleMeta.description}</p>
              </div>
            </div>

            {/* Profile Fields */}
            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Job Title / Designation
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={profileData.jobTitle}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="e.g. Chief Executive Officer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Direct Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="0739443244"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    City / Country
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="Nairobi, Kenya"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Office Address
                  </label>
                  <input
                    type="text"
                    name="officeAddress"
                    value={profileData.officeAddress}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="Westlands Supreme Branch"
                  />
                </div>
              </div>

              {/* Password Change Sub-section */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <Key size={16} className="text-orange-500" />
                  <span>Update Account Password</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Leave empty if you do not want to change your current login password.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={profileData.newPassword}
                      onChange={handleProfileChange}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={profileData.confirmPassword}
                      onChange={handleProfileChange}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: ORGANIZATION IDENTITY                               */}
      {/* ========================================================== */}
      {activeTab === 'company' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Corporate Identity & Presence</h2>
                <p className="text-xs text-slate-400">Printed on official invoices, delivery notes, quotes & job cards</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Entity Name</label>
                <input
                  type="text"
                  name="name"
                  value={companyData.name}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tagline / Motto</label>
                <input
                  type="text"
                  name="tagline"
                  value={companyData.tagline}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Official Company Email</label>
                <input
                  type="email"
                  name="email"
                  value={companyData.email}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Official Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={companyData.phone}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Corporate Website</label>
                <input
                  type="text"
                  name="website"
                  value={companyData.website}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Postal Address</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={companyData.addressLine1}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: TAXATION & BANKING COORDINATES                      */}
      {/* ========================================================== */}
      {activeTab === 'tax-banking' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">KRA Tax & Bank Settlement Accounts</h2>
                <p className="text-xs text-slate-400">Coordinates stamped on legal VAT invoices and payment receipts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">KRA PIN Number</label>
                <input
                  type="text"
                  name="vatNumber"
                  value={companyData.vatNumber}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company Registration No</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={companyData.registrationNumber}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={companyData.bankName}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Account Number</label>
                <input
                  type="text"
                  name="bankAccount"
                  value={companyData.bankAccount}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bank Branch</label>
                <input
                  type="text"
                  name="bankBranch"
                  value={companyData.bankBranch}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SWIFT / BIC Code</label>
                <input
                  type="text"
                  name="swiftCode"
                  value={companyData.swiftCode}
                  onChange={handleCompanyChange}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: SMTP MAIL GATEWAY & DIAGNOSTICS                     */}
      {/* ========================================================== */}
      {activeTab === 'smtp' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Status & Diagnostic Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Server size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Corporate SMTP Mail Transport</h2>
                  <p className="text-xs text-slate-400">External mail transfer agent for customer invoicing & notifications</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="http://localhost:8081/account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>Stalwart WebUI</span>
                </a>
                <button
                  type="button"
                  onClick={handleVerifySmtp}
                  disabled={verifyingSmtp}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={14} className={verifyingSmtp ? 'animate-spin' : ''} />
                  <span>Verify Status</span>
                </button>
              </div>
            </div>

            {/* Connection Status Banner */}
            <div className={`mt-4 p-4 rounded-2xl border text-xs flex items-center justify-between ${
              smtpStatus?.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                {smtpStatus?.success ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-amber-600" />}
                <div>
                  <p className="font-semibold text-xs">
                    {smtpStatus?.success ? 'Mail Gateway Active & Operational' : 'SMTP Gateway in Fallback Mode'}
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {smtpStatus?.message || 'Ready for test dispatch'}
                  </p>
                </div>
              </div>
              {smtpStatus?.host && (
                <span className="font-mono text-[11px] px-2 py-0.5 bg-white/60 rounded">
                  {smtpStatus.host}:{smtpStatus.port}
                </span>
              )}
            </div>

            {/* Quick Presets */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setSmtpConfig({
                  host: 'stalwart-mail',
                  port: 465,
                  secure: true,
                  user: 'admin@exoinafrica.com',
                  pass: 'jhoqEX3TrBmqrfi6',
                  fromEmail: 'admin@exoinafrica.com',
                  fromName: 'Exoin Africa'
                })}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Stalwart Mail Server (Active)
              </button>
              <button
                type="button"
                onClick={() => setSmtpConfig({
                  host: 'smtp-relay.brevo.com',
                  port: 587,
                  secure: false,
                  user: '9ce801001@smtp-brevo.com',
                  pass: '',
                  fromEmail: 'admin@exoinafrica.com',
                  fromName: 'Exoin Africa'
                })}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all active:scale-95"
              >
                Brevo Relay
              </button>
              <button
                type="button"
                onClick={() => setSmtpConfig({
                  host: '172.17.0.1',
                  port: 1025,
                  secure: false,
                  user: '',
                  pass: '',
                  fromEmail: 'admin@exoinafrica.com',
                  fromName: 'Exoin Africa'
                })}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all active:scale-95"
              >
                MailHog Local
              </button>
            </div>

            {/* SMTP Configuration Fields */}
            <form onSubmit={handleSaveSmtp} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    SMTP Host / Server Address *
                  </label>
                  <input
                    type="text"
                    name="host"
                    value={smtpConfig.host}
                    onChange={handleSmtpChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="stalwart-mail"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    SMTP Port *
                  </label>
                  <select
                    name="port"
                    value={smtpConfig.port}
                    onChange={handleSmtpChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="465">465 (SMTPS / SSL - Stalwart Default)</option>
                    <option value="587">587 (Submission / STARTTLS)</option>
                    <option value="25">25 (Standard SMTP)</option>
                    <option value="2525">2525 (Alternative)</option>
                    <option value="1025">1025 (Local Relay)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    SMTP Username / Login
                  </label>
                  <input
                    type="text"
                    name="user"
                    value={smtpConfig.user}
                    onChange={handleSmtpChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="admin@exoinafrica.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    SMTP Password / Secret
                  </label>
                  <input
                    type="password"
                    name="pass"
                    value={smtpConfig.pass}
                    onChange={handleSmtpChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Sender From Email
                  </label>
                  <input
                    type="email"
                    name="fromEmail"
                    value={smtpConfig.fromEmail}
                    onChange={handleSmtpChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="admin@exoinafrica.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    name="fromName"
                    value={smtpConfig.fromName}
                    onChange={handleSmtpChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Exoin Africa"
                  />
                </div>
              </div>
            </form>

            {/* Diagnostic Dispatch Section */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Send size={16} className="text-blue-600" />
                <span>Send Diagnostic Test Email</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Send an automated verification test email right now to confirm delivery to external inboxes.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Recipient email address (e.g. test@gmail.com)"
                  className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {sendingTestEmail ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{sendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 5: BRANDING & COLORS                                   */}
      {/* ========================================================== */}
      {activeTab === 'branding' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Brand Palette & Document Styling</h2>
                <p className="text-xs text-slate-400">Controls header accents, button gradients, and PDF themes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Primary Corporate Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="primaryColor"
                    value={companyData.primaryColor}
                    onChange={handleCompanyChange}
                    className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={companyData.primaryColor}
                    onChange={handleCompanyChange}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={companyData.secondaryColor}
                    onChange={handleCompanyChange}
                    className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={companyData.secondaryColor}
                    onChange={handleCompanyChange}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Live Brand Preview Card */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Live Document Header Preview</h3>
              <div 
                className="rounded-2xl p-6 text-white shadow-lg flex items-center justify-between"
                style={{ backgroundColor: companyData.primaryColor }}
              >
                <div>
                  <h4 className="text-xl font-black tracking-tight">{companyData.name}</h4>
                  <p className="text-xs opacity-80 mt-0.5">{companyData.tagline}</p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: companyData.secondaryColor }}
                >
                  Action Accent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 6: DOMAIN HOSTING                                      */}
      {/* ========================================================== */}
      {activeTab === 'email-hosting' && (
        <div className="animate-in fade-in duration-200">
          <EmailHostingSettings />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
