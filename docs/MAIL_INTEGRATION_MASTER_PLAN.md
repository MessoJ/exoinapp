# Exoin Mail Integration Master Plan
## Building a World-Class, Gmail-Level Email Experience

**Date:** November 27, 2025  
**Last Updated:** November 27, 2025  
**Status:** ✅ Phase 1-2 Complete | 🔄 Phase 3-4 In Progress  
**Goal:** Create a fully integrated, professional email system that rivals Gmail/Outlook

---

## 📋 Executive Summary

The Exoin platform needs a unified email experience that:
1. ✅ **Works flawlessly** - IMAP/SMTP properly connected to Mailu server
2. ✅ **Matches Gmail/Outlook quality** - Professional UI/UX with templates
3. ✅ **Deeply integrated** - Email woven into every workspace workflow
4. 🔄 **Unified user management** - Email hosting and app users are ONE system

---

## ✅ COMPLETED - Phase 1: Core Issues Fixed

### 1.1 ✅ Encryption Key Fixed
**Problem:** `RangeError: Invalid key length` - Key wasn't exactly 32 bytes for AES-256  
**Solution:** Use SHA-256 hash to ensure consistent 32-byte key
```typescript
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();
```

### 1.2 ✅ IMAP Connection Working
- Tested with admin@exoinafrica.com - **SUCCESS**
- Found 5 folders: INBOX, Sent, Drafts, Junk, Trash
- Fetched 7 messages successfully
- Proper TLS configuration with Mailu

### 1.3 ✅ Email Sync Working
- Credentials encrypted and stored in database
- Folders synced from IMAP
- Messages fetched and displayed

---

## ✅ COMPLETED - Phase 2: Workspace Integration

### Dashboard Integration
- ✅ Email widget showing unread count and recent emails
- ✅ Quick action to compose email
- ✅ Email activity in dashboard feed
- ✅ Quick compose button in header

### Sidebar Integration
- ✅ Mail link with unread badge
- ✅ Email Hosting link with server icon
- ✅ Auto-refresh unread count every 60 seconds

### Document Integration
- ✅ "Email to Client" button on document view
- ✅ Pre-fills recipient, subject, and body with document details
- ✅ URL parameters for compose (/mail?compose=true&to=...)
- ✅ **Document PDF attachment support**
- ✅ "Create & Send Email" button on document create page

### Client Integration
- ✅ Email button on clients list page
- ✅ Email history tab on client edit page
- ✅ Client email history API endpoint

### Compose Enhancements
- ✅ Email templates (5 pre-built templates)
- ✅ Template selector in compose modal
- ✅ Document attachment indicator
- ✅ Templates: Invoice Reminder, Quotation Follow-up, Thank You, Project Update, Meeting Request

---

## 🎯 Feature Comparison Matrix

| Feature | Gmail | Outlook | Mailu Webmail | Exoin (Target) |
|---------|-------|---------|---------------|----------------|
| Compose with formatting | ✅ | ✅ | ✅ | ✅ |
| Attachments | ✅ | ✅ | ✅ | ✅ |
| Labels/Folders | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ⚠️ Basic | ✅ Advanced |
| Keyboard shortcuts | ✅ | ✅ | ❌ | ✅ |
| Conversation threading | ✅ | ✅ | ⚠️ Basic | ✅ |
| Scheduled sending | ✅ | ✅ | ❌ | ✅ |
| Email signatures | ✅ | ✅ | ✅ | ✅ Branded |
| Templates | ✅ | ✅ | ❌ | ✅ Integrated |
| Calendar integration | ✅ | ✅ | ❌ | 🔄 Phase 2 |
| Contact sync | ✅ | ✅ | ❌ | ✅ From clients |
| **Workspace Integration** | ❌ | ❌ | ❌ | ✅ Unique |

---

## 🏗️ Architecture

### Unified User & Email Model

```
┌─────────────────────────────────────────────────────────────┐
│                     EXOIN WORKSPACE                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   Users     │────▶│  Mailboxes   │────▶│   Domains    │ │
│  │  (Unified)  │     │ (Auto-sync)  │     │  (Verified)  │ │
│  └─────────────┘     └──────────────┘     └──────────────┘ │
│         │                    │                    │        │
│         ▼                    ▼                    ▼        │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │ Signatures  │     │    Emails    │     │  DNS/DKIM    │ │
│  │ (Branded)   │     │  (Synced)    │     │  (Auto)      │ │
│  └─────────────┘     └──────────────┘     └──────────────┘ │
│         │                    │                             │
│         ▼                    ▼                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            WORKSPACE INTEGRATIONS                    │   │
│  │  • Clients → Contacts auto-sync                     │   │
│  │  • Documents → Send as email attachment             │   │
│  │  • Invoices → Auto-email with tracking              │   │
│  │  • Dashboard → Email stats & notifications          │   │
│  │  • Templates → Quick-reply templates                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MAILU SERVER                             │
│  mail.exoinafrica.com:993 (IMAP) / :465 (SMTP)             │
│  Postfix + Dovecot + Rspamd + Admin API                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Implementation Plan

### Phase 1: Fix Core Issues (Immediate)

#### 1.1 Fix Encryption Key
```typescript
// Use SHA256 hash to ensure 32-byte key
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.MAIL_ENCRYPTION_KEY || 'exoin-mail-secret-key')
  .digest();
