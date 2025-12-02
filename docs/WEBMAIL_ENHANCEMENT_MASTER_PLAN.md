# Exoin Africa Webmail Enhancement Master Plan

## Executive Summary

This document outlines a comprehensive roadmap for transforming the Exoin Africa webmail system from a basic email interface into a modern, feature-rich email experience comparable to Gmail, Outlook, and other enterprise email solutions.

**Current State:** Basic IMAP-based webmail with compose, read, and folder navigation  
**Target State:** Full-featured webmail with AI assistance, smart features, and enterprise-grade capabilities

---

## Phase 1: Core Email Experience Enhancement

### 1.1 Modern Three-Pane Layout

**Implementation Priority:** HIGH  
**Estimated Effort:** 2-3 days

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Search Bar + Quick Actions + User Menu                    │
├──────────┬──────────────────────────┬──────────────────────────────┤
│          │                          │                              │
│  Folder  │    Email List            │    Email Preview/Reader      │
│  Tree    │    (Compact/Comfortable) │    (Full Email Content)      │
│          │                          │                              │
│  ─────── │    ☐ Subject Line       │    From: sender@example.com  │
│  Inbox   │       Sender | Time      │    To: me@exoin.africa       │
│  Starred │    ─────────────────     │    ─────────────────────     │
│  Sent    │    ☐ Another Email       │    Email body with full      │
│  Drafts  │       Preview text...    │    formatting, images,       │
│  Archive │                          │    attachments...            │
│  Trash   │                          │                              │
│          │                          │    [Reply] [Forward] [More]  │
│  Labels  │                          │                              │
│  ─────── │                          │                              │
│  + Work  │                          │                              │
│  + Personal                         │                              │
│                                     │                              │
└──────────┴──────────────────────────┴──────────────────────────────┘
```

**Features:**
- Resizable panes with drag handles
- Collapsible folder tree
- Keyboard navigation between panes
- Responsive design (collapses to 2-pane on smaller screens)
- Density settings: Comfortable / Cozy / Compact

**Files to Create/Modify:**
- `components/mail/MailLayout.jsx` - Main three-pane container
- `components/mail/FolderTree.jsx` - Folder navigation with labels
- `components/mail/EmailList.jsx` - Virtualized email list
- `components/mail/EmailPreview.jsx` - Email content viewer
- `components/mail/EmailListItem.jsx` - Individual email row

### 1.2 Keyboard Shortcuts

**Implementation Priority:** HIGH  
**Estimated Effort:** 1 day

| Shortcut | Action |
|----------|--------|
| `j` / `k` | Navigate up/down in email list |
| `o` / `Enter` | Open email |
| `u` | Return to email list |
| `r` | Reply |
| `a` | Reply all |
| `f` | Forward |
| `c` | Compose new email |
| `e` | Archive |
| `#` | Delete |
| `s` | Star/unstar |
| `l` | Label |
| `v` | Move to folder |
| `/` | Focus search |
| `?` | Show keyboard shortcuts |
| `Ctrl+Enter` | Send email |
| `Escape` | Close/cancel |

**Implementation:**
```jsx
// hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handler = (e) => {
      // Check for modifier keys
      const combo = [
        e.ctrlKey && 'ctrl',
        e.shiftKey && 'shift',
        e.altKey && 'alt',
        e.key.toLowerCase()
      ].filter(Boolean).join('+');
      
      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo]();
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
};
```

### 1.3 Dark Mode Support

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 1-2 days

- CSS variables for all colors
- Automatic detection of system preference
- Manual toggle in settings
- Consistent theming across all components
- Email content rendering with dark mode adaptation

**Implementation Strategy:**
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --accent-color: #f97316;
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: #334155;
  --accent-color: #fb923c;
}
```

---

## Phase 2: Conversation & Organization Features

### 2.1 Conversation Threading

**Implementation Priority:** HIGH  
**Estimated Effort:** 3-4 days

**Backend Changes:**
```prisma
// prisma/schema.prisma additions

model EmailThread {
  id            String    @id @default(cuid())
  subject       String
  participants  String[]
  lastMessageAt DateTime
  messageCount  Int       @default(1)
  isStarred     Boolean   @default(false)
  labels        EmailLabel[]
  emails        Email[]   @relation("ThreadEmails")
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId, lastMessageAt])
}

