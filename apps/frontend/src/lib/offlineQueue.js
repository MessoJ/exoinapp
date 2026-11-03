/**
 * EXOIN WORKSPACE - PWA OFFLINE QUEUING & BACKGROUND SYNC ENGINE
 * IndexedDB storage for drafts and outbound mail outbox with automatic
 * background synchronization when network connectivity is restored.
 */

const DB_NAME = 'exoin_workspace_pwa_db';
const DB_VERSION = 1;
const STORE_OUTBOX = 'outbox';
const STORE_DRAFTS = 'drafts';

// In-memory fallback if IndexedDB is unavailable
let memoryStore = {
  outbox: new Map(),
  drafts: new Map()
};

/**
 * Open or upgrade the IndexedDB database
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return resolve(null); // Fallback to memoryStore
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Outbox store
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        const outboxStore = db.createObjectStore(STORE_OUTBOX, { keyPath: 'id' });
        outboxStore.createIndex('status', 'status', { unique: false });
        outboxStore.createIndex('queuedAt', 'queuedAt', { unique: false });
      }

      // Drafts store
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        const draftsStore = db.createObjectStore(STORE_DRAFTS, { keyPath: 'id' });
        draftsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('[OfflineQueue] IndexedDB open error, using in-memory store:', request.error);
      resolve(null);
    };
  });
}

/**
 * Dispatch event to window for reactive UI updates
 */
function notifyUpdate(eventName, detail) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch (e) {
      // Ignore in environments without CustomEvent
    }
  }
}

// ========================================================
// OUTBOX API
// ========================================================

/**
 * Queue an outbound message for background sending
 */
