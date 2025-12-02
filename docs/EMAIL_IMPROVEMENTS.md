# 📧 Email System Improvements Guide

## Executive Summary

This document outlines a comprehensive plan to upgrade the ExoinApp email system from a **simulated internal messaging system** to a **world-class production email platform** capable of sending real emails to external recipients.

---

## 🔍 Current State Analysis

### What Works
- ✅ Internal user-to-user messaging (simulates delivery within system)
- ✅ Email folders (Inbox, Sent, Drafts, Trash, Spam, Archive)
- ✅ Email composition with rich text editing
- ✅ Star, labels, and bulk actions
- ✅ Search functionality
- ✅ Email signature integration
- ✅ Pagination and filtering
- ✅ Priority levels and scheduling (UI only)

### Current Limitations
- ❌ **No real SMTP integration** - emails only work between users in the database
- ❌ No email delivery to external addresses (Gmail, Outlook, etc.)
- ❌ No delivery status tracking
- ❌ No email templates for transactional emails
- ❌ No attachment storage/upload
- ❌ No email queue for reliability
- ❌ No bounce handling
- ❌ No unsubscribe mechanism
- ❌ No email analytics

---

## 🎯 Improvement Plan

### Phase 1: Backend Email Service (Priority: Critical)

#### 1.1 SMTP Configuration

Create a dedicated email service using Nodemailer:

**File: `apps/backend/src/services/emailService.ts`**

```typescript
import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
    contentType?: string;
  }>;
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
}

class EmailService {
  private transporter: Transporter;
  private fromAddress: string;
  private fromName: string;

  constructor() {
    this.fromAddress = process.env.SMTP_FROM_EMAIL || 'noreply@exoinafrica.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'Exoin Africa';
    this.initTransporter();
  }

  private initTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<{ messageId: string; accepted: string[] }> {
    const result = await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromAddress}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc?.join(', '),
      bcc: options.bcc?.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
      replyTo: options.replyTo,
      priority: options.priority,
    });

    return {
      messageId: result.messageId,
      accepted: result.accepted as string[],
    };
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
```

#### 1.2 Environment Variables

Add to `.env`:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@exoinafrica.com
SMTP_FROM_NAME=Exoin Africa
```

**Gmail App Password Setup:**
1. Enable 2-Step Verification on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Use this password as SMTP_PASS

#### 1.3 Email Queue System

Add reliable email delivery with queue:

**Schema Addition:**
```prisma
model EmailQueue {
  id            String       @id @default(uuid())
  to            String[]
  cc            String[]
  bcc           String[]
  subject       String
  html          String
  text          String?
  
  status        EmailStatus  @default(PENDING)
  attempts      Int          @default(0)
  maxAttempts   Int          @default(3)
  lastError     String?
  
  scheduledAt   DateTime?
  processedAt   DateTime?
  
  userId        String
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum EmailStatus {
  PENDING
  PROCESSING
  SENT
  FAILED
  BOUNCED
}
```

---

### Phase 2: Database Enhancements

#### 2.1 SMTP Settings Per Company

```prisma
model Company {
  // ... existing fields ...
  
  // SMTP Settings (for custom email domains)
  smtpHost        String?
  smtpPort        Int?         @default(587)
  smtpSecure      Boolean      @default(false)
  smtpUser        String?
  smtpPass        String?      // Encrypted in production
  smtpFromEmail   String?
  smtpFromName    String?
  smtpVerified    Boolean      @default(false)
}
```

#### 2.2 Delivery Tracking

```prisma
model EmailDelivery {
  id            String          @id @default(uuid())
  emailId       String
  email         Email           @relation(fields: [emailId], references: [id])
  
  recipient     String
  status        DeliveryStatus  @default(PENDING)
  
  openedAt      DateTime?
  clickedAt     DateTime?
  bouncedAt     DateTime?
  bounceReason  String?
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

enum DeliveryStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  COMPLAINED
}
```

#### 2.3 Email Templates

```prisma
model EmailTemplate {
  id            String    @id @default(uuid())
  name          String
  subject       String
  htmlContent   String
  textContent   String?
  
  variables     String[]  // e.g., ["recipientName", "invoiceNumber"]
  
  isActive      Boolean   @default(true)
  isDefault     Boolean   @default(false)
  
  companyId     String
  company       Company   @relation(fields: [companyId], references: [id])
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

### Phase 3: Security & Validation

#### 3.1 Email Validation

```typescript
import { z } from 'zod';

const emailSchema = z.object({
  to: z.array(z.string().email()).min(1, 'At least one recipient required'),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1).max(998), // RFC 5322 limit
  html: z.string().max(10000000), // 10MB limit
  text: z.string().max(5000000).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});
```

#### 3.2 Rate Limiting

```typescript
// Rate limit: 100 emails per hour per user
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 100;

const checkRateLimit = async (userId: string): Promise<boolean> => {
  const recentEmails = await prisma.email.count({
    where: {
      userId,
      folder: 'SENT',
      createdAt: {
        gte: new Date(Date.now() - RATE_LIMIT_WINDOW)
      }
    }
  });
  
  return recentEmails < RATE_LIMIT_MAX;
};
```

#### 3.3 HTML Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizeEmailHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'img',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
      'div', 'span', 'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'style', 'class',
      'width', 'height', 'border', 'cellpadding', 'cellspacing'
    ],
  });
};
```

#### 3.4 Attachment Security

```typescript
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_TOTAL_ATTACHMENTS_SIZE = 50 * 1024 * 1024; // 50MB

