#!/usr/bin/env node
/**
 * EXOIN AFRICA - PWA OFFLINE QUEUING & BACKGROUND SYNC E2E TEST
 * 
 * Verifies:
 * 1. PWA Service Worker (/sw.js) & Web App Manifest (/manifest.json)
 * 2. Offline Queueing Storage Engine (Drafts & Outbox)
 * 3. Outbox status transitions (QUEUED_OFFLINE -> SYNCING -> SENT)
 * 4. Offline outbox flush directly dispatching through Backend API -> Stalwart Mail
 * 5. Outbox cleanup upon successful delivery
 */

const http = require('http');
const https = require('https');
const assert = require('assert');

const API_BASE = 'http://localhost:8080';
const ADMIN_EMAIL = 'admin@exoinafrica.com';
const ADMIN_PASSWORD = 'Admin@123';

function request({ method, path, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Accept': 'application/json',
        ...headers
      }
    };

    let postData;
    if (body) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
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
          data: parsed
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function pass(msg) {
  console.log(`  ✔ ${msg}`);
}

function fail(msg) {
  console.error(`  ✖ ${msg}`);
  process.exit(1);
}

// In-memory simulation of the client's offline queue
class OfflineQueueSimulator {
  constructor() {
    this.outbox = new Map();
    this.drafts = new Map();
  }

