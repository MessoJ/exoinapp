import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { emailTrackingService } from '../services/emailTrackingService';

interface TrackingParams {
  trackingId: string;
}

interface ClickQuery {
  url: string;
}

interface StatsQuery {
  page?: string;
  limit?: string;
}

export default async function trackingRoutes(fastify: FastifyInstance) {
  // Tracking pixel endpoint - GET /api/track/:trackingId/open.gif
  fastify.get<{ Params: TrackingParams }>(
    '/:trackingId/open.gif',
    async (request, reply) => {
      const { trackingId } = request.params;
      
      // Record the open event asynchronously
      emailTrackingService.recordOpen(trackingId, request.headers as Record<string, string>);

      // Return 1x1 transparent GIF immediately
      return reply
        .header('Content-Type', 'image/gif')
        .header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .send(emailTrackingService.getTrackingPixelBuffer());
    }
  );

  // Link click tracking endpoint - GET /api/track/:trackingId/click
  fastify.get<{ Params: TrackingParams; Querystring: ClickQuery }>(
    '/:trackingId/click',
    async (request, reply) => {
      const { trackingId } = request.params;
      const { url } = request.query;

      if (!url) {
        return reply.status(400).send({ error: 'Missing URL parameter' });
      }

      // Decode the URL
      const decodedUrl = decodeURIComponent(url);

      // Record click and redirect
      await emailTrackingService.recordClick(
        trackingId,
        decodedUrl,
        request.headers as Record<string, string>
      );

      // Redirect to original URL
      return reply.redirect(302, decodedUrl);
    }
  );

  // ===== Protected Routes (require auth) =====

  // Get tracking stats for a specific email
  fastify.get<{ Params: TrackingParams }>(
    '/stats/:trackingId',
    { preHandler: [(fastify as any).authenticate] },
    async (request, reply) => {
      const { trackingId } = request.params;
      const userId = (request.user as any).id;

      const stats = await emailTrackingService.getTrackingStats(trackingId, userId);
      
      if (!stats) {
        return reply.status(404).send({ error: 'Tracking not found' });
      }

      return reply.send(stats);
    }
  );

  // Get all tracked emails for current user
  fastify.get<{ Querystring: StatsQuery }>(
    '/history',
    { preHandler: [(fastify as any).authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const page = parseInt(request.query.page || '1', 10);
      const limit = parseInt(request.query.limit || '20', 10);

      const history = await emailTrackingService.getUserTrackingHistory(userId, page, limit);
      return reply.send(history);
    }
  );

  // Create tracking for an email (called when sending)
  fastify.post<{
    Body: {
      emailId?: string;
      outboxId?: string;
      subject: string;
      recipientEmail: string;
    };
  }>(
    '/create',
    { preHandler: [(fastify as any).authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { emailId, outboxId, subject, recipientEmail } = request.body;

      if (!subject || !recipientEmail) {
        return reply.status(400).send({ error: 'Subject and recipient email are required' });
      }

      const tracking = await emailTrackingService.createTracking({
        emailId,
        outboxId,
        subject,
        recipientEmail,
        userId,
      });

      return reply.send(tracking);
    }
  );

  // Get tracking pixel HTML for embedding in email
  fastify.get<{ Params: TrackingParams }>(
    '/pixel/:trackingId',
    { preHandler: [(fastify as any).authenticate] },
    async (request, reply) => {
      const { trackingId } = request.params;
      
      const pixelHtml = emailTrackingService.generateTrackingPixel(trackingId);
      return reply.send({ html: pixelHtml });
    }
  );

  // Wrap links in HTML content with tracking
  fastify.post<{
    Body: {
      trackingId: string;
      htmlContent: string;
    };
  }>(
    '/wrap-links',
    { preHandler: [(fastify as any).authenticate] },
    async (request, reply) => {
      const { trackingId, htmlContent } = request.body;

      if (!trackingId || !htmlContent) {
        return reply.status(400).send({ error: 'Tracking ID and HTML content are required' });
      }

      const wrappedHtml = emailTrackingService.wrapLinksWithTracking(htmlContent, trackingId);
      return reply.send({ html: wrappedHtml });
    }
  );
}
