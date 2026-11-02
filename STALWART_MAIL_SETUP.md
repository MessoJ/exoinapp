# Stalwart Mail Server Setup & Architecture Guide

## 1. Why Stalwart Mail Server Replaced Mailu 2.0

| Feature | Legacy Mailu 2.0 | Modern Stalwart Mail Server |
| :--- | :--- | :--- |
| **Containers** | 8 micro-containers (`front`, `admin`, `imap`, `smtp`, `rspamd`, `webmail`, `redis`, `db`) | **1 single unified container** (`stalwartlabs/mail-server:latest`) |
| **RAM Footprint** | ~1,500 MB – 2,500 MB | **< 100 MB** (written in safe, high-performance Rust) |
| **Port Conflicts** | Hijacks host ports `80` & `443`, breaking web apps | **Admin UI on port `8081`**, mail ports isolated |
| **Protocols** | IMAP4, SMTP, POP3 | **JMAP, IMAP4rev2, SMTP/SMTPS, POP3, ManageSieve** |
| **Spam & Security** | External Rspamd + Redis dependencies | **Built-in Sieve, Bayesian filters, DKIM, DMARC, SPF & ARC** |
| **REST API** | Fragile internal Python admin API | **Full modern REST & JMAP for Administration API** |
| **TLS/Certificates**| Complex certbot scripts | **Built-in automatic ACME (Let's Encrypt) support** |

---

## 2. Quickstart Deployment

### Starting the Stalwart Mail Server:
```bash
# Navigate to infrastructure directory
cd infrastructure

# Start Stalwart container
docker compose -f docker-compose.stalwart.yml up -d
```

### Accessing the Web Admin UI:
- **URL**: `http://<your-server-ip>:8081` (or `https://mail.exoinafrica.com:8081`)
- **Username**: `admin`
- **Password**: `ExoinMail@2026!` (configured in `.env.stalwart.example`)

---

## 3. Required DNS Records for `exoinafrica.com`

To ensure 10/10 mail deliverability (preventing spam flags in Gmail and Outlook), add these records in your DNS provider (e.g., Cloudflare, Route53, Namecheap):

| Record Type | Host / Name | Target / Value | Priority / TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `mail` | `<YOUR_SERVER_PUBLIC_IP>` | Auto / 300 | Mail server address |
| **MX** | `@` | `mail.exoinafrica.com` | Priority: `10` | Mail routing |
| **TXT** | `@` | `v=spf1 mx a:mail.exoinafrica.com ~all` | Auto | SPF Sender Authorization |
| **TXT** | `mail._domainkey` | `v=DKIM1; k=rsa; p=<DKIM_PUBLIC_KEY>` | Auto | DKIM Cryptographic Signature |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@exoinafrica.com` | Auto | DMARC Enforcement & Reporting |
| **TXT** | `@` | `exoin-verify-<CODE>` | Auto | Exoin Domain Ownership Verification |

---

## 4. Backend & Webmail Client Integration

Exoin Africa's backend integrates seamlessly with Stalwart:
1. **IMAP Reading**: Connects via port `993` (TLS) or port `143` (STARTTLS) with AES-256 encrypted credential storage.
2. **SMTP Sending**: Connects via port `587` (Submission) or port `465` (SMTPS).
3. **Workspace Mailbox Mode**: When running in offline or demo development, Exoin automatically provides local workspace mail synchronization, ensuring zero disruption.
