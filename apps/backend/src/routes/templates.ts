import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

// Template categories
const EmailTemplateCategory = {
  GENERAL: 'GENERAL',
  SALES: 'SALES',
  SUPPORT: 'SUPPORT',
  MARKETING: 'MARKETING',
  HR: 'HR',
  FINANCE: 'FINANCE',
  FOLLOW_UP: 'FOLLOW_UP',
  MEETING: 'MEETING',
  INTRODUCTION: 'INTRODUCTION',
  THANK_YOU: 'THANK_YOU',
} as const;

type EmailTemplateCategoryType = typeof EmailTemplateCategory[keyof typeof EmailTemplateCategory];

// Common placeholders that can be used in templates
const COMMON_PLACEHOLDERS = [
  { key: '{{name}}', description: 'Recipient name' },
  { key: '{{firstName}}', description: 'Recipient first name' },
  { key: '{{lastName}}', description: 'Recipient last name' },
  { key: '{{company}}', description: 'Company name' },
  { key: '{{email}}', description: 'Email address' },
  { key: '{{date}}', description: 'Current date' },
  { key: '{{time}}', description: 'Current time' },
  { key: '{{senderName}}', description: 'Your name' },
  { key: '{{senderTitle}}', description: 'Your job title' },
];

// Extract placeholders from text
function extractPlaceholders(text: string): string[] {
  const regex = /\{\{[^}]+\}\}/g;
  const matches = text.match(regex) || [];
  return [...new Set(matches)];
}

