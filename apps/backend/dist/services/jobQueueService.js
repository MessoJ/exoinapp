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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQueueService = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
class JobQueueService {
    constructor() {
        this.connection = null;
        this.queues = new Map();
        this.workers = new Map();
        this.isInitialized = false;
    }
    /**
     * Initialize job queue service
     */
    async initialize() {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            console.log('⚠️ Redis URL not configured. Job queues disabled.');
            return false;
        }
        try {
            // Create Redis connection for BullMQ
            this.connection = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: null, // Required for BullMQ
            });
            // Create queues
            await this.createQueues();
            // Create workers
            await this.createWorkers();
            this.isInitialized = true;
            console.log('✅ Job queue service initialized');
            return true;
        }
        catch (error) {
            console.error('Failed to initialize job queues:', error);
            return false;
        }
    }
    /**
     * Check if queue service is available
     */
    isAvailable() {
        return this.isInitialized && this.connection !== null;
    }
    /**
     * Create all queues
     */
    async createQueues() {
        for (const queueName of Object.values(JobQueueService.QUEUES)) {
            const queue = new bullmq_1.Queue(queueName, {
                connection: this.connection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                    removeOnComplete: {
                        age: 3600, // Keep completed jobs for 1 hour
                        count: 1000,
                    },
                    removeOnFail: {
                        age: 86400, // Keep failed jobs for 24 hours
                    },
                },
            });
            this.queues.set(queueName, queue);
        }
    }
    /**
     * Create workers for all queues
     */
    async createWorkers() {
        // Email sync worker
        this.createWorker(JobQueueService.QUEUES.EMAIL_SYNC, async (job) => {
            const { userId, folder, fullSync } = job.data;
            console.log(`📧 Processing email sync for user ${userId}, folder: ${folder || 'ALL'}`);
            // The actual sync needs email credentials which are handled by the mail routes
            // This job just logs that a sync was requested
            console.log(`📧 Email sync job queued for user ${userId}`);
            return { success: true, folder };
        });
        // Scheduled send worker
        this.createWorker(JobQueueService.QUEUES.SCHEDULED_SEND, async (job) => {
            const { outboxId, userId } = job.data;
            console.log(`📤 Processing scheduled email ${outboxId}`);
            // Outbox service has its own processing loop, just trigger it
            const { outboxService } = await Promise.resolve().then(() => __importStar(require('./outboxService')));
            // Outbox service processes automatically, no manual trigger needed
            return { success: true, outboxId };
        });
        // Snooze process worker
        this.createWorker(JobQueueService.QUEUES.SNOOZE_PROCESS, async (job) => {
            const { emailId, userId } = job.data;
            console.log(`⏰ Processing snoozed email ${emailId}`);
            const { snoozeService } = await Promise.resolve().then(() => __importStar(require('./snoozeService')));
            await snoozeService.unsnoozeEmail(emailId, userId);
            return { success: true, emailId };
        });
        // AI categorization worker
        this.createWorker(JobQueueService.QUEUES.AI_CATEGORIZE, async (job) => {
            const { emailId, subject, fromAddress, content } = job.data;
            console.log(`🤖 AI categorizing email ${emailId}`);
            const { aiService } = await Promise.resolve().then(() => __importStar(require('./aiService')));
            const result = await aiService.categorizeEmail({ subject, fromAddress, content });
            if (result) {
                // Update email with AI categorization
                const { prisma } = await Promise.resolve().then(() => __importStar(require('../index')));
                // Add suggested labels
                for (const label of result.suggestedLabels) {
                    // This would add to the email's labels array
                    console.log(`📝 Suggested label: ${label}`);
                }
            }
            return { success: true, category: result?.category };
        });
        // Mailbox provisioning worker
        this.createWorker(JobQueueService.QUEUES.MAILBOX_PROVISION, async (job) => {
            console.log(`📬 Processing mailbox provision job ${job.id}`);
            const userMailboxLinkService = (await Promise.resolve().then(() => __importStar(require('./userMailboxLinkService')))).default;
            if ('userIds' in job.data) {
                // Bulk provision
                const { userIds, domainId, performedById } = job.data;
                console.log(`📬 Bulk provisioning ${userIds.length} mailboxes`);
                const result = await userMailboxLinkService.bulkProvisionMailboxes(userIds, {
                    domainId,
                    performedById,
                });
                return {
                    success: true,
                    total: result.total,
                    successful: result.successful,
                    failed: result.failed,
                };
            }
            else {
                // Single provision
                const { userId, domainId, localPart, performedById } = job.data;
                console.log(`📬 Provisioning mailbox for user ${userId}`);
                const result = await userMailboxLinkService.provisionMailboxForUser(userId, {
                    domainId,
                    localPart,
                    performedById,
                });
                return {
                    success: result.success,
                    mailbox: result.mailbox,
                    error: result.error,
                };
            }
        });
        // Mailbox sync worker (sync user active status with mailbox)
        this.createWorker(JobQueueService.QUEUES.MAILBOX_SYNC, async (job) => {
            const { mailboxId, userId } = job.data;
            console.log(`🔄 Syncing mailbox status for ${mailboxId}`);
            const userMailboxLinkService = (await Promise.resolve().then(() => __importStar(require('./userMailboxLinkService')))).default;
            await userMailboxLinkService.syncMailboxStatusWithUser(mailboxId);
            return { success: true, mailboxId };
        });
    }
    /**
     * Create a worker for a specific queue
     */
    createWorker(queueName, processor) {
        const worker = new bullmq_1.Worker(queueName, processor, {
            connection: this.connection,
            concurrency: 5,
        });
        worker.on('completed', (job) => {
            console.log(`✅ Job ${job.id} completed in queue ${queueName}`);
        });
        worker.on('failed', (job, err) => {
            console.error(`❌ Job ${job?.id} failed in queue ${queueName}:`, err.message);
        });
        this.workers.set(queueName, worker);
    }
    // ==========================================
    // JOB SCHEDULING METHODS
    // ==========================================
    /**
     * Schedule email sync
     */
    async scheduleEmailSync(userId, folder, delay) {
        if (!this.isAvailable())
            return null;
        const queue = this.queues.get(JobQueueService.QUEUES.EMAIL_SYNC);
        if (!queue)
            return null;
        const job = await queue.add('sync', { userId, folder }, {
            delay: delay || 0,
            jobId: `sync:${userId}:${folder || 'all'}:${Date.now()}`,
        });
        return job.id || null;
    }
    /**
     * Schedule recurring email sync
     */
    async scheduleRecurringSync(userId, intervalMs = 60000) {
        if (!this.isAvailable())
            return null;
        const queue = this.queues.get(JobQueueService.QUEUES.EMAIL_SYNC);
        if (!queue)
            return null;
        const job = await queue.add('recurring-sync', { userId, fullSync: false }, {
            repeat: {
                every: intervalMs,
            },
            jobId: `recurring-sync:${userId}`,
        });
        return job.id || null;
    }
    /**
     * Schedule email for sending
     */
    async scheduleEmailSend(outboxId, userId, sendAt) {
        if (!this.isAvailable())
            return null;
        const queue = this.queues.get(JobQueueService.QUEUES.SCHEDULED_SEND);
        if (!queue)
            return null;
        const delay = Math.max(0, sendAt.getTime() - Date.now());
        const job = await queue.add('send', { outboxId, userId }, {
            delay,
            jobId: `send:${outboxId}`,
        });
        return job.id || null;
    }
    /**
     * Cancel scheduled email send
     */
    async cancelScheduledSend(outboxId) {
        if (!this.isAvailable())
            return false;
        const queue = this.queues.get(JobQueueService.QUEUES.SCHEDULED_SEND);
        if (!queue)
            return false;
        try {
            const job = await queue.getJob(`send:${outboxId}`);
            if (job) {
                await job.remove();
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Failed to cancel scheduled send:', error);
            return false;
        }
    }
    /**
     * Schedule snooze wakeup
     */
    async scheduleSnoozeWakeup(emailId, userId, wakeupAt) {
        if (!this.isAvailable())
            return null;
        const queue = this.queues.get(JobQueueService.QUEUES.SNOOZE_PROCESS);
        if (!queue)
            return null;
        const delay = Math.max(0, wakeupAt.getTime() - Date.now());
        const job = await queue.add('wakeup', { emailId, userId }, {
            delay,
            jobId: `snooze:${emailId}`,
        });
        return job.id || null;
    }
    /**
     * Schedule AI categorization
     */
    async scheduleAICategorization(params) {
        if (!this.isAvailable())
            return null;
        const queue = this.queues.get(JobQueueService.QUEUES.AI_CATEGORIZE);
        if (!queue)
            return null;
        const job = await queue.add('categorize', params, {
            jobId: `categorize:${params.emailId}`,
        });
        return job.id || null;
    }
    /**
     * Schedule mailbox provisioning for a single user
     */
    async scheduleMailboxProvision(params, delay) {
        if (!this.isAvailable())
            return null;
        const queue = this.queues.get(JobQueueService.QUEUES.MAILBOX_PROVISION);
        if (!queue)
            return null;
        const job = await queue.add('provision', params, {
            delay: delay || 0,
            jobId: `provision:${params.userId}:${Date.now()}`,
        });
        return job.id || null;
    }
    /**
     * Schedule bulk mailbox provisioning
     */
    async scheduleBulkMailboxProvision(params) {
        if (!this.isAvailable())
            return null;
        const queue = this.queues.get(JobQueueService.QUEUES.MAILBOX_PROVISION);
        if (!queue)
            return null;
        const job = await queue.add('bulk-provision', params, {
            jobId: `bulk-provision:${params.companyId}:${Date.now()}`,
        });
        return job.id || null;
    }
    /**
     * Schedule mailbox status sync
     */
    async scheduleMailboxSync(mailboxId, userId, delay) {
        if (!this.isAvailable())
            return null;
        const queue = this.queues.get(JobQueueService.QUEUES.MAILBOX_SYNC);
        if (!queue)
            return null;
        const job = await queue.add('sync', { mailboxId, userId }, {
            delay: delay || 0,
            jobId: `mailbox-sync:${mailboxId}:${Date.now()}`,
        });
        return job.id || null;
    }
    // ==========================================
    // QUEUE MANAGEMENT
    // ==========================================
    /**
     * Get queue stats
     */
    async getQueueStats(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue)
            return null;
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
        ]);
        return { waiting, active, completed, failed, delayed };
    }
    /**
     * Clean old jobs
     */
    async cleanQueue(queueName, gracePeriod = 3600000) {
        const queue = this.queues.get(queueName);
        if (!queue)
            return;
        await queue.clean(gracePeriod, 1000, 'completed');
        await queue.clean(gracePeriod, 1000, 'failed');
    }
    /**
     * Shutdown all workers and queues
     */
    async shutdown() {
        // Close workers first
        for (const worker of this.workers.values()) {
            await worker.close();
        }
        this.workers.clear();
        // Close queues
        for (const queue of this.queues.values()) {
            await queue.close();
        }
        this.queues.clear();
        // Close connection
        if (this.connection) {
            await this.connection.quit();
            this.connection = null;
        }
        this.isInitialized = false;
        console.log('🛑 Job queue service shut down');
    }
}
// Queue names
JobQueueService.QUEUES = {
    EMAIL_SYNC: 'email-sync',
    SCHEDULED_SEND: 'scheduled-send',
    SNOOZE_PROCESS: 'snooze-process',
    AI_CATEGORIZE: 'ai-categorize',
    NOTIFICATIONS: 'notifications',
    MAILBOX_PROVISION: 'mailbox-provision',
    MAILBOX_SYNC: 'mailbox-sync',
};
exports.jobQueueService = new JobQueueService();
