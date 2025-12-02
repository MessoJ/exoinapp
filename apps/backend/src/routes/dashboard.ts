import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { DocumentStatus, DocumentType } from '@prisma/client';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  
  // Get dashboard stats
  fastify.get('/stats', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    
    const [
      documentsCount,
      clientsCount,
      usersCount,
      paidInvoices,
      pendingInvoices,
    ] = await Promise.all([
      prisma.document.count({ where: { companyId } }),
      prisma.client.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId } }),
      prisma.document.count({ where: { companyId, type: DocumentType.INVOICE, status: DocumentStatus.PAID } }),
      prisma.document.count({ where: { companyId, type: DocumentType.INVOICE, status: { in: [DocumentStatus.SENT, DocumentStatus.DRAFT] } } }),
    ]);
    
    // Calculate revenue
    const invoiceRevenue = await prisma.document.aggregate({
      where: { companyId, type: DocumentType.INVOICE, status: DocumentStatus.PAID },
      _sum: { total: true },
    });
    
    const pendingRevenue = await prisma.document.aggregate({
      where: { companyId, type: DocumentType.INVOICE, status: { in: [DocumentStatus.SENT, DocumentStatus.DRAFT] } },
      _sum: { total: true },
    });
    
    return {
      documentsCount,
      clientsCount,
      usersCount,
      totalRevenue: invoiceRevenue._sum.total || 0,
      pendingAmount: pendingInvoices,
    };
  });

  // Get activity feed
  fastify.get('/activity', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    const { limit = 10 } = request.query as { limit?: number };
    
    const documents = await prisma.document.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      take: Number(limit),
      include: {
        client: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      }
    });
    
    return documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      documentNumber: doc.documentNumber,
      client: doc.client?.name,
      user: `${doc.createdBy.firstName} ${doc.createdBy.lastName}`,
      status: doc.status,
      total: doc.total,
      createdAt: doc.createdAt,
    }));
  });
}
