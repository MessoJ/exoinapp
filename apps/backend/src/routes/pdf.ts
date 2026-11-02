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


// Generate Delivery Note HTML
function generateDeliveryNoteHTML(document: any): string {
  const { company, client, items } = document;
  const primaryColor = company?.primaryColor || '#1E3A8A';
  const secondaryColor = company?.secondaryColor || '#F97316';
  
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
      margin-bottom: 30px;
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
    .doc-title {
      text-align: right;
    }
    .doc-title h1 {
      font-size: 28px;
      font-weight: 800;
      color: ${primaryColor};
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-title .number {
      font-size: 15px;
      font-weight: 700;
      color: ${secondaryColor};
      margin-top: 4px;
      font-family: monospace;
    }
    .addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
    }
    .address-block {
      width: 46%;
    }
    .address-block h3 {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .address-block p {
      font-size: 12px;
      line-height: 1.5;
      color: #334155;
    }
    .address-block .name {
      font-weight: 700;
      color: #0f172a;
      font-size: 14px;
      margin-bottom: 2px;
    }
    .meta-row {
      display: flex;
      gap: 30px;
      margin-bottom: 25px;
      padding: 14px 18px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .meta-item label {
      display: block;
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .meta-item span {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    th {
      background: #f8fafc;
      padding: 10px 14px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 12px 14px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .notes-box {
      margin-top: 20px;
      padding: 14px 18px;
      background: #f8fafc;
      border-left: 4px solid ${primaryColor};
      border-radius: 4px;
      font-size: 11px;
      color: #334155;
      line-height: 1.5;
    }
    .notes-box strong {
      color: #0f172a;
      display: block;
      margin-bottom: 4px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .acknowledgment {
      margin-top: 25px;
      padding: 12px 16px;
      background: #eff6ff;
      border: 1px dashed #93c5fd;
      border-radius: 6px;
      font-size: 11px;
      color: #1e40af;
      font-style: italic;
      text-align: center;
    }
    .signatures-section {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-top: 30px;
    }
    .signature-card {
      width: 48%;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      background: #fafafa;
    }
    .signature-card h4 {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .sig-field {
      margin-bottom: 10px;
      font-size: 11px;
      color: #475569;
    }
    .sig-line {
      display: inline-block;
      width: 140px;
      border-bottom: 1px solid #94a3b8;
      margin-left: 8px;
    }
    .stamp-box {
      margin-top: 12px;
      border: 1px dashed #cbd5e1;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      border-radius: 4px;
    }
    .footer {
      margin-top: 35px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <svg class="logo-icon" viewBox="0 0 100 100" fill="none">
        <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="${primaryColor}" />
        <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="${secondaryColor}" />
      </svg>
      <div>
        <div class="logo-text">EXOIN</div>
        <div class="logo-sub">● AFRICA</div>
      </div>
    </div>
    <div class="doc-title">
      <h1>Delivery Note</h1>
      <div class="number">${document.documentNumber}</div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>Dispatched From</h3>
      <p class="name">${company?.name || 'Exoin Africa'}</p>
      <p>${company?.addressLine1 || 'Exoin Tower, Westlands'}<br>${company?.city || 'Nairobi'}, ${company?.country || 'Kenya'}</p>
      <p>${company?.phone || ''}<br>${company?.email || ''}</p>
    </div>
    <div class="address-block">
      <h3>Deliver To</h3>
      <p class="name">${client?.name || 'Customer'}</p>
      <p>${client?.addressLine1 || ''}<br>${client?.city || ''}${client?.country ? ', ' + client.country : ''}</p>
      <p>Attn: ${client?.contactPerson || 'Receiving Department'}</p>
      <p>${client?.phone ? 'Tel: ' + client.phone : ''}${client?.email ? ' • ' + client.email : ''}</p>
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-item">
      <label>Date</label>
      <span>${new Date(document.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    </div>
    <div class="meta-item">
      <label>Order / LPO Ref</label>
      <span>${document.scope || document.terms || 'N/A'}</span>
    </div>
    <div class="meta-item">
      <label>Delivery Status</label>
      <span style="color: #059669;">${document.status}</span>
    </div>
    <div class="meta-item">
      <label>Total Items</label>
      <span>${items?.length || 0} Line Items</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 8%;">#</th>
        <th style="width: 48%;">Description / Item</th>
        <th style="width: 14%; text-align: center;">Qty Ordered</th>
        <th style="width: 14%; text-align: center;">Qty Delivered</th>
        <th style="width: 16%;">Condition / Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any, idx: number) => `
        <tr>
          <td style="font-weight: 600; color: #64748b;">${idx + 1}</td>
          <td>
            <div style="font-weight: 600; color: #0f172a;">${item.name || item.description}</div>
            ${item.name && item.description !== item.name ? `<div style="font-size: 11px; color: #64748b;">${item.description}</div>` : ''}
          </td>
          <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
          <td style="text-align: center; font-weight: 700; color: #059669;">${item.quantity}</td>
          <td style="font-size: 11px; color: #64748b;">Good Condition</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${document.notes ? `
    <div class="notes-box">
      <strong>Special Delivery Instructions / Notes:</strong>
      ${document.notes}
    </div>
  ` : ''}

  <div class="acknowledgment">
    "Received the above listed goods and services in good order, full quantity, and satisfactory condition."
  </div>

  <div class="signatures-section">
    <div class="signature-card">
      <h4>Dispatched By (Exoin Africa)</h4>
      <div class="sig-field">Dispatched By: <span style="font-weight: 600;">${document.createdBy?.firstName || 'Authorized'} ${document.createdBy?.lastName || 'Representative'}</span></div>
      <div class="sig-field">Signature: <span class="sig-line"></span></div>
      <div class="sig-field">Dispatch Date: ${new Date(document.issueDate).toLocaleDateString('en-GB')}</div>
    </div>

    <div class="signature-card">
      <h4>Received By (Customer)</h4>
      <div class="sig-field">Receiver Name: <span class="sig-line"></span></div>
      <div class="sig-field">Signature: <span class="sig-line"></span></div>
      <div class="sig-field">Date & Time: <span class="sig-line"></span></div>
      <div class="stamp-box">Official Rubber Stamp & ID</div>
    </div>
  </div>

  <div class="footer">
    <div>${company?.name || 'Exoin Africa Ltd'} • Official Delivery Documentation</div>
    <div>${company?.website || 'https://exoin.africa'}</div>
  </div>
</body>
</html>
`;
}


// Generate Service Job Card HTML (Clean, Minimalist, Original Logo Colors, Subtle Background Seal)
function generateJobCardHTML(document: any): string {
  const { company, client, items } = document;
  const primaryNavy = '#1E3A8A';
  const accentOrange = '#F97316';
  const issueDateFormatted = new Date(document.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const hasNextService = document.dueDate && !isNaN(new Date(document.dueDate).getTime());
  const nextServiceFormatted = hasNextService
    ? new Date(document.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const techName = document.technicianName || 
    (document.createdBy ? `${document.createdBy.firstName || ''} ${document.createdBy.lastName || ''}`.trim() : '') || 
    '';
  const showSeal = document.includeSeal !== false;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
      background: #ffffff; 
      color: #0f172a;
      padding: 36px 40px;
      font-size: 11px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 20px;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .logo-sub {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 8px;
      color: #64748b;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      font-weight: 700;
    }
    .logo-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: ${accentOrange};
    }
    .company-details {
      margin-top: 6px;
      font-size: 9.5px;
      color: #475569;
      line-height: 1.4;
    }
    .title-block {
      text-align: right;
    }
    .card-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .doc-meta {
      margin-top: 4px;
      font-size: 11px;
      color: #475569;
    }
    .doc-meta strong {
      color: #0f172a;
      font-family: monospace;
    }
    .grid-2 {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
    }
    .info-card h3 {
      font-size: 9.5px;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 700;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .info-card p {
      font-size: 11px;
      color: #334155;
      margin-bottom: 3px;
    }
    .info-card .client-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f8fafc;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      padding: 9px 12px;
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      color: #475569;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
      vertical-align: top;
    }
    .notes-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 20px;
      font-size: 10.5px;
      color: #334155;
    }
    .notes-box strong {
      color: #0f172a;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 4px;
    }
    .sign-section {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 20px;
      margin-top: 15px;
      margin-bottom: 20px;
    }
    .sign-box {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      z-index: 1;
    }
    .sign-box h4 {
      font-size: 9.5px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .sig-line {
      height: 48px;
      border-bottom: 1px dashed #94a3b8;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 4px;
      font-size: 9.5px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .bg-seal-watermark {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0.12;
      z-index: 0;
    }
    .footer {
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-section">
        <!-- Original Brand Color Logo -->
        <svg class="logo-icon" viewBox="0 0 100 100" fill="none">
          <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="${primaryNavy}" />
          <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="${accentOrange}" />
        </svg>
        <div>
          <div class="logo-text">EXOIN</div>
          <div class="logo-sub">
            <span class="logo-dot"></span>
            AFRICA
          </div>
        </div>
      </div>
      <div class="company-details">
        <strong>${company?.name || 'Exoin Africa Ltd'}</strong> • PIN: ${company?.taxId || 'A015776087P'}<br>
        ${company?.addressLine1 || '48706, 00100, Nairobi, Kenya'} • Tel: ${company?.phone || '0739443244'}<br>
        Email: ${company?.email || 'info@exoinafrica.com'}
      </div>
    </div>
    <div class="title-block">
      <div class="card-title">Service Job Card</div>
      <div class="doc-meta">
        <div>Job No: <strong>${document.documentNumber}</strong></div>
        <div>Date: ${issueDateFormatted}</div>
      </div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-card">
      <h3>Client & Site Details</h3>
      <div class="client-name">${client?.name || 'Client Premises'}</div>
      <p><strong>Site Location:</strong> ${client?.addressLine1 || client?.address || 'On-site'}${client?.city ? ', ' + client.city : ''}</p>
      ${client?.contactPerson ? `<p><strong>Contact Person:</strong> ${client.contactPerson}</p>` : ''}
      ${client?.phone || client?.email ? `<p><strong>Contact:</strong> ${[client?.phone, client?.email].filter(Boolean).join(' • ')}</p>` : ''}
    </div>

    <div class="info-card">
      <h3>Service Details</h3>
      <p><strong>Service / Scope:</strong> ${document.scope || 'Service Rendered'}</p>
      ${techName ? `<p><strong>Technician:</strong> ${techName}</p>` : ''}
      <p><strong>Date of Service:</strong> ${issueDateFormatted}</p>
      ${nextServiceFormatted ? `<p><strong>Next Service:</strong> ${nextServiceFormatted}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 6%;">#</th>
        <th style="width: 50%;">Service / Work Description</th>
        <th style="width: 32%;">Remarks / Details</th>
        <th style="width: 12%; text-align: center;">Qty</th>
      </tr>
    </thead>
    <tbody>
      ${items && items.length > 0 ? items.map((item: any, idx: number) => `
        <tr>
          <td style="color: #64748b; font-weight: 600;">${idx + 1}</td>
          <td>
            <strong>${item.name || item.description || ''}</strong>
            ${item.name && item.description && item.description !== item.name ? `<br><span style="font-size: 9.5px; color: #64748b;">${item.description}</span>` : ''}
          </td>
          <td style="color: #475569; font-size: 10px;">${item.notes || 'Completed as specified'}</td>
          <td style="text-align: center; font-weight: 600;">${item.quantity || 1}</td>
        </tr>
      `).join('') : `
        <tr>
          <td style="color: #64748b; font-weight: 600;">1</td>
          <td><strong>${document.scope || 'Service execution completed'}</strong></td>
          <td style="color: #475569; font-size: 10px;">Full service completed on premises</td>
          <td style="text-align: center; font-weight: 600;">1</td>
        </tr>
      `}
    </tbody>
  </table>

  ${document.notes && document.notes.trim() ? `
  <div class="notes-box">
    <strong>Notes / Instructions:</strong>
    ${document.notes}
  </div>
  ` : ''}

  <div class="sign-section">
    ${showSeal ? `
    <!-- Subtle Background Watermark Seal (No text label) -->
    <div class="bg-seal-watermark">
      <svg width="120" height="120" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="74" fill="none" stroke="${primaryNavy}" stroke-width="2" stroke-dasharray="4 2" />
        <circle cx="80" cy="80" r="64" fill="none" stroke="${accentOrange}" stroke-width="1.5" />
        <circle cx="80" cy="80" r="50" fill="none" stroke="${primaryNavy}" stroke-width="1" />
        <path id="sealPathOuter" d="M 80, 80 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" fill="none"/>
        <text font-size="7" font-weight="700" fill="${primaryNavy}" letter-spacing="1.2">
          <textPath href="#sealPathOuter" startOffset="50%" text-anchor="middle">
            EXOIN AFRICA • SERVICE VERIFIED
          </textPath>
        </text>
        <g transform="translate(68, 65) scale(0.24)">
          <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="${primaryNavy}" />
          <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="${accentOrange}" />
        </g>
        <text x="80" y="105" font-size="6" font-weight="700" text-anchor="middle" fill="${primaryNavy}" letter-spacing="0.5">VERIFIED</text>
      </svg>
    </div>
    ` : ''}

    <div class="sign-box">
      <h4>Technician Sign-Off</h4>
      <p style="font-size: 10px; color: #475569; margin-bottom: 8px;">Technician: <strong>${techName || 'Authorized Officer'}</strong></p>
      <div class="sig-line">
        ${document.signature ? `<img src="${document.signature}" alt="Technician Signature" style="max-height: 40px; max-width: 140px; object-fit: contain; margin-bottom: 2px;" />` : 'Signature & Date'}
      </div>
    </div>

    <div class="sign-box">
      <h4>Client Confirmation</h4>
      <p style="font-size: 9.5px; color: #475569; font-style: italic; margin-bottom: 6px;">
        "${document.terms || 'Work completed satisfactorily on-site as described.'}"
      </p>
      <p style="font-size: 10px; color: #475569; margin-bottom: 4px;">Client Rep: <strong>${client?.contactPerson || 'Authorized Representative'}</strong></p>
      <div class="sig-line">Signature & Official Stamp</div>
    </div>
  </div>

  <div class="footer">
    <div>${company?.name || 'Exoin Africa Ltd'} • Service Completion Document</div>
    <div>${company?.website || 'exoin.africa'}</div>
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
    
    // Generate HTML based on document type
    const html = document.type === 'DELIVERY_NOTE' 
      ? generateDeliveryNoteHTML(document) 
      : document.type === 'JOB_CARD'
      ? generateJobCardHTML(document)
      : generateInvoiceHTML(document);
    
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
    
    const html = document.type === 'DELIVERY_NOTE' 
      ? generateDeliveryNoteHTML(document) 
      : document.type === 'JOB_CARD'
      ? generateJobCardHTML(document)
      : generateInvoiceHTML(document);
    
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
