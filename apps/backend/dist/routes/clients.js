"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = clientsRoutes;
const index_1 = require("../index");
async function clientsRoutes(fastify) {
    // Get all clients
    fastify.get('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const clients = await index_1.prisma.client.findMany({
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { companyId } = request.user;
        const client = await index_1.prisma.client.findFirst({
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
    // Create client
    fastify.post('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const { name, email, phone, contactPerson, addressLine1, addressLine2, city, country } = request.body;
        const client = await index_1.prisma.client.create({
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { companyId } = request.user;
        const data = request.body;
        const existing = await index_1.prisma.client.findFirst({
            where: { id, companyId }
        });
        if (!existing) {
            return reply.status(404).send({ error: 'Client not found' });
        }
        const client = await index_1.prisma.client.update({
            where: { id },
            data,
        });
        return client;
    });
    // Delete client
    fastify.delete('/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { companyId } = request.user;
        const existing = await index_1.prisma.client.findFirst({
            where: { id, companyId }
        });
        if (!existing) {
            return reply.status(404).send({ error: 'Client not found' });
        }
        await index_1.prisma.client.delete({ where: { id } });
        return { success: true };
    });
}
