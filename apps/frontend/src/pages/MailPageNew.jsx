import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Mail, Edit3, RefreshCw, ChevronLeft, ChevronRight, Loader2, 
  PanelLeftClose, PanelLeft, Settings, Check, X, Key, 
  CheckCircle2, XCircle, Wifi, Keyboard, MoreHorizontal,
  Inbox, ChevronDown, Trash2, Archive, Sun, Moon, MessageSquare,
  Palmtree, LayoutGrid, Calendar, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { mailApi } from '../lib/api';
import { useMailStore } from '../stores/mailStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Import mail components
import { 
  SearchBar, 
  FolderTree, 
  EmailList, 
  EmailPreview,
  EmailThread,
  KeyboardShortcutsModal,
  ThemeToggle,
  ComposeModal,
  UndoSendToast,
  SnoozeModal,
  PriorityInbox,
  ScheduleSendModal,
  ScheduledEmailsList,
  SmartReply,
  EmailSummary,
  TemplatesPanel,
  VacationResponder,
} from '../components/mail';

// ==========================================
// SETUP SCREEN - Shown when mail not configured
// ==========================================
const MailSetupScreen = ({ onSetupComplete }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);
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
      setError(err.response?.data?.message || 'Connection failed');
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
        setError(res.data.message || 'Setup failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Exoin Mail</h1>
            <p className="text-blue-200 mt-1">Connect your mailbox</p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-medium">
                {user?.email}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Connected to mail.exoinafrica.com</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Key size={14} className="inline mr-1" />
                Email Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your email password"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder-slate-400"
              />
              <p className="text-xs text-slate-500 mt-1">Your password is encrypted and stored securely</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                <XCircle size={16} />
                {error}
              </div>
            )}

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                testResult.success 
                  ? 'bg-green-50 border border-green-100 text-green-600' 
                  : 'bg-red-50 border border-red-100 text-red-600'
              }`}>
                {testResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {testResult.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleTest}
                disabled={!password || testing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {testing ? <Loader2 size={18} className="animate-spin" /> : <Wifi size={18} />}
                Test
              </button>
              <button
                onClick={handleSetup}
                disabled={!password || loading}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all font-medium shadow-lg shadow-orange-500/25"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Connect & Sync
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Having trouble? Contact your IT administrator
        </p>
      </div>
    </div>
  );
};

// ==========================================
// EMAIL TEMPLATES (for compose modal)
// ==========================================
const EMAIL_TEMPLATES = [
  {
    id: 'invoice-reminder',
    name: 'Invoice Reminder',
    subject: 'Friendly Reminder: Invoice Due',
    body: `Dear Client,

I hope this message finds you well. This is a friendly reminder that invoice #[INVOICE_NUMBER] with an outstanding balance of KES [AMOUNT] is due on [DUE_DATE].

If you have already made the payment, please disregard this message. Otherwise, we kindly request that you process the payment at your earliest convenience.

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

Looking forward to hearing from you.

Best regards`
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    subject: 'Thank You for Your Business',
    body: `Dear Client,

Thank you for choosing Exoin Africa for your business needs. We truly appreciate your trust in our services.

If there's anything more we can do to assist you, please don't hesitate to reach out.

