"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = trackingRoutes;
const emailTrackingService_1 = require("../services/emailTrackingService");
async function trackingRoutes(fastify) {
    // Tracking pixel endpoint - GET /api/track/:trackingId/open.gif
    fastify.get('/:trackingId/open.gif', async (request, reply) => {
        const { trackingId } = request.params;
        // Record the open event asynchronously
        emailTrackingService_1.emailTrackingService.recordOpen(trackingId, request.headers);
        // Return 1x1 transparent GIF immediately
        return reply
            .header('Content-Type', 'image/gif')
            .header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
            .header('Pragma', 'no-cache')
            .header('Expires', '0')
            .send(emailTrackingService_1.emailTrackingService.getTrackingPixelBuffer());
    });
    // Link click tracking endpoint - GET /api/track/:trackingId/click
    fastify.get('/:trackingId/click', async (request, reply) => {
        const { trackingId } = request.params;
        const { url } = request.query;
        if (!url) {
            return reply.status(400).send({ error: 'Missing URL parameter' });
        }
        // Decode the URL
        const decodedUrl = decodeURIComponent(url);
        // Record click and redirect
        await emailTrackingService_1.emailTrackingService.recordClick(trackingId, decodedUrl, request.headers);
        // Redirect to original URL
        return reply.redirect(302, decodedUrl);
    });
    // ===== Protected Routes (require auth) =====
    // Get tracking stats for a specific email
    fastify.get('/stats/:trackingId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { trackingId } = request.params;
        const userId = request.user.id;
        const stats = await emailTrackingService_1.emailTrackingService.getTrackingStats(trackingId, userId);
        if (!stats) {
            return reply.status(404).send({ error: 'Tracking not found' });
        }
        return reply.send(stats);
    });
    // Get all tracked emails for current user
    fastify.get('/history', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.id;
        const page = parseInt(request.query.page || '1', 10);
        const limit = parseInt(request.query.limit || '20', 10);
        const history = await emailTrackingService_1.emailTrackingService.getUserTrackingHistory(userId, page, limit);
        return reply.send(history);
    });
    // Create tracking for an email (called when sending)
    fastify.post('/create', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.id;
        const { emailId, outboxId, subject, recipientEmail } = request.body;
        if (!subject || !recipientEmail) {
            return reply.status(400).send({ error: 'Subject and recipient email are required' });
        }
        const tracking = await emailTrackingService_1.emailTrackingService.createTracking({
            emailId,
            outboxId,
            subject,
            recipientEmail,
            userId,
        });
        return reply.send(tracking);
    });
    // Get tracking pixel HTML for embedding in email
    fastify.get('/pixel/:trackingId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { trackingId } = request.params;
        const pixelHtml = emailTrackingService_1.emailTrackingService.generateTrackingPixel(trackingId);
        return reply.send({ html: pixelHtml });
    });
    // Wrap links in HTML content with tracking
    fastify.post('/wrap-links', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { trackingId, htmlContent } = request.body;
        if (!trackingId || !htmlContent) {
            return reply.status(400).send({ error: 'Tracking ID and HTML content are required' });
        }
        const wrappedHtml = emailTrackingService_1.emailTrackingService.wrapLinksWithTracking(htmlContent, trackingId);
        return reply.send({ html: wrappedHtml });
    });
}
