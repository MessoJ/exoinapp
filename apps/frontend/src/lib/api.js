import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('exoin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('exoin_token');
      localStorage.removeItem('exoin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: (params) => api.get('/auth/me', { params }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
};

// Documents API
export const documentsApi = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  getInvoices: () => api.get('/documents/invoices'),
  getQuotations: () => api.get('/documents/quotations'),
};

// Clients API
export const clientsApi = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Company API
export const companyApi = {
  get: () => api.get('/company'),
  update: (data) => api.put('/company', data),
  getUsers: () => api.get('/company/users'),
  createUser: (data) => api.post('/company/users', data),
  updateUser: (id, data) => api.put(`/company/users/${id}`, data),
  deleteUser: (id) => api.delete(`/company/users/${id}`),
  getTemplates: (type) => api.get('/company/templates', { params: { type } }),
};

// Users API (Team Management)
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats/summary'),
  
  // Mailbox Management
  getMailboxes: (userId) => api.get(`/users/${userId}/mailboxes`),
  provisionMailbox: (userId, data) => api.post(`/users/${userId}/mailbox`, data),
  linkMailbox: (userId, mailboxId, setAsPrimary = true) => 
    api.post(`/users/${userId}/mailbox/link`, { mailboxId, setAsPrimary }),
  unlinkMailbox: (userId, mailboxId) => api.delete(`/users/${userId}/mailbox/${mailboxId}`),
  bulkProvisionMailboxes: (userIds, domainId) => 
    api.post('/users/mailbox/bulk-provision', { userIds, domainId }),
  getUnlinkedMailboxes: () => api.get('/users/mailbox/unlinked'),
  
  // Email Hosting Settings
  getEmailHostingSettings: () => api.get('/users/settings/email-hosting'),
  updateEmailHostingSettings: (data) => api.put('/users/settings/email-hosting', data),
  
  // Audit Logs
  getAuditLogs: (params) => api.get('/users/audit-logs', { params }),
};

// Assets API
export const assetsApi = {
  getAll: (type) => api.get('/assets', { params: { type } }),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDownloadUrl: (id) => api.get(`/assets/${id}/download`),
  delete: (id) => api.delete(`/assets/${id}`),
};

// PDF API
export const pdfApi = {
  generate: (documentId) => api.post(`/pdf/generate/${documentId}`, {}, { responseType: 'blob' }),
  preview: (documentId) => api.get(`/pdf/preview/${documentId}`),
  getDownloadUrl: (documentId) => api.get(`/pdf/download/${documentId}`),
};

