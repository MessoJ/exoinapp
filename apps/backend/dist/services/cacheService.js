"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class CacheService {
    constructor() {
        this.redis = null;
        this.isConnected = false;
        this.prefix = 'exoin:';
        // Default TTL values (in seconds)
        this.TTL = {
            EMAIL_LIST: 300, // 5 minutes
            FOLDER_COUNTS: 60, // 1 minute
            SEARCH_RESULTS: 600, // 10 minutes
            USER_SETTINGS: 3600, // 1 hour
            EMAIL_DETAIL: 1800, // 30 minutes
            TEMPLATES: 3600, // 1 hour
        };
    }
    /**
     * Initialize Redis connection
     */
    async initialize() {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            console.log('⚠️ Redis URL not configured. Caching disabled.');
            return false;
        }
        try {
            this.redis = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: 3,
                lazyConnect: true,
            });
            await this.redis.connect();
            this.redis.on('error', (err) => {
                console.error('Redis error:', err);
                this.isConnected = false;
            });
            this.redis.on('connect', () => {
                console.log('✅ Redis connected');
                this.isConnected = true;
            });
            this.redis.on('close', () => {
                console.log('🔌 Redis connection closed');
                this.isConnected = false;
            });
            this.isConnected = true;
            console.log('✅ Cache service initialized');
            return true;
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            return false;
        }
    }
    /**
     * Alias for initialize - Connect to Redis
     */
    async connect() {
        return this.initialize();
    }
    /**
     * Alias for close - Disconnect from Redis
     */
    async disconnect() {
        return this.close();
    }
    /**
     * Check if cache is available
     */
    isAvailable() {
        return this.isConnected && this.redis !== null;
    }
    /**
     * Build cache key with prefix
     */
    key(key) {
        return `${this.prefix}${key}`;
    }
    // ==========================================
    // GENERIC CACHE OPERATIONS
    // ==========================================
    /**
     * Get cached value
     */
    async get(key) {
        if (!this.isAvailable())
            return null;
        try {
            const data = await this.redis.get(this.key(key));
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    /**
     * Set cached value
     */
    async set(key, value, ttlSeconds) {
        if (!this.isAvailable())
            return false;
        try {
            const ttl = ttlSeconds || this.TTL.EMAIL_LIST;
            await this.redis.setex(this.key(key), ttl, JSON.stringify(value));
            return true;
        }
        catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }
    /**
     * Delete cached value
     */
    async delete(key) {
        if (!this.isAvailable())
            return false;
        try {
            await this.redis.del(this.key(key));
            return true;
        }
        catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }
    /**
     * Delete by pattern
     */
    async invalidatePattern(pattern) {
        if (!this.isAvailable())
            return false;
        try {
            const keys = await this.redis.keys(this.key(pattern));
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            return true;
        }
        catch (error) {
            console.error('Cache invalidate pattern error:', error);
            return false;
        }
    }
    // ==========================================
    // SPECIFIC CACHE METHODS
    // ==========================================
    /**
     * Cache email list
     */
    async cacheEmailList(userId, folder, page, emails) {
        const key = `emails:${userId}:${folder}:p${page}`;
        await this.set(key, emails, this.TTL.EMAIL_LIST);
    }
    /**
     * Get cached email list
     */
    async getEmailList(userId, folder, page) {
        const key = `emails:${userId}:${folder}:p${page}`;
        return this.get(key);
    }
    /**
     * Invalidate user's email list cache
     */
    async invalidateEmailList(userId, folder) {
        if (folder) {
            await this.invalidatePattern(`emails:${userId}:${folder}:*`);
        }
        else {
            await this.invalidatePattern(`emails:${userId}:*`);
        }
    }
    /**
     * Cache folder counts
     */
    async cacheFolderCounts(userId, counts) {
        const key = `folders:${userId}:counts`;
        await this.set(key, counts, this.TTL.FOLDER_COUNTS);
    }
    /**
     * Get cached folder counts
     */
    async getFolderCounts(userId) {
        const key = `folders:${userId}:counts`;
        return this.get(key);
    }
    /**
     * Cache search results
     */
    async cacheSearchResults(userId, query, results) {
        const queryHash = Buffer.from(query).toString('base64').substring(0, 32);
        const key = `search:${userId}:${queryHash}`;
        await this.set(key, results, this.TTL.SEARCH_RESULTS);
    }
    /**
     * Get cached search results
     */
    async getSearchResults(userId, query) {
        const queryHash = Buffer.from(query).toString('base64').substring(0, 32);
        const key = `search:${userId}:${queryHash}`;
        return this.get(key);
    }
    /**
     * Cache user settings
     */
    async cacheUserSettings(userId, settings) {
        const key = `settings:${userId}`;
        await this.set(key, settings, this.TTL.USER_SETTINGS);
    }
    /**
     * Get cached user settings
     */
    async getUserSettings(userId) {
        const key = `settings:${userId}`;
        return this.get(key);
    }
    /**
     * Cache email detail
     */
    async cacheEmailDetail(emailId, email) {
        const key = `email:${emailId}`;
        await this.set(key, email, this.TTL.EMAIL_DETAIL);
    }
    /**
     * Get cached email detail
     */
    async getEmailDetail(emailId) {
        const key = `email:${emailId}`;
        return this.get(key);
    }
    /**
     * Invalidate email detail cache
     */
    async invalidateEmailDetail(emailId) {
        await this.delete(`email:${emailId}`);
    }
    /**
     * Cache templates
     */
    async cacheTemplates(userId, templates) {
        const key = `templates:${userId}`;
        await this.set(key, templates, this.TTL.TEMPLATES);
    }
    /**
     * Get cached templates
     */
    async getTemplates(userId) {
        const key = `templates:${userId}`;
        return this.get(key);
    }
    /**
     * Invalidate templates cache
     */
    async invalidateTemplates(userId) {
        await this.delete(`templates:${userId}`);
    }
    // ==========================================
    // RATE LIMITING
    // ==========================================
    /**
     * Check and increment rate limit
     */
    async checkRateLimit(key, limit, windowSeconds) {
        if (!this.isAvailable()) {
            return { allowed: true, remaining: limit, resetAt: 0 };
        }
        const rateLimitKey = this.key(`ratelimit:${key}`);
        try {
            const current = await this.redis.incr(rateLimitKey);
            if (current === 1) {
                await this.redis.expire(rateLimitKey, windowSeconds);
            }
            const ttl = await this.redis.ttl(rateLimitKey);
            return {
                allowed: current <= limit,
                remaining: Math.max(0, limit - current),
                resetAt: Date.now() + (ttl * 1000),
            };
        }
        catch (error) {
            console.error('Rate limit error:', error);
            return { allowed: true, remaining: limit, resetAt: 0 };
        }
    }
    // ==========================================
    // CLEANUP
    // ==========================================
    /**
     * Close Redis connection
     */
    async close() {
        if (this.redis) {
            await this.redis.quit();
            this.redis = null;
            this.isConnected = false;
        }
    }
}
exports.cacheService = new CacheService();