export async function enqueueOutboxMessage(message) {
  const record = {
    id: message.id || `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    to: message.to,
    toAddresses: message.toAddresses || (Array.isArray(message.to) ? message.to : [message.to]),
    cc: message.cc || [],
    bcc: message.bcc || [],
    subject: message.subject || '(No Subject)',
    text: message.text || '',
    html: message.html || '',
    attachments: message.attachments || [],
    signatureStyle: message.signatureStyle || 'executive',
    includeSignature: message.includeSignature ?? true,
    status: 'QUEUED_OFFLINE', // QUEUED_OFFLINE | SYNCING | FAILED | SENT
    retries: 0,
    maxRetries: 3,
    error: null,
    queuedAt: new Date().toISOString(),
    lastAttemptAt: null
  };

  const db = await openDB();
  if (db) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_OUTBOX).put(record);
    });
  } else {
    memoryStore.outbox.set(record.id, record);
  }

  // Trigger background sync if service worker registration supports it
  registerBackgroundSync();
  notifyUpdate('exoin:outbox-updated', { count: await getOutboxCount(), latest: record });

  return record;
}

/**
 * Get all queued messages in outbox
 */
export async function getOutboxMessages() {
  const db = await openDB();
  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], 'readonly');
      const request = tx.objectStore(STORE_OUTBOX).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } else {
    return Array.from(memoryStore.outbox.values());
  }
}

/**
 * Get count of pending outbox messages
 */
export async function getOutboxCount() {
  const messages = await getOutboxMessages();
  return messages.filter(m => m.status === 'QUEUED_OFFLINE' || m.status === 'FAILED').length;
}

/**
 * Remove an item from the outbox
 */
export async function removeOutboxMessage(id) {
  const db = await openDB();
  if (db) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_OUTBOX).delete(id);
    });
  } else {
    memoryStore.outbox.delete(id);
  }
  notifyUpdate('exoin:outbox-updated', { count: await getOutboxCount() });
}

/**
 * Update the status of an outbox message
 */
export async function updateOutboxStatus(id, updates) {
  const db = await openDB();
  if (db) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], 'readwrite');
      const store = tx.objectStore(STORE_OUTBOX);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = { ...getReq.result, ...updates };
          store.put(updated);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } else {
    const existing = memoryStore.outbox.get(id);
    if (existing) {
      memoryStore.outbox.set(id, { ...existing, ...updates });
    }
  }
  notifyUpdate('exoin:outbox-updated', { count: await getOutboxCount() });
}

// ========================================================
// DRAFTS API
// ========================================================

/**
 * Save draft offline
 */
export async function saveOfflineDraft(draft) {
  const record = {
    id: draft.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    to: draft.to || '',
    toChips: draft.toChips || [],
    cc: draft.cc || '',
    bcc: draft.bcc || '',
    subject: draft.subject || '',
    body: draft.body || '',
    attachments: draft.attachments || [],
    signatureStyle: draft.signatureStyle || 'executive',
    updatedAt: new Date().toISOString()
  };

  const db = await openDB();
  if (db) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DRAFTS], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_DRAFTS).put(record);
    });
  } else {
    memoryStore.drafts.set(record.id, record);
  }

  notifyUpdate('exoin:drafts-updated', { latest: record });
  return record;
}

/**
 * Get all offline drafts
 */
export async function getOfflineDrafts() {
  const db = await openDB();
  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DRAFTS], 'readonly');
      const request = tx.objectStore(STORE_DRAFTS).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } else {
    return Array.from(memoryStore.drafts.values());
  }
}

/**
 * Delete offline draft
 */
export async function deleteOfflineDraft(id) {
  const db = await openDB();
  if (db) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DRAFTS], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_DRAFTS).delete(id);
    });
  } else {
    memoryStore.drafts.delete(id);
  }
  notifyUpdate('exoin:drafts-updated', { deletedId: id });
}

// ========================================================
// SYNC & OUTBOX FLUSHING
// ========================================================

/**
 * Flush pending outbox messages by calling the send function
 * @param {Function} sendFn - async function(payload) that calls POST /api/mail/send
 */
export async function flushOfflineOutbox(sendFn) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('[OfflineQueue] Device is offline, skipping flush');
    return { flushed: 0, pending: await getOutboxCount(), status: 'OFFLINE' };
  }

  const messages = await getOutboxMessages();
  const pending = messages.filter(m => m.status === 'QUEUED_OFFLINE' || m.status === 'FAILED');

  if (pending.length === 0) {
    return { flushed: 0, pending: 0, status: 'IDLE' };
  }

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const item of pending) {
    try {
      await updateOutboxStatus(item.id, {
        status: 'SYNCING',
        lastAttemptAt: new Date().toISOString()
      });

      const payload = {
        to: item.to || (Array.isArray(item.toAddresses) ? item.toAddresses.join(', ') : item.toAddresses),
        cc: item.cc,
        bcc: item.bcc,
        subject: item.subject,
        text: item.text,
        html: item.html,
        attachments: item.attachments,
        signatureStyle: item.signatureStyle
      };

      const res = await sendFn(payload);

      if (res?.data?.success || res?.success || res?.data?.messageId || res?.messageId) {
        await removeOutboxMessage(item.id);
        successCount++;
        results.push({ id: item.id, success: true, result: res });
      } else {
        throw new Error(res?.data?.error || res?.error || 'Send unsuccessful');
      }
    } catch (err) {
      console.warn(`[OfflineQueue] Failed to send queued message ${item.id}:`, err);
      failCount++;
      const retries = (item.retries || 0) + 1;
      await updateOutboxStatus(item.id, {
        status: retries >= (item.maxRetries || 3) ? 'FAILED' : 'QUEUED_OFFLINE',
        retries,
        error: err.message || 'Unknown network error'
      });
      results.push({ id: item.id, success: false, error: err.message });
    }
  }

  notifyUpdate('exoin:sync-finished', {
    successCount,
    failCount,
    remaining: await getOutboxCount()
  });

  return {
    flushed: successCount,
    failed: failCount,
    pending: await getOutboxCount(),
    results
  };
}

/**
 * Register background sync with the service worker
 */
export function registerBackgroundSync() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register('exoin-sync-outbox');
      })
      .catch((err) => {
        console.log('[OfflineQueue] Background sync registration skipped:', err.message);
      });
  }
}