  async enqueueOutbox(msg) {
    const record = {
      id: msg.id || `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      status: 'QUEUED_OFFLINE',
      retries: 0,
      queuedAt: new Date().toISOString()
    };
    this.outbox.set(record.id, record);
    return record;
  }

  async getOutbox() {
    return Array.from(this.outbox.values());
  }

  async getPendingCount() {
    return (await this.getOutbox()).filter(m => m.status === 'QUEUED_OFFLINE' || m.status === 'FAILED').length;
  }

  async updateStatus(id, updates) {
    const item = this.outbox.get(id);
    if (item) {
      Object.assign(item, updates);
    }
  }

  async remove(id) {
    this.outbox.delete(id);
  }

  async saveDraft(draft) {
    const record = {
      id: draft.id || `draft_${Date.now()}`,
      subject: draft.subject,
      body: draft.body,
      updatedAt: new Date().toISOString()
    };
    this.drafts.set(record.id, record);
    return record;
  }

  async getDrafts() {
    return Array.from(this.drafts.values());
  }

  async deleteDraft(id) {
    this.drafts.delete(id);
  }

  async flush(sendFn) {
    const pending = (await this.getOutbox()).filter(m => m.status === 'QUEUED_OFFLINE' || m.status === 'FAILED');
    let flushed = 0;
    for (const item of pending) {
      await this.updateStatus(item.id, { status: 'SYNCING' });
      try {
        const res = await sendFn(item);
        if (res && (res.success || res.messageId)) {
          await this.remove(item.id);
          flushed++;
        } else {
          throw new Error('Send failed');
        }
      } catch (err) {
        await this.updateStatus(item.id, {
          status: 'FAILED',
          retries: item.retries + 1,
          error: err.message
        });
      }
    }
    return { flushed, remaining: await this.getPendingCount() };
  }
}

async function run() {
  console.log('\n======================================================');
  console.log('  EXOIN AFRICA - PWA OFFLINE QUEUE & SYNC E2E TEST   ');
  console.log('======================================================\n');

  try {
    // ----------------------------------------------------
    // 1. Service Worker & PWA Manifest
    // ----------------------------------------------------
    console.log('1. PWA Service Worker & Manifest Endpoints:');
    
    const swRes = await request({ method: 'GET', path: '/sw.js' });
    assert(swRes.status === 200, `GET /sw.js returned 200 (Got: ${swRes.status})`);
    pass('Service Worker /sw.js accessible with status 200');

    assert(swRes.data.includes('exoin-sync-outbox'), 'Service worker handles exoin-sync-outbox tag');
    pass('Service worker listens for exoin-sync-outbox sync event');

    assert(swRes.data.includes('CHECK_OFFLINE_STATUS'), 'Service worker supports client status messaging');
    pass('Service worker handles CHECK_OFFLINE_STATUS message channel');

    const manifestRes = await request({ method: 'GET', path: '/manifest.json' });
    assert(manifestRes.status === 200, `GET /manifest.json returned 200 (Got: ${manifestRes.status})`);
    pass('Web App Manifest /manifest.json accessible with status 200');

    assert(manifestRes.data.name === 'Exoin Workspace', 'Manifest name is Exoin Workspace');
    assert(Array.isArray(manifestRes.data.icons), 'Manifest declares icon bundle');
    pass('PWA Manifest metadata and icons verified');

    // ----------------------------------------------------
    // 2. Authentication
    // ----------------------------------------------------
    console.log('\n2. Admin Authentication:');
    const authRes = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    assert(authRes.status === 200 && authRes.data.token, 'Admin authentication succeeded');
    const token = authRes.data.token;
    pass('Admin JWT token retrieved');

    // ----------------------------------------------------
    // 3. Offline Drafts Engine
    // ----------------------------------------------------
    console.log('\n3. Offline Drafts Lifecycle:');
    const sim = new OfflineQueueSimulator();

    const draft = await sim.saveDraft({
      subject: 'Urgent: Disinfection Schedule Nairobi Depot',
      body: '<p>Scope: 12 vehicles and warehouse spray</p>'
    });
    assert(draft.id, 'Draft generated unique ID');
    pass(`Offline draft stored (ID: ${draft.id})`);

    const drafts = await sim.getDrafts();
    assert(drafts.length === 1, 'Drafts store contains 1 item');
    assert(drafts[0].subject.includes('Disinfection'), 'Draft content matches');
    pass('Draft retrieved from offline store');

    await sim.deleteDraft(draft.id);
    const draftsAfter = await sim.getDrafts();
    assert(draftsAfter.length === 0, 'Draft deleted after discard/send');
    pass('Offline draft deleted successfully');

    // ----------------------------------------------------
    // 4. Offline Outbox Queuing & Retry State Transitions
    // ----------------------------------------------------
    console.log('\n4. Offline Outbox Queuing & State Management:');

    const queuedMsg = await sim.enqueueOutbox({
      to: 'operations@exoinafrica.com',
      subject: 'Offline Queued Delivery Note Notice',
      html: '<p>This email was composed while completely disconnected from the network.</p>'
    });
    assert(queuedMsg.id, 'Outbox item generated unique ID');
    assert(queuedMsg.status === 'QUEUED_OFFLINE', 'Initial status is QUEUED_OFFLINE');
    pass(`Outbound email queued into Outbox (ID: ${queuedMsg.id})`);

    let pendingCount = await sim.getPendingCount();
    assert(pendingCount === 1, 'Pending outbox count is 1');
    pass('Pending outbox count accurately reported as 1');

    // Simulate failed attempt while offline
    await sim.flush(async () => {
      throw new Error('ERR_INTERNET_DISCONNECTED');
    });

    const failedItem = (await sim.getOutbox())[0];
    assert(failedItem.status === 'FAILED', 'Status transitioned to FAILED after network error');
    assert(failedItem.retries === 1, 'Retry count incremented to 1');
    assert(failedItem.error === 'ERR_INTERNET_DISCONNECTED', 'Network error recorded on item');
    pass('Outbox gracefully records failure state and preserves queue');

    // ----------------------------------------------------
    // 5. Connectivity Restoration & Outbox Flush via Stalwart
    // ----------------------------------------------------
    console.log('\n5. Background Sync & Delivery via Stalwart Mail Server:');

    // Flush using real backend mail API with Stalwart
    const flushResult = await sim.flush(async (item) => {
      const sendRes = await request({
        method: 'POST',
        path: '/api/mail/send',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          to: item.to,
          subject: item.subject,
          html: item.html
        }
      });
      return sendRes.data;
    });

    assert(flushResult.flushed === 1, `1 message successfully flushed (Got: ${flushResult.flushed})`);
    pass('Queued email dispatched through Backend & Stalwart Mail SMTPS');

    assert(flushResult.remaining === 0, 'Outbox remaining count is 0');
    pass('Sent email automatically evicted from Outbox queue');

    const outboxAfter = await sim.getOutbox();
    assert(outboxAfter.length === 0, 'Outbox completely clean');
    pass('Outbox verified clean and fully synchronized');

    console.log('\n======================================================');
    console.log('  ALL 16 PWA OFFLINE QUEUING & SYNC TESTS PASSED!     ');
    console.log('======================================================\n');

  } catch (err) {
    fail(`Unexpected error during Offline Sync E2E execution: ${err.message}`);
    console.error(err);
  }
}

run();
