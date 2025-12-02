"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = dashboardRoutes;
const index_1 = require("../index");
const client_1 = require("@prisma/client");
async function dashboardRoutes(fastify) {
    // Get dashboard stats
    fastify.get('/stats', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const [documentsCount, clientsCount, usersCount, paidInvoices, pendingInvoices,] = await Promise.all([
            index_1.prisma.document.count({ where: { companyId } }),
            index_1.prisma.client.count({ where: { companyId } }),
            index_1.prisma.user.count({ where: { companyId } }),
            index_1.prisma.document.count({ where: { companyId, type: client_1.DocumentType.INVOICE, status: client_1.DocumentStatus.PAID } }),
            index_1.prisma.document.count({ where: { companyId, type: client_1.DocumentType.INVOICE, status: { in: [client_1.DocumentStatus.SENT, client_1.DocumentStatus.DRAFT] } } }),
        ]);
        // Calculate revenue
        const invoiceRevenue = await index_1.prisma.document.aggregate({
            where: { companyId, type: client_1.DocumentType.INVOICE, status: client_1.DocumentStatus.PAID },
            _sum: { total: true },
        });
        const pendingRevenue = await index_1.prisma.document.aggregate({
            where: { companyId, type: client_1.DocumentType.INVOICE, status: { in: [client_1.DocumentStatus.SENT, client_1.DocumentStatus.DRAFT] } },
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const { limit = 10 } = request.query;
        const documents = await index_1.prisma.document.findMany({
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