const validateAttachment = (file: { mimeType: string; size: number }) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
    throw new Error(`File type ${file.mimeType} not allowed`);
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error('File size exceeds 25MB limit');
  }
};
```

---

### Phase 4: Frontend Improvements

#### 4.1 Enhanced Compose Modal

**New Features:**
- Drag-and-drop attachment upload
- Contact autocomplete from clients database
- Real-time email validation
- Delivery confirmation dialog
- Template selection
- Attachment preview

#### 4.2 Delivery Status Indicators

```jsx
const DeliveryStatus = ({ status }) => {
  const statusConfig = {
    PENDING: { icon: Clock, color: 'text-yellow-500', label: 'Sending...' },
    SENT: { icon: Check, color: 'text-blue-500', label: 'Sent' },
    DELIVERED: { icon: CheckCheck, color: 'text-green-500', label: 'Delivered' },
    OPENED: { icon: Eye, color: 'text-green-600', label: 'Opened' },
    BOUNCED: { icon: AlertTriangle, color: 'text-red-500', label: 'Bounced' },
  };
  
  const config = statusConfig[status] || statusConfig.PENDING;
  
  return (
    <span className={`flex items-center gap-1 ${config.color}`}>
      <config.icon size={14} />
      {config.label}
    </span>
  );
};
```

#### 4.3 Contact Suggestions

```jsx
const ContactSuggestions = ({ query, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  
  useEffect(() => {
    if (query.length >= 2) {
      clientsApi.search(query).then(res => setSuggestions(res.data));
    }
  }, [query]);
  
  return (
    <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-lg mt-1 z-50">
      {suggestions.map(contact => (
        <button
          key={contact.id}
          onClick={() => onSelect(contact.email)}
          className="w-full px-4 py-2 text-left hover:bg-slate-50"
        >
          <div className="font-medium">{contact.name}</div>
          <div className="text-sm text-slate-500">{contact.email}</div>
        </button>
      ))}
    </div>
  );
};
```

---

### Phase 5: API Enhancements

#### 5.1 Updated Send Endpoint

```typescript
fastify.post('/send', {
  preHandler: [(fastify as any).authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['to', 'subject'],
      properties: {
        to: { type: 'array', items: { type: 'string', format: 'email' } },
        cc: { type: 'array', items: { type: 'string', format: 'email' } },
        bcc: { type: 'array', items: { type: 'string', format: 'email' } },
        subject: { type: 'string', minLength: 1 },
        html: { type: 'string' },
        text: { type: 'string' },
        priority: { enum: ['low', 'normal', 'high'] },
        scheduledAt: { type: 'string', format: 'date-time' },
        attachments: { type: 'array' },
      },
    },
  },
}, async (request, reply) => {
  // 1. Validate rate limit
  // 2. Sanitize HTML content
  // 3. Send via SMTP
  // 4. Save to database
  // 5. Return confirmation
});
```

#### 5.2 New Endpoints

```typescript
// SMTP Settings
GET  /api/mail/settings          // Get SMTP configuration
PUT  /api/mail/settings          // Update SMTP settings
POST /api/mail/settings/verify   // Test SMTP connection