// Mail API
export const mailApi = {
  // Account management
  getAccountStatus: () => api.get('/mail/account/status'),
  setupAccount: (password) => api.post('/mail/account/setup', { password }),
  testConnection: (password) => api.post('/mail/account/test', { password }),
  
  // Sync
  quickSync: () => api.post('/mail/sync/quick'),
  fullSync: (password) => api.post('/mail/sync/full', { password }),
  checkNewMail: () => api.get('/mail/sync/check'),
  
  // Folders & Messages
  getFolders: () => api.get('/mail/folders'),
  getMessages: (folder = 'INBOX', page = 1, limit = 25, search) => 
    api.get('/mail/messages', { params: { folder, page, limit, search } }),
  getMessage: (id) => api.get(`/mail/messages/${id}`),
  getThread: (subjectQuery) => api.get(`/mail/thread/${encodeURIComponent(subjectQuery)}`),
  
  // Send emails
  send: (data) => api.post('/mail/send', data),
  sendWithUndo: (data) => api.post('/mail/send/queue', data),
  queueEmail: (data, delaySeconds = 10) => api.post('/mail/send/queue', { ...data, delaySeconds }),
  cancelEmail: (outboxId) => api.post(`/mail/send/undo/${outboxId}`),
  undoSend: (outboxId) => api.post(`/mail/send/undo/${outboxId}`),
  
  // Outbox & Scheduled
  getOutbox: () => api.get('/mail/outbox'),
  getScheduled: () => api.get('/mail/scheduled'),
  updateScheduled: (outboxId, data) => api.put(`/mail/scheduled/${outboxId}`, data),
  cancelScheduled: (outboxId) => api.delete(`/mail/scheduled/${outboxId}`),
  
  // Actions
  markAsRead: (id, isRead) => api.put(`/mail/messages/${id}/read`, { isRead }),
  star: (id, isStarred) => api.put(`/mail/messages/${id}/star`, { isStarred }),
  delete: (id) => api.delete(`/mail/messages/${id}`),
  move: (id, folder) => api.put(`/mail/messages/${id}/move`, { folder }),
  updateLabels: (id, label, action) => api.put(`/mail/messages/${id}/labels`, { label, action }),
  
  // Snooze
  snooze: (id, preset, customTime) => api.post(`/mail/messages/${id}/snooze`, { preset, customTime }),
  unsnooze: (id) => api.delete(`/mail/messages/${id}/snooze`),
  updateSnooze: (id, newTime) => api.put(`/mail/messages/${id}/snooze`, { newTime }),
  getSnoozed: () => api.get('/mail/snoozed'),
  getSnoozePresets: () => api.get('/mail/snooze/presets'),
  
  // Priority Inbox
  getPriorityInbox: (limit = 100) => api.get('/mail/inbox/priority', { params: { limit } }),
  getPriorityInboxCounts: () => api.get('/mail/inbox/priority/counts'),
  getEmailPriority: (id) => api.get(`/mail/messages/${id}/priority`),
  
  // Search
  search: (query, folder = 'ALL') => api.get('/mail/search', { params: { q: query, folder } }),
  advancedSearch: (query, page = 1, limit = 50) => 
    api.get('/mail/search/advanced', { params: { q: query, page, limit } }),
  fullTextSearch: (query, folder = 'ALL', page = 1, limit = 50) =>
    api.get('/mail/search/fulltext', { params: { q: query, folder, page, limit } }),
  searchSuggestions: (query) => api.get('/mail/search/suggestions', { params: { q: query } }),
  
  // Bulk actions
  bulk: (ids, action, folder) => api.post('/mail/messages/bulk', { ids, action, folder }),
  
  // Attachments
  getAttachment: (attachmentId) => api.get(`/mail/attachments/${attachmentId}`, { responseType: 'blob' }),
  
  // SMTP
  getSmtpStatus: () => api.get('/mail/smtp/status'),
  verifySmtp: () => api.post('/mail/smtp/verify'),

  // Email History with a Contact
  getContactHistory: (email, params) => api.get(`/mail/history/${encodeURIComponent(email)}`, { params }),
  
  // Templates
  getTemplates: (params) => api.get('/mail/templates', { params }),
  getTemplateCategories: () => api.get('/mail/templates/categories'),
  getPlaceholders: () => api.get('/mail/templates/placeholders'),
  getTemplate: (id) => api.get(`/mail/templates/${id}`),
  createTemplate: (data) => api.post('/mail/templates', data),
  updateTemplate: (id, data) => api.put(`/mail/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/mail/templates/${id}`),
  useTemplate: (id, variables) => api.post(`/mail/templates/${id}/use`, { variables }),
  duplicateTemplate: (id) => api.post(`/mail/templates/${id}/duplicate`),
  
  // Vacation Responder
  getVacationResponder: () => api.get('/mail/vacation-responder'),
  updateVacationResponder: (data) => api.post('/mail/vacation-responder', data),
  deleteVacationResponder: () => api.delete('/mail/vacation-responder'),
  toggleVacationResponder: (isActive) => api.patch('/mail/vacation-responder/toggle', { isActive }),
};

// Signature API
export const signatureApi = {
  get: () => api.get('/signature/settings'),
  update: (data) => api.put('/signature/settings', data),
  getHtml: (darkMode = false, regenerate = false) => api.get('/signature/html', { params: { darkMode, regenerate } }),
  preview: (data) => api.post('/signature/preview', data),
  getStyles: () => api.get('/signature/styles'),
};

// Email Hosting API
export const emailHostingApi = {
  // Domains
  getDomains: () => api.get('/email-hosting/domains'),
  createDomain: (data) => api.post('/email-hosting/domains', data),
  getDomain: (id) => api.get(`/email-hosting/domains/${id}`),
  deleteDomain: (id) => api.delete(`/email-hosting/domains/${id}`),
  getDomainDNS: (domainId) => api.get(`/email-hosting/domains/${domainId}/dns`),
  regenerateDNS: (domainId) => api.post(`/email-hosting/domains/${domainId}/regenerate-dns`),
  verifyDomain: (domainId) => api.post(`/email-hosting/domains/${domainId}/verify`),
  getDomainStats: (domainId) => api.get(`/email-hosting/domains/${domainId}/stats`),
  getDomainLogs: (domainId, params) => api.get(`/email-hosting/domains/${domainId}/logs`, { params }),

  // Gmail Deliverability
  checkGmailDeliverability: (domainId) => api.get(`/email-hosting/domains/${domainId}/gmail-check`),
  checkPTR: (serverIP, hostname) => api.post('/email-hosting/check-ptr', { serverIP, hostname }),
  checkBlacklists: (serverIP) => api.post('/email-hosting/check-blacklists', { serverIP }),
  upgradeDmarc: (domainId, policy) => api.post(`/email-hosting/domains/${domainId}/upgrade-dmarc`, { policy }),

  // Mailboxes
  getMailboxes: (domainId) => api.get(`/email-hosting/domains/${domainId}/mailboxes`),
  createMailbox: (domainId, data) => api.post(`/email-hosting/domains/${domainId}/mailboxes`, data),
  getMailbox: (mailboxId) => api.get(`/email-hosting/mailboxes/${mailboxId}`),
  updateMailbox: (mailboxId, data) => api.patch(`/email-hosting/mailboxes/${mailboxId}`, data),
  updateMailboxPassword: (mailboxId, password) => api.post(`/email-hosting/mailboxes/${mailboxId}/password`, { password }),
  deleteMailbox: (mailboxId) => api.delete(`/email-hosting/mailboxes/${mailboxId}`),

  // Aliases
  getAliases: (domainId) => api.get(`/email-hosting/domains/${domainId}/aliases`),
  createAlias: (domainId, data) => api.post(`/email-hosting/domains/${domainId}/aliases`, data),
  updateAlias: (aliasId, data) => api.patch(`/email-hosting/aliases/${aliasId}`, data),
  deleteAlias: (aliasId) => api.delete(`/email-hosting/aliases/${aliasId}`),
};

