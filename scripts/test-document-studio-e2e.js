#!/usr/bin/env node

/**
 * EXOIN AFRICA - OPTION 3: DOCUMENT STUDIO & EDITOR CONSISTENCY E2E TEST SUITE
 * 
 * Verifies:
 * 1. Admin login & token generation
 * 2. Multi-currency document issuance (USD, GBP, EUR, KES)
 * 3. 16% VAT tax calculation vs zero-rated / tax-exempt
 * 4. Job Card technician, site coordinates, and seal attachment
 * 5. Document edit persistence (PUT /api/documents/:id) with updated line items
 * 6. Status progression (PATCH /api/documents/:id/status)
 * 7. Clean teardown and verification metrics
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

async function runDocumentStudioE2E() {
  console.log(bold(cyan('\n======================================================')));
  console.log(bold(cyan('   EXOIN AFRICA - DOCUMENT STUDIO & EDITOR E2E TEST   ')));
  console.log(bold(cyan('======================================================')));

  let token = '';
  let clientId = '';
  const createdDocIds = [];

  try {
    // 1. Auth Flow
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

    // 2. Client Creation
    console.log(bold('\n2. Client Entity Setup:'));
    const clientRes = await request({
      method: 'POST',
      path: '/api/clients',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        name: `Studio Enterprise Ltd ${Date.now()}`,
        contactPerson: 'Director of Procurement',
        email: 'procurement@studioenterprise.com',
        phone: '0722000111',
        addressLine1: 'Exoin Innovation Center, Tower A',
        city: 'Nairobi',
        country: 'Kenya',
      },
    });
    assert([200, 201].includes(clientRes.status), 'Test client created');
    clientId = clientRes.data?.id;
    assert(Boolean(clientId), `Client registered with ID: ${clientId}`);

    // 3. Multi-Currency: USD Invoice (Tax Exempt / Zero-Rated)
    console.log(bold('\n3. Multi-Currency USD Invoice (Tax-Exempt):'));
    const usdInvoiceRes = await request({
      method: 'POST',
      path: '/api/documents',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        type: 'INVOICE',
        clientId,
        currency: 'USD',
        taxable: false,
        taxRate: 0,
        subtotal: 500,
        taxAmount: 0,
        total: 500,
        notes: 'Cross-border autonomous facility audit invoice. Tax exempt under regional treaty.',
        items: [
          { description: 'Autonomous Hygiene Architecture Consultancy', quantity: 2, unitPrice: 250, total: 500 }
        ]
      }
    });
    assert([200, 201].includes(usdInvoiceRes.status), 'USD Invoice created successfully');
    const usdDocId = usdInvoiceRes.data?.id;
    if (usdDocId) createdDocIds.push(usdDocId);

    // Verify USD Document via GET /api/documents/:id
    const getUsdRes = await request({
      method: 'GET',
      path: `/api/documents/${usdDocId}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(getUsdRes.status === 200, 'USD Document retrieved via API');
    assert(getUsdRes.data?.currency === 'USD', `Currency is USD (Got: ${getUsdRes.data?.currency})`);
    assert(getUsdRes.data?.taxable === false, 'Taxable flag is false');
    assert(Number(getUsdRes.data?.taxAmount) === 0, `Tax amount is 0 (Got: ${getUsdRes.data?.taxAmount})`);
    assert(Number(getUsdRes.data?.total) === 500, `Total equals subtotal 500 (Got: ${getUsdRes.data?.total})`);

    // 4. Multi-Currency: GBP Quotation (16% Standard VAT)
    console.log(bold('\n4. Multi-Currency GBP Quotation (16% VAT):'));
    const gbpQuoteRes = await request({
      method: 'POST',
      path: '/api/documents',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        type: 'QUOTATION',
        clientId,
        currency: 'GBP',
        taxable: true,
        taxRate: 16,
        subtotal: 1000,
        taxAmount: 160,
        total: 1160,
        notes: 'Commercial quotation valid for 30 calendar days.',
        items: [
          { description: 'Specialized High-Bay Drone Sanitization Package', quantity: 1, unitPrice: 1000, total: 1000 }
        ]
      }
    });
    assert([200, 201].includes(gbpQuoteRes.status), 'GBP Quotation created successfully');
    const gbpDocId = gbpQuoteRes.data?.id;
    if (gbpDocId) createdDocIds.push(gbpDocId);

    const getGbpRes = await request({
      method: 'GET',
      path: `/api/documents/${gbpDocId}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(getGbpRes.status === 200, 'GBP Quotation retrieved');
    assert(getGbpRes.data?.currency === 'GBP', `Currency is GBP (Got: ${getGbpRes.data?.currency})`);
    assert(Number(getGbpRes.data?.taxRate) === 16, `Tax rate is 16% (Got: ${getGbpRes.data?.taxRate})`);
    assert(Number(getGbpRes.data?.taxAmount) === 160, `Tax amount is 160 (Got: ${getGbpRes.data?.taxAmount})`);
    assert(Number(getGbpRes.data?.total) === 1160, `Grand total is 1,160 (Got: ${getGbpRes.data?.total})`);

    // 5. Service Job Card Engine: Technician & Site Scope
    console.log(bold('\n5. Service Job Card Specifications & Seal:'));
    const jobCardRes = await request({
      method: 'POST',
      path: '/api/documents',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        type: 'JOB_CARD',
        clientId,
        currency: 'KES',
        technicianName: 'Francis Meso',
        scope: 'Webuye RRU Facility Complex, Zone 3',
        includeSeal: true,
        taxable: true,
        taxRate: 16,
        subtotal: 12000,
        taxAmount: 1920,
        total: 13920,
        notes: 'Safe for re-entry after 2 hours. Chemical batch #440-B.',
        items: [
          { description: 'Deep Barrier Fumigation & Sanitization', quantity: 1, unitPrice: 12000, total: 12000 }
        ]
      }
    });
    assert([200, 201].includes(jobCardRes.status), 'Job Card created successfully');
    const jobCardDocId = jobCardRes.data?.id;
    if (jobCardDocId) createdDocIds.push(jobCardDocId);

    const getJobCardRes = await request({
      method: 'GET',
      path: `/api/documents/${jobCardDocId}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(getJobCardRes.status === 200, 'Job Card retrieved');
    assert(getJobCardRes.data?.technicianName === 'Francis Meso', `Technician matches Francis Meso (Got: ${getJobCardRes.data?.technicianName})`);
    assert(getJobCardRes.data?.scope === 'Webuye RRU Facility Complex, Zone 3', 'Service site scope matches');
    assert(getJobCardRes.data?.includeSeal === true, 'Official company seal included');

    // 6. Document Studio Edit Persistence (PUT /api/documents/:id)
    console.log(bold('\n6. Document Studio Edit Persistence (PUT):'));
    const updateRes = await request({
      method: 'PUT',
      path: `/api/documents/${jobCardDocId}`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        technicianName: 'Francis Meso & Senior Operations Crew',
        scope: 'Webuye RRU Facility Complex, Zone 3 & 4 Expanded',
        notes: 'Updated re-entry instructions: Aeration completed, verified clean.',
        taxable: true,
        taxRate: 16,
        currency: 'KES',
        items: [
          { description: 'Deep Barrier Fumigation & Sanitization', quantity: 1, unitPrice: 12000 },
          { description: 'Ultrasonic Rodent Deterrent Unit Installation', quantity: 2, unitPrice: 3500 }
        ]
      }
    });
    assert(updateRes.status === 200, 'PUT /api/documents/:id succeeded');
    assert(Number(updateRes.data?.subtotal) === 19000, `Updated subtotal is 19,000 (Got: ${updateRes.data?.subtotal})`);
    assert(Number(updateRes.data?.taxAmount) === 3040, `Updated 16% VAT is 3,040 (Got: ${updateRes.data?.taxAmount})`);
    assert(Number(updateRes.data?.total) === 22040, `Updated grand total is 22,040 (Got: ${updateRes.data?.total})`);
    assert(updateRes.data?.technicianName === 'Francis Meso & Senior Operations Crew', 'Updated technician persisted');
    assert(updateRes.data?.items?.length === 2, `Line items count updated to 2 (Got: ${updateRes.data?.items?.length})`);

    // 7. Status Progression
    console.log(bold('\n7. Status Lifecycle Progression:'));
    const statusPatchRes = await request({
      method: 'PATCH',
      path: `/api/documents/${usdDocId}/status`,
      headers: { Authorization: `Bearer ${token}` },
      body: { status: 'PAID' }
    });
    assert(statusPatchRes.status === 200, 'PATCH status to PAID succeeded');
    assert(statusPatchRes.data?.status === 'PAID', `Status updated to PAID (Got: ${statusPatchRes.data?.status})`);

    // 8. Cleanup
    console.log(bold('\n8. Teardown & Resource Cleanup:'));
    for (const docId of createdDocIds) {
      await request({
        method: 'DELETE',
        path: `/api/documents/${docId}`,
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    if (clientId) {
      await request({
        method: 'DELETE',
        path: `/api/clients/${clientId}`,
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    ok('Test documents and client records cleaned up gracefully');

  } catch (err) {
    fail(`Unexpected error during Document Studio E2E execution: ${err.message}`);
    console.error(err);
  }

  console.log(bold(cyan('\n======================================================')));
  if (failedAssertions === 0) {
    console.log(bold(green(`  ALL ${passedAssertions} DOCUMENT STUDIO TESTS PASSED!`)));
  } else {
    console.log(bold(red(`  FAILURES: ${passedAssertions} PASSED | ${failedAssertions} FAILED`)));
  }
  console.log(bold(cyan('======================================================\n')));

  process.exit(failedAssertions === 0 ? 0 : 1);
}

runDocumentStudioE2E();
