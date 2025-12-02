import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { mailMergeService } from '../services/mailMergeService';

interface MailMergeParams {
  id: string;
}

interface ListQuery {
  page?: string;
  limit?: string;
}

export default async function mailMergeRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', (fastify as any).authenticate);

  // Parse CSV and return recipients with fields
  fastify.post<{
    Body: { csvContent: string };
  }>('/parse-csv', async (request, reply) => {
    const { csvContent } = request.body;

    if (!csvContent) {
      return reply.status(400).send({ error: 'CSV content is required' });
    }

    const recipients = mailMergeService.parseCSV(csvContent);
    const sampleFields = mailMergeService.getSampleMergeFields(recipients);

    return reply.send({
      recipients,
      count: recipients.length,
      fields: sampleFields,
    });
  });

  // Extract merge fields from content
  fastify.post<{
    Body: { content: string };
  }>('/extract-fields', async (request, reply) => {
    const { content } = request.body;

    if (!content) {
      return reply.status(400).send({ error: 'Content is required' });
    }

    const fields = mailMergeService.extractMergeFields(content);
    return reply.send({ fields });
  });

  // Validate recipients have all required fields
  fastify.post<{
    Body: {
      recipients: any[];
      requiredFields: string[];
    };
  }>('/validate', async (request, reply) => {
    const { recipients, requiredFields } = request.body;

    if (!recipients || !requiredFields) {
      return reply.status(400).send({ error: 'Recipients and required fields are required' });
    }

    const validation = mailMergeService.validateRecipients(recipients, requiredFields);
    return reply.send(validation);
  });

  // Preview merged content for a recipient
  fastify.post<{
    Body: {
      subject: string;
      content: string;
      recipient: any;
    };
  }>('/preview', async (request, reply) => {
    const { subject, content, recipient } = request.body;

    if (!subject || !content || !recipient) {
      return reply.status(400).send({ error: 'Subject, content, and recipient are required' });
    }

    const preview = mailMergeService.previewMailMerge(subject, content, recipient);
    return reply.send(preview);
  });

  // Create new mail merge campaign
  fastify.post<{
    Body: {
      name: string;
      subject: string;
      htmlBody: string;
      recipients: any[];
      scheduledAt?: string;
    };
  }>('/', async (request, reply) => {
    const userId = (request.user as any).id;
    const {
      name,
      subject,
      htmlBody,
      recipients,
      scheduledAt,
    } = request.body;

    if (!name || !subject || !htmlBody || !recipients) {
      return reply.status(400).send({
        error: 'Name, subject, htmlBody, and recipients are required',
      });
    }

    const mailMerge = await mailMergeService.createMailMerge({
      name,
      subject,
      htmlBody,
      recipients,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      userId,
    });

    return reply.status(201).send(mailMerge);
  });

  // Get all mail merges for current user
  fastify.get<{ Querystring: ListQuery }>('/', async (request, reply) => {
    const userId = (request.user as any).id;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);

    const result = await mailMergeService.getUserMailMerges(userId, page, limit);
    return reply.send(result);
  });

  // Get specific mail merge
  fastify.get<{ Params: MailMergeParams }>('/:id', async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;

    const mailMerge = await mailMergeService.getMailMerge(id, userId);
    
    if (!mailMerge) {
      return reply.status(404).send({ error: 'Mail merge not found' });
    }

    return reply.send(mailMerge);
  });

  // Start mail merge campaign
  fastify.post<{ Params: MailMergeParams }>('/:id/start', async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;

    const success = await mailMergeService.startMailMerge(id, userId);
    
    if (!success) {
      return reply.status(400).send({ error: 'Failed to start mail merge' });
    }

    return reply.send({ success: true, message: 'Mail merge started' });
  });

  // Cancel mail merge campaign
  fastify.post<{ Params: MailMergeParams }>('/:id/cancel', async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;

    const success = await mailMergeService.cancelMailMerge(id, userId);
    
    if (!success) {
      return reply.status(400).send({ error: 'Failed to cancel mail merge' });
    }

    return reply.send({ success: true, message: 'Mail merge cancelled' });
  });

  // Delete mail merge campaign
  fastify.delete<{ Params: MailMergeParams }>('/:id', async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;

    const success = await mailMergeService.deleteMailMerge(id, userId);
    
    if (!success) {
      return reply.status(400).send({ error: 'Failed to delete mail merge' });
    }

    return reply.send({ success: true, message: 'Mail merge deleted' });
  });
}
