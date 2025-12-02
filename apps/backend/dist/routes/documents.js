"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = documentsRoutes;
const index_1 = require("../index");
const client_1 = require("@prisma/client");
async function documentsRoutes(fastify) {
    // Get all documents (with filters)
    fastify.get('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { type, status, clientId, page = 1, limit = 20 } = request.query;
        const { companyId } = request.user;
        const where = { companyId };
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        if (clientId)
            where.clientId = clientId;
        const skip = (Number(page) - 1) * Number(limit);
        const [documents, total] = await Promise.all([
            index_1.prisma.document.findMany({
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
            index_1.prisma.document.count({ where })
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { companyId } = request.user;
        const document = await index_1.prisma.document.findFirst({
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId, companyId } = request.user;
        const { type, clientId, date, issueDate, dueDate, notes, terms, items } = request.body;
        // Generate document number
        const prefix = type === 'INVOICE' ? 'INV' : type === 'QUOTATION' ? 'QUO' : type === 'RECEIPT' ? 'REC' : 'LTR';
        const year = new Date().getFullYear();
        const count = await index_1.prisma.document.count({
            where: { companyId, type }
        });
        const documentNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxRate = 16; // Default Kenya VAT
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        const documentDate = date || issueDate || new Date();
        const document = await index_1.prisma.document.create({
            data: {
                documentNumber,
                type,
                status: client_1.DocumentStatus.DRAFT,
                issueDate: new Date(documentDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                subtotal,
                taxRate,
                taxAmount,
                total,
                notes,
                terms,
                companyId,
                clientId: clientId || null,
                createdById: userId,
                items: {
                    create: items.map((item) => ({
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { companyId } = request.user;
        const { status, clientId, issueDate, dueDate, notes, terms, items } = request.body;
        // Verify document exists and belongs to company
        const existing = await index_1.prisma.document.findFirst({
            where: { id, companyId }
        });
        if (!existing) {
            return reply.status(404).send({ error: 'Document not found' });
        }
        // If items are updated, recalculate totals
        let updateData = { status, clientId, issueDate, dueDate, notes, terms };
        if (items) {
            // Delete existing items and create new ones
            await index_1.prisma.documentItem.deleteMany({ where: { documentId: id } });
            const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const taxAmount = subtotal * (Number(existing.taxRate) / 100);
            const total = subtotal + taxAmount;
            updateData = {
                ...updateData,
                subtotal,
                taxAmount,
                total,
                items: {
                    create: items.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    }))
                }
            };
        }
        const document = await index_1.prisma.document.update({
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { companyId } = request.user;
        const existing = await index_1.prisma.document.findFirst({
            where: { id, companyId }
        });
        if (!existing) {
            return reply.status(404).send({ error: 'Document not found' });
        }
        await index_1.prisma.document.delete({ where: { id } });
        return { success: true };
    });
    // Get invoices specifically
    fastify.get('/invoices', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const documents = await index_1.prisma.document.findMany({
            where: { companyId, type: client_1.DocumentType.INVOICE },
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const documents = await index_1.prisma.document.findMany({
            where: { companyId, type: client_1.DocumentType.QUOTATION },
            include: {
                client: true,
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return documents;
    });
}
