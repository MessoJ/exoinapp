import Redis from 'ioredis';

class CacheService {
  private redis: Redis | null = null;
  private isConnected: boolean = false;
  private prefix: string = 'exoin:';

  // Default TTL values (in seconds)
  private TTL = {
    EMAIL_LIST: 300,      // 5 minutes
    FOLDER_COUNTS: 60,    // 1 minute
    SEARCH_RESULTS: 600,  // 10 minutes
    USER_SETTINGS: 3600,  // 1 hour
    EMAIL_DETAIL: 1800,   // 30 minutes
    TEMPLATES: 3600,      // 1 hour
  };

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<boolean> {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.log('⚠️ Redis URL not configured. Caching disabled.');
      return false;
    }

    try {
      this.redis = new Redis(redisUrl, {
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
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      return false;
    }
  }

  /**
   * Alias for initialize - Connect to Redis
   */
  async connect(): Promise<boolean> {
    return this.initialize();
  }

  /**
   * Alias for close - Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    return this.close();
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.isConnected && this.redis !== null;
  }

  /**
   * Build cache key with prefix
   */
  private key(key: string): string {
    return `${this.prefix}${key}`;
  }

  // ==========================================
  // GENERIC CACHE OPERATIONS
  // ==========================================

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;
    
    try {
      const data = await this.redis!.get(this.key(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      const ttl = ttlSeconds || this.TTL.EMAIL_LIST;
      await this.redis!.setex(this.key(key), ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      await this.redis!.del(this.key(key));
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete by pattern
   */
  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      const keys = await this.redis!.keys(this.key(pattern));
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }
      return true;
    } catch (error) {
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
  async cacheEmailList(userId: string, folder: string, page: number, emails: any[]): Promise<void> {
    const key = `emails:${userId}:${folder}:p${page}`;
    await this.set(key, emails, this.TTL.EMAIL_LIST);
  }

  /**
   * Get cached email list
   */
  async getEmailList(userId: string, folder: string, page: number): Promise<any[] | null> {
    const key = `emails:${userId}:${folder}:p${page}`;
    return this.get<any[]>(key);
  }

  /**
   * Invalidate user's email list cache
   */
  async invalidateEmailList(userId: string, folder?: string): Promise<void> {
    if (folder) {
      await this.invalidatePattern(`emails:${userId}:${folder}:*`);
    } else {
      await this.invalidatePattern(`emails:${userId}:*`);
    }
  }

  /**
   * Cache folder counts
   */
  async cacheFolderCounts(userId: string, counts: Record<string, number>): Promise<void> {
    const key = `folders:${userId}:counts`;
    await this.set(key, counts, this.TTL.FOLDER_COUNTS);
  }

  /**
   * Get cached folder counts
   */
  async getFolderCounts(userId: string): Promise<Record<string, number> | null> {
    const key = `folders:${userId}:counts`;
    return this.get<Record<string, number>>(key);
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(userId: string, query: string, results: any[]): Promise<void> {
    const queryHash = Buffer.from(query).toString('base64').substring(0, 32);
    const key = `search:${userId}:${queryHash}`;
    await this.set(key, results, this.TTL.SEARCH_RESULTS);
  }

  /**
   * Get cached search results
   */
  async getSearchResults(userId: string, query: string): Promise<any[] | null> {
    const queryHash = Buffer.from(query).toString('base64').substring(0, 32);
    const key = `search:${userId}:${queryHash}`;
    return this.get<any[]>(key);
  }

  /**
   * Cache user settings
   */
  async cacheUserSettings(userId: string, settings: any): Promise<void> {
    const key = `settings:${userId}`;
    await this.set(key, settings, this.TTL.USER_SETTINGS);
  }

  /**
   * Get cached user settings
   */
  async getUserSettings(userId: string): Promise<any | null> {
    const key = `settings:${userId}`;
    return this.get(key);
  }

  /**
   * Cache email detail
   */
  async cacheEmailDetail(emailId: string, email: any): Promise<void> {
    const key = `email:${emailId}`;
    await this.set(key, email, this.TTL.EMAIL_DETAIL);
  }

  /**
   * Get cached email detail
   */
  async getEmailDetail(emailId: string): Promise<any | null> {
    const key = `email:${emailId}`;
    return this.get(key);
  }

  /**
   * Invalidate email detail cache
   */
  async invalidateEmailDetail(emailId: string): Promise<void> {
    await this.delete(`email:${emailId}`);
  }

  /**
   * Cache templates
   */
  async cacheTemplates(userId: string, templates: any[]): Promise<void> {
    const key = `templates:${userId}`;
    await this.set(key, templates, this.TTL.TEMPLATES);
  }

  /**
   * Get cached templates
   */
  async getTemplates(userId: string): Promise<any[] | null> {
    const key = `templates:${userId}`;
    return this.get<any[]>(key);
  }

  /**
   * Invalidate templates cache
   */
  async invalidateTemplates(userId: string): Promise<void> {
    await this.delete(`templates:${userId}`);
  }

  // ==========================================
  // RATE LIMITING
  // ==========================================

  /**
   * Check and increment rate limit
   */
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }> {
    if (!this.isAvailable()) {
      return { allowed: true, remaining: limit, resetAt: 0 };
    }

    const rateLimitKey = this.key(`ratelimit:${key}`);
    
    try {
      const current = await this.redis!.incr(rateLimitKey);
      
      if (current === 1) {
        await this.redis!.expire(rateLimitKey, windowSeconds);
      }

      const ttl = await this.redis!.ttl(rateLimitKey);
      
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetAt: Date.now() + (ttl * 1000),
      };
    } catch (error) {
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
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }
}

export const cacheService = new CacheService();
