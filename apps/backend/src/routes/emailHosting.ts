import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import emailHostingService from '../services/emailHostingService';

interface CreateDomainBody {
  domain: string;
  maxMailboxes?: number;
  maxAliases?: number;
  totalStorageQuotaMb?: number;
}

interface CreateMailboxBody {
  localPart: string;
  password: string;
  displayName?: string;
  quotaMb?: number;
  isAdmin?: boolean;
}

interface UpdateMailboxBody {
  displayName?: string;
  quotaMb?: number;
  isActive?: boolean;
  autoReply?: boolean;
  autoReplySubject?: string;
  autoReplyMessage?: string;
  autoReplyStart?: string;
  autoReplyEnd?: string;
  forwardingEnabled?: boolean;
  forwardingAddress?: string;
  keepCopy?: boolean;
  spamFilterLevel?: string;
  spamAction?: string;
  signatureHtml?: string;
  signatureText?: string;
}

interface CreateAliasBody {
  localPart: string;
  targetMailboxId?: string;
  externalTarget?: string;
}

export default async function emailHostingRoutes(fastify: FastifyInstance) {
  // Add authentication to all routes in this plugin
  fastify.addHook('preHandler', (fastify as any).authenticate);

  // ==================== DOMAIN ROUTES ====================

  // Get all domains for company
  fastify.get('/domains', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const domains = await emailHostingService.getDomainsByCompany(user.companyId);
      return { success: true, domains };
    } catch (error: any) {
      console.error('Error fetching domains:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Create a new domain
  fastify.post('/domains', async (request: FastifyRequest<{ Body: CreateDomainBody }>, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { domain, maxMailboxes, maxAliases, totalStorageQuotaMb } = request.body;

      if (!domain) {
        return reply.status(400).send({ success: false, error: 'Domain name is required' });
      }

      // Validate domain format
      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(domain)) {
        return reply.status(400).send({ success: false, error: 'Invalid domain format' });
      }

      const emailDomain = await emailHostingService.createEmailDomain(
        domain,
        user.companyId,
        { maxMailboxes, maxAliases, totalStorageQuotaMb }
      );

      return { success: true, domain: emailDomain };
    } catch (error: any) {
      console.error('Error creating domain:', error);
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, error: 'Domain already exists' });
      }
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Get domain by ID
  fastify.get('/domains/:domainId', async (request: FastifyRequest<{ Params: { domainId: string } }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const domain = await emailHostingService.getDomainById(domainId);

      if (!domain) {
        return reply.status(404).send({ success: false, error: 'Domain not found' });
      }

      return { success: true, domain };
    } catch (error: any) {
      console.error('Error fetching domain:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Get DNS records for domain
  fastify.get('/domains/:domainId/dns', async (request: FastifyRequest<{ Params: { domainId: string } }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const records = await emailHostingService.getDomainDNSRecords(domainId);
      return { success: true, records };
    } catch (error: any) {
      console.error('Error fetching DNS records:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Regenerate DNS records for domain (fixes missing records)
  fastify.post('/domains/:domainId/regenerate-dns', async (request: FastifyRequest<{ Params: { domainId: string } }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const records = await emailHostingService.regenerateDNSRecords(domainId);
      return { success: true, records, message: 'DNS records regenerated successfully' };
    } catch (error: any) {
      console.error('Error regenerating DNS records:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Verify DNS records
  fastify.post('/domains/:domainId/verify', async (request: FastifyRequest<{ Params: { domainId: string } }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const result = await emailHostingService.verifyDNSRecords(domainId);
      return { success: true, ...result };
    } catch (error: any) {
      console.error('Error verifying DNS records:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Get domain statistics
  fastify.get('/domains/:domainId/stats', async (request: FastifyRequest<{ Params: { domainId: string } }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const stats = await emailHostingService.getDomainStats(domainId);
      return { success: true, stats };
    } catch (error: any) {
      console.error('Error fetching domain stats:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Check Gmail deliverability - comprehensive check for Gmail acceptance
  fastify.get('/domains/:domainId/gmail-check', async (request: FastifyRequest<{ Params: { domainId: string } }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const result = await emailHostingService.checkGmailDeliverability(domainId);
      return { success: true, ...result };
    } catch (error: any) {
      console.error('Error checking Gmail deliverability:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Check PTR record for server IP
  fastify.post('/check-ptr', async (request: FastifyRequest<{ Body: { serverIP: string; hostname: string } }>, reply: FastifyReply) => {
    try {
      const { serverIP, hostname } = request.body;
      if (!serverIP || !hostname) {
        return reply.status(400).send({ success: false, error: 'serverIP and hostname are required' });
      }
      const result = await emailHostingService.checkPTRRecord(serverIP, hostname);
      return { success: true, ...result };
    } catch (error: any) {
      console.error('Error checking PTR:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Check if IP is on blacklists
  fastify.post('/check-blacklists', async (request: FastifyRequest<{ Body: { serverIP: string } }>, reply: FastifyReply) => {
    try {
      const { serverIP } = request.body;
      if (!serverIP) {
        return reply.status(400).send({ success: false, error: 'serverIP is required' });
      }
      const result = await emailHostingService.checkBlacklists(serverIP);
      return { success: true, ...result };
    } catch (error: any) {
      console.error('Error checking blacklists:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Upgrade DMARC policy
  fastify.post('/domains/:domainId/upgrade-dmarc', async (request: FastifyRequest<{ 
    Params: { domainId: string }; 
    Body: { policy: 'none' | 'quarantine' | 'reject' } 
  }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const { policy } = request.body;
      
      if (!['none', 'quarantine', 'reject'].includes(policy)) {
        return reply.status(400).send({ success: false, error: 'Policy must be none, quarantine, or reject' });
      }
      
      await emailHostingService.upgradeDmarcPolicy(domainId, policy);
      return { success: true, message: `DMARC policy updated to ${policy}` };
    } catch (error: any) {
      console.error('Error upgrading DMARC:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Delete domain
  fastify.delete('/domains/:domainId', async (request: FastifyRequest<{ Params: { domainId: string } }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      await emailHostingService.deleteEmailDomain(domainId);
      return { success: true, message: 'Domain deleted successfully' };
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // ==================== MAILBOX ROUTES ====================

  // Get mailboxes for domain
  fastify.get('/domains/:domainId/mailboxes', async (request: FastifyRequest<{ Params: { domainId: string } }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const mailboxes = await emailHostingService.getMailboxesByDomain(domainId);
      return { success: true, mailboxes };
    } catch (error: any) {
      console.error('Error fetching mailboxes:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Create mailbox
  fastify.post('/domains/:domainId/mailboxes', async (request: FastifyRequest<{ Params: { domainId: string }; Body: CreateMailboxBody }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const { localPart, password, displayName, quotaMb, isAdmin } = request.body;

      if (!localPart || !password) {
        return reply.status(400).send({ success: false, error: 'Email address and password are required' });
      }

      if (password.length < 8) {
        return reply.status(400).send({ success: false, error: 'Password must be at least 8 characters' });
      }

      const mailbox = await emailHostingService.createMailbox(domainId, localPart, password, {
        displayName,
        quotaMb,
        isAdmin
      });

      return { success: true, mailbox };
    } catch (error: any) {
      console.error('Error creating mailbox:', error);
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, error: 'Mailbox already exists' });
      }
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Get mailbox by ID
  fastify.get('/mailboxes/:mailboxId', async (request: FastifyRequest<{ Params: { mailboxId: string } }>, reply: FastifyReply) => {
    try {
      const { mailboxId } = request.params;
      const mailbox = await emailHostingService.getMailboxById(mailboxId);

      if (!mailbox) {
        return reply.status(404).send({ success: false, error: 'Mailbox not found' });
      }

      // Don't send password hash
      const { passwordHash, ...safeMailbox } = mailbox;
      return { success: true, mailbox: safeMailbox };
    } catch (error: any) {
      console.error('Error fetching mailbox:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Update mailbox
  fastify.patch('/mailboxes/:mailboxId', async (request: FastifyRequest<{ Params: { mailboxId: string }; Body: UpdateMailboxBody }>, reply: FastifyReply) => {
    try {
      const { mailboxId } = request.params;
      const data: any = { ...request.body };

      // Convert date strings to Date objects
      if (data.autoReplyStart) data.autoReplyStart = new Date(data.autoReplyStart);
      if (data.autoReplyEnd) data.autoReplyEnd = new Date(data.autoReplyEnd);

      const mailbox = await emailHostingService.updateMailbox(mailboxId, data);
      return { success: true, mailbox };
    } catch (error: any) {
      console.error('Error updating mailbox:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Update mailbox password
  fastify.post('/mailboxes/:mailboxId/password', async (request: FastifyRequest<{ Params: { mailboxId: string }; Body: { password: string } }>, reply: FastifyReply) => {
    try {
      const { mailboxId } = request.params;
      const { password } = request.body;

      if (!password || password.length < 8) {
        return reply.status(400).send({ success: false, error: 'Password must be at least 8 characters' });
      }

      await emailHostingService.updateMailboxPassword(mailboxId, password);
      return { success: true, message: 'Password updated successfully' };
    } catch (error: any) {
      console.error('Error updating mailbox password:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Delete mailbox
  fastify.delete('/mailboxes/:mailboxId', async (request: FastifyRequest<{ Params: { mailboxId: string } }>, reply: FastifyReply) => {
    try {
      const { mailboxId } = request.params;
      await emailHostingService.deleteMailbox(mailboxId);
      return { success: true, message: 'Mailbox deleted successfully' };
    } catch (error: any) {
      console.error('Error deleting mailbox:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // ==================== ALIAS ROUTES ====================

  // Get aliases for domain
  fastify.get('/domains/:domainId/aliases', async (request: FastifyRequest<{ Params: { domainId: string } }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const aliases = await emailHostingService.getAliasesByDomain(domainId);
      return { success: true, aliases };
    } catch (error: any) {
      console.error('Error fetching aliases:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Create alias
  fastify.post('/domains/:domainId/aliases', async (request: FastifyRequest<{ Params: { domainId: string }; Body: CreateAliasBody }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const { localPart, targetMailboxId, externalTarget } = request.body;

      if (!localPart) {
        return reply.status(400).send({ success: false, error: 'Alias name is required' });
      }

      if (!targetMailboxId && !externalTarget) {
        return reply.status(400).send({ success: false, error: 'Target mailbox or external address is required' });
      }

      const alias = await emailHostingService.createEmailAlias(domainId, localPart, {
        mailboxId: targetMailboxId,
        externalAddress: externalTarget
      });

      return { success: true, alias };
    } catch (error: any) {
      console.error('Error creating alias:', error);
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, error: 'Alias already exists' });
      }
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Update alias
  fastify.patch('/aliases/:aliasId', async (request: FastifyRequest<{ Params: { aliasId: string }; Body: Partial<CreateAliasBody & { isActive: boolean }> }>, reply: FastifyReply) => {
    try {
      const { aliasId } = request.params;
      const data: any = { ...request.body };
      
      // Map the body fields to the correct names
      if (data.targetMailboxId !== undefined) {
        data.targetMailboxId = data.targetMailboxId;
      }
      if (data.externalTarget !== undefined) {
        data.externalTarget = data.externalTarget;
      }

      const alias = await emailHostingService.updateEmailAlias(aliasId, data);
      return { success: true, alias };
    } catch (error: any) {
      console.error('Error updating alias:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Delete alias
  fastify.delete('/aliases/:aliasId', async (request: FastifyRequest<{ Params: { aliasId: string } }>, reply: FastifyReply) => {
    try {
      const { aliasId } = request.params;
      await emailHostingService.deleteEmailAlias(aliasId);
      return { success: true, message: 'Alias deleted successfully' };
    } catch (error: any) {
      console.error('Error deleting alias:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // ==================== EMAIL LOGS ====================

  fastify.get('/domains/:domainId/logs', async (request: FastifyRequest<{ 
    Params: { domainId: string }; 
    Querystring: { direction?: string; status?: string; limit?: string; offset?: string } 
  }>, reply: FastifyReply) => {
    try {
      const { domainId } = request.params;
      const { direction, status, limit, offset } = request.query;

      const result = await emailHostingService.getEmailLogs(domainId, {
        direction: direction as 'inbound' | 'outbound' | undefined,
        status,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      });

      return { success: true, ...result };
    } catch (error: any) {
      console.error('Error fetching email logs:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
}