// Update Email model
model Email {
  // ... existing fields
  threadId      String?
  thread        EmailThread? @relation("ThreadEmails", fields: [threadId], references: [id])
  inReplyTo     String?      // Message-ID of parent email
  references    String[]     // Chain of Message-IDs
}
```

**Thread Detection Algorithm:**
1. Parse `In-Reply-To` and `References` headers
2. Match by normalized subject (remove RE:, FW:, etc.)
3. Match by participants within time window
4. Group related emails into threads

**UI Components:**
- Collapsed thread view in email list (shows count)
- Expanded thread view with all messages
- Quick reply inline within thread
- Thread actions (archive all, delete all, etc.)

### 2.2 Labels & Categories

**Implementation Priority:** HIGH  
**Estimated Effort:** 2 days

**Database Schema:**
```prisma
model EmailLabel {
  id          String   @id @default(cuid())
  name        String
  color       String   // Hex color code
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  emails      Email[]  @relation("EmailLabels")
  threads     EmailThread[]
  createdAt   DateTime @default(now())
  
  @@unique([userId, name])
}
```

**Predefined System Labels:**
- Primary (auto-categorized important emails)
- Social (social network notifications)
- Promotions (marketing emails)
- Updates (bills, receipts, notifications)
- Forums (mailing lists, forums)

**Features:**
- Create custom labels with colors
- Nested labels (Work/Project A, Work/Project B)
- Multiple labels per email
- Filter emails by label
- Bulk label operations
- Label suggestions based on content

### 2.3 Advanced Search

**Implementation Priority:** HIGH  
**Estimated Effort:** 2-3 days

**Search Operators:**
| Operator | Example | Description |
|----------|---------|-------------|
| `from:` | `from:john@example.com` | Emails from specific sender |
| `to:` | `to:team@exoin.africa` | Emails to specific recipient |
| `subject:` | `subject:invoice` | Search in subject line |
| `has:attachment` | `has:attachment` | Emails with attachments |
| `has:pdf` | `has:pdf` | Emails with PDF attachments |
| `is:starred` | `is:starred` | Starred emails |
| `is:unread` | `is:unread` | Unread emails |
| `is:read` | `is:read` | Read emails |
| `label:` | `label:work` | Emails with specific label |
| `before:` | `before:2024-01-01` | Emails before date |
| `after:` | `after:2024-01-01` | Emails after date |
| `size:` | `size:>5mb` | Emails larger than size |
| `""` | `"exact phrase"` | Exact phrase match |
| `-` | `-unsubscribe` | Exclude term |
| `OR` | `from:a OR from:b` | Either condition |

**Search UI:**
- Real-time search suggestions
- Search history
- Save searches as smart folders
- Advanced search builder modal

**Backend Implementation:**
```typescript
// services/emailSearchService.ts

interface SearchQuery {
  text?: string;
  from?: string[];
  to?: string[];
  subject?: string;
  hasAttachment?: boolean;
  attachmentType?: string;
  isStarred?: boolean;
  isRead?: boolean;
  labels?: string[];
  before?: Date;
  after?: Date;
  minSize?: number;
  maxSize?: number;
}

