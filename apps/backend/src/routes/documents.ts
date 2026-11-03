import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { DocumentType, DocumentStatus } from '@prisma/client';

export default async function documentsRoutes(fastify: FastifyInstance) {
  
  // Get all documents (with filters)
  fastify.get('/', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { type, status, clientId, page = 1, limit = 20 } = request.query as any;
    const { companyId } = (request as any).user;
    
    const where: any = { companyId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          client: true,
          createdBy: {
            select: { firstName: true, lastName: true }
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.document.count({ where })
    ]);

    const formattedDocs = documents.map(doc => ({
      ...doc,
      tax: Number(doc.taxAmount),
      subtotal: Number(doc.subtotal),
      total: Number(doc.total)
    }));
    
    return { 
      documents: formattedDocs, 
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };
  });

  // Get single document
  fastify.get('/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    
    const document = await prisma.document.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        company: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true }
        },
        items: true,
      },
    });
    
    if (!document) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    return {
      ...document,
      tax: Number(document.taxAmount),
      subtotal: Number(document.subtotal),
      total: Number(document.total)
    };
  });

  // Create document
  fastify.post('/', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id: userId, companyId } = (request as any).user;
    const { 
      type, 
      clientId, 
      date,
      issueDate, 
      dueDate, 
      notes, 
      terms, 
      technicianName,
      includeSeal,
      signature,
      items,
      scope,
      taxable,
      taxRate: reqTaxRate,
      status: reqStatus,
      currency: reqCurrency,
    } = request.body as any;
    
    // Generate document number
    const prefix = type === 'INVOICE' ? 'INV' : type === 'QUOTATION' ? 'QUO' : type === 'DELIVERY_NOTE' ? 'DN' : type === 'JOB_CARD' ? 'JC' : type === 'RECEIPT' ? 'REC' : 'LTR';
    const year = new Date().getFullYear();
    const count = await prisma.document.count({ 
      where: { companyId, type } 
    });
    const documentNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
    
    // Calculate totals safely
    const itemsList = Array.isArray(items) ? items : [];
    const computedSubtotal = itemsList.length > 0
      ? itemsList.reduce((sum: number, item: any) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0)
      : (Number((request.body as any).subtotal) || 0);

    const isTaxable = taxable !== false;
    const taxRate = isTaxable ? (Number(reqTaxRate) || 16) : 0;
    const taxAmount = ((request.body as any).tax !== undefined && (request.body as any).tax !== null)
      ? Number((request.body as any).tax)
      : ((request.body as any).taxAmount !== undefined && (request.body as any).taxAmount !== null)
        ? Number((request.body as any).taxAmount)
        : (computedSubtotal * (taxRate / 100));
    const total = ((request.body as any).total !== undefined && (request.body as any).total !== null)
      ? Number((request.body as any).total)
      : (computedSubtotal + taxAmount);
    
    const documentDate = date || issueDate || new Date();
    const resolvedStatus = (reqStatus && Object.values(DocumentStatus).includes(reqStatus)) 
      ? reqStatus 
      : DocumentStatus.DRAFT;
    
    const document = await prisma.document.create({
      data: {
        documentNumber,
        type,
        status: resolvedStatus,
        issueDate: new Date(documentDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: computedSubtotal,
        taxable: isTaxable,
        taxRate,
        taxAmount,
        total,
        currency: reqCurrency || 'KES',
        scope,
        notes,
        terms,
        technicianName: technicianName || null,
        includeSeal: includeSeal !== false,
        signature: signature || null,
        companyId,
        clientId: clientId || null,
        createdById: userId,
        items: itemsList.length > 0 ? {
          create: itemsList.map((item: any) => ({
            name: item.name || item.title || item.description || 'Service/Item',
            description: item.description || item.name || item.title || '',
            quantity: Number(item.quantity ?? item.qty ?? 1),
            unitPrice: Number(item.unitPrice ?? item.rate ?? item.price ?? 0),
            total: (Number(item.quantity ?? item.qty ?? 1)) * (Number(item.unitPrice ?? item.rate ?? item.price ?? 0)),
          }))
        } : undefined
      },
      include: {
        client: true,
        items: true,
      }
    });
    
    return {
      ...document,
      tax: Number(document.taxAmount),
      subtotal: Number(document.subtotal),
      total: Number(document.total)
    };
  });

  // Update document
  fastify.put('/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    const { 
      clientId, 
      status, 
      issueDate, 
      dueDate, 
      notes, 
      terms, 
      technicianName,
      includeSeal,
      signature,
      items,
      scope,
      taxable,
      taxRate,
      currency
    } = request.body as any;
    
    // Verify document exists and belongs to company
    const existing = await prisma.document.findFirst({
      where: { id, companyId }
    });
    
    if (!existing) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    let updateData: any = { clientId, issueDate, dueDate, notes, terms, scope, technicianName };
    if (status && Object.values(DocumentStatus).includes(status)) updateData.status = status;
    if (currency) updateData.currency = currency;
    if (includeSeal !== undefined) updateData.includeSeal = includeSeal;
    if (signature !== undefined) updateData.signature = signature;
    if (taxable !== undefined) updateData.taxable = taxable;
    if (taxRate !== undefined) updateData.taxRate = Number(taxRate);
    
    if (items) {
      const itemsList = Array.isArray(items) ? items : [];
      await prisma.documentItem.deleteMany({ where: { documentId: id } });
      
      const effectiveTaxable = taxable !== undefined ? taxable : ((existing as any).taxable ?? true);
      const effectiveTaxRate = taxRate !== undefined ? Number(taxRate) : Number(existing.taxRate);
      const actualTaxRate = effectiveTaxable ? effectiveTaxRate : 0;

      const subtotal = itemsList.length > 0
        ? itemsList.reduce((sum: number, item: any) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0)
        : (Number((request.body as any).subtotal) || Number(existing.subtotal));
      const taxAmount = ((request.body as any).tax !== undefined)
        ? Number((request.body as any).tax)
        : ((request.body as any).taxAmount !== undefined)
          ? Number((request.body as any).taxAmount)
          : (subtotal * (actualTaxRate / 100));
      const total = ((request.body as any).total !== undefined)
        ? Number((request.body as any).total)
        : (subtotal + taxAmount);
      
      updateData = {
        ...updateData,
        taxAmount,
        total,
        subtotal,
        items: itemsList.length > 0 ? {
          create: itemsList.map((item: any) => ({
            name: item.name || item.title || item.description || 'Service/Item',
            description: item.description || item.title || item.name || '',
            quantity: Number(item.quantity ?? item.qty ?? 1),
            unitPrice: Number(item.unitPrice ?? item.rate ?? item.price ?? 0),
            total: (Number(item.quantity ?? item.qty ?? 1)) * (Number(item.unitPrice ?? item.rate ?? item.price ?? 0)),
          }))
        } : undefined
      };
    }
    
    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        items: true,
      }
    });
    
    return {
      ...document,
      tax: Number(document.taxAmount),
      subtotal: Number(document.subtotal),
      total: Number(document.total)
    };
  });

  // Delete document
  fastify.delete('/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    
    // Verify document exists and belongs to company
    const existing = await prisma.document.findFirst({
      where: { id, companyId }
    });
    
    if (!existing) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    // Delete items first
    await prisma.documentItem.deleteMany({ where: { documentId: id } });
    
    // Delete document
    await prisma.document.delete({ where: { id } });
    
    return { success: true };
  });

  // Update document status
  fastify.patch('/:id/status', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { status } = request.body as any;
    const { companyId } = (request as any).user;
    
    const document = await prisma.document.update({
      where: { id },
      data: { status }
    });
    
    return document;
  });

  // Duplicate document
  fastify.post('/:id/duplicate', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { id: userId, companyId } = (request as any).user;
    
    const existing = await prisma.document.findFirst({
      where: { id, companyId },
      include: { items: true }
    });
    
    if (!existing) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    // Generate new document number
    const prefix = existing.type === 'INVOICE' ? 'INV' : existing.type === 'QUOTATION' ? 'QUO' : existing.type === 'DELIVERY_NOTE' ? 'DN' : existing.type === 'JOB_CARD' ? 'JC' : existing.type === 'RECEIPT' ? 'REC' : 'LTR';
    const year = new Date().getFullYear();
    const count = await prisma.document.count({ 
      where: { companyId, type: existing.type } 
    });
    const documentNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
    
    const newDoc = await prisma.document.create({
      data: {
        documentNumber,
        type: existing.type,
        status: DocumentStatus.DRAFT,
        issueDate: new Date(),
        subtotal: existing.subtotal,
        taxRate: existing.taxRate,
        taxAmount: existing.taxAmount,
        total: existing.total,
        currency: existing.currency,
        scope: existing.scope,
        notes: existing.notes,
        terms: existing.terms,
        technicianName: existing.technicianName,
        includeSeal: existing.includeSeal,
        companyId,
        clientId: existing.clientId,
        createdById: userId,
        items: {
          create: existing.items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          }))
        }
      },
      include: {
        client: true,
        items: true,
      }
    });
    
    return {
      ...newDoc,
      tax: Number(newDoc.taxAmount),
      subtotal: Number(newDoc.subtotal),
      total: Number(newDoc.total)
    };
  });
}
