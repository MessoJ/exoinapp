import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

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
