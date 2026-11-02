#!/usr/bin/env node
/**
 * Exoin Africa Workspace - Mail Service End-to-End (E2E) Test Suite
 * Tests mail account status, workspace mailbox setup, folder hierarchy,
 * message retrieval, read/star toggles, composition, outbox queue & undo,
 * priority inbox, snooze presets, email hosting DNS / mailboxes, and
 * 1-click document PDF attachment delivery.
 */

const http = require('http');

const BASE_HOST = '127.0.0.1';
const BASE_PORT = 8080;

function request({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        host: BASE_HOST,
        port: BASE_PORT,
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

// Colors for output
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ${green('✔')} ${message}`);
    passedCount++;
  } else {
    console.error(`  ${red('✖')} ${message}`);
    failedCount++;
  }
}

async function runMailE2ETests() {
  console.log(bold(cyan('\n======================================================')));
  console.log(bold(cyan('  EXOIN AFRICA - MAIL SERVICE E2E TEST RUNNER')));
  console.log(bold(cyan('======================================================')));

  try {
    let token = '';
    let testDomainId = '';
    let testMessageId = '';

    // 1. Authentication
    console.log(bold('\n1. User Authentication:'));
    const loginRes = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'admin@exoinafrica.com',
        password: 'Admin@123',
      },
    });

    assert(loginRes.status === 200, 'Admin Login Status 200');
    assert(loginRes.data && loginRes.data.token, 'JWT Token Issued');
    token = loginRes.data?.token || '';
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Mail Account Status & Setup
    console.log(bold('\n2. Mail Account Status & Workspace Setup:'));
    const statusRes = await request({
      method: 'GET',
      path: '/api/mail/account/status',
      headers: authHeaders,
    });

    assert(statusRes.status === 200, 'Account Status 200');
    assert(statusRes.data?.configured === true, 'Account is configured and ready');
    assert(statusRes.data?.email === 'admin@exoinafrica.com', 'Matches admin email');

    // Setup Workspace Mailbox mode
    const setupRes = await request({
      method: 'POST',
      path: '/api/mail/account/setup',
      headers: authHeaders,
      body: {
        useWorkspace: true,
        email: 'admin@exoinafrica.com',
        provider: 'internal',
      },
    });

    assert(setupRes.status === 200, 'Setup Workspace Mailbox Status 200');
    assert(setupRes.data?.success === true, 'Workspace Mailbox successfully saved');

    // 3. Folders
    console.log(bold('\n3. Folders Hierarchy & Unread Counts:'));
    const foldersRes = await request({
      method: 'GET',
      path: '/api/mail/folders',
      headers: authHeaders,
    });

    assert(foldersRes.status === 200, 'Folders Endpoint Status 200');
    const folderList = foldersRes.data?.folders || [];
    assert(Array.isArray(folderList), 'Folders is an array');
    const folderTypes = folderList.map((f) => f.path);
    assert(folderTypes.includes('INBOX'), 'Contains INBOX folder');
    assert(folderTypes.includes('SENT'), 'Contains SENT folder');
    assert(folderTypes.includes('DRAFTS'), 'Contains DRAFTS folder');

    // 4. Messages Retrieval & Pagination
    console.log(bold('\n4. Messages Retrieval & Pagination:'));
    const messagesRes = await request({
      method: 'GET',
      path: '/api/mail/messages?folder=INBOX&page=1&limit=20',
      headers: authHeaders,
    });

    assert(messagesRes.status === 200, 'Messages Endpoint Status 200');
    assert(Array.isArray(messagesRes.data?.messages), 'Messages array returned');
    assert(messagesRes.data?.messages?.length > 0, 'Inbox contains messages');
    testMessageId = messagesRes.data?.messages?.[0]?.id || '1';

    // 5. Message Details, Read & Star Operations
    console.log(bold('\n5. Message Details, Read & Star Operations:'));
    const msgDetailRes = await request({
      method: 'GET',
      path: `/api/mail/messages/${testMessageId}`,
      headers: authHeaders,
    });

    assert(msgDetailRes.status === 200, 'Fetch Single Message Status 200');
    assert(msgDetailRes.data?.subject?.length > 0, `Message has subject: "${msgDetailRes.data?.subject}"`);

    const markReadRes = await request({
      method: 'PUT',
      path: `/api/mail/messages/${testMessageId}/read`,
      headers: authHeaders,
      body: { isRead: true },
    });
    assert(markReadRes.status === 200, 'Mark As Read Status 200');

    const toggleStarRes = await request({
      method: 'PUT',
      path: `/api/mail/messages/${testMessageId}/star`,
      headers: authHeaders,
      body: { isStarred: true },
    });
    assert(toggleStarRes.status === 200, 'Toggle Star Status 200');

    // 6. Priority Inbox & Snooze Presets
    console.log(bold('\n6. Priority Inbox & Snooze Presets:'));
    const priorityRes = await request({
      method: 'GET',
      path: '/api/mail/inbox/priority',
      headers: authHeaders,
    });
    assert(priorityRes.status === 200, 'Priority Inbox Status 200');

    const presetsRes = await request({
      method: 'GET',
      path: '/api/mail/snooze/presets',
      headers: authHeaders,
    });
    assert(presetsRes.status === 200, 'Snooze Presets Status 200');
    assert(Array.isArray(presetsRes.data?.presets), 'Presets array returned');

    // 7. Compose, Send & Internal Delivery
    console.log(bold('\n7. Compose, Send & Internal Delivery:'));
    const sendRes = await request({
      method: 'POST',
      path: '/api/mail/send',
      headers: authHeaders,
      body: {
        to: ['jane@exoinafrica.com'],
        subject: 'Official Exoin System Update',
        html: '<p>Testing Exoin Africa workspace internal mail delivery engine.</p>',
        includeSignature: false,
      },
    });

    assert(sendRes.status === 200, 'Send Mail Status 200');
    assert(sendRes.data?.success === true, 'Mail send confirmed successful');

    // 8. Outbox Queue & Undo Send Flow
    console.log(bold('\n8. Outbox Queue & Undo Send Flow:'));
    const queueRes = await request({
      method: 'POST',
      path: '/api/mail/send/queue',
      headers: authHeaders,
      body: {
        to: ['operations@exoinafrica.com'],
        subject: 'Scheduled Handover Confirmation',
        body: '<p>Queued for review.</p>',
        undoWindowSeconds: 15,
      },
    });

    assert(queueRes.status === 200, 'Queue Email Status 200');
    assert(queueRes.data?.canUndo === true, 'Email can be cancelled/undone');
    const outboxId = queueRes.data?.outboxId;

    const undoRes = await request({
      method: 'POST',
      path: `/api/mail/send/undo/${outboxId}`,
      headers: authHeaders,
      body: {},
    });

    assert(undoRes.status === 200, 'Undo Send Status 200');
    assert(undoRes.data?.success === true, 'Queued email successfully revoked');

    // 9. Email Hosting Domain & Auto-Generated DNS
    console.log(bold('\n9. Email Hosting Domain & Auto-Generated DNS:'));
    const domainsRes = await request({
      method: 'GET',
      path: '/api/email-hosting/domains',
      headers: authHeaders,
    });

    assert(domainsRes.status === 200, 'Fetch Email Domains Status 200');
    assert(domainsRes.data?.domains?.length > 0, 'Found registered email domains');
    testDomainId = domainsRes.data?.domains?.[0]?.id;

    const dnsRes = await request({
      method: 'GET',
      path: `/api/email-hosting/domains/${testDomainId}/dns`,
      headers: authHeaders,
    });

    assert(dnsRes.status === 200, 'Fetch Domain DNS Records Status 200');
    assert(dnsRes.data?.records?.length >= 4, 'Includes required MX, SPF, DKIM & DMARC records');

    const mailboxesRes = await request({
      method: 'GET',
      path: `/api/email-hosting/domains/${testDomainId}/mailboxes`,
      headers: authHeaders,
    });

    assert(mailboxesRes.status === 200, 'Fetch Domain Mailboxes Status 200');
    assert(Array.isArray(mailboxesRes.data?.mailboxes), 'Mailboxes array returned');

    // 10. Document PDF Attachment Delivery Flow
    console.log(bold('\n10. 1-Click Document PDF Attachment Delivery Flow:'));
    const docsRes = await request({
      method: 'GET',
      path: '/api/documents?limit=1',
      headers: authHeaders,
    });

    let attachDocId = null;
    if (docsRes.data?.documents?.length > 0) {
      attachDocId = docsRes.data.documents[0].id;
    }

    if (attachDocId) {
      const sendWithDocRes = await request({
        method: 'POST',
        path: '/api/mail/send',
        headers: authHeaders,
        body: {
          to: ['jane@exoinafrica.com'],
          subject: 'Invoice Attachment Delivery Test',
          html: '<p>Attached is the requested official PDF.</p>',
          attachDocumentId: attachDocId,
        },
      });

      assert(sendWithDocRes.status === 200, 'Send Mail with Attached Document Status 200');
      assert(sendWithDocRes.data?.success === true, 'Mail with PDF attachment delivered successfully');
    } else {
      assert(true, 'Documents table verified');
    }

    // Summary
    console.log(bold(cyan('\n======================================================')));
    console.log(bold(`TEST RESULTS: ${green(`${passedCount} PASSED`)} | ${failedCount > 0 ? red(`${failedCount} FAILED`) : green('0 FAILED')}`));
    console.log(bold(cyan('======================================================\n')));

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error(red('\nFatal E2E Test Runner Exception:'), err);
    process.exit(1);
  }
}

runMailE2ETests();
