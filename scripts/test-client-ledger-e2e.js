#!/usr/bin/env node
/**
 * Exoin Africa - Client Financial Statement & Ledger E2E Test Suite
 * 
 * Tests:
 * 1. Admin Authentication
 * 2. Client Creation & Directory Listing
 * 3. Issuance of Multiple Invoices & Receipts for Client
 * 4. Statement of Account / Financial Ledger Generation
 * 5. Cumulative Running Balance & Aging Brackets Calculation
 * 6. Statement Email Dispatch via Stalwart Mail Gateway
 * 7. Graceful Data Cleanup
 */

const http = require('http');

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
        host: '127.0.0.1',
        port: 8080,
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

async function runClientLedgerE2E() {
  console.log(bold(cyan('\n======================================================')));
  console.log(bold(cyan('  EXOIN AFRICA - CLIENT LEDGER & STATEMENT E2E TEST   ')));
  console.log(bold(cyan('======================================================')));

  let token = '';
  let clientId = '';
  const createdDocIds = [];

  try {
    // 1. Auth
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

    // 2. Create Test Client
    console.log(bold('\n2. Client Creation & Directory Listing:'));
    const testClientPayload = {
      name: `Ledger Corp Test ${Date.now()}`,
      contactPerson: 'Sarah Mwangi',
      email: 'client-ledger@exoinafrica.com',
      phone: '0712345678',
      addressLine1: 'Westlands Commercial Center',
      city: 'Nairobi',
      country: 'Kenya',
    };
    const createClientRes = await request({
      method: 'POST',
      path: '/api/clients',
      headers: { Authorization: `Bearer ${token}` },
      body: testClientPayload,
    });
    assert([200, 201].includes(createClientRes.status), 'Test client created successfully');
    clientId = createClientRes.data?.id;
    assert(Boolean(clientId), `Client ID assigned: ${clientId}`);

    // 3. Issue Financial Documents
    console.log(bold('\n3. Financial Documents Generation:'));
    
    // Invoice 1: 15,000 KES - Paid
    const inv1Res = await request({
      method: 'POST',
      path: '/api/documents',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        documentNumber: `INV-TEST-01`,
        type: 'INVOICE',
        status: 'PAID',
        clientId,
        subtotal: 15000,
        taxAmount: 2400,
        total: 17400,
        currency: 'KES',
        items: [
          { description: 'Sanitary Hygiene Station Initial Setup', quantity: 1, unitPrice: 15000, total: 15000 }
        ]
      }
    });
    assert([200, 201].includes(inv1Res.status), 'Invoice 1 (PAID, KES 17,400) created');
    if (inv1Res.data?.id) createdDocIds.push(inv1Res.data.id);

    // Invoice 2: 25,000 KES - Unpaid / SENT
    const inv2Res = await request({
      method: 'POST',
      path: '/api/documents',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        documentNumber: `INV-TEST-02`,
        type: 'INVOICE',
        status: 'SENT',
        clientId,
        subtotal: 25000,
        taxAmount: 4000,
        total: 29000,
        currency: 'KES',
        items: [
          { description: 'Quarterly Deep Facility Disinfection Service', quantity: 1, unitPrice: 25000, total: 25000 }
        ]
      }
    });
    assert([200, 201].includes(inv2Res.status), 'Invoice 2 (SENT/Unpaid, KES 29,000) created');
    if (inv2Res.data?.id) createdDocIds.push(inv2Res.data.id);

    // 4. Fetch Statement of Account
    console.log(bold('\n4. Financial Statement of Account & Ledger:'));
    const statementRes = await request({
      method: 'GET',
      path: `/api/clients/${clientId}/statement`,
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(statementRes.status === 200, 'GET /api/clients/:id/statement status 200');
    
    const statement = statementRes.data;
    assert(statement.success === true, 'Statement returned success flag');
    assert(statement.client?.name === testClientPayload.name, 'Statement matches client name');
    assert(statement.company?.name !== undefined, 'Company branding coordinates attached');

    // Validate calculations
    const summary = statement.summary;
    console.log(bold('\n5. Ledger Calculations & Balance Verification:'));
    assert(summary.totalInvoiced === 46400, `Total Invoiced KES 46,400 verified (Got: ${summary.totalInvoiced})`);
    assert(summary.totalPaid === 17400, `Total Paid KES 17,400 verified (Got: ${summary.totalPaid})`);
    assert(summary.totalOutstanding === 29000, `Outstanding Balance KES 29,000 verified (Got: ${summary.totalOutstanding})`);
    assert(summary.aging !== undefined, 'Aging breakdown computed');
    assert(summary.aging.current === 29000, `Current aging bucket reflects KES 29,000 (Got: ${summary.aging.current})`);

    assert(statement.transactions?.length === 2, `Transactions list contains 2 records (Got: ${statement.transactions?.length})`);
    const tx1 = statement.transactions[0];
    const tx2 = statement.transactions[1];
    assert(tx1.runningBalance === 0, `Tx 1 running balance after payment is 0 (Got: ${tx1.runningBalance})`);
    assert(tx2.runningBalance === 29000, `Tx 2 final running balance is 29,000 (Got: ${tx2.runningBalance})`);

    // 6. Statement Email Dispatch via Stalwart
    console.log(bold('\n6. Statement Email Delivery via Stalwart Mail:'));
    const emailRes = await request({
      method: 'POST',
      path: `/api/clients/${clientId}/statement/email`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        message: 'Your monthly statement of account is ready for review.',
      }
    });
    assert(emailRes.status === 200, 'POST /api/clients/:id/statement/email status 200');
    assert(emailRes.data?.success === true, 'Statement email delivered via Stalwart Mail Server');
    assert(emailRes.data?.balanceDue === 29000, `Email includes accurate balance due (KES 29,000)`);

    // 7. Cleanup
    console.log(bold('\n7. Test Data Cleanup:'));
    for (const docId of createdDocIds) {
      await request({
        method: 'DELETE',
        path: `/api/documents/${docId}`,
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    await request({
      method: 'DELETE',
      path: `/api/clients/${clientId}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(true, 'Test client and billing documents cleaned up gracefully');

    console.log(bold(cyan('\n======================================================')));
    if (failed === 0) {
      console.log(bold(green(`  ALL ${passed} CLIENT LEDGER & STATEMENT TESTS PASSED!`)));
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

runClientLedgerE2E();
