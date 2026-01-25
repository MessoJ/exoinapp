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
    
    return { 
      documents, 
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
    
    return document;
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
      items,
      scope,
      taxable,
      taxRate: reqTaxRate
    } = request.body as any;
    
    // Generate document number
    const prefix = type === 'INVOICE' ? 'INV' : type === 'QUOTATION' ? 'QUO' : type === 'RECEIPT' ? 'REC' : 'LTR';
    const year = new Date().getFullYear();
    const count = await prisma.document.count({ 
      where: { companyId, type } 
    });
    const documentNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
    
    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const isTaxable = taxable !== false;
    const taxRate = isTaxable ? (Number(reqTaxRate) || 16) : 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    const documentDate = date || issueDate || new Date();
    
    const document = await prisma.document.create({
      data: {
        documentNumber,
        type,
        status: DocumentStatus.DRAFT,
        issueDate: new Date(documentDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        taxable: isTaxable,
        taxRate,
        taxAmount,
        total,
        scope,
        notes,
        terms,
        companyId,
        clientId: clientId || null,
        createdById: userId,
        items: {
          create: items.map((item: any) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          }))
        }
      },
      include: {
        client: true,
        items: true,
      }
    });
    
    return document;
  });

  // Update document
  fastify.put('/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    const { 
      status, 
      clientId, 
      issueDate, 
      dueDate, 
      notes, 
      terms, 
      items,
      scope,
      taxable,
      taxRate
    } = request.body as any;
    
    // Verify document exists and belongs to company
    const existing = await prisma.document.findFirst({
      where: { id, companyId }
    });
    
    if (!existing) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    // If items are updated, recalculate totals
    let updateData: any = { status, clientId, issueDate, dueDate, notes, terms, scope };
    if (taxable !== undefined) updateData.taxable = taxable;
    if (taxRate !== undefined) updateData.taxRate = Number(taxRate);
    
    if (items) {
      // Delete existing items and create new ones
      await prisma.documentItem.deleteMany({ where: { documentId: id } });
      
      const effectiveTaxable = taxable !== undefined ? taxable : ((existing as any).taxable ?? true);
      const effectiveTaxRate = taxRate !== undefined ? Number(taxRate) : Number(existing.taxRate);
      const actualTaxRate = effectiveTaxable ? effectiveTaxRate : 0;

      const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = subtotal * (actualTaxRate / 100);
      const total = subtotal + taxAmount;
      
      updateData = {
        ...updateData,
        taxAmount,
        total,
        subtotal,
        items: {
          create: items.map((item: any) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          }))
        }
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
    
    return document;
  });

  // Delete document
  fastify.delete('/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    
    const existing = await prisma.document.findFirst({
      where: { id, companyId }
    });
    
    if (!existing) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    await prisma.document.delete({ where: { id } });
    
    return { success: true };
  });

  // Get invoices specifically
  fastify.get('/invoices', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    
    const documents = await prisma.document.findMany({
      where: { companyId, type: DocumentType.INVOICE },
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return documents;
  });

  // Get quotations specifically
  fastify.get('/quotations', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    
    const documents = await prisma.document.findMany({
      where: { companyId, type: DocumentType.QUOTATION },
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return documents;
  });
}
