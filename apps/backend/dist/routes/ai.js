"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = aiRoutes;
const aiService_1 = require("../services/aiService");
async function aiRoutes(fastify) {
    // Check if AI is available
    fastify.get('/status', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        return {
            available: aiService_1.aiService.isAvailable(),
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { currentText, emailContext, recipientInfo, tone, isReply } = request.body;
        if (!currentText) {
            return reply.status(400).send({ error: 'Current text is required' });
        }
        if (!aiService_1.aiService.isAvailable()) {
            return reply.status(503).send({ error: 'AI service not configured' });
        }
        const suggestion = await aiService_1.aiService.getSmartComposeSuggestion({
            currentText,
            emailContext,
            recipientInfo,
            tone: tone,
            isReply,
        });
        return { suggestion };
    });
    // Smart Reply - Generate reply options
    fastify.post('/reply', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { emailContent, senderName, subject, tone } = request.body;
        if (!emailContent) {
            return reply.status(400).send({ error: 'Email content is required' });
        }
        if (!aiService_1.aiService.isAvailable()) {
            return reply.status(503).send({ error: 'AI service not configured' });
        }
        const replies = await aiService_1.aiService.generateSmartReplies({
            emailContent,
            senderName,
            subject,
            tone: tone,
        });
        return { replies };
    });
    // Summarize email or thread
    fastify.post('/summarize', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { emailContent, includeActionItems, maxLength } = request.body;
        if (!emailContent) {
            return reply.status(400).send({ error: 'Email content is required' });
        }
        if (!aiService_1.aiService.isAvailable()) {
            return reply.status(503).send({ error: 'AI service not configured' });
        }
        const result = await aiService_1.aiService.summarizeEmail({
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { text, style } = request.body;
        if (!text || !style) {
            return reply.status(400).send({ error: 'Text and style are required' });
        }
        const validStyles = ['formal', 'friendly', 'concise', 'expand', 'fix-grammar'];
        if (!validStyles.includes(style)) {
            return reply.status(400).send({ error: `Invalid style. Must be one of: ${validStyles.join(', ')}` });
        }
        if (!aiService_1.aiService.isAvailable()) {
            return reply.status(503).send({ error: 'AI service not configured' });
        }
        const result = await aiService_1.aiService.rewriteText({ text, style });
        if (!result) {
            return reply.status(500).send({ error: 'Failed to rewrite text' });
        }
        return { rewritten: result };
    });
    // Subject line suggestions
    fastify.post('/subject-suggestions', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { emailBody, count } = request.body;
        if (!emailBody) {
            return reply.status(400).send({ error: 'Email body is required' });
        }
        if (!aiService_1.aiService.isAvailable()) {
            return reply.status(503).send({ error: 'AI service not configured' });
        }
        const suggestions = await aiService_1.aiService.suggestSubjectLines(emailBody, count || 3);
        return { suggestions };
    });
    // Analyze tone
    fastify.post('/analyze-tone', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { text } = request.body;
        if (!text) {
            return reply.status(400).send({ error: 'Text is required' });
        }
        if (!aiService_1.aiService.isAvailable()) {
            return reply.status(503).send({ error: 'AI service not configured' });
        }
        const result = await aiService_1.aiService.analyzeTone(text);
        if (!result) {
            return reply.status(500).send({ error: 'Failed to analyze tone' });
        }
        return result;
    });
    // Extract key information
    fastify.post('/extract-info', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { emailContent } = request.body;
        if (!emailContent) {
            return reply.status(400).send({ error: 'Email content is required' });
        }
        if (!aiService_1.aiService.isAvailable()) {
            return reply.status(503).send({ error: 'AI service not configured' });
        }
        const result = await aiService_1.aiService.extractKeyInfo(emailContent);
        if (!result) {
            return reply.status(500).send({ error: 'Failed to extract information' });
        }
        return result;
    });
    // Smart categorization - Auto-label emails
    fastify.post('/categorize', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { subject, fromAddress, content } = request.body;
        if (!content) {
            return reply.status(400).send({ error: 'Email content is required' });
        }
        if (!aiService_1.aiService.isAvailable()) {
            return reply.status(503).send({ error: 'AI service not configured' });
        }
        const result = await aiService_1.aiService.categorizeEmail({
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { fromAddress, subject, content, links } = request.body;
        if (!content) {
            return reply.status(400).send({ error: 'Email content is required' });
        }
        if (!aiService_1.aiService.isAvailable()) {
            return reply.status(503).send({ error: 'AI service not configured' });
        }
        const result = await aiService_1.aiService.analyzeSecurityThreats({
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