// Replace placeholders in text
function replacePlaceholders(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = key.startsWith('{{') ? key : `{{${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  return result;
}

export default async function templatesRoutes(fastify: FastifyInstance) {
  
  // ==========================================
  // EMAIL TEMPLATES
  // ==========================================

  // Get all templates for user
  fastify.get('/templates', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId, companyId } = (request as any).user;
    const { category, search } = request.query as any;

    const where: any = {
      OR: [
        { userId },
        { isShared: true, companyId },
      ],
    };

    if (category && category !== 'ALL') {
      where.category = category as EmailTemplateCategoryType;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return {
      templates: templates.map((t: any) => ({
        ...t,
        isOwner: t.userId === userId,
      })),
    };
  });

  // Get template categories
  fastify.get('/templates/categories', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const categories = Object.values(EmailTemplateCategory).map((cat: string) => ({
      id: cat,
      name: cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
    }));

    return { categories };
  });

  // Get available placeholders
  fastify.get('/templates/placeholders', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    return { placeholders: COMMON_PLACEHOLDERS };
  });

  // Get single template
  fastify.get('/templates/:id', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { id: userId, companyId } = (request as any).user;

    const template = await prisma.emailTemplate.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { isShared: true, companyId },
        ],
      },
    });

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    return {
      template: {
        ...template,
        isOwner: template.userId === userId,
      },
    };
  });

  // Create template
  fastify.post('/templates', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId, companyId } = (request as any).user;
    const { name, subject, htmlBody, textBody, category, isShared } = request.body as any;

    if (!name) {
      return reply.status(400).send({ error: 'Template name is required' });
    }

    // Extract placeholders from content
    const allContent = `${subject || ''} ${htmlBody || ''} ${textBody || ''}`;
    const placeholders = extractPlaceholders(allContent);

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject: subject || '',
        htmlBody,
        textBody,
        category: (category as EmailTemplateCategoryType) || 'GENERAL',
        placeholders,
        isShared: isShared || false,
        userId,
        companyId: isShared ? companyId : null,
      },
    });

    return { template };
  });

  // Update template
  fastify.put('/templates/:id', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { id: userId } = (request as any).user;
    const { name, subject, htmlBody, textBody, category, isShared } = request.body as any;

    // Check ownership
    const existing = await prisma.emailTemplate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Template not found or no permission to edit' });
    }

    // Extract placeholders from content
    const allContent = `${subject || ''} ${htmlBody || ''} ${textBody || ''}`;
    const placeholders = extractPlaceholders(allContent);

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(subject !== undefined && { subject }),
        ...(htmlBody !== undefined && { htmlBody }),
        ...(textBody !== undefined && { textBody }),
        ...(category !== undefined && { category: category as EmailTemplateCategoryType }),
        ...(isShared !== undefined && { isShared }),
        placeholders,
      },
    });

    return { template };
  });

  // Delete template
  fastify.delete('/templates/:id', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { id: userId } = (request as any).user;

    // Check ownership
    const existing = await prisma.emailTemplate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Template not found or no permission to delete' });
    }

    await prisma.emailTemplate.delete({ where: { id } });

    return { success: true };
  });

  // Use template (increment counter and replace placeholders)
  fastify.post('/templates/:id/use', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { id: userId, companyId } = (request as any).user;
    const { variables = {} } = request.body as { variables?: Record<string, string> };

    const template = await prisma.emailTemplate.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { isShared: true, companyId },
        ],
      },
    });

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    // Increment usage counter
    await prisma.emailTemplate.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Get sender info for placeholders
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, jobTitle: true, email: true },
    });

    // Add default variables
    const now = new Date();
    const defaultVars: Record<string, string> = {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      senderName: sender ? `${sender.firstName} ${sender.lastName}` : '',
      senderTitle: sender?.jobTitle || '',
      ...variables,
    };

    // Replace placeholders
    const processedSubject = replacePlaceholders(template.subject, defaultVars);
    const processedHtmlBody = template.htmlBody ? replacePlaceholders(template.htmlBody, defaultVars) : null;
    const processedTextBody = template.textBody ? replacePlaceholders(template.textBody, defaultVars) : null;

    return {
      subject: processedSubject,
      htmlBody: processedHtmlBody,
      textBody: processedTextBody,
      placeholdersUsed: template.placeholders,
      missingPlaceholders: (template.placeholders as string[]).filter((p: string) => !defaultVars[p.replace(/[{}]/g, '')]),
    };
  });

  // Duplicate template
  fastify.post('/templates/:id/duplicate', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { id: userId, companyId } = (request as any).user;

    const original = await prisma.emailTemplate.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { isShared: true, companyId },
        ],
      },
    });

    if (!original) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    const duplicate = await prisma.emailTemplate.create({
      data: {
        name: `${original.name} (Copy)`,
        subject: original.subject,
        htmlBody: original.htmlBody,
        textBody: original.textBody,
        category: original.category,
        placeholders: original.placeholders,
        isShared: false,
        userId,
      },
    });

    return { template: duplicate };
  });

  // ==========================================
  // VACATION RESPONDER
  // ==========================================

  // Get vacation responder settings
  fastify.get('/vacation', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;

    const responder = await prisma.vacationResponder.findUnique({
      where: { userId },
    });

    return {
      responder: responder || null,
      isActive: responder?.isActive && 
        new Date() >= responder.startDate && 
        new Date() <= responder.endDate,
    };
  });

  // Create/Update vacation responder
  fastify.put('/vacation', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;
    const { 
      startDate, 
      endDate, 
      subject, 
      message, 
      isActive,
      onlyContacts,
      onlyOnce,
      excludedDomains,
    } = request.body as any;

    if (!startDate || !endDate || !message) {
      return reply.status(400).send({ error: 'Start date, end date, and message are required' });
    }

    const responder = await prisma.vacationResponder.upsert({
      where: { userId },
      create: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        subject: subject || 'Out of Office',
        message,
        isActive: isActive ?? true,
        onlyContacts: onlyContacts ?? false,
        onlyOnce: onlyOnce ?? true,
        excludedDomains: excludedDomains || [],
        respondedTo: [],
      },
      update: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        subject: subject || 'Out of Office',
        message,
        isActive: isActive ?? true,
        onlyContacts: onlyContacts ?? false,
        onlyOnce: onlyOnce ?? true,
        excludedDomains: excludedDomains || [],
        // Reset responded list if dates change
        ...(startDate && { respondedTo: [] }),
      },
    });

    return { responder };
  });

  // Delete vacation responder
  fastify.delete('/vacation', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;

    await prisma.vacationResponder.delete({
      where: { userId },
    }).catch(() => null); // Ignore if doesn't exist

    return { success: true };
  });

  // Toggle vacation responder active status
  fastify.patch('/vacation/toggle', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;
    const { isActive } = request.body as { isActive: boolean };

    const responder = await prisma.vacationResponder.update({
      where: { userId },
      data: { isActive },
    });

    return { responder };
  });
}
