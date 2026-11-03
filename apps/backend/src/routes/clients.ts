import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { emailService } from '../services/emailService';

export default async function clientsRoutes(fastify: FastifyInstance) {
  
  // Get all clients
  fastify.get('/', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    
    const clients = await prisma.client.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { documents: true }
        }
      }
    });
    
    return { clients };
  });

  // Get single client
  fastify.get('/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    
    const client = await prisma.client.findFirst({
      where: { id, companyId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    });
    
    if (!client) {
      return reply.status(404).send({ error: 'Client not found' });
    }
    
    return client;
  });

  // Get Client Financial Statement of Account / Ledger
  fastify.get('/:id/statement', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    const { startDate, endDate } = request.query as any;

    const [client, company] = await Promise.all([
      prisma.client.findFirst({
        where: { id, companyId },
      }),
      prisma.company.findUnique({
        where: { id: companyId },
      })
    ]);

    if (!client) {
      return reply.status(404).send({ error: 'Client not found' });
    }

    // Build date filter if provided
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const documents = await prisma.document.findMany({
      where: {
        clientId: id,
        companyId,
        status: { not: 'CANCELLED' },
        ...(startDate || endDate ? { issueDate: dateFilter } : {})
      },
      orderBy: { issueDate: 'asc' },
      include: {
        items: true,
      }
    });

    const now = new Date();
    let runningBalance = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;
    let currency = 'KES';

    const aging = {
      current: 0,     // 0-30 days
      days30_60: 0,   // 31-60 days
      days61_90: 0,   // 61-90 days
      days90Plus: 0,  // > 90 days
    };

    const transactions = documents.map((doc) => {
      const docTotal = Number(doc.total) || 0;
      currency = doc.currency || currency;

      let debit = 0;
      let credit = 0;
      let docTypeLabel = doc.type;

      if (doc.type === 'INVOICE') {
        debit = docTotal;
        totalInvoiced += docTotal;

        if (doc.status === 'PAID') {
          credit = docTotal;
          totalPaid += docTotal;
        } else {
          // Calculate aging for unpaid invoices
          const issueDate = new Date(doc.issueDate);
          const diffDays = Math.floor((now.getTime() - issueDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 30) aging.current += docTotal;
          else if (diffDays <= 60) aging.days30_60 += docTotal;
          else if (diffDays <= 90) aging.days61_90 += docTotal;
          else aging.days90Plus += docTotal;
        }
      } else if (doc.type === 'RECEIPT') {
        credit = docTotal;
        totalPaid += docTotal;
      }

      runningBalance += (debit - credit);

      return {
        id: doc.id,
        date: doc.issueDate,
        dueDate: doc.dueDate,
        documentNumber: doc.documentNumber,
        type: doc.type,
        status: doc.status,
        description: doc.items?.[0]?.description || `${doc.type} #${doc.documentNumber}`,
        debit,
        credit,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });

    const totalOutstanding = Math.max(0, runningBalance);

    return {
      success: true,
      client,
      company,
      statementPeriod: {
        startDate: startDate || (documents[0]?.issueDate ?? null),
        endDate: endDate || new Date(),
      },
      summary: {
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        currency,
        aging: {
          current: Math.round(aging.current * 100) / 100,
          days30_60: Math.round(aging.days30_60 * 100) / 100,
          days61_90: Math.round(aging.days61_90 * 100) / 100,
          days90Plus: Math.round(aging.days90Plus * 100) / 100,
        }
      },
      transactions,
    };
  });

  // Email Statement to Client via Stalwart Mail Server
  fastify.post('/:id/statement/email', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    const { emailOverride, message } = (request.body as any) || {};

    const [client, company] = await Promise.all([
      prisma.client.findFirst({ where: { id, companyId } }),
      prisma.company.findUnique({ where: { id: companyId } })
    ]);

    if (!client) {
      return reply.status(404).send({ error: 'Client not found' });
    }

    const recipientEmail = emailOverride || client.email;
    if (!recipientEmail) {
      return reply.status(400).send({ error: 'No email address on file for this client' });
    }

    // Fetch documents to compute current balance
    const docs = await prisma.document.findMany({
      where: { clientId: id, companyId, status: { not: 'CANCELLED' } }
    });

    let totalInvoiced = 0;
    let totalPaid = 0;
    docs.forEach(d => {
      const amt = Number(d.total) || 0;
      if (d.type === 'INVOICE') {
        totalInvoiced += amt;
        if (d.status === 'PAID') totalPaid += amt;
      } else if (d.type === 'RECEIPT') {
        totalPaid += amt;
      }
    });

    const balanceDue = Math.max(0, totalInvoiced - totalPaid);
    const currency = docs[0]?.currency || 'KES';

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
        <div style="border-bottom: 2px solid #1E3A8A; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #1E3A8A; margin: 0; font-size: 24px; font-weight: 800;">${company?.name || 'Exoin Africa'}</h1>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">${company?.tagline || 'Autonomous Hygiene & Specialized Facility Solutions'}</p>
        </div>

        <h2 style="font-size: 18px; color: #0f172a; margin-bottom: 8px;">Official Statement of Account</h2>
        <p>Dear ${client.contactPerson || client.name},</p>
        <p>${message || 'Please find below a summary of your statement of account with Exoin Africa.'}</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Total Invoiced:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; font-size: 14px;">${currency} ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Total Paid:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; font-size: 14px; color: #16a34a;">${currency} ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="padding: 10px 0 4px 0; font-weight: 700; font-size: 16px; color: #0f172a;">Outstanding Balance Due:</td>
              <td style="padding: 10px 0 4px 0; text-align: right; font-weight: 800; font-size: 18px; color: #ea580c;">${currency} ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #1E3A8A; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #1e3a8a;">
          <strong>Remittance Coordinates:</strong><br />
          Bank: ${company?.bankName || 'Equity Bank Kenya'}<br />
          Account: ${company?.bankAccount || '0123456789012'}<br />
          Branch: ${company?.bankBranch || 'Westlands Supreme Branch'}<br />
          KRA PIN: ${company?.taxId || 'A015776087P'}
        </div>

        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 32px;">
          This official statement was automatically dispatched from Exoin Africa Workspace. For any questions, please contact ${company?.email || 'admin@exoinafrica.com'} or call ${company?.phone || '0739443244'}.
        </p>
      </div>
    `;

    const sendResult = await emailService.sendEmail({
      to: recipientEmail,
      subject: `Statement of Account from ${company?.name || 'Exoin Africa'} - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      html: htmlBody,
    });

    return {
      success: sendResult.success,
      messageId: sendResult.messageId,
      recipient: recipientEmail,
      balanceDue,
    };
  });

  // Create client
  fastify.post('/', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    const { name, email, phone, contactPerson, addressLine1, addressLine2, city, country } = request.body as any;
    
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        contactPerson,
        addressLine1,
        addressLine2,
        city,
        country,
        companyId,
      }
    });
    
    return client;
  });

  // Update client
  fastify.put('/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    const data = request.body as any;
    
    const existing = await prisma.client.findFirst({
      where: { id, companyId }
    });
    
    if (!existing) {
      return reply.status(404).send({ error: 'Client not found' });
    }
    
    const client = await prisma.client.update({
      where: { id },
      data,
    });
    
    return client;
  });

  // Delete client
  fastify.delete('/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    
    const existing = await prisma.client.findFirst({
      where: { id, companyId }
    });
    
    if (!existing) {
      return reply.status(404).send({ error: 'Client not found' });
    }
    
    await prisma.client.delete({ where: { id } });
    
    return { success: true };
  });
}
