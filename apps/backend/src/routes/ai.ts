import { FastifyInstance } from 'fastify';
import { aiService, EmailTone } from '../services/aiService';

export default async function aiRoutes(fastify: FastifyInstance) {
  
  // Check if AI is available
  fastify.get('/status', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    return {
      available: aiService.isAvailable(),
      features: {
        smartCompose: true,
        smartReply: true,
        summarize: true,
        rewrite: true,
        subjectSuggestions: true,
        toneAnalysis: true,
      }
    };
  });

  // Smart Compose - Get autocomplete suggestion
  fastify.post('/compose', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { currentText, emailContext, recipientInfo, tone, isReply } = request.body as any;

    if (!currentText) {
      return reply.status(400).send({ error: 'Current text is required' });
    }

    if (!aiService.isAvailable()) {
      return reply.status(503).send({ error: 'AI service not configured' });
    }

    const suggestion = await aiService.getSmartComposeSuggestion({
      currentText,
      emailContext,
      recipientInfo,
      tone: tone as EmailTone,
      isReply,
    });

    return { suggestion };
  });

  // Smart Reply - Generate reply options
  fastify.post('/reply', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { emailContent, senderName, subject, tone } = request.body as any;

    if (!emailContent) {
      return reply.status(400).send({ error: 'Email content is required' });
    }

    if (!aiService.isAvailable()) {
      return reply.status(503).send({ error: 'AI service not configured' });
    }

    const replies = await aiService.generateSmartReplies({
      emailContent,
      senderName,
      subject,
      tone: tone as EmailTone,
    });

    return { replies };
  });

  // Summarize email or thread
  fastify.post('/summarize', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { emailContent, includeActionItems, maxLength } = request.body as any;

    if (!emailContent) {
      return reply.status(400).send({ error: 'Email content is required' });
    }

    if (!aiService.isAvailable()) {
      return reply.status(503).send({ error: 'AI service not configured' });
    }

    const result = await aiService.summarizeEmail({
      emailContent,
      includeActionItems,
      maxLength,
    });

    if (!result) {
      return reply.status(500).send({ error: 'Failed to summarize email' });
    }

    return result;
  });

  // Rewrite text
  fastify.post('/rewrite', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { text, style } = request.body as any;

    if (!text || !style) {
      return reply.status(400).send({ error: 'Text and style are required' });
    }

    const validStyles = ['formal', 'friendly', 'concise', 'expand', 'fix-grammar'];
    if (!validStyles.includes(style)) {
      return reply.status(400).send({ error: `Invalid style. Must be one of: ${validStyles.join(', ')}` });
    }

    if (!aiService.isAvailable()) {
      return reply.status(503).send({ error: 'AI service not configured' });
    }

    const result = await aiService.rewriteText({ text, style });

    if (!result) {
      return reply.status(500).send({ error: 'Failed to rewrite text' });
    }

    return { rewritten: result };
  });

  // Subject line suggestions
  fastify.post('/subject-suggestions', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { emailBody, count } = request.body as any;

    if (!emailBody) {
      return reply.status(400).send({ error: 'Email body is required' });
    }

    if (!aiService.isAvailable()) {
      return reply.status(503).send({ error: 'AI service not configured' });
    }

    const suggestions = await aiService.suggestSubjectLines(emailBody, count || 3);

    return { suggestions };
  });

  // Analyze tone
  fastify.post('/analyze-tone', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { text } = request.body as any;

    if (!text) {
      return reply.status(400).send({ error: 'Text is required' });
    }

    if (!aiService.isAvailable()) {
      return reply.status(503).send({ error: 'AI service not configured' });
    }

    const result = await aiService.analyzeTone(text);

    if (!result) {
      return reply.status(500).send({ error: 'Failed to analyze tone' });
    }

    return result;
  });

  // Extract key information
  fastify.post('/extract-info', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { emailContent } = request.body as any;

    if (!emailContent) {
      return reply.status(400).send({ error: 'Email content is required' });
    }

    if (!aiService.isAvailable()) {
      return reply.status(503).send({ error: 'AI service not configured' });
    }

    const result = await aiService.extractKeyInfo(emailContent);

    if (!result) {
      return reply.status(500).send({ error: 'Failed to extract information' });
    }

    return result;
  });

  // Smart categorization - Auto-label emails
  fastify.post('/categorize', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { subject, fromAddress, content } = request.body as any;

    if (!content) {
      return reply.status(400).send({ error: 'Email content is required' });
    }

    if (!aiService.isAvailable()) {
      return reply.status(503).send({ error: 'AI service not configured' });
    }

    const result = await aiService.categorizeEmail({
      subject: subject || '',
      fromAddress: fromAddress || '',
      content,
    });

    if (!result) {
      return reply.status(500).send({ error: 'Failed to categorize email' });
    }

    return result;
  });

  // Security threat analysis
  fastify.post('/security-check', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { fromAddress, subject, content, links } = request.body as any;

    if (!content) {
      return reply.status(400).send({ error: 'Email content is required' });
    }

    if (!aiService.isAvailable()) {
      return reply.status(503).send({ error: 'AI service not configured' });
    }

    const result = await aiService.analyzeSecurityThreats({
      fromAddress: fromAddress || '',
      subject: subject || '',
      content,
      links: links || [],
    });

    if (!result) {
      return reply.status(500).send({ error: 'Failed to analyze security' });
    }

    return result;
  });
}