```

#### 1.2 Fix IMAP Connection
- Add better error logging
- Handle Mailu-specific folder names
- Add connection timeout handling

#### 1.3 Test Email Flow
- Test IMAP connection with proper credentials
- Verify folder structure from Mailu
- Test send/receive cycle

### Phase 2: World-Class Mail UI

#### 2.1 Gmail-Style Features
- [ ] Conversation threading (group emails by subject/thread)
- [ ] Smart compose suggestions
- [ ] Undo send (5-30 second window)
- [ ] Scheduled sending
- [ ] Read receipts
- [ ] Priority inbox (AI-sorted)
- [ ] Snooze emails
- [ ] Quick reply templates

#### 2.2 UI Enhancements
- [ ] Split-pane resizable layout
- [ ] Dark mode support
- [ ] Keyboard shortcuts overlay
- [ ] Swipe gestures on mobile
- [ ] Inline image preview
- [ ] Drag-drop attachments
- [ ] Email loading skeletons
- [ ] Offline mode with sync queue

### Phase 3: Deep Workspace Integration

#### 3.1 Client → Contact Sync
```javascript
// When a client is created/updated, auto-populate mail contacts
onClientCreate(client) → addToMailContacts(client.email, client.name)
```

#### 3.2 Document → Email Integration
```javascript
// Send invoice with one click
onDocumentSend(document) → {
  openCompose({
    to: document.client.email,
    subject: `Invoice ${document.documentNumber} - ${company.name}`,
    attachment: document.pdfUrl,
    body: emailTemplate('invoice', document)
  })
}
```

#### 3.3 Dashboard Notifications
```javascript
// Show mail stats on dashboard
- Unread count in sidebar
- Recent emails in activity feed
- "Email invoice to [client]" quick actions
```

#### 3.4 Email Signature Integration
```javascript
// Auto-append branded signature from signature settings
onCompose() → appendSignature(user.signatureHtml)
```

### Phase 4: Unified User & Email Hosting

#### 4.1 Merge User Creation with Mailbox
```javascript
// When creating a user in the app, also create mailbox
createUser(userData) → {
  // 1. Create app user
  const user = await prisma.user.create(userData);
  
  // 2. Auto-create mailbox in Mailu
  await mailuApi.createMailbox({
    email: `${userData.email}`,
    password: generateSecurePassword(),
    displayName: userData.firstName + ' ' + userData.lastName
  });
  
  // 3. Send welcome email with credentials
  await sendWelcomeEmail(user);
}
```

#### 4.2 Single Admin Interface
- Users Page shows both app user and mailbox info
- Password reset updates both app and mailbox
- User deactivation disables mailbox too

---

## 🎨 UI/UX Design Principles

### Mail Interface
1. **Clean, minimal** - No clutter, focus on content
2. **Responsive** - Works on desktop, tablet, mobile
3. **Fast** - Instant feedback, optimistic updates
4. **Branded** - Exoin colors (blue/orange) throughout
5. **Contextual** - Related actions always visible

### Integration Points
1. **Sidebar** - Unread badge, quick compose
2. **Dashboard** - Email activity widget
3. **Documents** - "Send to client" button
4. **Clients** - "View email history" tab
5. **Settings** - Unified mail & signature settings

---

## 🔧 Technical Requirements

### Backend
- Node.js with Fastify
- Prisma ORM with PostgreSQL
- imapflow for IMAP
- nodemailer for SMTP
- mailparser for parsing

### Frontend
- React with React Router
- Tailwind CSS + custom components
- Lucide React icons
- Rich text editor (TipTap or Slate)

### Email Server
- Mailu 2024.06 on DigitalOcean
- IMAP: 993 (SSL)
- SMTP: 465 (SSL)
- Admin API for automation

---

## 📊 Success Metrics

1. **Connection Success Rate:** > 99%
2. **Email Sync Speed:** < 2s for initial load
3. **Send Latency:** < 1s to queue
4. **UI Response Time:** < 100ms for interactions
5. **User Satisfaction:** "As good as Gmail" feedback

---

## 🚀 Execution Order

### Today (Priority 1)
1. ✅ Fix encryption key length error
2. ✅ Fix IMAP connection issues
3. ✅ Test full email flow
4. ✅ Add proper error handling

### This Week (Priority 2)
5. Enhance mail UI to Gmail standard
6. Add conversation threading
7. Integrate with documents
8. Add dashboard email widget

### Next Week (Priority 3)
9. Unify user and mailbox management
10. Add client → contact sync
11. Implement scheduled sending
12. Add keyboard shortcuts

---

## 🔐 Security Considerations

1. **Password Encryption:** AES-256-CBC with proper key derivation
2. **Token Refresh:** Regular IMAP token refresh
3. **Rate Limiting:** Prevent abuse
4. **Audit Logging:** Track all email actions
5. **Data Isolation:** Per-user mailbox separation

---

## 📝 Files to Modify

| File | Purpose |
|------|---------|
| `mailSyncService.ts` | Fix encryption, improve IMAP handling |
| `mail.ts` (routes) | Better error responses |
| `MailPage.jsx` | Gmail-quality UI |
| `emailHostingService.ts` | Connect to user management |
| `auth.ts` | Link user creation with mailbox |
| `DashboardHome.jsx` | Add email widget |
| `DocumentViewPage.jsx` | Add "email to client" |

---

*This plan will be executed systematically with testing at each step.*
