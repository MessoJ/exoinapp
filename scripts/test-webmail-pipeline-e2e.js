#!/usr/bin/env node

/**
 * EXOIN AFRICA - OPTION 4: WEBMAIL & MINIO ATTACHMENT PIPELINE E2E TEST SUITE
 * 
 * Verifies:
 * 1. Admin login & JWT retrieval
 * 2. MinIO document attachment upload (POST /api/mail/attachments/upload)
 * 3. Signature style switcher (Executive vs Compact) persistence & HTML rendering
 * 4. End-to-end email dispatch through Stalwart Mail Server with MinIO attachment
 * 5. IMAP folder list & Stalwart message syncing verification
 */

const http = require('http');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:8080';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const ok = (msg) => console.log(`  ${colors.green}✔${colors.reset} ${msg}`);
const fail = (msg) => console.log(`  ${colors.red}✖${colors.reset} ${msg}`);
const bold = (msg) => `${colors.bold}${msg}${colors.reset}`;
const cyan = (msg) => `${colors.cyan}${msg}${colors.reset}`;
const green = (msg) => `${colors.green}${msg}${colors.reset}`;
const red = (msg) => `${colors.red}${msg}${colors.reset}`;

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    ok(message);
    return true;
  } else {
    failedAssertions++;
    fail(message);
    return false;
  }
}

