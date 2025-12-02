import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import puppeteer from 'puppeteer';
import * as Minio from 'minio';
import { AssetType } from '@prisma/client';

// MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9010'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'secureminiopass',
});

const BUCKET_NAME = 'exoin-assets';

// Format currency
function formatCurrency(amount: number, currency: string = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

// Generate Invoice HTML
function generateInvoiceHTML(document: any): string {
  const { company, client, items } = document;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', system-ui, sans-serif; 
      background: white; 
      color: #1e293b;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f1f5f9;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
    }
    .logo-text {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -1px;
    }
    .logo-sub {
      font-size: 8px;
      color: #64748b;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 32px;
      font-weight: 800;
      color: ${company?.primaryColor || '#1E3A8A'};
      text-transform: uppercase;
    }
    .invoice-title .number {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
    }
    .addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .address-block h3 {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .address-block p {
      font-size: 12px;
      line-height: 1.6;
      color: #334155;
    }
    .address-block .name {
      font-weight: 700;
      color: #0f172a;
      font-size: 14px;
    }
    .meta-row {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
      padding: 16px 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .meta-item label {
      display: block;
      font-size: 9px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .meta-item span {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      text-align: left;
      padding: 12px 16px;
      background: #0f172a;
      color: white;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    th:first-child { border-radius: 8px 0 0 0; }
    th:last-child { border-radius: 0 8px 0 0; text-align: right; }
    td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    td:last-child { text-align: right; font-weight: 600; }
    .totals {
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 280px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 13px;
    }
    .totals-row.subtotal { border-bottom: 1px solid #e2e8f0; }
    .totals-row.total {
      font-size: 18px;
      font-weight: 800;
      color: ${company?.secondaryColor || '#F97316'};
      border-top: 2px solid #0f172a;
      padding-top: 16px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .bank-details h4 {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .bank-details p {
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }
    .notes {
      margin-top: 30px;
      padding: 16px;
      background: #fffbeb;
      border-left: 4px solid ${company?.secondaryColor || '#F97316'};
      font-size: 11px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <svg class="logo-icon" viewBox="0 0 100 100" fill="none">
        <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="${company?.primaryColor || '#1E3A8A'}" />
        <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="${company?.secondaryColor || '#F97316'}" />
      </svg>
      <div>
        <div class="logo-text">EXOIN</div>
        <div class="logo-sub">● AFRICA</div>
      </div>
    </div>
    <div class="invoice-title">
      <h1>Invoice</h1>
      <div class="number">${document.documentNumber}</div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>From</h3>
      <p class="name">${company?.name}</p>
      <p>${company?.addressLine1}<br>${company?.city}, ${company?.country}</p>
      <p>${company?.phone}<br>${company?.email}</p>
    </div>
    <div class="address-block">
      <h3>Bill To</h3>
      <p class="name">${client?.name}</p>
      <p>${client?.addressLine1 || ''}<br>${client?.city || ''}, ${client?.country || ''}</p>
      <p>${client?.contactPerson || ''}</p>
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-item">
      <label>Invoice Date</label>
      <span>${new Date(document.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    </div>
    <div class="meta-item">
      <label>Due Date</label>
      <span>${document.dueDate ? new Date(document.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Upon Receipt'}</span>
    </div>
    <div class="meta-item">
      <label>Status</label>
      <span>${document.status}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(Number(item.unitPrice), document.currency)}</td>
          <td>${formatCurrency(Number(item.total), document.currency)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row subtotal">
        <span>Subtotal</span>
        <span>${formatCurrency(Number(document.subtotal), document.currency)}</span>
      </div>
      <div class="totals-row">
        <span>VAT (${document.taxRate}%)</span>
        <span>${formatCurrency(Number(document.taxAmount), document.currency)}</span>
      </div>
      <div class="totals-row total">
        <span>Total Due</span>
        <span>${formatCurrency(Number(document.total), document.currency)}</span>
      </div>
    </div>
  </div>

  ${document.notes ? `<div class="notes">${document.notes}</div>` : ''}

  <div class="footer">
    <div class="bank-details">
      <h4>Payment Details</h4>
      <p>
        Bank: ${company?.bankName || 'N/A'}<br>
        Account: ${company?.bankAccount || 'N/A'}<br>
        Branch: ${company?.bankBranch || 'N/A'}
      </p>
    </div>
    <div style="text-align: right; font-size: 10px; color: #94a3b8;">
      ${company?.website || 'exoin.africa'}
    </div>
  </div>
</body>
</html>
  `;
}

export default async function pdfRoutes(fastify: FastifyInstance) {
  
  // Generate PDF for a document
  fastify.post('/generate/:documentId', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { documentId } = request.params as any;
    const { companyId } = (request as any).user;
    
    // Fetch document with all relations
    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId },
      include: {
        company: true,
        client: true,
        items: true,
        createdBy: true,
      }
    });
    
    if (!document) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    // Generate HTML
    const html = generateInvoiceHTML(document);
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });
    
    await browser.close();
    
    // Save to MinIO
    const filename = `${companyId}/documents/${document.documentNumber}.pdf`;
    await minioClient.putObject(BUCKET_NAME, filename, pdfBuffer, pdfBuffer.length, {
      'Content-Type': 'application/pdf',
    });
    
    // Update document with PDF URL
    const pdfUrl = `/${BUCKET_NAME}/${filename}`;
    await prisma.document.update({
      where: { id: documentId },
      data: { pdfUrl },
    });
    
    // Create asset record
    await prisma.asset.create({
      data: {
        name: `${document.documentNumber}.pdf`,
        type: AssetType.DOCUMENT,
        mimeType: 'application/pdf',
        size: pdfBuffer.length,
        url: pdfUrl,
        companyId,
      }
    });
    
    // Return PDF directly
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${document.documentNumber}.pdf"`);
    return reply.send(pdfBuffer);
  });

  // Preview PDF (returns HTML for preview)
  fastify.get('/preview/:documentId', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { documentId } = request.params as any;
    const { companyId } = (request as any).user;
    
    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId },
      include: {
        company: true,
        client: true,
        items: true,
        createdBy: true,
      }
    });
    
    if (!document) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    const html = generateInvoiceHTML(document);
    
    reply.header('Content-Type', 'text/html');
    return reply.send(html);
  });

  // Download existing PDF
  fastify.get('/download/:documentId', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { documentId } = request.params as any;
    const { companyId } = (request as any).user;
    
    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId }
    });
    
    if (!document || !document.pdfUrl) {
      return reply.status(404).send({ error: 'PDF not found' });
    }
    
    const objectName = document.pdfUrl.replace(`/${BUCKET_NAME}/`, '');
    const presignedUrl = await minioClient.presignedGetObject(BUCKET_NAME, objectName, 3600);
    
    return { url: presignedUrl };
  });
}
