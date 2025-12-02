# Exoin Africa Workspace Platform - AI Coding Instructions

## Architecture Overview

This is a **modular monolith** business workspace platform with email hosting, document generation, and brand asset management. Optimized for a single DigitalOcean Droplet (4GB RAM).

```
apps/
├── backend/     # Fastify + TypeScript + Prisma (PostgreSQL)
├── frontend/    # React + Vite + Tailwind CSS + Zustand
infrastructure/  # Docker Compose configs (dev/prod/mail)
```

### Key Services Stack
- **API**: Fastify with JWT auth (`@fastify/jwt`, argon2)
- **Database**: PostgreSQL 15 via Prisma ORM
- **Storage**: MinIO (S3-compatible) for PDFs/assets
- **Cache/Queue**: Redis + BullMQ for job queues
- **Email**: IMAP (imapflow) for reading, SMTP (nodemailer/Brevo) for sending
- **PDF**: Puppeteer (headless Chrome)

## Development Workflow

### Starting the Environment
```powershell
# Start infrastructure (from project root)
cd infrastructure; docker-compose -f docker-compose.dev.yml up -d

# Backend (port 3000)
cd apps/backend; npm run dev

# Frontend (port 5173)
cd apps/frontend; npm run dev
```

### Database Operations
```powershell
# Migrations
cd apps/backend
npx prisma migrate dev --name <migration_name>
npx prisma generate

# Seeding
npm run seed  # or: npx ts-node prisma/seed.ts
```

## Code Conventions

### Backend (TypeScript)
- **Routes**: `apps/backend/src/routes/<domain>.ts` - Fastify plugin pattern
- **Services**: `apps/backend/src/services/<domain>Service.ts` - Business logic singletons
- **Auth guard**: Use `preHandler: [(fastify as any).authenticate]` on protected routes
- **Validation**: Zod schemas for request/response validation
- **Prisma client**: Import from `import { prisma } from '../index';`

**Route pattern example** (`routes/auth.ts`):
```typescript
export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => { /* ... */ });
  
  fastify.get('/me', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = (request as any).user;  // JWT payload
    // ...
  });
}
```

### Frontend (React + JSX)
- **Pages**: `apps/frontend/src/pages/<Name>Page.jsx`
- **Components**: `apps/frontend/src/components/<category>/<Component>.jsx`
- **State**: Zustand stores in `stores/` (see `mailStore.js` for patterns)
- **API calls**: Centralized in `lib/api.js` using axios with auth interceptor
- **Styling**: Tailwind CSS with custom colors in `tailwind.config.js`
- **Icons**: Lucide React (`lucide-react`) and Heroicons (`@heroicons/react`)

**API pattern** (`lib/api.js`):
```javascript
export const mailApi = {
  getMessages: (folder, page, limit, search) => 
    api.get('/mail/messages', { params: { folder, page, limit, search } }),
  send: (data) => api.post('/mail/send', data),
};
```

**Auth context pattern**:
```javascript
const { user, login, logout, isAuthenticated } = useAuth();
// Token stored in localStorage as 'exoin_token'
```

### Prisma Schema Patterns
Located at `apps/backend/prisma/schema.prisma`:
- Models use UUIDs as primary keys: `id String @id @default(uuid())`
- Timestamps: `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt`
- Enums defined inline: `enum UserRole { ADMIN MANAGER STAFF }`
- Relations use explicit foreign keys with `@relation` decorators

## Key Feature Domains

### Email System (`/api/mail/*`)
- **Sync**: IMAP-based email fetch via `imapService.ts`
- **Send**: SMTP via Brevo relay, supports undo-send (outbox queue)
- **Features**: Snooze, priority inbox, templates, mail merge, tracking pixels
- **User credentials**: Per-user mailboxes linked via `Mailbox` model

### Email Hosting (`/api/email-hosting/*`)
- **Domains**: DNS verification (SPF, DKIM, DMARC), catch-all support
- **Mailboxes**: Quota management, auto-provisioning on user creation
- **Settings model**: `EmailHostingSettings` for company-wide defaults

### Documents (`/api/documents/*`, `/api/pdf/*`)
- **Types**: Invoice, Quotation, Letterhead, Receipt
- **PDF generation**: Puppeteer renders React template → stored in MinIO
- **Templates**: Configurable per-company in `Template` model

### Authentication (`/api/auth/*`)
- **Traditional**: Email/password with argon2 hashing
- **SSO**: Google, Microsoft, Keycloak, generic OIDC via `ssoService.ts`
- **2FA**: TOTP with backup codes via `twoFactorService.ts`

## Environment Variables (Backend)
Key variables in `apps/backend/.env`:
```dotenv
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  # Brevo SMTP
IMAP_HOST, IMAP_PORT                         # Mail reading
MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY
REDIS_URL                                    # Optional, enables caching/queues
```

## Testing & Debugging
- **SMTP test**: `node apps/backend/debug-smtp.js`
- **IMAP test**: `npx ts-node apps/backend/test-imap.ts`
- **Health check**: `GET /health` returns `{ status: 'ok', timestamp: '...' }`

---

## Deployment & Infrastructure