function request({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const payload = body ? JSON.stringify(body) : null;
    
    const reqHeaders = {
      ...headers,
      ...(payload ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      } : {})
    };

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let parsed;
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

async function runWebmailPipelineE2E() {
  console.log(bold(cyan('\n======================================================')));
  console.log(bold(cyan('  EXOIN AFRICA - WEBMAIL & MINIO PIPELINE E2E TEST   ')));
  console.log(bold(cyan('======================================================')));

  let token = '';

  try {
    // 1. Authentication
    console.log(bold('\n1. Admin Authentication:'));
    const loginRes = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'admin@exoinafrica.com',
        password: 'Admin@123',
      },
    });
    assert(loginRes.status === 200, 'Admin login succeeded');
    token = loginRes.data?.token;
    assert(Boolean(token), 'JWT token retrieved');

    // 2. Direct MinIO File Attachment Upload
    console.log(bold('\n2. MinIO Attachment Pipeline:'));
    // Minimal valid PDF in base64
    const samplePdfBase64 = 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqIDIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iajMgMCBvYmo8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PD4+Pj5lbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAwMDkgMDAwMDAgbgowMDAwMDAwMDUyIDAwMDAwIG4KMDAwMDAwMDEwMSAwMDAwMCBuCnRyYWlsZXI8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxNzgKJSVFT0Y=';
    
    const uploadRes = await request({
      method: 'POST',
      path: '/api/mail/attachments/upload',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        filename: 'Exoin-Disinfection-Protocol.pdf',
        mimeType: 'application/pdf',
        data: samplePdfBase64,
      }
    });
    assert(uploadRes.status === 200, 'POST /api/mail/attachments/upload status 200');
    assert(uploadRes.data?.success === true, 'Upload returned success flag');
    assert(uploadRes.data?.url && uploadRes.data.url.includes('/exoin-assets/mail-attachments/'), `Attachment saved to MinIO (URL: ${uploadRes.data?.url})`);
    assert(uploadRes.data?.size > 0, `Attachment size calculated (${uploadRes.data?.size} bytes)`);

    const minioAttachmentUrl = uploadRes.data?.url;

    // 3. Signature Style Switcher
    console.log(bold('\n3. Signature Style Switcher (Compact vs Executive):'));
    
    // Switch to Compact / Minimal
    const setMinimalRes = await request({
      method: 'PUT',
      path: '/api/signature/settings',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        signatureEnabled: true,
        signatureStyle: 'minimal',
        jobTitle: 'Managing Director & Lead Systems Architect',
      }
    });
    assert(setMinimalRes.status === 200, 'Signature style updated to minimal');
    assert(setMinimalRes.data?.signatureStyle === 'minimal', 'Style persisted as minimal in database');

    const getMinimalHtmlRes = await request({
      method: 'GET',
      path: '/api/signature/html',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(getMinimalHtmlRes.status === 200, 'Compact signature HTML retrieved');
    assert(getMinimalHtmlRes.data?.html && getMinimalHtmlRes.data.html.includes('Managing Director'), 'Compact signature includes job title');

    // Switch to Executive
    const setExecutiveRes = await request({
      method: 'PUT',
      path: '/api/signature/settings',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        signatureEnabled: true,
        signatureStyle: 'executive',
        jobTitle: 'Executive Director',
      }
    });
    assert(setExecutiveRes.status === 200, 'Signature style updated to executive');
    assert(setExecutiveRes.data?.signatureStyle === 'executive', 'Style persisted as executive in database');

    const getExecHtmlRes = await request({
      method: 'GET',
      path: '/api/signature/html',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(getExecHtmlRes.status === 200, 'Executive signature HTML retrieved');
    assert(getExecHtmlRes.data?.html && getExecHtmlRes.data.html.includes('EXOIN'), 'Executive signature includes EXOIN branding');

    // 4. Outbound Email with MinIO Attachment via Stalwart Mail Server
    console.log(bold('\n4. Dispatch Email with MinIO Attachment via Stalwart:'));
    const sendMailRes = await request({
      method: 'POST',
      path: '/api/mail/send',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        to: ['admin@exoinafrica.com'],
        subject: `E2E MinIO Attachment & Pipeline Test ${Date.now()}`,
        html: '<p>Attached please find the official Exoin Disinfection Protocol document pulled directly from MinIO Storage.</p>',
        includeSignature: true,
        attachments: [
          {
            filename: 'Exoin-Disinfection-Protocol.pdf',
            url: minioAttachmentUrl,
            mimeType: 'application/pdf',
          }
        ]
      }
    });
    assert(sendMailRes.status === 200, 'POST /api/mail/send status 200');
    assert(sendMailRes.data?.success === true, 'Email successfully delivered through Stalwart');
    assert(Boolean(sendMailRes.data?.messageId), `Message ID issued: ${sendMailRes.data?.messageId}`);

    // 5. Stalwart Folder Tree & Mailbox Inspection
    console.log(bold('\n5. Stalwart Folder Sync & Mailbox Verification:'));
    const foldersRes = await request({
      method: 'GET',
      path: '/api/mail/folders',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(foldersRes.status === 200, 'GET /api/mail/folders status 200');
    const folderNames = Array.isArray(foldersRes.data?.folders) 
      ? foldersRes.data.folders.map(f => f.name || f.path) 
      : [];
    assert(folderNames.length > 0, `Stalwart folders discovered (${folderNames.join(', ')})`);

    // Verify messages list
    const messagesRes = await request({
      method: 'GET',
      path: '/api/mail/messages?folder=INBOX&limit=10',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(messagesRes.status === 200, 'GET /api/mail/messages status 200');
    const messageList = messagesRes.data?.messages || messagesRes.data?.emails;
    assert(Array.isArray(messageList), 'Emails/messages collection returned as array');

  } catch (err) {
    fail(`Unexpected error during Webmail Pipeline E2E execution: ${err.message}`);
    console.error(err);
  }

  console.log(bold(cyan('\n======================================================')));
  if (failedAssertions === 0) {
    console.log(bold(green(`  ALL ${passedAssertions} WEBMAIL & MINIO PIPELINE TESTS PASSED!`)));
  } else {
    console.log(bold(red(`  FAILURES: ${passedAssertions} PASSED | ${failedAssertions} FAILED`)));
  }
  console.log(bold(cyan('======================================================\n')));

  process.exit(failedAssertions === 0 ? 0 : 1);
}

runWebmailPipelineE2E();