export async function searchEmails(userId: string, query: SearchQuery) {
  // Build Prisma query from search parameters
  const where: Prisma.EmailWhereInput = {
    userId,
    ...(query.text && {
      OR: [
        { subject: { contains: query.text, mode: 'insensitive' } },
        { textContent: { contains: query.text, mode: 'insensitive' } },
      ],
    }),
    ...(query.from && { from: { in: query.from } }),
    ...(query.hasAttachment && { attachments: { some: {} } }),
    // ... more conditions
  };
  
  return prisma.email.findMany({ where, orderBy: { date: 'desc' } });
}
```

---

## Phase 3: Smart Email Features

### 3.1 Undo Send

**Implementation Priority:** HIGH  
**Estimated Effort:** 1 day

**Configuration:**
- Delay options: 5, 10, 20, 30 seconds
- User-configurable in settings
- Visual countdown timer

**Implementation:**
```jsx
// Compose modal sends email to "outbox" with sendAt timestamp
const handleSend = async () => {
  const delay = userSettings.undoSendDelay || 10; // seconds
  const sendAt = new Date(Date.now() + delay * 1000);
  
  const email = await api.emails.queueSend({
    ...emailData,
    sendAt,
  });
  
  showToast({
    message: 'Message sent',
    action: {
      label: 'Undo',
      onClick: () => cancelSend(email.id),
    },
    duration: delay * 1000,
  });
};
```

**Backend:**
- Store emails in outbox with `sendAt` timestamp
- Background job processes outbox every second
- Cancel API removes from outbox before sendAt

### 3.2 Snooze Emails

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 1-2 days

**Snooze Options:**
- Later today (configurable time)
- Tomorrow morning
- This weekend
- Next week
- Pick date & time

**Implementation:**
```prisma
model Email {
  // ... existing fields
  snoozedUntil  DateTime?
  snoozedFromFolder String?
}
```

**Backend Job:**
```typescript
// jobs/unsnoozeEmails.ts
export async function processSnooze() {
  const now = new Date();
  const snoozedEmails = await prisma.email.findMany({
    where: {
      snoozedUntil: { lte: now },
    },
  });
  
  for (const email of snoozedEmails) {
    await prisma.email.update({
      where: { id: email.id },
      data: {
        snoozedUntil: null,
        folder: email.snoozedFromFolder || 'INBOX',
        isRead: false, // Mark as unread to resurface
      },
    });
    
    // Send notification to user
    await notifyUser(email.userId, {
      type: 'EMAIL_UNSNOOZE',
      emailId: email.id,
    });
  }
}
```

### 3.3 Priority Inbox

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 2-3 days

**Smart Categorization:**
1. **Important & Unread** - High priority based on:
   - Sender is in contacts
   - Previous email exchanges
   - Direct (not CC'd)
   - Contains urgent keywords
   
2. **Starred** - User-marked important

3. **Everything Else** - Lower priority

**ML-Based Priority (Future):**
- Train on user interactions (opens, replies, archives)
- Factor in time spent reading
- Sender relationship strength

### 3.4 Email Scheduling

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 1 day

**Features:**
- Schedule send for specific date/time
- Suggested times based on recipient timezone
- Edit/cancel scheduled emails
- Scheduled emails folder

**UI:**
- Dropdown next to Send button
- Date/time picker
- Quick options: Tomorrow morning, Monday morning, etc.

---

## Phase 4: AI Integration (Gemini Pro)

### 4.1 Smart Compose

**Implementation Priority:** HIGH  
**Estimated Effort:** 3-4 days

**Features:**
- Real-time writing suggestions as you type
- Complete sentences with Tab key
- Context-aware (considers email thread)
- Tone adjustment (formal, friendly, concise)

**Implementation:**
```typescript
// services/aiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getSmartComposeSuggestion(params: {
  currentText: string;
  emailContext?: string;
  tone?: 'formal' | 'friendly' | 'concise';
}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `
    You are an email assistant. Complete the following email text naturally.
    Context: ${params.emailContext || 'New email'}
    Tone: ${params.tone || 'professional'}
    Current text: "${params.currentText}"
    
    Provide ONLY the suggested completion (not the full text).
    Keep it brief (1-2 sentences max).
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

**Frontend Integration:**
- Debounced API calls (300ms after typing stops)
- Ghost text shown in lighter color
- Tab to accept, continue typing to dismiss

### 4.2 Smart Reply

**Implementation Priority:** HIGH  
**Estimated Effort:** 2 days

**Features:**
- 3 contextual quick reply options
- One-click response
- Editable before sending

**Implementation:**
```typescript
export async function generateSmartReplies(emailContent: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `
    Analyze this email and generate 3 short, appropriate replies.
    Each reply should be 1-2 sentences max.
    Vary the tone: positive, neutral, decline/redirect.
    
    Email: "${emailContent}"
    
    Return as JSON array: ["reply1", "reply2", "reply3"]
  `;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

### 4.3 Email Summarization

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 1-2 days

**Features:**
- Thread summary for long conversations
- Key points extraction
- Action items detection
- TL;DR for long emails

**UI:**
- "Summarize" button in thread view
- Expandable summary card
- Highlighted action items

### 4.4 Writing Assistance

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 2 days

**Features:**
- Grammar and spell check
- Tone analysis
- Clarity improvements
- Professional language suggestions
- Rewrite options:
  - Make more formal
  - Make more concise
  - Make friendlier
  - Fix grammar
  - Translate

### 4.5 Smart Categorization

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 2-3 days

**Auto-labeling based on content:**
- Invoices → Finance label
- Meeting invites → Calendar label
- Project discussions → Project name label
- Support tickets → Support label

**Spam detection enhancement:**
- AI-powered phishing detection
- Suspicious sender analysis

---

## Phase 5: Backend Infrastructure

### 5.1 WebSocket Real-Time Updates

**Implementation Priority:** HIGH  
**Estimated Effort:** 2 days

**Features:**
- New email notifications without polling
- Read status sync across devices
- Typing indicators in shared drafts
- Presence awareness

**Implementation:**
```typescript
// services/websocketService.ts
import { Server } from 'socket.io';

export function setupWebSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL },
  });
  
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    
    socket.join(`user:${userId}`);
    
    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });
  
  return {
    notifyNewEmail: (userId: string, email: any) => {
      io.to(`user:${userId}`).emit('email:new', email);
    },
    notifyEmailUpdate: (userId: string, emailId: string, changes: any) => {
      io.to(`user:${userId}`).emit('email:update', { emailId, changes });
    },
  };
}
```

### 5.2 Redis Caching

**Implementation Priority:** HIGH  
**Estimated Effort:** 1-2 days

**Cache Layers:**
- Email list cache (5 min TTL)
- Folder counts cache (1 min TTL)
- Search results cache (10 min TTL)
- User settings cache (1 hour TTL)

**Implementation:**
```typescript
// services/cacheService.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  
  async set(key: string, value: any, ttlSeconds = 300) {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },
  
  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  },
};

// Usage in email routes
const emails = await cache.get(`emails:${userId}:inbox`);
if (!emails) {
  const fresh = await fetchEmails(userId, 'INBOX');
  await cache.set(`emails:${userId}:inbox`, fresh, 300);
  return fresh;
}
return emails;
```

### 5.3 Background Jobs

**Implementation Priority:** HIGH  
**Estimated Effort:** 2 days

**Job Queue (BullMQ):**
- Email sync jobs
- Scheduled send processing
- Snooze processing
- AI processing (summarization, categorization)
- Attachment processing
- Search indexing

**Implementation:**
```typescript
// jobs/queue.ts
import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('email', { connection: redisConnection });

// Add jobs
await emailQueue.add('sync', { userId, folder: 'INBOX' }, { repeat: { every: 60000 } });
await emailQueue.add('send', { emailId, sendAt }, { delay: sendAt - Date.now() });

// Process jobs
new Worker('email', async (job) => {
  switch (job.name) {
    case 'sync':
      await syncEmails(job.data.userId, job.data.folder);
      break;
    case 'send':
      await sendScheduledEmail(job.data.emailId);
      break;
  }
}, { connection: redisConnection });
```

### 5.4 Full-Text Search (PostgreSQL)

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 2 days

**Database Setup:**
```sql
-- Add full-text search columns
ALTER TABLE "Email" ADD COLUMN search_vector tsvector;

-- Create index
CREATE INDEX email_search_idx ON "Email" USING GIN(search_vector);

-- Update trigger
CREATE FUNCTION email_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.subject, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.text_content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.from_address, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_search_trigger 
BEFORE INSERT OR UPDATE ON "Email"
FOR EACH ROW EXECUTE FUNCTION email_search_update();
```

---

## Phase 6: Security & Compliance

### 6.1 Two-Factor Authentication

**Implementation Priority:** HIGH  
**Estimated Effort:** 2 days

**Methods:**
- TOTP (Google Authenticator, Authy)
- SMS (backup)
- Backup codes

**Database Schema:**
```prisma
model UserSecurity {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  totpSecret    String?
  totpEnabled   Boolean  @default(false)
  backupCodes   String[] // Hashed
  lastLogin     DateTime?
  loginHistory  Json[]
}
```

### 6.2 Email Security Indicators

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 1-2 days

**Checks:**
- SPF validation
- DKIM signature verification
- DMARC compliance
- Suspicious sender detection
- Phishing link detection

**UI:**
- Security badge on emails
- Warning banners for suspicious emails
- "Report phishing" button

### 6.3 Encryption Options

**Implementation Priority:** LOW  
**Estimated Effort:** 3-4 days

**Features:**
- End-to-end encryption for sensitive emails
- S/MIME support
- PGP key management
- Encrypted attachment handling

---

## Phase 7: Additional Features

### 7.1 Email Templates

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 1-2 days

**Features:**
- Create/save templates
- Template categories
- Variable placeholders: {{name}}, {{company}}, {{date}}
- Quick insert in compose

### 7.2 Email Tracking (Optional)

**Implementation Priority:** LOW  
**Estimated Effort:** 1 day

**Features:**
- Read receipts (if recipient allows)
- Open tracking (optional)
- Link click tracking

### 7.3 Vacation Responder

**Implementation Priority:** MEDIUM  
**Estimated Effort:** 1 day

**Features:**
- Date range
- Custom message
- Only respond once per sender
- Exclude certain senders/domains

### 7.4 Mail Merge

**Implementation Priority:** LOW  
**Estimated Effort:** 2 days

**Features:**
- CSV upload for recipient list
- Template with placeholders
- Preview before send
- Scheduling for bulk sends
- Analytics (delivery, opens)

---

## Implementation Timeline

### Sprint 1 (Week 1-2): Foundation
- [ ] Three-pane layout
- [ ] Keyboard shortcuts
- [ ] Basic dark mode
- [ ] Email list virtualization

### Sprint 2 (Week 3-4): Organization
- [ ] Conversation threading
- [ ] Labels system
- [ ] Advanced search UI
- [ ] Search backend

### Sprint 3 (Week 5-6): Smart Features
- [ ] Undo send
- [ ] Email scheduling
- [ ] Snooze
- [ ] Priority inbox basics

### Sprint 4 (Week 7-8): AI Integration
- [ ] Gemini Pro setup
- [ ] Smart compose
- [ ] Smart reply
- [ ] Email summarization

### Sprint 5 (Week 9-10): Backend Infrastructure
- [ ] WebSocket implementation
- [ ] Redis caching
- [ ] Background jobs
- [ ] Full-text search

### Sprint 6 (Week 11-12): Security & Polish
- [ ] 2FA implementation
- [ ] Security indicators
- [ ] Email templates
- [ ] Performance optimization
- [ ] Testing & bug fixes

---

## Technical Stack Summary

### Frontend
- **Framework:** React 18+ with Vite
- **State Management:** React Query + Zustand
- **Styling:** Tailwind CSS
- **Components:** Radix UI primitives
- **Rich Text:** TipTap (upgrade from Quill)
- **Virtualization:** react-window or @tanstack/virtual

### Backend
- **Runtime:** Node.js with Fastify
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis (ioredis)
- **Queue:** BullMQ
- **WebSocket:** Socket.io
- **Email:** Nodemailer + IMAP

### AI
- **Provider:** Google Gemini Pro
- **SDK:** @google/generative-ai

### Infrastructure
- **Mail Server:** Mailu 2024.06
- **Storage:** MinIO for attachments
- **CDN:** CloudFlare (for static assets)

---

## Success Metrics

1. **User Engagement**
   - Daily active users
   - Average session duration
   - Emails sent per user

2. **Performance**
   - Page load time < 2s
   - Email list render < 100ms
   - Search results < 500ms

3. **Reliability**
   - 99.9% uptime
   - Email delivery rate > 99%
   - Zero data loss

4. **User Satisfaction**
   - Feature adoption rate
   - User feedback scores
   - Support ticket volume

---

## Appendix A: File Structure

```
apps/frontend/src/
├── components/
│   └── mail/
│       ├── MailLayout.jsx
│       ├── FolderTree.jsx
│       ├── EmailList.jsx
│       ├── EmailListItem.jsx
│       ├── EmailPreview.jsx
│       ├── EmailThread.jsx
│       ├── ComposeModal.jsx
│       ├── SearchBar.jsx
│       ├── LabelManager.jsx
│       ├── SmartReply.jsx
│       └── KeyboardShortcutsModal.jsx
├── hooks/
│   ├── useKeyboardShortcuts.js
│   ├── useEmailList.js
│   ├── useEmailSearch.js
│   └── useSmartCompose.js
├── stores/
│   ├── mailStore.js
│   └── settingsStore.js
└── pages/
    └── MailPage.jsx

apps/backend/src/
├── routes/
│   ├── mail.ts
│   ├── threads.ts
│   ├── labels.ts
│   ├── search.ts
│   └── ai.ts
├── services/
│   ├── imapService.ts
│   ├── smtpService.ts
│   ├── threadingService.ts
│   ├── searchService.ts
│   ├── aiService.ts
│   ├── cacheService.ts
│   └── websocketService.ts
├── jobs/
│   ├── queue.ts
│   ├── syncEmails.ts
│   ├── sendScheduled.ts
│   └── processSnooze.ts
└── middleware/
    └── rateLimiter.ts
```

---

## Appendix B: API Endpoints (New/Modified)

```
# Threads
GET    /api/mail/threads
GET    /api/mail/threads/:id
PATCH  /api/mail/threads/:id/star
DELETE /api/mail/threads/:id

# Labels
GET    /api/mail/labels
POST   /api/mail/labels
PUT    /api/mail/labels/:id
DELETE /api/mail/labels/:id
POST   /api/mail/emails/:id/labels

# Search
GET    /api/mail/search?q=...
GET    /api/mail/search/suggestions

# AI
POST   /api/ai/compose
POST   /api/ai/reply
POST   /api/ai/summarize
POST   /api/ai/categorize

# Scheduling
POST   /api/mail/schedule
GET    /api/mail/scheduled
DELETE /api/mail/scheduled/:id

# Snooze
POST   /api/mail/emails/:id/snooze
DELETE /api/mail/emails/:id/snooze
```

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Author: Development Team*
