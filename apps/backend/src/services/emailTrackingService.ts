import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import * as UAParser from 'ua-parser-js';

interface CreateTrackingParams {
  emailId?: string;
  outboxId?: string;
  subject: string;
  recipientEmail: string;
  userId: string;
}

interface TrackingPixelData {
  trackingId: string;
  pixelUrl: string;
}

class EmailTrackingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Create tracking record for an email
   */
  async createTracking(params: CreateTrackingParams): Promise<TrackingPixelData> {
    const trackingId = uuidv4();

    await prisma.emailTracking.create({
      data: {
        trackingId,
        emailId: params.emailId,
        outboxId: params.outboxId,
        subject: params.subject,
        recipientEmail: params.recipientEmail,
        userId: params.userId,
      },
    });

    return {
      trackingId,
      pixelUrl: `${this.baseUrl}/api/track/${trackingId}/open.gif`,
    };
  }

  /**
   * Generate tracking pixel HTML
   */
  generateTrackingPixel(trackingId: string): string {
    const pixelUrl = `${this.baseUrl}/api/track/${trackingId}/open.gif`;
    return `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
  }

  /**
   * Wrap links with tracking
   */
  wrapLinksWithTracking(htmlContent: string, trackingId: string): string {
    // Match all <a href="..."> tags
    const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi;
    
    return htmlContent.replace(linkRegex, (match, before, url, after) => {
      // Skip if it's already a tracking URL or mailto/tel link
      if (url.includes('/api/track/') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        return match;
      }
      
      const trackingUrl = `${this.baseUrl}/api/track/${trackingId}/click?url=${encodeURIComponent(url)}`;
      return `<a ${before}href="${trackingUrl}"${after}>`;
    });
  }

  /**
   * Record email open event
   */
  async recordOpen(trackingId: string, headers: Record<string, string>): Promise<boolean> {
    try {
      const tracking = await prisma.emailTracking.findUnique({
        where: { trackingId },
      });

      if (!tracking) return false;

      // Parse user agent
      const userAgent = headers['user-agent'] || '';
      const ua = new (UAParser as any).UAParser(userAgent);
      const device = ua.getDevice();
      const browser = ua.getBrowser();

      // Get IP (handle proxies)
      const ipAddress = headers['x-forwarded-for']?.split(',')[0] || 
                       headers['x-real-ip'] || 
                       'unknown';

      // Create tracking event
      await prisma.emailTrackingEvent.create({
        data: {
          trackingId: tracking.id,
          eventType: 'open',
          ipAddress,
          userAgent,
          device: device.type || 'desktop',
          browser: browser.name || 'unknown',
        },
      });

      // Update tracking summary
      const now = new Date();
      await prisma.emailTracking.update({
        where: { id: tracking.id },
        data: {
          openCount: { increment: 1 },
          lastOpenedAt: now,
          firstOpenedAt: tracking.firstOpenedAt || now,
        },
      });

      return true;
    } catch (error) {
      console.error('Record open error:', error);
      return false;
    }
  }

  /**
   * Record link click event
   */
  async recordClick(trackingId: string, url: string, headers: Record<string, string>): Promise<string | null> {
    try {
      const tracking = await prisma.emailTracking.findUnique({
        where: { trackingId },
      });

      if (!tracking) return null;

      const ipAddress = headers['x-forwarded-for']?.split(',')[0] || 
                       headers['x-real-ip'] || 
                       'unknown';
      const userAgent = headers['user-agent'] || '';

      // Upsert link click record
      await prisma.emailLinkClick.upsert({
        where: {
          trackingId_originalUrl: {
            trackingId: tracking.id,
            originalUrl: url,
          },
        },
        update: {
          clickCount: { increment: 1 },
          lastClickedAt: new Date(),
          ipAddress,
          userAgent,
        },
        create: {
          trackingId: tracking.id,
          originalUrl: url,
          ipAddress,
          userAgent,
        },
      });

      // Update tracking summary
      await prisma.emailTracking.update({
        where: { id: tracking.id },
        data: {
          clickCount: { increment: 1 },
        },
      });

      // Create event record
      await prisma.emailTrackingEvent.create({
        data: {
          trackingId: tracking.id,
          eventType: 'click',
          ipAddress,
          userAgent,
        },
      });

      return url;
    } catch (error) {
      console.error('Record click error:', error);
      return null;
    }
  }

  /**
   * Get tracking stats for an email
   */
  async getTrackingStats(trackingId: string, userId: string): Promise<any | null> {
    try {
      const tracking = await prisma.emailTracking.findFirst({
        where: { trackingId, userId },
        include: {
          opens: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          clicks: {
            orderBy: { clickCount: 'desc' },
          },
        },
      });

      if (!tracking) return null;

      return {
        id: tracking.id,
        trackingId: tracking.trackingId,
        subject: tracking.subject,
        recipientEmail: tracking.recipientEmail,
        openCount: tracking.openCount,
        clickCount: tracking.clickCount,
        firstOpenedAt: tracking.firstOpenedAt,
        lastOpenedAt: tracking.lastOpenedAt,
        createdAt: tracking.createdAt,
        recentOpens: tracking.opens.map(e => ({
          device: e.device,
          browser: e.browser,
          timestamp: e.createdAt,
        })),
        links: tracking.clicks.map(c => ({
          url: c.originalUrl,
          clicks: c.clickCount,
          firstClick: c.firstClickedAt,
          lastClick: c.lastClickedAt,
        })),
      };
    } catch (error) {
      console.error('Get tracking stats error:', error);
      return null;
    }
  }

  /**
   * Get all tracked emails for a user
   */
  async getUserTrackingHistory(userId: string, page: number = 1, limit: number = 20): Promise<{
    emails: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const [total, emails] = await Promise.all([
        prisma.emailTracking.count({ where: { userId } }),
        prisma.emailTracking.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            trackingId: true,
            subject: true,
            recipientEmail: true,
            openCount: true,
            clickCount: true,
            firstOpenedAt: true,
            lastOpenedAt: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        emails,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Get tracking history error:', error);
      return { emails: [], total: 0, page: 1, pages: 0 };
    }
  }

  /**
   * Get 1x1 transparent GIF for tracking pixel
   */
  getTrackingPixelBuffer(): Buffer {
    // 1x1 transparent GIF
    return Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
  }
}

export const emailTrackingService = new EmailTrackingService();
