import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Mail, Inbox, Send, FileText, Trash2, AlertCircle, Star, Search, RefreshCw, 
  Paperclip, Reply, ReplyAll, Forward, MoreHorizontal, ChevronLeft, ChevronRight,
  Edit3, X, Loader2, Check, Archive, Clock, Settings, ChevronDown, 
  Eye, EyeOff, Download, Bold, Italic, Underline, Link, List, ListOrdered,
  Smile, Flag, Maximize2, Minimize2, PanelLeftClose, PanelLeft, 
  AlertTriangle, Cloud, CloudOff, Key, CheckCircle2, XCircle, Wifi, HelpCircle,
  SendHorizonal, Timer, CalendarClock
} from 'lucide-react';
import { signatureApi } from '../lib/api';
import { mailApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ComposeModal from '../components/mail/ComposeModal';

// ==========================================
// SETUP SCREEN - Shown when mail not configured
// ==========================================
const MailSetupScreen = ({ onSetupComplete }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();

  const handleTest = async () => {
    if (!password) return;
    setTesting(true);
    setError('');
    setTestResult(null);
    
    try {
      const res = await mailApi.testConnection(password);
      setTestResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Connection failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSetup = async () => {
    if (!password) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await mailApi.setupAccount(password);
      if (res.data.success) {
        onSetupComplete(res.data);
      } else {
        setError(res.data.message || res.data.error || 'Setup failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Setup failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && password && !loading) {
      handleSetup();
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-auto">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-8 sm:px-8 sm:py-10 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-white/10">
                <Mail size={32} className="text-white sm:w-10 sm:h-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Exoin Mail</h1>
              <p className="text-blue-200 mt-2 text-sm sm:text-base">Connect your company mailbox</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Email field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="px-4 py-3.5 bg-slate-100 rounded-xl text-slate-700 font-medium flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-white" />
                </div>
                <span className="truncate">{user?.email}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <Cloud size={12} className="text-green-500" />
                Connected to mail.exoinafrica.com
              </p>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Key size={18} className="text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your email password"
                  className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-green-500" />
                Your password is encrypted and stored securely
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-shake">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Connection Failed</p>
                  <p className="text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Test result */}
            {testResult && (
              <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-green-600" />
                ) : (
                  <XCircle size={18} className="flex-shrink-0 mt-0.5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">{testResult.success ? 'Connection Successful' : 'Connection Failed'}</p>
                  <p className="mt-0.5 opacity-80">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleTest}
                disabled={!password || testing || loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {testing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Wifi size={18} />
                )}
                <span>Test Connection</span>
              </button>
              <button
                onClick={handleSetup}
                disabled={!password || loading || testing}
                className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                <span>Connect & Sync</span>
              </button>
            </div>
          </div>
        </div>

        {/* Help text */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-white/70">
            Having trouble connecting?
          </p>
          <p className="text-xs text-white/50">
            Make sure you're using your email password, not your system password.
            <br className="hidden sm:block" />
            Contact your IT administrator for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// EMAIL AVATAR
// ==========================================
const EmailAvatar = ({ name, email, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : email?.[0]?.toUpperCase() || '?';
  const colors = [
    'from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-green-500 to-green-600',
    'from-orange-500 to-orange-600', 'from-pink-500 to-pink-600', 'from-teal-500 to-teal-600',
  ];
  const colorIndex = (name || email || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
};

// ==========================================
// EMAIL TEMPLATES
// ==========================================
const EMAIL_TEMPLATES = [
  {
    id: 'invoice-reminder',
    name: 'Invoice Reminder',
    subject: 'Friendly Reminder: Invoice Due',
    body: `Dear Client,

I hope this message finds you well. This is a friendly reminder that invoice #[INVOICE_NUMBER] with an outstanding balance of KES [AMOUNT] is due on [DUE_DATE].

If you have already made the payment, please disregard this message. Otherwise, we kindly request that you process the payment at your earliest convenience.

If you have any questions regarding this invoice, please don't hesitate to reach out.

Thank you for your business.

Best regards`
  },
  {
    id: 'quotation-followup',
    name: 'Quotation Follow-up',
    subject: 'Following Up on Our Quotation',
    body: `Dear Client,

I hope you're doing well. I wanted to follow up on the quotation we sent recently and see if you have any questions or require any clarifications.

We're happy to discuss any adjustments or provide additional information that might help you make a decision.

Please let me know if there's anything I can assist you with.

Looking forward to hearing from you.

Best regards`
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    subject: 'Thank You for Your Business',
    body: `Dear Client,

Thank you for choosing Exoin Africa for your business needs. We truly appreciate your trust in our services.

If there's anything more we can do to assist you, please don't hesitate to reach out. We look forward to serving you again in the future.

Warm regards`
  },
  {
    id: 'project-update',
    name: 'Project Update',
    subject: 'Project Status Update',
    body: `Dear Client,

I wanted to provide you with an update on the current status of your project.

**Progress:**
- [Update 1]
- [Update 2]

**Next Steps:**
- [Next step 1]
- [Next step 2]

If you have any questions or concerns, please feel free to reach out.

Best regards`
  },
  {
    id: 'meeting-request',
    name: 'Meeting Request',
    subject: 'Meeting Request: [Topic]',
    body: `Dear Client,

I hope this message finds you well. I would like to schedule a meeting to discuss [topic].

Would any of the following times work for you?
- [Option 1]
- [Option 2]
- [Option 3]

Please let me know your availability, and I'll send a calendar invite.

Best regards`
  }
];

// Local ComposeModal removed in favor of shared component


// ==========================================
// EMAIL LIST ITEM
// ==========================================
const EmailListItem = ({ email, selected, onSelect, onStar }) => (
  <div
    onClick={() => onSelect(email)}
    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-700 ${
      selected ? 'bg-orange-50 dark:bg-orange-900/20 border-l-2 border-l-orange-500' : 
      !email.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
    }`}
  >
    <button
      onClick={(e) => { e.stopPropagation(); onStar(email.id, !email.isStarred); }}
      className={`transition-colors flex-shrink-0 ${email.isStarred ? 'text-yellow-500' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-500'}`}
    >
      <Star size={16} className="sm:w-[18px] sm:h-[18px]" fill={email.isStarred ? 'currentColor' : 'none'} />
    </button>
    
    <EmailAvatar name={email.from.name} email={email.from.address} size="sm" className="flex-shrink-0" />
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1 sm:gap-2">
        <span className={`truncate text-sm sm:text-base ${!email.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
          {email.from.name || email.from.address}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {email.hasAttachments && <Paperclip size={12} className="sm:w-[14px] sm:h-[14px] text-slate-400 dark:text-slate-500" />}
          {email.priority === 'high' && <Flag size={12} className="sm:w-[14px] sm:h-[14px] text-red-500" />}
        </div>
      </div>
      <div className="flex items-baseline gap-1 sm:gap-2">
        <span className={`truncate text-xs sm:text-sm ${!email.isRead ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
          {email.subject || '(No subject)'}
        </span>
        <span className="text-slate-400 dark:text-slate-500 text-xs truncate flex-1 hidden sm:inline">— {email.snippet}</span>
      </div>
      {/* Mobile snippet - shown on separate line */}
      <span className="text-slate-400 dark:text-slate-500 text-xs truncate block sm:hidden mt-0.5">{email.snippet}</span>
    </div>
    
    <span className={`text-[10px] sm:text-xs flex-shrink-0 ${!email.isRead ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
      {formatDate(email.date)}
    </span>
  </div>
);

// ==========================================
// OUTBOX LIST ITEM
// ==========================================
const OutboxListItem = ({ email, onCancel }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      case 'SENDING': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
        <SendHorizonal size={16} className="sm:w-[18px] sm:h-[18px]" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm sm:text-base font-medium text-slate-900 dark:text-white">
            To: {email.to?.join(', ') || 'Unknown'}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(email.status)}`}>
            {email.status}
          </span>
        </div>
        <div className="flex items-baseline gap-1 sm:gap-2">
          <span className="truncate text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {email.subject || '(No subject)'}
          </span>
        </div>
        {email.timeRemaining && (
          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
            <Clock size={12} />
            <span>Sending in {email.timeRemaining}</span>
          </div>
        )}
      </div>
      
      <button
        onClick={() => onCancel(email.id)}
        className="p-1.5 sm:p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
        title="Cancel"
      >
        <X size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
    </div>
  );
};

// ==========================================
// SCHEDULED LIST ITEM
// ==========================================
const ScheduledListItem = ({ email, onCancel }) => (
  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0">
      <CalendarClock size={16} className="sm:w-[18px] sm:h-[18px]" />
    </div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="truncate text-sm sm:text-base font-medium text-slate-900 dark:text-white">
          To: {email.to?.join(', ') || 'Unknown'}
        </span>
      </div>
      <div className="flex items-baseline gap-1 sm:gap-2">
        <span className="truncate text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {email.subject || '(No subject)'}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400">
        <CalendarClock size={12} />
        <span>Scheduled for {new Date(email.sendAt).toLocaleString()}</span>
      </div>
    </div>
    
    <button
      onClick={() => onCancel(email.id)}
      className="p-1.5 sm:p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
      title="Cancel scheduled send"
    >
      <X size={16} className="sm:w-[18px] sm:h-[18px]" />
    </button>
  </div>
);

// ==========================================
// EMAIL DETAIL VIEW
// ==========================================
const EmailDetailView = ({ email, onClose, onReply, onForward, onDelete, onMove, onStar }) => {
  if (!email) return null;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Toolbar - More compact on mobile */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400" title="Back">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => onMove('ARCHIVE')} className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hidden xs:block" title="Archive">
            <Archive size={18} />
          </button>
          <button onClick={() => onMove('SPAM')} className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hidden sm:block" title="Spam">
            <AlertTriangle size={18} />
          </button>
          <button onClick={onDelete} className="p-1.5 sm:p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600" title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={() => onStar(email.id, !email.isStarred)}
            className={`p-1.5 sm:p-2 rounded-lg ${email.isStarred ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
            title="Star"
          >
            <Star size={18} fill={email.isStarred ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onReply} className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400" title="Reply">
            <Reply size={18} />
          </button>
          <button onClick={onForward} className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400" title="Forward">
            <Forward size={18} />
          </button>
        </div>
      </div>

      {/* Header - Responsive layout */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <EmailAvatar name={email.from.name} email={email.from.address} size="lg" className="hidden sm:flex" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-1 leading-tight">{email.subject || '(No subject)'}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <EmailAvatar name={email.from.name} email={email.from.address} size="sm" className="sm:hidden flex-shrink-0" />
                <div className="text-sm min-w-0">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{email.from.name || email.from.address}</span>
                  <span className="text-slate-400 dark:text-slate-500 hidden sm:inline ml-1">&lt;{email.from.address}&gt;</span>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 ml-auto sm:ml-0">
                {new Date(email.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
              To: {email.to?.map(t => t.address).join(', ')}
              {email.cc?.length > 0 && <span className="ml-2 sm:ml-3">Cc: {email.cc.map(t => t.address).join(', ')}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-white dark:bg-slate-900">
        {email.html ? (
          <div 
            className="prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none overflow-x-auto
              dark:prose-headings:text-slate-100 dark:prose-p:text-slate-300
              dark:prose-a:text-orange-400 dark:prose-strong:text-slate-100
              email-content-dark" 
            dangerouslySetInnerHTML={{ __html: email.html }} 
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-slate-700 dark:text-slate-300">{email.text}</pre>
        )}
      </div>

      {/* Attachments */}
      {email.attachments?.length > 0 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 sm:mb-3 flex items-center gap-2">
            <Paperclip size={14} className="sm:w-4 sm:h-4 text-slate-400" />
            {email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}
          </h4>
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm hover:border-orange-300 dark:hover:border-orange-500 cursor-pointer">
                <FileText size={14} className="text-slate-400 dark:text-slate-500 sm:w-4 sm:h-4" />
                <span className="text-slate-700 dark:text-slate-200 max-w-[100px] sm:max-w-none truncate">{att.filename}</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs hidden sm:inline">({formatSize(att.size)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply buttons - Stack on mobile */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onReply} className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
            <Reply size={16} className="sm:w-[18px] sm:h-[18px]" /> 
            <span>Reply</span>
          </button>
          <button onClick={onForward} className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
            <Forward size={16} className="sm:w-[18px] sm:h-[18px]" /> 
            <span>Forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// HELPERS
// ==========================================
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  if (date.getFullYear() === now.getFullYear()) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const FOLDER_ICONS = {
  INBOX: Inbox, SENT: Send, DRAFTS: FileText, TRASH: Trash2, SPAM: AlertCircle, ARCHIVE: Archive,
  OUTBOX: SendHorizonal, SCHEDULED: CalendarClock
};

// ==========================================
// MAIN MAIL PAGE
// ==========================================
const MailPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('INBOX');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardEmail, setForwardEmail] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [composeDefaults, setComposeDefaults] = useState(null);
  const [outboxEmails, setOutboxEmails] = useState([]);
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [signatureHtml, setSignatureHtml] = useState('');
  const [signatureEnabled, setSignatureEnabled] = useState(false);

  // Handle URL params for compose (e.g., from Document View)
  useEffect(() => {
    const compose = searchParams.get('compose');
    if (compose === 'true') {
      const to = searchParams.get('to') || '';
      const subject = searchParams.get('subject') || '';
      const body = searchParams.get('body') || '';
      const attachDoc = searchParams.get('attachDoc') || null;
      setComposeDefaults({ to, subject, body, attachDocumentId: attachDoc });
      setComposeOpen(true);
      // Clear URL params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Check account status on mount
  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const res = await mailApi.getAccountStatus();
      setAccountStatus(res.data);
      if (res.data.configured) {
        await loadMail();
      }
    } catch (err) {
      console.error('Failed to check account status:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMail = async () => {
    try {
      await Promise.all([fetchFolders(), fetchMessages(), fetchOutbox(), fetchScheduled(), fetchSignature()]);
    } catch (err) {
      console.error('Failed to load mail:', err);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await mailApi.getFolders();
      setFolders(res.data.folders);
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  };

  const fetchOutbox = async () => {
    try {
      const res = await mailApi.getOutbox();
      setOutboxEmails(res.data.emails || []);
    } catch (err) {
      console.error('Failed to fetch outbox:', err);
    }
  };

  const fetchScheduled = async () => {
    try {
      const res = await mailApi.getScheduled();
      setScheduledEmails(res.data.emails || []);
    } catch (err) {
      console.error('Failed to fetch scheduled:', err);
    }
  };

  const fetchSignature = async () => {
    try {
      const res = await signatureApi.get();
      if (res.data) {
        setSignatureEnabled(res.data.signatureEnabled || false);
        if (res.data.signatureEnabled) {
          const sigRes = await signatureApi.getHtml();
          setSignatureHtml(sigRes.data.html || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch signature:', err);
    }
  };

  const fetchMessages = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await mailApi.getMessages(selectedFolder, pagination.page, pagination.limit, searchQuery || undefined);
      setMessages(res.data.messages);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await mailApi.quickSync();
      if (res.data.success) {
        setLastSync(new Date());
        await loadMail();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectEmail = async (email) => {
    try {
      const res = await mailApi.getMessage(email.id);
      setSelectedEmail(res.data);
      if (!email.isRead) {
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, isRead: true } : m));
      }
    } catch (err) {
      console.error('Failed to fetch email:', err);
    }
  };

  const handleStar = async (id, isStarred) => {
    try {
      await mailApi.star(id, isStarred);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isStarred } : m));
      if (selectedEmail?.id === id) setSelectedEmail(prev => ({ ...prev, isStarred }));
    } catch (err) {
      console.error('Failed to star email:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmail) return;
    try {
      await mailApi.delete(selectedEmail.id);
      setSelectedEmail(null);
      fetchMessages(false);
      fetchFolders();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleMove = async (folder) => {
    if (!selectedEmail) return;
    try {
      await mailApi.move(selectedEmail.id, folder);
      setSelectedEmail(null);
      fetchMessages(false);
      fetchFolders();
    } catch (err) {
      console.error('Failed to move:', err);
    }
  };

  const handleCancelOutbox = async (outboxId) => {
    try {
      await mailApi.undoSend(outboxId);
      await fetchOutbox();
    } catch (err) {
      console.error('Failed to cancel outbox email:', err);
    }
  };

  const handleCancelScheduled = async (outboxId) => {
    try {
      await mailApi.cancelScheduled(outboxId);
      await fetchScheduled();
    } catch (err) {
      console.error('Failed to cancel scheduled email:', err);
    }
  };

  const handleSendEmail = async (data) => {
    console.log('MailPage.handleSendEmail: Called with data:', data);
    try {
      console.log('MailPage.handleSendEmail: Calling mailApi.send...');
      const res = await mailApi.send({ ...data, includeSignature: true });
      console.log('MailPage.handleSendEmail: API response:', res.data);
      if (res.data.success) {
        console.log('MailPage.handleSendEmail: Success, refreshing...');
        fetchMessages(false);
        fetchFolders();
      }
      return res.data;
    } catch (error) {
      console.error('MailPage.handleSendEmail: Error:', error.response?.data || error.message || error);
      throw error;
    }
  };

  const handleSetupComplete = async () => {
    setAccountStatus({ configured: true });
    await loadMail();
  };

  useEffect(() => {
    if (accountStatus?.configured) {
      fetchMessages();
      setSelectedEmail(null);
    }
  }, [selectedFolder]);

  useEffect(() => {
    if (accountStatus?.configured && searchQuery !== undefined) {
      const timeout = setTimeout(() => fetchMessages(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery]);

  // Auto-sync every 2 minutes
  useEffect(() => {
    if (!accountStatus?.configured) return;
    const interval = setInterval(handleSync, 120000);
    return () => clearInterval(interval);
  }, [accountStatus?.configured]);

  if (loading && !accountStatus) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!accountStatus?.configured) {
    return (
      <div className="h-[calc(100vh-7rem)]">
        <MailSetupScreen onSetupComplete={handleSetupComplete} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 sm:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar - Slide-out drawer on mobile */}
      <div className={`
        ${sidebarCollapsed 
          ? 'w-14 sm:w-16' 
          : 'fixed sm:relative left-0 top-0 bottom-0 w-64 sm:w-56 lg:w-64 z-30 sm:z-0'
        } 
        border-r border-slate-200 dark:border-slate-700 flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 transition-all duration-200
        ${sidebarCollapsed ? 'flex' : 'flex'}
      `}>
        {/* Close button for mobile drawer */}
        {!sidebarCollapsed && (
          <div className="sm:hidden absolute right-2 top-2 z-10">
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Header */}
        {!sidebarCollapsed && (
          <div className="px-3 lg:px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white">Exoin Mail</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Compose */}
        <div className="p-2 sm:p-3">
          <button
            onClick={() => { setComposeOpen(true); setReplyTo(null); setForwardEmail(null); }}
            className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-lg shadow-orange-500/25 ${sidebarCollapsed ? 'px-2' : ''}`}
          >
            <Edit3 size={18} />
            {!sidebarCollapsed && <span className="hidden sm:inline">Compose</span>}
          </button>
        </div>

        {/* Folders */}
        <nav className="flex-1 px-1 sm:px-2 py-2 space-y-1 overflow-y-auto">
          {folders.map((folder) => {
            const Icon = FOLDER_ICONS[folder.path] || Mail;
            return (
              <button
                key={folder.path}
                onClick={() => setSelectedFolder(folder.path)}
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-sm transition-all ${
                  selectedFolder === folder.path
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-medium shadow-sm border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon size={18} className={selectedFolder === folder.path ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    {folder.unseen > 0 && (
                      <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                        selectedFolder === folder.path ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {folder.unseen}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
          
          {/* Divider */}
          {(outboxEmails.length > 0 || scheduledEmails.length > 0) && (
            <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
          )}
          
          {/* Outbox - Pending emails */}
          {outboxEmails.length > 0 && (
            <button
              onClick={() => setSelectedFolder('OUTBOX')}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-sm transition-all ${
                selectedFolder === 'OUTBOX'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-medium shadow-sm border border-slate-200 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <SendHorizonal size={18} className={selectedFolder === 'OUTBOX' ? 'text-orange-500 dark:text-orange-400' : 'text-amber-500'} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">Outbox</span>
                  <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400`}>
                    {outboxEmails.length}
                  </span>
                </>
              )}
            </button>
          )}
          
          {/* Scheduled emails */}
          {scheduledEmails.length > 0 && (
            <button
              onClick={() => setSelectedFolder('SCHEDULED')}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-sm transition-all ${
                selectedFolder === 'SCHEDULED'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-medium shadow-sm border border-slate-200 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <CalendarClock size={18} className={selectedFolder === 'SCHEDULED' ? 'text-orange-500 dark:text-orange-400' : 'text-blue-500'} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">Scheduled</span>
                  <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400`}>
                    {scheduledEmails.length}
                  </span>
                </>
              )}
            </button>
          )}
        </nav>

        {/* Sync button */}
        <div className="p-2 sm:p-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`w-full flex items-center justify-center gap-2 px-2 sm:px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-sm ${sidebarCollapsed ? '' : ''}`}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {!sidebarCollapsed && <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync'}</span>}
          </button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-2 sm:px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors mt-1"
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar toggle - improved positioning */}
      <div className="sm:hidden fixed left-4 bottom-4 z-40">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/30 transition-all"
        >
          {sidebarCollapsed ? <PanelLeft size={22} /> : <PanelLeftClose size={22} />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search bar */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm bg-slate-100 dark:bg-slate-800 dark:text-white border border-transparent rounded-lg sm:rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={16} />
              </button>
            )}
          </div>
          <button onClick={() => fetchMessages(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Email list / detail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email list */}
          <div className={`${selectedEmail ? 'hidden lg:flex w-80 xl:w-96 border-r border-slate-200 dark:border-slate-700' : 'flex-1'} flex-col bg-white dark:bg-slate-900`}>
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {selectedFolder === 'OUTBOX' ? 'Outbox' : selectedFolder === 'SCHEDULED' ? 'Scheduled' : (folders.find(f => f.path === selectedFolder)?.name || 'Inbox')}
                {selectedFolder === 'OUTBOX' && <span className="ml-2 text-slate-400 dark:text-slate-500">({outboxEmails.length})</span>}
                {selectedFolder === 'SCHEDULED' && <span className="ml-2 text-slate-400 dark:text-slate-500">({scheduledEmails.length})</span>}
                {selectedFolder !== 'OUTBOX' && selectedFolder !== 'SCHEDULED' && pagination.total > 0 && <span className="ml-2 text-slate-400 dark:text-slate-500">({pagination.total})</span>}
              </span>
              {selectedFolder !== 'OUTBOX' && selectedFolder !== 'SCHEDULED' && pagination.pages > 1 && (
                <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                  <span className="hidden sm:inline">{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-600">of</span>
                  <span className="hidden sm:inline">{pagination.total}</span>
                  <span className="sm:hidden">{pagination.page}/{pagination.pages}</span>
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={pagination.page <= 1}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                    disabled={pagination.page >= pagination.pages}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && selectedFolder !== 'OUTBOX' && selectedFolder !== 'SCHEDULED' ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="animate-spin text-orange-500" size={32} />
                </div>
              ) : selectedFolder === 'OUTBOX' ? (
                // Outbox emails
                outboxEmails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 px-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center mb-4">
                      <SendHorizonal size={32} className="text-amber-500" />
                    </div>
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No pending emails</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
                      Emails waiting to be sent will appear here
                    </p>
                  </div>
                ) : (
                  outboxEmails.map((email) => (
                    <OutboxListItem
                      key={email.id}
                      email={email}
                      onCancel={handleCancelOutbox}
                    />
                  ))
                )
              ) : selectedFolder === 'SCHEDULED' ? (
                // Scheduled emails
                scheduledEmails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 px-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center mb-4">
                      <CalendarClock size={32} className="text-blue-500" />
                    </div>
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No scheduled emails</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
                      Schedule emails to send later
                    </p>
                  </div>
                ) : (
                  scheduledEmails.map((email) => (
                    <ScheduledListItem
                      key={email.id}
                      email={email}
                      onCancel={handleCancelScheduled}
                    />
                  ))
                )
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 px-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                    <Mail size={32} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No emails</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
                    {selectedFolder === 'INBOX' ? 'Your inbox is empty' : `No emails in ${selectedFolder.toLowerCase()}`}
                  </p>
                  <button
                    onClick={handleSync}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <RefreshCw size={16} />
                    Sync Now
                  </button>
                </div>
              ) : (
                messages.map((msg) => (
                  <EmailListItem
                    key={msg.id}
                    email={msg}
                    selected={selectedEmail?.id === msg.id}
                    onSelect={handleSelectEmail}
                    onStar={handleStar}
                  />
                ))
              )}
            </div>
          </div>

          {/* Email detail */}
          {selectedEmail ? (
            <EmailDetailView
              email={selectedEmail}
              onClose={() => setSelectedEmail(null)}
              onReply={() => { setReplyTo(selectedEmail); setComposeOpen(true); }}
              onForward={() => { setForwardEmail(selectedEmail); setComposeOpen(true); }}
              onDelete={handleDelete}
              onMove={handleMove}
              onStar={handleStar}
            />
          ) : (
            !loading && messages.length > 0 && (
              <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-900/10 to-orange-500/10 flex items-center justify-center mb-6">
                  <Mail size={48} className="text-blue-900/60" />
                </div>
                <p className="text-xl font-semibold text-slate-700">Exoin Mail</p>
                <p className="text-sm mt-2 text-slate-500">Select an email to read</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Compose modal */}
      <ComposeModal
        isOpen={composeOpen}
        onClose={() => { setComposeOpen(false); setReplyTo(null); setForwardEmail(null); setComposeDefaults(null); }}
        replyTo={replyTo}
        forwardEmail={forwardEmail}
        onSend={handleSendEmail}
        defaults={composeDefaults}
      />
    </div>
  );
};

export default MailPage;