// AI API
export const aiApi = {
  // Check if AI is available
  getStatus: () => api.get('/ai/status'),
  
  // Smart Compose - Get autocomplete suggestion
  smartCompose: (currentText, options = {}) => 
    api.post('/ai/compose', { currentText, ...options }),
  
  // Smart Reply - Generate reply options
  smartReply: (emailContent, options = {}) => 
    api.post('/ai/reply', { emailContent, ...options }),
  
  // Summarize email
  summarize: (emailContent, options = {}) => 
    api.post('/ai/summarize', { emailContent, ...options }),
  
  // Rewrite text with style
  rewrite: (text, style) => 
    api.post('/ai/rewrite', { text, style }),
  
  // Suggest subject lines
  suggestSubjects: (emailBody, count = 3) => 
    api.post('/ai/subject-suggestions', { emailBody, count }),
  
  // Analyze tone
  analyzeTone: (text) => 
    api.post('/ai/analyze-tone', { text }),
  
  // Extract key info from email
  extractInfo: (emailContent) => 
    api.post('/ai/extract-info', { emailContent }),
    
  // Smart Categorization
  categorize: (subject, snippet, sender) =>
    api.post('/ai/categorize', { subject, snippet, sender }),
    
  // Security Threat Analysis
  securityCheck: (subject, content, sender, links) =>
    api.post('/ai/security-check', { subject, content, sender, links }),
};

// Tracking API
export const trackingApi = {
  // Get tracking history
  getHistory: (page = 1, limit = 20) => 
    api.get('/track/history', { params: { page, limit } }),
  
  // Get tracking stats for specific email
  getStats: (trackingId) => 
    api.get(`/track/stats/${trackingId}`),
  
  // Create tracking for an email
  create: (data) => 
    api.post('/track/create', data),
  
  // Get tracking pixel HTML
  getPixelHtml: (trackingId) => 
    api.get(`/track/pixel/${trackingId}`),
  
  // Wrap links with tracking
  wrapLinks: (trackingId, htmlContent) => 
    api.post('/track/wrap-links', { trackingId, htmlContent }),
};

// Mail Merge API
export const mailMergeApi = {
  // Parse CSV
  parseCSV: (csvContent) => 
    api.post('/mail-merge/parse-csv', { csvContent }),
  
  // Extract merge fields from content
  extractFields: (content) => 
    api.post('/mail-merge/extract-fields', { content }),
  
  // Validate recipients
  validate: (recipients, requiredFields) => 
    api.post('/mail-merge/validate', { recipients, requiredFields }),
  
  // Preview merged content
  preview: (subject, content, recipient) => 
    api.post('/mail-merge/preview', { subject, content, recipient }),
  
  // Get all campaigns
  getCampaigns: (page = 1, limit = 20) => 
    api.get('/mail-merge', { params: { page, limit } }),
  
  // Get campaign by ID
  getCampaign: (id) => 
    api.get(`/mail-merge/${id}`),
  
  // Create campaign
  create: (data) => 
    api.post('/mail-merge', data),
  
  // Start campaign
  start: (id) => 
    api.post(`/mail-merge/${id}/start`),
  
  // Cancel campaign
  cancel: (id) => 
    api.post(`/mail-merge/${id}/cancel`),
  
  // Delete campaign
  delete: (id) => 
    api.delete(`/mail-merge/${id}`),
};

// Two-Factor Auth API
export const twoFactorApi = {
  // Get 2FA status
  getStatus: () => api.get('/auth/2fa/status'),
  
  // Setup 2FA
  setup: () => api.post('/auth/2fa/setup'),
  
  // Enable 2FA
  enable: (token) => api.post('/auth/2fa/enable', { token }),
  
  // Disable 2FA
  disable: (token) => api.post('/auth/2fa/disable', { token }),
  
  // Verify token
  verify: (token) => api.post('/auth/2fa/verify', { token }),
  
  // Verify backup code
  verifyBackup: (code) => api.post('/auth/2fa/verify-backup', { code }),
  
  // Regenerate backup codes
  regenerateBackup: (token) => api.post('/auth/2fa/regenerate-backup', { token }),
};

export default api;
