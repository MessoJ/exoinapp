import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import * as argon2 from 'argon2';

export default async function companyRoutes(fastify: FastifyInstance) {
  
  // Get company details
  fastify.get('/', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    
    if (!company) {
      return reply.status(404).send({ error: 'Company not found' });
    }
    
    return company;
  });

  // Update company
  fastify.put('/', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId, role } = (request as any).user;
    
    // Only admins can update company
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    
    const data = request.body as any;
    
    const company = await prisma.company.update({
      where: { id: companyId },
      data,
    });
    
    return company;
  });

  // Get company users
  fastify.get('/users', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    
    const users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        jobTitle: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return users;
  });

  // Create new user
  fastify.post('/users', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId, role } = (request as any).user;
    
    // Only admins can create users
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    
    const { email, firstName, lastName, password, role: userRole, jobTitle, phone } = request.body as any;
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return reply.status(400).send({ error: 'Email already exists' });
    }
    
    const hashedPassword = await argon2.hash(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        role: userRole || 'STAFF',
        jobTitle,
        phone,
        companyId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        jobTitle: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
    
    return user;
  });

  // Update user
  fastify.put('/users/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId, role } = (request as any).user;
    const { id } = request.params as any;
    
    // Only admins can update users
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    
    const { email, firstName, lastName, role: userRole, jobTitle, phone, isActive, password } = request.body as any;
    
    // Verify user belongs to company
    const existingUser = await prisma.user.findFirst({
      where: { id, companyId },
    });
    
    if (!existingUser) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    const updateData: any = {};
    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (userRole) updateData.role = userRole;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.passwordHash = await argon2.hash(password);
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        jobTitle: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
    
    return user;
  });

  // Delete user
  fastify.delete('/users/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId, role, userId } = (request as any).user;
    const { id } = request.params as any;
    
    // Only admins can delete users
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    
    // Can't delete yourself
    if (id === userId) {
      return reply.status(400).send({ error: 'Cannot delete yourself' });
    }
    
    // Verify user belongs to company
    const existingUser = await prisma.user.findFirst({
      where: { id, companyId },
    });
    
    if (!existingUser) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    await prisma.user.delete({
      where: { id },
    });
    
    return { success: true };
  });

  // Get templates
  fastify.get('/templates', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    const { type } = request.query as any;
    
    const where: any = { companyId };
    if (type) where.type = type;
    
    const templates = await prisma.template.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    
    return templates;
  });
}