// Templates
GET  /api/mail/templates         // List email templates
POST /api/mail/templates         // Create template
PUT  /api/mail/templates/:id     // Update template
DELETE /api/mail/templates/:id   // Delete template

// Delivery Tracking
GET  /api/mail/messages/:id/delivery  // Get delivery status
```

---

## 🔧 Implementation Checklist

### Backend (Priority Order)

- [ ] Create `emailService.ts` with Nodemailer
- [ ] Add SMTP environment variables
- [ ] Update `/send` endpoint for real SMTP
- [ ] Add email queue table to schema
- [ ] Implement rate limiting
- [ ] Add HTML sanitization
- [ ] Add delivery tracking
- [ ] Add SMTP settings per company
- [ ] Add email templates support
- [ ] Add attachment upload/storage

### Frontend

- [ ] Add delivery status indicators
- [ ] Implement contact autocomplete
- [ ] Add drag-drop attachments
- [ ] Add template selection
- [ ] Add SMTP settings page
- [ ] Add email analytics dashboard

### Testing

- [ ] Test SMTP connection
- [ ] Send test email to external address
- [ ] Verify delivery tracking
- [ ] Test rate limiting
- [ ] Test attachment handling

---

## 📊 Testing Plan

### Test Email Delivery

1. Configure SMTP with Gmail App Password
2. Send email to `mesofrancis49@gmail.com`
3. Verify email arrives in inbox
4. Check sender name and formatting
5. Test with attachments
6. Test with HTML content

### Load Testing

- Send 10 emails in sequence
- Verify rate limiting works
- Test queue processing
- Monitor for failures

---

## 🚀 Quick Start Implementation

### Step 1: Install Dependencies
```bash
cd apps/backend
npm install isomorphic-dompurify @types/dompurify
```

### Step 2: Create Email Service
Create `apps/backend/src/services/emailService.ts`

### Step 3: Update Environment
Add SMTP credentials to `.env`

### Step 4: Update Mail Route
Modify `/send` endpoint to use real SMTP

### Step 5: Test
```bash
# Run the backend
npm run dev

# Send a test email via the UI
```

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| Email Delivery Rate | > 98% |
| Delivery Time | < 30 seconds |
| Bounce Rate | < 2% |
| User Satisfaction | High |

---

## 🔒 Security Considerations

1. **Never log email content** in production
2. **Encrypt SMTP passwords** in database
3. **Implement SPF/DKIM/DMARC** for domain
4. **Rate limit** to prevent abuse
5. **Sanitize all HTML** to prevent XSS
6. **Validate attachments** for malware
7. **Use TLS** for SMTP connections

---

## 📝 Next Steps

1. ✅ Research complete
2. ✅ Documentation complete
3. 🔄 Implement email service
4. ⏳ Configure SMTP
5. ⏳ Test email delivery
6. ⏳ Deploy to production

---

*Last Updated: January 2025*
*Author: ExoinApp Development Team*