### Docker Compose Configurations
| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Local dev: PostgreSQL + MinIO only |
| `docker-compose.yml` | Production: Full stack with Nginx, Redis, backend |
| `docker-compose.mail.yml` | Mailu email server stack |

### Production Deployment (DigitalOcean)
```powershell
# Build frontend
cd apps/frontend; npm run build

# Start full stack
cd infrastructure; docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

### Mail Server (Mailu)
Self-hosted email via `docker-compose.mail.yml`:
- **Admin UI**: `https://mail.yourdomain.com/admin`
- **Webmail**: `https://mail.yourdomain.com/webmail`
- **IMAP/SMTP**: Connect backend via `IMAP_HOST=mailu-imap`, `SMTP_HOST=mailu-smtp`

Required DNS records (MX, SPF, DKIM, DMARC) - see `EMAIL_HOSTING_GUIDE.md`.

### Gmail Deliverability Requirements
For emails to be accepted by Gmail, the following are **critical**:

1. **PTR Record** (Reverse DNS): Server IP must resolve to mail hostname
2. **SPF**: Use `-all` (hard fail) not `~all` for better reputation
3. **DKIM**: 2048-bit RSA key minimum (auto-generated)
4. **DMARC**: Use `p=quarantine` or `p=reject` policy
5. **Blacklist-free**: Server IP not on Spamhaus, Barracuda, etc.

**API Endpoints for Gmail checks**:
```javascript
// Check all Gmail requirements
emailHostingApi.checkGmailDeliverability(domainId)

// Individual checks
emailHostingApi.checkPTR(serverIP, hostname)
emailHostingApi.checkBlacklists(serverIP)
emailHostingApi.upgradeDmarc(domainId, 'quarantine')
```

---

## Brand Template System

### Template Components (`apps/frontend/src/components/templates/`)
Pre-designed React components for branded documents:

| Component | Purpose |
|-----------|---------|
| `ExoinInvoices.jsx` | Invoice template with line items, totals |
| `ExoinQuotations.jsx` | Quote/proposal template |
| `ExoinLetterheadAlternatives.jsx` | Official letterhead variants |
| `ExoinBusinessCardAlternatives.jsx` | Business card designs |
| `ExoinEmailSignatures.jsx` | HTML email signature generator |
| `Logo.jsx` | Reusable logo with variants (`default`, `dark`, `monochrome`) |

### Creating New Templates
1. Create component in `apps/frontend/src/components/templates/`
2. Export a `*Template` component accepting `data` and `mode` props
3. Add route in `App.jsx` under `/templates/` or `/assets/`
4. For PDF export, ensure A4 dimensions: `width: 595px, min-height: 842px`

**Logo usage pattern**:
```jsx
import { Logo } from '../components/templates/Logo';
// Variants: 'default' | 'dark' | 'monochrome'
<Logo variant="default" className="h-12" />
```

**Invoice/Document pattern** (`InvoiceTemplate`):
```jsx
<InvoiceTemplate
  mode="view"           // 'view' | 'edit'
  data={invoiceData}    // { number, date, client, items[], subtotal, tax, total }
  onUpdate={handleUpdate}
  showTotals={true}
  signature={userSignature}
/>
```

### Brand Colors (Tailwind config)
- **Primary Navy**: `#1E3A8A` (`bg-blue-900`)
- **Accent Orange**: `#F97316` (`bg-orange-500`)
- **Text Dark**: `#0F172A` (`text-slate-900`)

---

## WebSocket Real-time Features

### Enabling WebSockets
Set `ENABLE_WEBSOCKET=true` in backend `.env`. WebSocket service auto-initializes on server start.

### Client Connection Pattern
```javascript
// Frontend: Connect after auth
socket.emit('authenticate', { userId, token });

// Listen for real-time events
socket.on('email:new', (data) => { /* new email notification */ });
socket.on('sync:complete', (data) => { /* sync finished */ });
socket.on('snooze:complete', (data) => { /* snoozed email returned */ });
```

### Available Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `email:new` | Server→Client | New email received |
| `email:updated` | Server→Client | Email flags changed |
| `folder:updated` | Server→Client | Folder unread count changed |
| `sync:complete` | Server→Client | IMAP sync finished |
| `snooze:complete` | Server→Client | Snoozed email returned to inbox |
| `email:markRead` | Client→Server | Sync read status across devices |

### Backend Notification Usage
```typescript
import { websocketService } from './services/websocketService';

// Notify user of new email
websocketService.notifyNewEmail(userId, {
  id: email.id,
  subject: email.subject,
  fromAddress: email.fromAddress,
  folder: 'INBOX'
});
```

---

## Important File References
| Concept | Primary File |
|---------|-------------|
| API routes registration | `apps/backend/src/index.ts` |
| Database schema | `apps/backend/prisma/schema.prisma` |
| Frontend routing | `apps/frontend/src/App.jsx` |
| API client | `apps/frontend/src/lib/api.js` |
| Mail state management | `apps/frontend/src/stores/mailStore.js` |
| Docker production | `infrastructure/docker-compose.yml` |
| Mailu mail server | `infrastructure/docker-compose.mail.yml` |
| Brand logo component | `apps/frontend/src/components/templates/Logo.jsx` |
| WebSocket service | `apps/backend/src/services/websocketService.ts` |
