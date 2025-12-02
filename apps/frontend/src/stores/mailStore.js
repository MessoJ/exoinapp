import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mailApi } from '../lib/api';

// Default mail settings
const DEFAULT_SETTINGS = {
  density: 'comfortable', // 'comfortable' | 'cozy' | 'compact'
  readingPane: 'right', // 'right' | 'bottom' | 'off'
  conversationView: true,
  previewLines: 2,
  darkMode: 'system', // 'light' | 'dark' | 'system'
  keyboardShortcuts: true,
  undoSendDelay: 10, // seconds
  defaultReplyBehavior: 'reply', // 'reply' | 'replyAll'
  autoAdvance: 'next', // 'next' | 'previous' | 'list'
  markAsReadDelay: 0, // seconds, 0 = immediately
  priorityInboxEnabled: true, // Enable smart priority inbox
};

// Create the mail store
export const useMailStore = create(
  persist(
    (set, get) => ({
      // ================== STATE ==================
      
      // Account
      accountStatus: null,
      isConfigured: false,
      
      // Folders
      folders: [],
      selectedFolder: 'INBOX',
      
      // Emails
      emails: [],
      selectedEmailId: null,
      selectedEmail: null,
      loadingEmails: false,
      loadingEmail: false,
      
      // Pagination
      pagination: { page: 1, limit: 25, total: 0, pages: 0 },
      
      // Search
      searchQuery: '',
      searchResults: [],
      searchParsed: null,
      isSearching: false,
      savedSearches: [],
      recentSearches: [],
      searchSuggestions: [],
      
      // Labels
      labels: [],
      selectedLabels: [],
      
      // Compose
      composeOpen: false,
      replyTo: null,
      forwardEmail: null,
      draftEmail: null,
      composeDefaults: null,
      
      // Sync
      syncing: false,
      lastSync: null,
      
      // UI State
      sidebarCollapsed: false,
      previewPaneWidth: 50,
      showKeyboardShortcuts: false,
      
      // Settings
      settings: DEFAULT_SETTINGS,
      
      // Bulk selection
      selectedEmailIds: [],
      selectMode: false,
      
      // Thread/Conversation
      threadMessages: [],
      loadingThread: false,
      
      // Undo Send
      pendingOutboxId: null,
      showUndoToast: false,
      
      // Snooze modal
      snoozeModalOpen: false,
      snoozeTargetEmail: null,
      
      // Priority Inbox
      priorityInboxEnabled: true,
      prioritySections: null,
      priorityCounts: null,
      loadingPriority: false,
      
      // ================== ACTIONS ==================
      
      // Account Actions
      setAccountStatus: (status) => set({ 
        accountStatus: status, 
        isConfigured: status?.configured || false 
      }),
      
      // Folder Actions
      setFolders: (folders) => set({ folders }),
      setSelectedFolder: (folder) => set({ 
        selectedFolder: folder, 
        selectedEmailId: null, 
        selectedEmail: null,
        pagination: { ...get().pagination, page: 1 }
      }),
      
      fetchFolders: async () => {
        try {
          const res = await mailApi.getFolders();
          set({ folders: res.data.folders });
          return res.data.folders;
        } catch (err) {
          console.error('Failed to fetch folders:', err);
          return [];
        }
      },
      
      // Email Actions
      setEmails: (emails) => set({ emails }),
      setSelectedEmailId: (id) => set({ selectedEmailId: id }),
      setSelectedEmail: (email) => set({ selectedEmail: email }),
      setLoadingEmails: (loading) => set({ loadingEmails: loading }),
      
      fetchEmails: async (showLoader = true) => {
        const { selectedFolder, pagination, searchQuery } = get();
        if (showLoader) set({ loadingEmails: true });
        
        try {
          const res = await mailApi.getMessages(
            selectedFolder, 
            pagination.page, 
            pagination.limit, 
            searchQuery || undefined
          );
          set({ 
            emails: res.data.messages, 
            pagination: res.data.pagination,
            loadingEmails: false 
          });
          return res.data.messages;
        } catch (err) {
          console.error('Failed to fetch emails:', err);
          set({ loadingEmails: false });
          return [];
        }
      },
      
      fetchEmail: async (id) => {
        set({ loadingEmail: true });
        try {
          const res = await mailApi.getMessage(id);
          set({ selectedEmail: res.data, loadingEmail: false });
          
          // Mark as read in local state
          set((state) => ({
            emails: state.emails.map(e => 
              e.id === id ? { ...e, isRead: true } : e
            )
          }));
          
          // If conversation view is enabled, fetch thread messages
          const { settings } = get();
          if (settings.conversationView && res.data) {
            get().fetchThreadMessages(res.data);
          } else {
            set({ threadMessages: [res.data] });
          }
          
          return res.data;
        } catch (err) {
          console.error('Failed to fetch email:', err);
          set({ loadingEmail: false });
          return null;
        }
      },
      
      // Fetch thread/conversation messages
      fetchThreadMessages: async (email) => {
        set({ loadingThread: true });
        try {
          // Get the clean subject to search for related messages
          const subject = email.subject?.replace(/^(Re:|Fwd:|RE:|FWD:|Fw:)\s*/gi, '').trim();
          
          if (subject) {
            const res = await mailApi.getThread(subject);
            if (res.data?.messages?.length > 0) {
              set({ threadMessages: res.data.messages, loadingThread: false });
              return res.data.messages;
            }
          }
          
          // If no thread found, just use the single email
          set({ threadMessages: [email], loadingThread: false });
          return [email];
        } catch (err) {
          console.error('Failed to fetch thread:', err);
          set({ threadMessages: [email], loadingThread: false });
          return [email];
        }
      },
      
      clearThread: () => set({ threadMessages: [] }),
      
      // Email Operations
      starEmail: async (id, isStarred) => {
        try {
          await mailApi.star(id, isStarred);
          set((state) => ({
            emails: state.emails.map(e => e.id === id ? { ...e, isStarred } : e),
            selectedEmail: state.selectedEmail?.id === id 
              ? { ...state.selectedEmail, isStarred } 
              : state.selectedEmail
          }));
        } catch (err) {
          console.error('Failed to star email:', err);
        }
      },
      
      markAsRead: async (id, isRead) => {
        try {
          await mailApi.markAsRead(id, isRead);
          set((state) => ({
            emails: state.emails.map(e => e.id === id ? { ...e, isRead } : e),
            selectedEmail: state.selectedEmail?.id === id 
              ? { ...state.selectedEmail, isRead } 
              : state.selectedEmail
          }));
        } catch (err) {
          console.error('Failed to mark as read:', err);
        }
      },
      
      deleteEmail: async (id) => {
        try {
          await mailApi.delete(id);
          const { selectedEmailId, emails, settings } = get();
          
          // Auto-advance logic
          let nextId = null;
          if (selectedEmailId === id && settings.autoAdvance !== 'list') {
            const currentIndex = emails.findIndex(e => e.id === id);
            if (settings.autoAdvance === 'next' && currentIndex < emails.length - 1) {
              nextId = emails[currentIndex + 1]?.id;
            } else if (settings.autoAdvance === 'previous' && currentIndex > 0) {
              nextId = emails[currentIndex - 1]?.id;
            }
          }
          
          set((state) => ({
            emails: state.emails.filter(e => e.id !== id),
            selectedEmailId: nextId,
            selectedEmail: nextId ? state.emails.find(e => e.id === nextId) : null
          }));
          
          get().fetchFolders();
        } catch (err) {
          console.error('Failed to delete email:', err);
        }
      },
      
      moveEmail: async (id, folder) => {
        try {
          await mailApi.move(id, folder);
          set((state) => ({
            emails: state.emails.filter(e => e.id !== id),
            selectedEmailId: null,
            selectedEmail: null
          }));
          get().fetchFolders();
        } catch (err) {
          console.error('Failed to move email:', err);
        }
      },
      
      archiveEmail: async (id) => {
        await get().moveEmail(id, 'ARCHIVE');
      },
      
      // Bulk Operations
      toggleSelectEmail: (id) => set((state) => ({
        selectedEmailIds: state.selectedEmailIds.includes(id)
          ? state.selectedEmailIds.filter(i => i !== id)
          : [...state.selectedEmailIds, id]
      })),
      
      selectAllEmails: () => set((state) => ({
        selectedEmailIds: state.emails.map(e => e.id),
        selectMode: true
      })),
      
      clearSelection: () => set({ selectedEmailIds: [], selectMode: false }),
      
      toggleSelectMode: () => set((state) => ({
        selectMode: !state.selectMode,
        selectedEmailIds: state.selectMode ? [] : state.selectedEmailIds
      })),
      
      bulkAction: async (action) => {
        const { selectedEmailIds } = get();
        if (selectedEmailIds.length === 0) return;
        
        try {
          await mailApi.bulk(selectedEmailIds, action);
          set((state) => ({
            emails: state.emails.filter(e => !selectedEmailIds.includes(e.id)),
            selectedEmailIds: [],
            selectMode: false
          }));
          get().fetchFolders();
        } catch (err) {
          console.error('Bulk action failed:', err);
        }
      },
      
      // Pagination
      setPagination: (pagination) => set({ pagination }),
      goToPage: (page) => {
        set((state) => ({ pagination: { ...state.pagination, page } }));
        get().fetchEmails();
      },
      nextPage: () => {
        const { pagination } = get();
        if (pagination.page < pagination.pages) get().goToPage(pagination.page + 1);
      },
      prevPage: () => {
        const { pagination } = get();
        if (pagination.page > 1) get().goToPage(pagination.page - 1);
      },
      
      // Search
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      search: async (query) => {
        if (!query.trim()) {
          set({ searchQuery: '', isSearching: false, searchParsed: null });
          get().fetchEmails();
          return;
        }
        
        set({ searchQuery: query, isSearching: true });
        try {
          // Use advanced search if query contains operators
          const hasOperators = /(?:from:|to:|subject:|has:|is:|label:|before:|after:|older_than:|newer_than:|in:|folder:)/.test(query);
          
          let res;
          if (hasOperators) {
            res = await mailApi.advancedSearch(query, 1, 50);
            set({ 
              emails: res.data.results || [], 
              isSearching: false,
              searchParsed: res.data.parsed || null,
              pagination: res.data.pagination || { page: 1, limit: 50, total: res.data.results?.length || 0, pages: 1 }
            });
          } else {
            res = await mailApi.search(query);
            set({ 
              emails: res.data.results || [], 
              isSearching: false,
              searchParsed: null,
              pagination: { page: 1, limit: 25, total: res.data.results?.length || 0, pages: 1 }
            });
          }
          
          // Add to recent searches
          set((state) => ({
            recentSearches: [
              query,
              ...state.recentSearches.filter(s => s !== query)
            ].slice(0, 10)
          }));
        } catch (err) {
          console.error('Search failed:', err);
          set({ isSearching: false });
        }
      },
      
      fetchSearchSuggestions: async (query) => {
        if (!query || query.length < 2) {
          set({ searchSuggestions: [] });
          return;
        }
        
        try {
          const res = await mailApi.searchSuggestions(query);
          set({ searchSuggestions: res.data.suggestions || [] });
        } catch (err) {
          console.error('Failed to fetch suggestions:', err);
          set({ searchSuggestions: [] });
        }
      },
      
      clearSearchSuggestions: () => set({ searchSuggestions: [] }),
      
      saveSearch: (name, query) => set((state) => ({
        savedSearches: [...state.savedSearches, { name, query, createdAt: new Date() }]
      })),
      
      removeSavedSearch: (query) => set((state) => ({
        savedSearches: state.savedSearches.filter(s => s.query !== query)
      })),
      
      clearRecentSearches: () => set({ recentSearches: [] }),
      
      // Labels
      setLabels: (labels) => set({ labels }),
      addLabel: (label) => set((state) => ({ labels: [...state.labels, label] })),
      updateLabel: (id, updates) => set((state) => ({
        labels: state.labels.map(l => l.id === id ? { ...l, ...updates } : l)
      })),
      removeLabel: (id) => set((state) => ({
        labels: state.labels.filter(l => l.id !== id)
      })),
      
      addLabelToEmail: async (emailId, labelId) => {
        try {
          await mailApi.updateLabels(emailId, labelId, 'add');
          set((state) => ({
            emails: state.emails.map(e => 
              e.id === emailId 
                ? { ...e, labels: [...(e.labels || []), labelId] }
                : e
            )
          }));
        } catch (err) {
          console.error('Failed to add label:', err);
        }
      },
      
      removeLabelFromEmail: async (emailId, labelId) => {
        try {
          await mailApi.updateLabels(emailId, labelId, 'remove');
          set((state) => ({
            emails: state.emails.map(e => 
              e.id === emailId 
                ? { ...e, labels: (e.labels || []).filter(l => l !== labelId) }
                : e
            )
          }));
        } catch (err) {
          console.error('Failed to remove label:', err);
        }
      },
      
      // Compose
      openCompose: (options = {}) => set({ 
        composeOpen: true, 
        replyTo: options.replyTo || null,
        forwardEmail: options.forward || null,
        composeDefaults: options.defaults || null
      }),
      
      closeCompose: () => set({ 
        composeOpen: false, 
        replyTo: null, 
        forwardEmail: null,
        composeDefaults: null 
      }),
      
      setDraftEmail: (draft) => set({ draftEmail: draft }),
      
      sendEmail: async (data) => {
        const res = await mailApi.send(data);
        if (res.data.success) {
          get().fetchEmails(false);
          get().fetchFolders();
        }
        return res.data;
      },
      
      // Send with undo capability
      sendEmailWithUndo: async (data, delaySeconds) => {
        const { settings } = get();
        const undoDelayMs = (delaySeconds || settings.undoSendDelay || 10) * 1000;
        
        try {
          const res = await mailApi.queueEmail(data, delaySeconds || settings.undoSendDelay || 10);
          
          if (res.data.success) {
            // Show undo toast and store the outbox ID
            set({ 
              pendingOutboxId: res.data.outboxId,
              showUndoToast: true 
            });
            
            // Return the outbox info for the UI
            return {
              success: true,
              outboxId: res.data.outboxId,
              sendAt: res.data.sendAt,
            };
          }
          
          return res.data;
        } catch (err) {
          console.error('Failed to queue email:', err);
          throw err;
        }
      },
      
      // Cancel a scheduled email (undo send)
      cancelScheduledEmail: async (outboxId) => {
        try {
          const res = await mailApi.cancelEmail(outboxId);
          if (res.data.success) {
            set({ 
              pendingOutboxId: null,
              showUndoToast: false 
            });
          }
          return res.data;
        } catch (err) {
          console.error('Failed to cancel email:', err);
          throw err;
        }
      },
      
      // Get pending outbox emails
      fetchOutbox: async () => {
        try {
          const res = await mailApi.getOutbox();
          return res.data.emails || [];
        } catch (err) {
          console.error('Failed to fetch outbox:', err);
          return [];
        }
      },
      
      // Get scheduled emails
      fetchScheduled: async () => {
        try {
          const res = await mailApi.getScheduled();
          return res.data.emails || [];
        } catch (err) {
          console.error('Failed to fetch scheduled:', err);
          return [];
        }
      },
      
      // Cancel a scheduled email
      cancelScheduled: async (outboxId) => {
        try {
          const res = await mailApi.cancelScheduled(outboxId);
          return res.data;
        } catch (err) {
          console.error('Failed to cancel scheduled:', err);
          throw err;
        }
      },
      
      // ==========================================
      // SNOOZE ACTIONS
      // ==========================================
      
      // Snooze an email
      snoozeEmail: async (emailId, preset, customTime) => {
        try {
          const res = await mailApi.snooze(emailId, preset, customTime);
          if (res.data.success) {
            // Remove from current list (it moves to snoozed)
            set((state) => ({
              emails: state.emails.filter(e => e.id !== emailId),
              selectedEmail: state.selectedEmail?.id === emailId ? null : state.selectedEmail,
              selectedEmailId: state.selectedEmailId === emailId ? null : state.selectedEmailId,
            }));
            get().fetchFolders();
          }
          return res.data;
        } catch (err) {
          console.error('Failed to snooze email:', err);
          throw err;
        }
      },
      
      // Unsnooze an email (cancel snooze)
      unsnoozeEmail: async (emailId) => {
        try {
          const res = await mailApi.unsnooze(emailId);
          if (res.data.success) {
            // Refresh the snoozed list if viewing it
            const { selectedFolder } = get();
            if (selectedFolder === 'SNOOZED') {
              get().fetchSnoozedEmails();
            }
            get().fetchFolders();
          }
          return res.data;
        } catch (err) {
          console.error('Failed to unsnooze email:', err);
          throw err;
        }
      },
      
      // Fetch snoozed emails
      fetchSnoozedEmails: async () => {
        set({ loadingEmails: true });
        try {
          const res = await mailApi.getSnoozed();
          set({ 
            emails: res.data.emails || [],
            loadingEmails: false,
            pagination: { page: 1, limit: 50, total: res.data.emails?.length || 0, pages: 1 }
          });
          return res.data.emails || [];
        } catch (err) {
          console.error('Failed to fetch snoozed:', err);
          set({ loadingEmails: false });
          return [];
        }
      },
      
      // ==========================================
      // PRIORITY INBOX ACTIONS
      // ==========================================
      
      // Toggle priority inbox view
      togglePriorityInbox: () => set((state) => ({
        priorityInboxEnabled: !state.priorityInboxEnabled
      })),
      
      // Fetch prioritized inbox
      fetchPriorityInbox: async () => {
        set({ loadingPriority: true });
        try {
          const res = await mailApi.getPriorityInbox(100);
          set({ 
            prioritySections: res.data.sections,
            loadingPriority: false 
          });
          return res.data.sections;
        } catch (err) {
          console.error('Failed to fetch priority inbox:', err);
          set({ loadingPriority: false });
          return null;
        }
      },
      
      // Fetch priority inbox counts
      fetchPriorityCounts: async () => {
        try {
          const res = await mailApi.getPriorityInboxCounts();
          set({ priorityCounts: res.data.counts });
          return res.data.counts;
        } catch (err) {
          console.error('Failed to fetch priority counts:', err);
          return null;
        }
      },
      
      // Get priority insight for an email
      getEmailPriority: async (emailId) => {
        try {
          const res = await mailApi.getEmailPriority(emailId);
          return res.data;
        } catch (err) {
          console.error('Failed to get email priority:', err);
          return null;
        }
      },
      
      // Clear priority sections
      clearPrioritySections: () => set({ prioritySections: null }),
      
      // Sync
      sync: async () => {
        set({ syncing: true });
        try {
          const res = await mailApi.quickSync();
          if (res.data.success) {
            set({ lastSync: new Date() });
            await get().fetchFolders();
            await get().fetchEmails(false);
          }
        } catch (err) {
          console.error('Sync failed:', err);
        } finally {
          set({ syncing: false });
        }
      },
      
      // UI Actions
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setPreviewPaneWidth: (width) => set({ previewPaneWidth: width }),
      toggleKeyboardShortcuts: () => set((state) => ({ 
        showKeyboardShortcuts: !state.showKeyboardShortcuts 
      })),
      
      // Settings
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
      
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      
      // Navigation helpers
      selectNextEmail: () => {
        const { emails, selectedEmailId } = get();
        const currentIndex = emails.findIndex(e => e.id === selectedEmailId);
        if (currentIndex < emails.length - 1) {
          const nextEmail = emails[currentIndex + 1];
          get().fetchEmail(nextEmail.id);
          set({ selectedEmailId: nextEmail.id });
        }
      },
      
      selectPreviousEmail: () => {
        const { emails, selectedEmailId } = get();
        const currentIndex = emails.findIndex(e => e.id === selectedEmailId);
        if (currentIndex > 0) {
          const prevEmail = emails[currentIndex - 1];
          get().fetchEmail(prevEmail.id);
          set({ selectedEmailId: prevEmail.id });
        }
      },
      
      // Initialize
      initialize: async () => {
        try {
          const res = await mailApi.getAccountStatus();
          set({ accountStatus: res.data, isConfigured: res.data.configured });
          
          if (res.data.configured) {
            await get().fetchFolders();
            await get().fetchEmails();
          }
        } catch (err) {
          console.error('Failed to initialize mail:', err);
        }
      },
    }),
    {
      name: 'exoin-mail-store',
      partialize: (state) => ({
        settings: state.settings,
        savedSearches: state.savedSearches,
        recentSearches: state.recentSearches,
        sidebarCollapsed: state.sidebarCollapsed,
        previewPaneWidth: state.previewPaneWidth,
        labels: state.labels,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useMailSettings = () => useMailStore((state) => state.settings);
export const useMailFolders = () => useMailStore((state) => state.folders);
export const useMailEmails = () => useMailStore((state) => state.emails);
export const useSelectedEmail = () => useMailStore((state) => state.selectedEmail);
export const useMailSearch = () => useMailStore((state) => ({
  searchQuery: state.searchQuery,
  isSearching: state.isSearching,
  recentSearches: state.recentSearches,
  savedSearches: state.savedSearches,
}));

export default useMailStore;