Warm regards`
  },
];

// ==========================================
// BULK ACTIONS BAR
// ==========================================
const BulkActionsBar = ({ count, onArchive, onDelete, onMarkRead, onMarkUnread, onClear }) => {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {count} selected
      </span>
      <div className="flex items-center gap-1">
        <button onClick={onArchive} className="px-3 py-1.5 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors">
          Archive
        </button>
        <button onClick={onDelete} className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
          Delete
        </button>
        <button onClick={onMarkRead} className="px-3 py-1.5 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors">
          Mark read
        </button>
        <button onClick={onMarkUnread} className="px-3 py-1.5 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors">
          Mark unread
        </button>
      </div>
      <button onClick={onClear} className="ml-auto p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded text-blue-600 dark:text-blue-400">
        <X size={16} />
      </button>
    </div>
  );
};

// ==========================================
// MAIN MAIL PAGE
// ==========================================
const MailPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState(null);
  
  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // New feature state
  const [showScheduleSendModal, setShowScheduleSendModal] = useState(false);
  const [scheduleEmailData, setScheduleEmailData] = useState(null);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const [showVacationResponder, setShowVacationResponder] = useState(false);
  const [showPriorityInbox, setShowPriorityInbox] = useState(false);
  const [showScheduledList, setShowScheduledList] = useState(false);
  
  // Get state and actions from mail store
  const {
    accountStatus, isConfigured, folders, emails, selectedFolder, selectedEmail,
    selectedEmailId, loadingEmails, loadingEmail, pagination, searchQuery,
    syncing, sidebarCollapsed, settings, labels, composeOpen, replyTo, forwardEmail,
    composeDefaults, selectedEmailIds, selectMode, showKeyboardShortcuts,
    recentSearches, savedSearches, threadMessages, loadingThread, searchSuggestions,
    pendingOutboxId, showUndoToast,
    // Actions
    setAccountStatus, fetchFolders, fetchEmails, fetchEmail, setSelectedFolder,
    starEmail, deleteEmail, archiveEmail, markAsRead, moveEmail, 
    selectNextEmail, selectPreviousEmail, toggleSelectEmail, clearSelection,
    bulkAction, sync, toggleSidebar, openCompose, closeCompose, sendEmail,
    toggleKeyboardShortcuts, setSearchQuery, search, saveSearch, 
    removeSavedSearch, clearRecentSearches, goToPage, nextPage, prevPage,
    addLabelToEmail, removeLabelFromEmail, updateSettings, fetchSearchSuggestions,
    sendEmailWithUndo, cancelScheduledEmail, snoozeEmail, fetchSnoozedEmails,
  } = useMailStore();

  // Initialize on mount
  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const res = await mailApi.getAccountStatus();
      setAccountStatus(res.data);
      if (res.data.configured) {
        await fetchFolders();
        await fetchEmails();
      }
    } catch (err) {
      console.error('Failed to check account status:', err);
    }
  };

  // Handle URL params for compose
  useEffect(() => {
    const compose = searchParams.get('compose');
    if (compose === 'true') {
      const to = searchParams.get('to') || '';
      const subject = searchParams.get('subject') || '';
      const body = searchParams.get('body') || '';
      const attachDoc = searchParams.get('attachDoc') || null;
      openCompose({ defaults: { to, subject, body, attachDocumentId: attachDoc } });
      setSearchParams({});
    }
  }, [searchParams]);

  // Refresh emails when folder changes
  useEffect(() => {
    if (isConfigured) {
      if (selectedFolder === 'SNOOZED') {
        fetchSnoozedEmails();
      } else {
        fetchEmails();
      }
    }
  }, [selectedFolder, isConfigured]);

  // Auto-sync every 2 minutes
  useEffect(() => {
    if (!isConfigured) return;
    const interval = setInterval(sync, 120000);
    return () => clearInterval(interval);
  }, [isConfigured]);

  // Keyboard shortcuts
  const shortcutHandlers = useMemo(() => ({
    nextEmail: selectNextEmail,
    previousEmail: selectPreviousEmail,
    openEmail: () => {
      if (emails.length > 0 && !selectedEmail) {
        fetchEmail(emails[0].id);
      }
    },
    backToList: () => useMailStore.setState({ selectedEmail: null, selectedEmailId: null }),
    closeOrCancel: () => {
      if (composeOpen) closeCompose();
      else if (selectedEmail) useMailStore.setState({ selectedEmail: null, selectedEmailId: null });
    },
    compose: () => openCompose(),
    reply: () => selectedEmail && openCompose({ replyTo: selectedEmail }),
    replyAll: () => selectedEmail && openCompose({ replyTo: selectedEmail }),
    forward: () => selectedEmail && openCompose({ forward: selectedEmail }),
    archive: () => selectedEmail && archiveEmail(selectedEmail.id),
    delete: () => selectedEmail && deleteEmail(selectedEmail.id),
    toggleStar: () => selectedEmail && starEmail(selectedEmail.id, !selectedEmail.isStarred),
    markUnread: () => selectedEmail && markAsRead(selectedEmail.id, false),
    markRead: () => selectedEmail && markAsRead(selectedEmail.id, true),
    focusSearch: () => searchInputRef.current?.focus(),
    showHelp: toggleKeyboardShortcuts,
    goToInbox: () => setSelectedFolder('INBOX'),
    goToStarred: () => setSelectedFolder('STARRED'),
    goToSent: () => setSelectedFolder('SENT'),
    goToDrafts: () => setSelectedFolder('DRAFTS'),
    goToArchive: () => setSelectedFolder('ARCHIVE'),
    toggleSelect: () => selectedEmail && toggleSelectEmail(selectedEmail.id),
    selectAll: () => useMailStore.setState({ 
      selectedEmailIds: emails.map(e => e.id), 
      selectMode: true 
    }),
    selectNone: clearSelection,
  }), [emails, selectedEmail, composeOpen]);

  useKeyboardShortcuts(shortcutHandlers, { 
    enabled: settings.keyboardShortcuts && !composeOpen 
  });

  // Handlers
  const handleSelectEmail = async (email) => {
    await fetchEmail(email.id);
  };

  const handleSendEmail = async (data) => {
    const res = await sendEmail(data);
    return res;
  };

  const handleSendWithUndo = async (data, delaySeconds) => {
    return await sendEmailWithUndo(data, delaySeconds);
  };

  const handleUndoSend = async (outboxId) => {
    return await cancelScheduledEmail(outboxId);
  };

  const handleOpenSnooze = (email) => {
    setSnoozeTarget(email || selectedEmail);
    setShowSnoozeModal(true);
  };

  const handleSnooze = async (preset, customTime) => {
    if (!snoozeTarget) return;
    await snoozeEmail(snoozeTarget.id, preset, customTime);
    setShowSnoozeModal(false);
    setSnoozeTarget(null);
  };

  const handleSetupComplete = async () => {
    setAccountStatus({ configured: true });
    await fetchFolders();
    await fetchEmails();
  };

  const handleQuickAction = async (action, email) => {
    switch (action) {
      case 'archive': await archiveEmail(email.id); break;
      case 'delete': await deleteEmail(email.id); break;
      case 'markRead': await markAsRead(email.id, true); break;
      case 'markUnread': await markAsRead(email.id, false); break;
    }
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      search(query);
    } else {
      setSearchQuery('');
      fetchEmails();
    }
  };

  // Loading state
  if (!accountStatus) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  // Setup screen
  if (!isConfigured) {
    return (
      <div className="h-[calc(100vh-7rem)]">
        <MailSetupScreen onSetupComplete={handleSetupComplete} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-7rem)] flex bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - Mobile: overlay, Desktop: inline */}
      <div className={`
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        w-72 lg:w-auto
        border-r border-slate-200 dark:border-slate-700 
        flex flex-col 
        bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 
        transition-all duration-300 ease-in-out
        shadow-xl lg:shadow-none
      `}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 lg:hidden">
          <span className="text-lg font-semibold text-slate-800 dark:text-white">Mail Folders</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Compose Button */}
        <div className="p-2 sm:p-3">
          <button
            onClick={() => {
              openCompose();
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-lg shadow-orange-500/25 text-sm sm:text-base ${sidebarCollapsed && !mobileMenuOpen ? 'lg:px-2' : ''}`}
          >
            <Edit3 size={18} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Compose</span>}
          </button>
        </div>

        {/* Folder Tree */}
        <FolderTree
          folders={[
            ...folders,
            { path: 'SNOOZED', name: 'Snoozed', unseen: 0 }
          ]}
          labels={labels}
          selectedFolder={selectedFolder}
          collapsed={sidebarCollapsed && !mobileMenuOpen}
          onFolderSelect={(folder) => {
            setSelectedFolder(folder);
            setMobileMenuOpen(false);
          }}
          onLabelSelect={(labelId) => {
            setSearchQuery(`label:${labelId}`);
            search(`label:${labelId}`);
            setMobileMenuOpen(false);
          }}
          userEmail={user?.email}
        />

        {/* Footer buttons */}
        <div className="p-2 sm:p-3 border-t border-slate-100 dark:border-slate-700 space-y-1 mt-auto">
          <button
            onClick={() => {
              sync();
              setMobileMenuOpen(false);
            }}
            disabled={syncing}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors text-sm`}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>{syncing ? 'Syncing...' : 'Sync'}</span>}
          </button>
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search bar */}
        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 lg:hidden"
          >
            <Menu size={20} />
          </button>
          
          {/* Back button on mobile when email is selected */}
          {selectedEmail && (
            <button
              onClick={() => useMailStore.setState({ selectedEmail: null, selectedEmailId: null })}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          
          <SearchBar
            ref={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            onClear={() => { setSearchQuery(''); fetchEmails(); }}
            recentSearches={recentSearches}
            savedSearches={savedSearches}
            onSaveSearch={saveSearch}
            onRemoveSavedSearch={removeSavedSearch}
            onClearRecentSearches={clearRecentSearches}
            onFetchSuggestions={fetchSearchSuggestions}
            apiSuggestions={searchSuggestions}
            className="flex-1 max-w-2xl"
          />
          <div className="hidden sm:flex items-center gap-1">
            <ThemeToggle />
            <button 
              onClick={() => updateSettings({ conversationView: !settings.conversationView })}
              className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${
                settings.conversationView 
                  ? 'text-orange-500' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title={settings.conversationView ? 'Conversation view on' : 'Conversation view off'}
            >
              <MessageSquare size={18} />
            </button>
            <button onClick={() => fetchEmails(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={() => setShowPriorityInbox(!showPriorityInbox)}
              className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${
                showPriorityInbox 
                  ? 'text-orange-500' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Priority Inbox"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setShowScheduledList(!showScheduledList)}
              className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${
                showScheduledList 
                  ? 'text-orange-500' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Scheduled Emails"
            >
              <Calendar size={18} />
            </button>
            <button 
              onClick={() => setShowVacationResponder(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400"
              title="Vacation Responder"
            >
              <Palmtree size={18} />
            </button>
            <button 
              onClick={toggleKeyboardShortcuts} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard size={18} />
            </button>
          </div>
          
          {/* Mobile more menu */}
          <button 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 sm:hidden"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Bulk actions bar */}
        <BulkActionsBar
          count={selectedEmailIds.length}
          onArchive={() => bulkAction('archive')}
          onDelete={() => bulkAction('delete')}
          onMarkRead={() => bulkAction('markRead')}
          onMarkUnread={() => bulkAction('markUnread')}
          onClear={clearSelection}
        />

        {/* Email list / detail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email list - Full width on mobile when no email selected, hidden when email selected */}
          <div className={`${selectedEmail ? 'hidden lg:flex lg:w-96 lg:border-r lg:border-slate-200 lg:dark:border-slate-700' : 'flex-1'} flex-col bg-white dark:bg-slate-900`}>
            {/* List header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {folders.find(f => f.path === selectedFolder)?.name || 'Inbox'}
                {pagination.total > 0 && <span className="ml-2 text-slate-400 dark:text-slate-500">({pagination.total})</span>}
              </span>
              {pagination.pages > 1 && (
                <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                  <span className="hidden sm:inline">{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-600">of</span>
                  <span className="hidden sm:inline">{pagination.total}</span>
                  <span className="sm:hidden">{pagination.page}/{pagination.pages}</span>
                  <button onClick={prevPage} disabled={pagination.page <= 1} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={nextPage} disabled={pagination.page >= pagination.pages} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Email list */}
            <EmailList
              emails={emails}
              selectedEmail={selectedEmail}
              selectMode={selectMode}
              selectedIds={selectedEmailIds}
              density={settings.density}
              labels={labels}
              loading={loadingEmails}
              onSelectEmail={handleSelectEmail}
              onStarEmail={starEmail}
              onToggleSelect={toggleSelectEmail}
              onQuickAction={handleQuickAction}
              emptyState={
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                    <Mail size={28} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-300">No emails</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
                    {selectedFolder === 'INBOX' ? 'Your inbox is empty' : `No emails in ${selectedFolder.toLowerCase()}`}
                  </p>
                  <button
                    onClick={sync}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <RefreshCw size={16} />
                    Sync Now
                  </button>
                </div>
              }
            />
          </div>

          {/* Email preview / Thread view - Full screen on mobile */}
          {selectedEmail ? (
            <div className="flex-1 flex flex-col">
              {settings.conversationView && threadMessages.length > 1 ? (
                <EmailThread
                  messages={threadMessages}
                  labels={labels}
                  loading={loadingThread}
                  onClose={() => useMailStore.setState({ selectedEmail: null, selectedEmailId: null, threadMessages: [] })}
                  onReply={(message) => openCompose({ replyTo: message || selectedEmail })}
                  onReplyAll={(message) => openCompose({ replyTo: message || selectedEmail })}
                  onForward={(message) => openCompose({ forward: message || selectedEmail })}
                  onDelete={(id) => deleteEmail(id || selectedEmail.id)}
                  onArchive={(id) => archiveEmail(id || selectedEmail.id)}
                  onMove={(folder, id) => moveEmail(id || selectedEmail.id, folder)}
                  onStar={starEmail}
                  onMarkRead={(id, isRead) => markAsRead(id, isRead)}
                  onLabel={(id, labelId, action) => {
                    if (action === 'add') addLabelToEmail(id, labelId);
                    else removeLabelFromEmail(id, labelId);
                  }}
                />
              ) : (
                <EmailPreview
                  email={selectedEmail}
                  labels={labels}
                  showSmartReply={false}
                  onClose={() => useMailStore.setState({ selectedEmail: null, selectedEmailId: null })}
                  onReply={() => openCompose({ replyTo: selectedEmail })}
                  onReplyAll={() => openCompose({ replyTo: selectedEmail })}
                  onForward={() => openCompose({ forward: selectedEmail })}
                  onDelete={() => deleteEmail(selectedEmail.id)}
                  onArchive={() => archiveEmail(selectedEmail.id)}
                  onMove={(folder) => moveEmail(selectedEmail.id, folder)}
                  onStar={starEmail}
                  onMarkRead={(isRead) => markAsRead(selectedEmail.id, isRead)}
                  onSnooze={() => handleOpenSnooze(selectedEmail)}
                  onLabel={(labelId, action) => {
                    if (action === 'add') addLabelToEmail(selectedEmail.id, labelId);
                    else removeLabelFromEmail(selectedEmail.id, labelId);
                  }}
                />
              )}
            </div>
          ) : (
            !loadingEmails && emails.length > 0 && (
              <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-blue-900/10 to-orange-500/10 dark:from-blue-900/20 dark:to-orange-500/20 flex items-center justify-center mb-6">
                  <Mail size={40} className="text-blue-900/60 dark:text-blue-400/60" />
                </div>
                <p className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200">Exoin Mail</p>
                <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">Select an email to read</p>
                <p className="text-xs mt-4 text-slate-400 dark:text-slate-500">
                  Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs">?</kbd> for keyboard shortcuts
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Compose modal */}
      <ComposeModal
        isOpen={composeOpen}
        onClose={closeCompose}
        replyTo={replyTo}
        forwardEmail={forwardEmail}
        onSend={handleSendEmail}
        onSendWithUndo={handleSendWithUndo}
        onUndoSend={handleUndoSend}
        defaults={composeDefaults}
        undoSendDelay={settings?.undoSendDelay ?? 5}
      />

      {/* Undo send toast */}
      {showUndoToast && pendingOutboxId && (
        <UndoSendToast
          outboxId={pendingOutboxId}
          subject="Email"
          sendAt={new Date(Date.now() + (settings?.undoSendDelay || 5) * 1000).toISOString()}
          undoDelaySeconds={settings?.undoSendDelay || 5}
          onUndo={async () => {
            await cancelScheduledEmail(pendingOutboxId);
            useMailStore.setState({ showUndoToast: false, pendingOutboxId: null });
          }}
          onDismiss={() => {
            useMailStore.setState({ showUndoToast: false, pendingOutboxId: null });
          }}
          onSent={() => {
            useMailStore.setState({ showUndoToast: false, pendingOutboxId: null });
          }}
        />
      )}

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={toggleKeyboardShortcuts}
      />

      {/* Snooze modal */}
      <SnoozeModal
        isOpen={showSnoozeModal}
        onClose={() => {
          setShowSnoozeModal(false);
          setSnoozeTarget(null);
        }}
        onSnooze={handleSnooze}
        emailSubject={snoozeTarget?.subject}
      />

      {/* Vacation Responder Modal */}
      {showVacationResponder && (
        <VacationResponder
          onClose={() => setShowVacationResponder(false)}
        />
      )}

      {/* Scheduled Emails List Panel */}
      {showScheduledList && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scheduled Emails</h2>
              <button
                onClick={() => setShowScheduledList(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <ScheduledEmailsList
              onEdit={(email) => {
                setScheduleEmailData(email);
                setShowScheduleSendModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Priority Inbox View */}
      {showPriorityInbox && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowPriorityInbox(false)}>
          <div 
            className="absolute inset-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Priority Inbox</h2>
              </div>
              <button
                onClick={() => setShowPriorityInbox(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <PriorityInbox
                onSelectEmail={(email) => {
                  fetchEmail(email.id);
                  setShowPriorityInbox(false);
                }}
                onStarEmail={starEmail}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailPage;
