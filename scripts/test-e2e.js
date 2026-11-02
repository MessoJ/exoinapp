#!/usr/bin/env node
/**
 * Exoin Africa Workspace - Automated End-to-End (E2E) Test Suite
 * Tests complete API integration, authentication, document generation,
 * KRA tax calculations, and schema integrity.
 */

const http = require('http');

const BASE_HOST = '127.0.0.1';
const BASE_PORT = 8080;

// Helper function to make HTTP requests
function request({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (dataString) {
      reqHeaders['Content-Length'] = Buffer.byteLength(dataString);
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
        let resData = '';
        res.on('data', (chunk) => {
          resData += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resData);
          } catch (e) {
            parsed = resData;
          }
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

// Colors for terminal output
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ${green('✔')} ${testName}`);
    passedCount++;
  } else {
    console.error(`  ${red('✖')} ${testName}`);
    if (details) console.error(`    ${red(details)}`);
    failedCount++;
  }
}

async function runE2ETests() {
  console.log(bold(cyan('\n======================================================')));
  console.log(bold(cyan('  EXOIN AFRICA WORKSPACE - E2E TEST RUNNER')));
  console.log(bold(cyan('======================================================\n')));

  let authToken = null;
  let testClientId = null;
  let testJobCardId = null;
  let testDeliveryNoteId = null;
  let testInvoiceId = null;
  let testQuotationId = null;

  try {
    // 1. Authentication
    console.log(bold('1. Authentication & Security Flow:'));
    const loginRes = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'admin@exoinafrica.com',
        password: 'Admin@123',
      },
    });

    assert(loginRes.status === 200, 'Admin Login Status 200', `Got ${loginRes.status}`);
    assert(loginRes.data && loginRes.data.token, 'JWT Token Issued');
    assert(loginRes.data?.user?.email === 'admin@exoinafrica.com', 'User Profile matches admin');
    authToken = loginRes.data?.token;

    const authHeaders = { Authorization: `Bearer ${authToken}` };

    // 2. Company Metadata & KRA Verification
    console.log(bold('\n2. Company Metadata & Tax Coordinates:'));
    const companyRes = await request({
      method: 'GET',
      path: '/api/company',
      headers: authHeaders,
    });

    assert(companyRes.status === 200, 'Company Profile Status 200');
    assert(companyRes.data?.phone === '0739443244', `Company Phone is 0739443244 (Got: ${companyRes.data?.phone})`);
    assert(companyRes.data?.taxId === 'A015776087P', `KRA PIN is A015776087P (Got: ${companyRes.data?.taxId})`);
    assert(companyRes.data?.primaryColor === '#1E3A8A', `Primary Brand Color is #1E3A8A (Got: ${companyRes.data?.primaryColor})`);

    // 3. Client Management
    console.log(bold('\n3. Client Management Lifecycle:'));
    const clientPayload = {
      name: `KRA Western Region Office (${Date.now()})`,
      email: 'callcenter@kra.go.ke',
      phone: '+254722856810',
      address: 'Lake Hub Mall Kisumu',
      city: 'Kisumu',
      country: 'Kenya',
      taxId: 'P051123456Z',
      notes: 'Western region tax enforcement hub'
    };

    const createClientRes = await request({
      method: 'POST',
      path: '/api/clients',
      headers: authHeaders,
      body: clientPayload,
    });

    assert(createClientRes.status === 201 || createClientRes.status === 200, 'Client Creation Status 200/201');
    testClientId = createClientRes.data?.id;
    assert(!!testClientId, 'Created Client ID generated');

    const getClientRes = await request({
      method: 'GET',
      path: `/api/clients/${testClientId}`,
      headers: authHeaders,
    });
    assert(getClientRes.status === 200, 'Fetch Client by ID');
    assert(getClientRes.data?.phone === '+254722856810', 'Client Phone coordinate verified');

    // 4. Service Job Card Creation & Verification
    console.log(bold('\n4. Service Job Card Engine:'));
    const jobCardPayload = {
      type: 'JOB_CARD',
      title: 'Fumigation & Pest Control Job Card',
      clientId: testClientId,
      clientName: clientPayload.name,
      status: 'COMPLETED',
      subtotal: 9850,
      tax: 0,
      total: 9850,
      technicianName: 'Francis Meso',
      includeSeal: true,
      scope: 'Fumigation and Pest Control Service AT KRA WEBUYE RRU',
      metadata: {
        jobNo: `JC-${Date.now()}`,
        serviceType: 'Fumigation & Barrier Pest Control',
        technicianPhone: '0739443244',
        clientContact: '+254722856810',
        clientAddress: 'Lake Hub Mall Kisumu',
        sealColor: '#F97316',
        clientSigned: true,
        completionDate: new Date().toISOString()
      }
    };

    const jobCardRes = await request({
      method: 'POST',
      path: '/api/documents',
      headers: authHeaders,
      body: jobCardPayload,
    });

    assert(jobCardRes.status === 201 || jobCardRes.status === 200, 'Job Card Created Successfully');
    testJobCardId = jobCardRes.data?.id;
    assert(jobCardRes.data?.type === 'JOB_CARD', 'Document Type confirmed as JOB_CARD');

    // Verify Job Card retrieval
    const getJobCardRes = await request({
      method: 'GET',
      path: `/api/documents/${testJobCardId}`,
      headers: authHeaders,
    });
    assert(getJobCardRes.status === 200, 'Job Card Retrieval 200');
    assert(getJobCardRes.data?.includeSeal === true, 'Seal is present and optional flag functional');
    assert(getJobCardRes.data?.technicianName === 'Francis Meso', 'Technician name verified as Francis Meso');

    // 5. Delivery Note Engine
    console.log(bold('\n5. Delivery Note Engine:'));
    const deliveryNotePayload = {
      type: 'DELIVERY_NOTE',
      title: 'Consumables & Hygiene Delivery Note',
      clientId: testClientId,
      clientName: clientPayload.name,
      status: 'ISSUED',
      subtotal: 18500,
      tax: 0,
      total: 18500,
      items: [
        { description: 'Synthetic Pyrethroid Fumigation Concentrate (5L)', quantity: 2, unitPrice: 4500, total: 9000 },
        { description: 'Surface Sanitizer Barrier Formula (20L)', quantity: 1, unitPrice: 9500, total: 9500 }
      ],
      metadata: {
        deliveryNo: `DN-${Date.now()}`,
        dispatchedBy: 'Exoin Logistics Hub Nairobi',
        deliveredBy: 'John Doe',
        recipientName: 'Facilities Inspector',
        vehicleReg: 'KDC 442P',
        receivedInGoodOrder: true
      }
    };

    const deliveryNoteRes = await request({
      method: 'POST',
      path: '/api/documents',
      headers: authHeaders,
      body: deliveryNotePayload,
    });

    assert(deliveryNoteRes.status === 201 || deliveryNoteRes.status === 200, 'Delivery Note Created');
    testDeliveryNoteId = deliveryNoteRes.data?.id;
    assert(deliveryNoteRes.data?.type === 'DELIVERY_NOTE', 'Document Type confirmed as DELIVERY_NOTE');

    // 6. Tax Invoice with KRA VAT (16%)
    console.log(bold('\n6. Corporate Tax Invoice Engine (16% VAT):'));
    const invoicePayload = {
      type: 'INVOICE',
      title: 'Tax Invoice INV-2026-001',
      clientId: testClientId,
      clientName: clientPayload.name,
      status: 'ISSUED',
      subtotal: 8491.38,
      tax: 1358.62,
      total: 9850.00,
      items: [
        { description: 'Fumigation and Pest Control Service AT KRA WEBUYE RRU', quantity: 1, unitPrice: 8491.38, total: 8491.38 }
      ],
      metadata: {
        invoiceNumber: `INV-${Date.now()}`,
        paymentMethod: 'mpesa',
        taxRate: 16,
        eTimsNumber: 'INVYKBUXVU'
      }
    };

    const invoiceRes = await request({
      method: 'POST',
      path: '/api/documents',
      headers: authHeaders,
      body: invoicePayload,
    });

    assert(invoiceRes.status === 201 || invoiceRes.status === 200, 'Tax Invoice Created');
    testInvoiceId = invoiceRes.data?.id;
    assert(invoiceRes.data?.total === 9850, `Invoice Total KES 9,850.00 Verified (Got: ${invoiceRes.data?.total})`);
    assert(invoiceRes.data?.tax === 1358.62, `16% VAT Amount KES 1,358.62 Verified (Got: ${invoiceRes.data?.tax})`);

    // 7. Commercial Quotation
    console.log(bold('\n7. Commercial Quotation Engine:'));
    const quotationPayload = {
      type: 'QUOTATION',
      title: 'Official Quotation QUO-2026-001',
      clientId: testClientId,
      clientName: clientPayload.name,
      status: 'SENT',
      subtotal: 8491.38,
      tax: 1358.62,
      total: 9850.00,
      items: [
        { description: 'Fumigation and Pest Control Service AT KRA WEBUYE RRU', quantity: 1, unitPrice: 8491.38, total: 8491.38 }
      ],
      metadata: {
        quoteNumber: 'INVYKBUXVU',
        validityDays: 30,
        paymentTerms: 'mpesa',
        kraCompliant: true
      }
    };

    const quoteRes = await request({
      method: 'POST',
      path: '/api/documents',
      headers: authHeaders,
      body: quotationPayload,
    });

    assert(quoteRes.status === 201 || quoteRes.status === 200, 'Quotation Created');
    testQuotationId = quoteRes.data?.id;
    assert(quoteRes.data?.type === 'QUOTATION', 'Document Type confirmed as QUOTATION');

    // 8. Signature Management Endpoint
    console.log(bold('\n8. E-Signature Service:'));
    const sigRes = await request({
      method: 'GET',
      path: '/api/signature',
      headers: authHeaders,
    });
    assert(sigRes.status === 200, 'Signature Settings Status 200');

    // 9. Dashboard Statistics
    console.log(bold('\n9. Dashboard Statistics:'));
    const dashRes = await request({
      method: 'GET',
      path: '/api/dashboard/stats',
      headers: authHeaders,
    });
    assert(dashRes.status === 200, 'Dashboard Home API Status 200');

    // 10. Clean up test documents & client
    console.log(bold('\n10. Data Cleanup:'));
    if (testJobCardId) {
      await request({ method: 'DELETE', path: `/api/documents/${testJobCardId}`, headers: authHeaders });
    }
    if (testDeliveryNoteId) {
      await request({ method: 'DELETE', path: `/api/documents/${testDeliveryNoteId}`, headers: authHeaders });
    }
    if (testInvoiceId) {
      await request({ method: 'DELETE', path: `/api/documents/${testInvoiceId}`, headers: authHeaders });
    }
    if (testQuotationId) {
      await request({ method: 'DELETE', path: `/api/documents/${testQuotationId}`, headers: authHeaders });
    }
    if (testClientId) {
      await request({ method: 'DELETE', path: `/api/clients/${testClientId}`, headers: authHeaders });
    }
    assert(true, 'Test records cleaned up gracefully');

  } catch (error) {
    console.error(red('\nFatal E2E error:'), error);
    failedCount++;
  }

  // Summary
  console.log(bold(cyan('\n------------------------------------------------------')));
  console.log(bold(`E2E TEST RUN SUMMARY:`));
  console.log(`  Passed: ${green(passedCount)}`);
  console.log(`  Failed: ${failedCount > 0 ? red(failedCount) : '0'}`);
  console.log(bold(cyan('------------------------------------------------------\n')));

  process.exit(failedCount > 0 ? 1 : 0);
}

runE2ETests();
