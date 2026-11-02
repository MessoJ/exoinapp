import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

// Import Routes
import authRoutes from './routes/auth';
import documentsRoutes from './routes/documents';
import clientsRoutes from './routes/clients';
import companyRoutes from './routes/company';
import assetsRoutes from './routes/assets';
import dashboardRoutes from './routes/dashboard';
import pdfRoutes from './routes/pdf';
import mailRoutes from './routes/mail';
import signatureRoutes from './routes/signature';
import emailHostingRoutes from './routes/emailHosting';
import usersRoutes from './routes/users';
import aiRoutes from './routes/ai';
import templatesRoutes from './routes/templates';
import trackingRoutes from './routes/tracking';
import mailMergeRoutes from './routes/mailMerge';
import twoFactorRoutes from './routes/twoFactor';
import adminRoutes from './routes/admin';
import rbacRoutes from './routes/rbac';

// Import Services
import { websocketService } from './services/websocketService';
import { cacheService } from './services/cacheService';
import { jobQueueService } from './services/jobQueueService';
import rbacService from './services/rbacService';

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Fastify
const server = Fastify({
  logger: true,
  bodyLimit: 52428800 // 50MB
});

// Register Plugins
server.register(cors, { 
  origin: true,
  credentials: true,
});

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
});

// Decorate request with user
server.decorate('authenticate', async function(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Enterprise RBAC Policy Enforcement Point (PEP) Decorators
server.decorate('authorize', function(requiredPermission: string) {
  return async function(request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const effectivePermissions = await rbacService.getUserEffectivePermissions(user);
    const allowed = rbacService.hasPermission(effectivePermissions, requiredPermission);

    if (!allowed) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Insufficient permissions: requires '${requiredPermission}'`,
        requiredPermission
      });
    }

    request.user.permissions = effectivePermissions;
  };
});

server.decorate('authorizeAny', function(requiredPermissions: string[]) {
  return async function(request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const effectivePermissions = await rbacService.getUserEffectivePermissions(user);
    const allowed = requiredPermissions.some(perm => rbacService.hasPermission(effectivePermissions, perm));

    if (!allowed) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Insufficient permissions: requires one of [${requiredPermissions.join(', ')}]`,
        requiredPermissions
      });
    }

    request.user.permissions = effectivePermissions;
  };
});

// Health Check
server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register Routes
server.register(authRoutes, { prefix: '/api/auth' });
server.register(documentsRoutes, { prefix: '/api/documents' });
server.register(clientsRoutes, { prefix: '/api/clients' });
server.register(companyRoutes, { prefix: '/api/company' });
server.register(assetsRoutes, { prefix: '/api/assets' });
server.register(dashboardRoutes, { prefix: '/api/dashboard' });
server.register(pdfRoutes, { prefix: '/api/pdf' });
server.register(mailRoutes, { prefix: '/api/mail' });
server.register(signatureRoutes, { prefix: '/api/signature' });
server.register(emailHostingRoutes, { prefix: '/api/email-hosting' });
server.register(usersRoutes, { prefix: '/api/users' });
server.register(aiRoutes, { prefix: '/api/ai' });
server.register(templatesRoutes, { prefix: '/api/mail' });
server.register(trackingRoutes, { prefix: '/api/track' });
server.register(mailMergeRoutes, { prefix: '/api/mail-merge' });
server.register(twoFactorRoutes, { prefix: '/api/auth/2fa' });
server.register(adminRoutes, { prefix: '/api/admin' });
server.register(rbacRoutes, { prefix: '/api/rbac' });

// Start Server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
    
    // Initialize WebSocket service with the underlying HTTP server
    if (process.env.ENABLE_WEBSOCKET === 'true') {
      websocketService.initialize(server.server);
      console.log('🔌 WebSocket service initialized');
    }
    
    // Initialize Redis cache (optional - only if REDIS_URL is set)
    if (process.env.REDIS_URL) {
      await cacheService.connect();
      console.log('📦 Redis cache connected');
    }
    
    // Initialize job queue (optional - only if REDIS_URL is set for BullMQ)
    if (process.env.REDIS_URL) {
      await jobQueueService.initialize();
      console.log('⚙️ Job queue service initialized');
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  try {
    await server.close();
    await prisma.$disconnect();
    
    if (process.env.REDIS_URL) {
      await cacheService.disconnect();
      await jobQueueService.shutdown();
    }
    
    console.log('✅ Server shut down successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
