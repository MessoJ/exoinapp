# ExoinAfrica Workspace Platform - Implementation Plan & Spec

## 1. Executive Summary
This document outlines the technical specification for the ExoinAfrica Workspace Platform. The platform serves as a central hub for email hosting, user management, and brand asset generation (documents, business cards, invoices). It leverages a microservices-ready architecture optimized for a single DigitalOcean Droplet (4GB RAM) while maintaining scalability.

## Implementation Progress

### ✅ Completed
- [x] **Phase 1**: Project Scaffolding (Monorepo, Frontend, Backend)
- [x] **Phase 2**: Core Backend & Database (PostgreSQL, MinIO, Auth, Prisma)
- [x] **Phase 3**: Frontend Integration (Dashboard, Forms, PDF Export)
- [x] **Phase 4**: Mail Module (IMAP/SMTP routes - mock mode for dev)
- [x] **Phase 5**: Nginx Configuration (reverse proxy ready)

### 🔧 Infrastructure Ready
- [x] PostgreSQL Database with Prisma ORM
- [x] MinIO Object Storage
- [x] Redis Cache/Queue
- [x] Nginx Reverse Proxy config
- [x] docker-mailserver config

### 📱 Frontend Pages
- [x] Login / Authentication
- [x] Dashboard with stats
- [x] Documents (List, Create, View, Edit, Delete)
- [x] Clients (List, Create, Edit, Delete)
- [x] Mail (Inbox, Compose, Read)
- [x] Settings (Company settings)
- [x] Users (Team management)
- [x] Brand Templates & Assets

### 🔌 Backend APIs
- [x] `/api/auth` - Authentication (JWT + Argon2)
- [x] `/api/documents` - Document CRUD
- [x] `/api/clients` - Client management
- [x] `/api/company` - Company settings & users
- [x] `/api/dashboard` - Stats & activity
- [x] `/api/pdf` - PDF generation (Puppeteer)
- [x] `/api/mail` - Email operations (mock mode)
- [x] `/api/assets` - File management

---

## 2. Architecture Overview

### 2.1 Infrastructure (Docker Compose)
We will use a containerized approach to ensure consistency and ease of deployment.
*   **Reverse Proxy**: Nginx (Handles SSL, routing to frontend/backend).
*   **Mail Server**: `docker-mailserver` (Postfix, Dovecot, SpamAssassin, ClamAV).
*   **Database**: PostgreSQL (User data, application state).
*   **Cache/Queue**: Redis (Session management, job queues for PDF generation).
*   **Object Storage**: MinIO (S3-compatible storage for generated PDFs and assets).
*   **Application Backend**: Node.js (Fastify) - Modular Monolith (Auth, Docs, Mail API).
*   **Frontend**: React (Vite) - Served as static assets via Nginx.

### 2.2 Service Boundaries (Microservices Strategy)
To optimize for the 4GB RAM limit while remaining "microservices-ready", we will deploy the backend as a **Modular Monolith**. This means distinct modules (Auth, Mail, Docs) run in the same Node.js process to save memory overhead, but are strictly separated in code.
*   **Auth Module**: Handles Registration, Login, JWT issuance.
*   **Mail Module**: Interacts with the Mail Server (via scripts/IMAP).
*   **Doc Module**: Handles PDF generation (Puppeteer) and Template rendering.

## 3. Technical Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Axios.
*   **Backend**: Node.js v22, Fastify (High performance), Prisma ORM, Zod (Validation).
*   **PDF Generation**: Puppeteer (Headless Chrome).
*   **Mail**: `docker-mailserver`.
*   **DevOps**: Docker, Docker Compose, GitHub Actions (CI/CD).

## 4. Detailed Feature Spec

### 4.1 User Management
*   **Registration**: User signs up -> System creates a DB record -> System executes script to create email account in `docker-mailserver`.
*   **Login**: JWT-based authentication.
*   **Role Management**: Admin vs. Standard User.

### 4.2 Workspace Dashboard
*   **Sidebar Navigation**: Mail, Documents, Assets, Settings.
*   **Home**: Quick stats (Unread emails, Recent docs).

### 4.3 Document Generation (The "Core")
*   **Templates**: Pre-coded React components (Invoices, Letterheads, etc.).
*   **Flow**:
    1.  User selects a template (e.g., "Invoice").
    2.  User fills a form (Client Name, Items, etc.).
    3.  **Preview**: Real-time React rendering on the client.
    4.  **Generate**:
        *   *Option A (Client)*: `html2canvas` + `jspdf` (Fast, no server load).
        *   *Option B (Server)*: JSON data sent to Backend -> Puppeteer renders PDF -> Saved to MinIO -> Link returned.

### 4.4 Email Client (Webmail Lite)
*   **Inbox**: Fetch emails via IMAP (using `imapflow`).
*   **Compose**: Send via SMTP (using `nodemailer`).
*   **Signatures**: Auto-inject the "ExoinEmailSignatures" HTML into outgoing mails.

## 5. Implementation Steps

### Phase 1: Project Scaffolding (Current Step)
1.  Set up Monorepo structure.
2.  Initialize Frontend (Vite + React).
3.  Migrate existing `src` components to Frontend.
4.  Initialize Backend (Fastify).

### Phase 2: Core Backend & Database
1.  Setup PostgreSQL & MinIO in Docker.
2.  Implement Auth (Prisma + Argon2 + JWT).
3.  Implement "Mock" Mail Server interactions (for dev).

### Phase 3: Frontend Integration
1.  Build Dashboard Layout.
2.  Create "Template Fillers" (Forms that update the React component state).
3.  Implement PDF Export.

### Phase 4: Mail Server Integration
1.  Deploy `docker-mailserver`.
2.  Connect Backend to Mail Server (IMAP/SMTP).

### Phase 5: Deployment
1.  Configure Nginx.
2.  Deploy to DigitalOcean.

## 6. Directory Structure
```
/
├── apps/
│   ├── frontend/       # React App
│   └── backend/        # Node.js API
├── infrastructure/     # Docker Compose, Nginx conf
├── packages/           # Shared types/utils (optional)
└── README.md
```
