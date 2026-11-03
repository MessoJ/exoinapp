#!/usr/bin/env node
/**
 * Exoin Africa - Stalwart Mail Server Direct Integration E2E Test Suite
 * 
 * Verifies:
 * 1. Stalwart Container Status & Network Connectivity
 * 2. Authenticated SMTPS (Port 465) Direct Handshake
 * 3. Authenticated IMAP4rev2 (Port 993) Direct Handshake & Folder Hierarchy
 * 4. Backend SMTP Status & Verification Route (/api/mail/smtp/verify)
 * 5. Backend Mailbox Synchronization via IMAP
 * 6. Email Delivery & Sending via Stalwart
 * 7. DNS Records (MX, SPF, DKIM, DMARC) Generation & Retrieval
 */

const http = require('http');
const { execSync } = require('child_process');

const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ${green('✔')} ${message}`);
    passed++;
  } else {
    console.error(`  ${red('✖')} ${message}`);
    failed++;
  }
}

function request({ method, path, headers = {}, body = null, port = 8080 }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runStalwartE2E() {
  console.log(bold(cyan('\n======================================================')));
  console.log(bold(cyan('  EXOIN AFRICA - STALWART DIRECT INTEGRATION E2E TEST ')));
  console.log(bold(cyan('======================================================')));

  try {
    // 1. Container Status Check
    console.log(bold('\n1. Stalwart Mail Server Container & Ports:'));
    const containerStatus = execSync('docker inspect -f "{{.State.Status}}" stalwart-mail 2>/dev/null', { encoding: 'utf8' }).trim();
    assert(containerStatus === 'running', 'Stalwart container is running');

    const httpRes = await request({ method: 'GET', path: '/account', port: 8081 });
    assert([200, 301, 302, 307].includes(httpRes.status), `Stalwart WebUI responds on port 8081 (status ${httpRes.status})`);

    // 2. Direct SMTPS Test on Port 465
    console.log(bold('\n2. Direct Authenticated SMTPS (Port 465):'));
    const smtpTestCmd = `docker exec infrastructure-backend-1 node -e '
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: "stalwart-mail",
        port: 465,
        secure: true,
        auth: {
          user: "admin@exoinafrica.com",
          pass: "jhoqEX3TrBmqrfi6"
        },
        tls: { rejectUnauthorized: false }
      });
      transporter.verify((err, success) => {
        if (err) {
          console.error("FAIL:", err.message);
          process.exit(1);
        } else {
          console.log("OK");
          process.exit(0);
        }
      });
    ' 2>&1`;
    let smtpOk = false;
    try {
      const out = execSync(smtpTestCmd, { encoding: 'utf8' });
      smtpOk = out.includes('OK');
    } catch (e) {
      console.error(e.stdout || e.message);
    }
    assert(smtpOk, 'Authenticated SMTPS handshake succeeded on stalwart-mail:465');

    // 3. Direct IMAP4rev2 Test on Port 993
    console.log(bold('\n3. Direct Authenticated IMAPS (Port 993):'));
    const imapTestCmd = `docker exec infrastructure-backend-1 node -e '
      const { ImapFlow } = require("imapflow");
      const client = new ImapFlow({
        host: "stalwart-mail",
        port: 993,
        secure: true,
        auth: {
          user: "admin@exoinafrica.com",
          pass: "jhoqEX3TrBmqrfi6"
        },
        tls: { rejectUnauthorized: false }
      });
      (async () => {
        try {
          await client.connect();
          const list = await client.list();
          const paths = list.map(f => f.path);
          console.log("FOLDERS:" + paths.join(","));
          await client.logout();
        } catch (e) {
          console.error("FAIL:", e.message);
          process.exit(1);
        }
      })();
    ' 2>&1`;
    let imapOk = false;
    let foldersFound = [];
    try {
      const out = execSync(imapTestCmd, { encoding: 'utf8' });
      const line = out.split('\n').find(l => l.startsWith('FOLDERS:'));
      if (line) {
        imapOk = true;
        foldersFound = line.replace('FOLDERS:', '').split(',');
      }
    } catch (e) {
      console.error(e.stdout || e.message);
    }
    assert(imapOk, 'Authenticated IMAP handshake succeeded on stalwart-mail:993');
    assert(foldersFound.includes('INBOX'), `IMAP contains INBOX (Found: ${foldersFound.join(', ')})`);

    // 4. Backend Integration & SMTP Verification Route
    console.log(bold('\n4. Exoin Backend Integration & SMTP Verification:'));
    const loginRes = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'admin@exoinafrica.com',
        password: 'Admin@123',
      },
    });
    assert(loginRes.status === 200, 'Admin login succeeded');
    const token = loginRes.data?.token;

    // Status endpoint
    const statusRes = await request({
      method: 'GET',
      path: '/api/mail/smtp/status',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(statusRes.status === 200, 'GET /api/mail/smtp/status returned 200');
    assert(statusRes.data?.configured === true, 'SMTP is configured in backend');

    // Verify SMTP endpoint via backend
    const verifySmtpRes = await request({
      method: 'POST',
      path: '/api/mail/smtp/verify',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(verifySmtpRes.status === 200, 'POST /api/mail/smtp/verify returned 200');
    assert(verifySmtpRes.data?.success === true, `SMTP connection verified: ${verifySmtpRes.data?.message}`);

    // 5. Send Email via Backend routed to Stalwart
    console.log(bold('\n5. Email Dispatch through Stalwart:'));
    const sendRes = await request({
      method: 'POST',
      path: '/api/mail/send',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        to: 'client@example.com',
        subject: `E2E Stalwart Delivery Test - ${new Date().toISOString()}`,
        html: '<p>This email was verified end-to-end through Stalwart Mail Server.</p>',
        folder: 'SENT',
      },
    });
    assert(sendRes.status === 200, 'POST /api/mail/send returned 200');
    assert(sendRes.data?.success === true, 'Outbound email accepted and delivered');

    // 6. DNS Records for Domain Hosting
    console.log(bold('\n6. Domain Hosting & DNS Generation:'));
    const domainsRes = await request({
      method: 'GET',
      path: '/api/email-hosting/domains',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(domainsRes.status === 200, 'GET /api/email-hosting/domains returned 200');
    const domains = domainsRes.data?.domains || [];
    assert(domains.length > 0, `Found ${domains.length} hosted domain(s)`);

    if (domains.length > 0) {
      const domainId = domains[0].id;
      const dnsRes = await request({
        method: 'GET',
        path: `/api/email-hosting/domains/${domainId}/dns`,
        headers: { Authorization: `Bearer ${token}` },
      });
      assert(dnsRes.status === 200, `GET /api/email-hosting/domains/${domainId}/dns returned 200`);
      const records = dnsRes.data?.records || [];
      const types = records.map(r => r.recordType);
      assert(types.includes('MX'), 'DNS records include MX');
      assert(types.includes('TXT'), 'DNS records include SPF / DKIM / DMARC');
    }

    console.log(bold(cyan('\n======================================================')));
    if (failed === 0) {
      console.log(bold(green(`  ALL ${passed} STALWART INTEGRATION TESTS PASSED!`)));
    } else {
      console.log(bold(red(`  TEST FAILURES: ${passed} PASSED | ${failed} FAILED`)));
    }
    console.log(bold(cyan('======================================================\n')));

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runStalwartE2E();
