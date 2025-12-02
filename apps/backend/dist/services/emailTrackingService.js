"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTrackingService = void 0;
const uuid_1 = require("uuid");
const index_1 = require("../index");
const UAParser = __importStar(require("ua-parser-js"));
class EmailTrackingService {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    }
    /**
     * Create tracking record for an email
     */
    async createTracking(params) {
        const trackingId = (0, uuid_1.v4)();
        await index_1.prisma.emailTracking.create({
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
    generateTrackingPixel(trackingId) {
        const pixelUrl = `${this.baseUrl}/api/track/${trackingId}/open.gif`;
        return `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
    }
    /**
     * Wrap links with tracking
     */
    wrapLinksWithTracking(htmlContent, trackingId) {
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
    async recordOpen(trackingId, headers) {
        try {
            const tracking = await index_1.prisma.emailTracking.findUnique({
                where: { trackingId },
            });
            if (!tracking)
                return false;
            // Parse user agent
            const userAgent = headers['user-agent'] || '';
            const ua = new UAParser.UAParser(userAgent);
            const device = ua.getDevice();
            const browser = ua.getBrowser();
            // Get IP (handle proxies)
            const ipAddress = headers['x-forwarded-for']?.split(',')[0] ||
                headers['x-real-ip'] ||
                'unknown';
            // Create tracking event
            await index_1.prisma.emailTrackingEvent.create({
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
            await index_1.prisma.emailTracking.update({
                where: { id: tracking.id },
                data: {
                    openCount: { increment: 1 },
                    lastOpenedAt: now,
                    firstOpenedAt: tracking.firstOpenedAt || now,
                },
            });
            return true;
        }
        catch (error) {
            console.error('Record open error:', error);
            return false;
        }
    }
    /**
     * Record link click event
     */
    async recordClick(trackingId, url, headers) {
        try {
            const tracking = await index_1.prisma.emailTracking.findUnique({
                where: { trackingId },
            });
            if (!tracking)
                return null;
            const ipAddress = headers['x-forwarded-for']?.split(',')[0] ||
                headers['x-real-ip'] ||
                'unknown';
            const userAgent = headers['user-agent'] || '';
            // Upsert link click record
            await index_1.prisma.emailLinkClick.upsert({
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
            await index_1.prisma.emailTracking.update({
                where: { id: tracking.id },
                data: {
                    clickCount: { increment: 1 },
                },
            });
            // Create event record
            await index_1.prisma.emailTrackingEvent.create({
                data: {
                    trackingId: tracking.id,
                    eventType: 'click',
                    ipAddress,
                    userAgent,
                },
            });
            return url;
        }
        catch (error) {
            console.error('Record click error:', error);
            return null;
        }
    }
    /**
     * Get tracking stats for an email
     */
    async getTrackingStats(trackingId, userId) {
        try {
            const tracking = await index_1.prisma.emailTracking.findFirst({
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
            if (!tracking)
                return null;
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
        }
        catch (error) {
            console.error('Get tracking stats error:', error);
            return null;
        }
    }
    /**
     * Get all tracked emails for a user
     */
    async getUserTrackingHistory(userId, page = 1, limit = 20) {
        try {
            const [total, emails] = await Promise.all([
                index_1.prisma.emailTracking.count({ where: { userId } }),
                index_1.prisma.emailTracking.findMany({
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
        }
        catch (error) {
            console.error('Get tracking history error:', error);
            return { emails: [], total: 0, page: 1, pages: 0 };
        }
    }
    /**
     * Get 1x1 transparent GIF for tracking pixel
     */
    getTrackingPixelBuffer() {
        // 1x1 transparent GIF
        return Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    }
}
exports.emailTrackingService = new EmailTrackingService();
