import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Job types
interface EmailSyncJob {
  userId: string;
  folder?: string;
  fullSync?: boolean;
}

interface SendScheduledJob {
  outboxId: string;
  userId: string;
}

interface ProcessSnoozeJob {
  emailId: string;
  userId: string;
}

interface AICategorizeJob {
  emailId: string;
  userId: string;
  subject: string;
  fromAddress: string;
  content: string;
}

interface MailboxProvisionJob {
  userId: string;
  domainId?: string;
  localPart?: string;
  performedById: string;
}

interface BulkMailboxProvisionJob {
  userIds: string[];
  domainId?: string;
  companyId: string;
  performedById: string;
}

interface SyncMailboxStatusJob {
  mailboxId: string;
  userId: string;
}

type JobData = EmailSyncJob | SendScheduledJob | ProcessSnoozeJob | AICategorizeJob | MailboxProvisionJob | BulkMailboxProvisionJob | SyncMailboxStatusJob;

class JobQueueService {
  private connection: Redis | null = null;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private isInitialized: boolean = false;

  // Queue names
  static QUEUES = {
    EMAIL_SYNC: 'email-sync',
    SCHEDULED_SEND: 'scheduled-send',
    SNOOZE_PROCESS: 'snooze-process',
    AI_CATEGORIZE: 'ai-categorize',
    NOTIFICATIONS: 'notifications',
    MAILBOX_PROVISION: 'mailbox-provision',
    MAILBOX_SYNC: 'mailbox-sync',
  };

  /**
   * Initialize job queue service
   */
  async initialize(): Promise<boolean> {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.log('⚠️ Redis URL not configured. Job queues disabled.');
      return false;
    }

    try {
      // Create Redis connection for BullMQ
      this.connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required for BullMQ
      });

      // Create queues
      await this.createQueues();
      
      // Create workers
      await this.createWorkers();

      this.isInitialized = true;
      console.log('✅ Job queue service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize job queues:', error);
      return false;
    }
  }

  /**
   * Check if queue service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.connection !== null;
  }

  /**
   * Create all queues
   */
  private async createQueues(): Promise<void> {
    for (const queueName of Object.values(JobQueueService.QUEUES)) {
      const queue = new Queue(queueName, {
        connection: this.connection!,
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
  private async createWorkers(): Promise<void> {
    // Email sync worker
    this.createWorker(JobQueueService.QUEUES.EMAIL_SYNC, async (job: Job<EmailSyncJob>) => {
      const { userId, folder, fullSync } = job.data;
      console.log(`📧 Processing email sync for user ${userId}, folder: ${folder || 'ALL'}`);
      
      // The actual sync needs email credentials which are handled by the mail routes
      // This job just logs that a sync was requested
      console.log(`📧 Email sync job queued for user ${userId}`);
      
      return { success: true, folder };
    });

    // Scheduled send worker
    this.createWorker(JobQueueService.QUEUES.SCHEDULED_SEND, async (job: Job<SendScheduledJob>) => {
      const { outboxId, userId } = job.data;
      console.log(`📤 Processing scheduled email ${outboxId}`);
      
      // Outbox service has its own processing loop, just trigger it
      const { outboxService } = await import('./outboxService');
      // Outbox service processes automatically, no manual trigger needed
      
      return { success: true, outboxId };
    });

    // Snooze process worker
    this.createWorker(JobQueueService.QUEUES.SNOOZE_PROCESS, async (job: Job<ProcessSnoozeJob>) => {
      const { emailId, userId } = job.data;
      console.log(`⏰ Processing snoozed email ${emailId}`);
      
      const { snoozeService } = await import('./snoozeService');
      await snoozeService.unsnoozeEmail(emailId, userId);
      
      return { success: true, emailId };
    });

    // AI categorization worker
    this.createWorker(JobQueueService.QUEUES.AI_CATEGORIZE, async (job: Job<AICategorizeJob>) => {
      const { emailId, subject, fromAddress, content } = job.data;
      console.log(`🤖 AI categorizing email ${emailId}`);
      
      const { aiService } = await import('./aiService');
      const result = await aiService.categorizeEmail({ subject, fromAddress, content });
      
      if (result) {
        // Update email with AI categorization
        const { prisma } = await import('../index');
        
        // Add suggested labels
        for (const label of result.suggestedLabels) {
          // This would add to the email's labels array
          console.log(`📝 Suggested label: ${label}`);
        }
      }
      
      return { success: true, category: result?.category };
    });

    // Mailbox provisioning worker
    this.createWorker(JobQueueService.QUEUES.MAILBOX_PROVISION, async (job: Job<MailboxProvisionJob | BulkMailboxProvisionJob>) => {
      console.log(`📬 Processing mailbox provision job ${job.id}`);
      
      const userMailboxLinkService = (await import('./userMailboxLinkService')).default;
      
      if ('userIds' in job.data) {
        // Bulk provision
        const { userIds, domainId, performedById } = job.data as BulkMailboxProvisionJob;
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
      } else {
        // Single provision
        const { userId, domainId, localPart, performedById } = job.data as MailboxProvisionJob;
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
    this.createWorker(JobQueueService.QUEUES.MAILBOX_SYNC, async (job: Job<SyncMailboxStatusJob>) => {
      const { mailboxId, userId } = job.data;
      console.log(`🔄 Syncing mailbox status for ${mailboxId}`);
      
      const userMailboxLinkService = (await import('./userMailboxLinkService')).default;
      await userMailboxLinkService.syncMailboxStatusWithUser(mailboxId);
      
      return { success: true, mailboxId };
    });
  }

  /**
   * Create a worker for a specific queue
   */
  private createWorker(queueName: string, processor: (job: Job) => Promise<any>): void {
    const worker = new Worker(queueName, processor, {
      connection: this.connection!,
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
  async scheduleEmailSync(userId: string, folder?: string, delay?: number): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    const queue = this.queues.get(JobQueueService.QUEUES.EMAIL_SYNC);
    if (!queue) return null;

    const job = await queue.add(
      'sync',
      { userId, folder },
      { 
        delay: delay || 0,
        jobId: `sync:${userId}:${folder || 'all'}:${Date.now()}`,
      }
    );
    
    return job.id || null;
  }

  /**
   * Schedule recurring email sync
   */
  async scheduleRecurringSync(userId: string, intervalMs: number = 60000): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    const queue = this.queues.get(JobQueueService.QUEUES.EMAIL_SYNC);
    if (!queue) return null;

    const job = await queue.add(
      'recurring-sync',
      { userId, fullSync: false },
      {
        repeat: {
          every: intervalMs,
        },
        jobId: `recurring-sync:${userId}`,
      }
    );
    
    return job.id || null;
  }

  /**
   * Schedule email for sending
   */
  async scheduleEmailSend(outboxId: string, userId: string, sendAt: Date): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    const queue = this.queues.get(JobQueueService.QUEUES.SCHEDULED_SEND);
    if (!queue) return null;

    const delay = Math.max(0, sendAt.getTime() - Date.now());
    
    const job = await queue.add(
      'send',
      { outboxId, userId },
      { 
        delay,
        jobId: `send:${outboxId}`,
      }
    );
    
    return job.id || null;
  }

  /**
   * Cancel scheduled email send
   */
  async cancelScheduledSend(outboxId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    const queue = this.queues.get(JobQueueService.QUEUES.SCHEDULED_SEND);
    if (!queue) return false;

    try {
      const job = await queue.getJob(`send:${outboxId}`);
      if (job) {
        await job.remove();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cancel scheduled send:', error);
      return false;
    }
  }

  /**
   * Schedule snooze wakeup
   */
  async scheduleSnoozeWakeup(emailId: string, userId: string, wakeupAt: Date): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    const queue = this.queues.get(JobQueueService.QUEUES.SNOOZE_PROCESS);
    if (!queue) return null;

    const delay = Math.max(0, wakeupAt.getTime() - Date.now());
    
    const job = await queue.add(
      'wakeup',
      { emailId, userId },
      { 
        delay,
        jobId: `snooze:${emailId}`,
      }
    );
    
    return job.id || null;
  }

  /**
   * Schedule AI categorization
   */
  async scheduleAICategorization(params: AICategorizeJob): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    const queue = this.queues.get(JobQueueService.QUEUES.AI_CATEGORIZE);
    if (!queue) return null;

    const job = await queue.add('categorize', params, {
      jobId: `categorize:${params.emailId}`,
    });
    
    return job.id || null;
  }

  /**
   * Schedule mailbox provisioning for a single user
   */
  async scheduleMailboxProvision(params: MailboxProvisionJob, delay?: number): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    const queue = this.queues.get(JobQueueService.QUEUES.MAILBOX_PROVISION);
    if (!queue) return null;

    const job = await queue.add('provision', params, {
      delay: delay || 0,
      jobId: `provision:${params.userId}:${Date.now()}`,
    });
    
    return job.id || null;
  }

  /**
   * Schedule bulk mailbox provisioning
   */
  async scheduleBulkMailboxProvision(params: BulkMailboxProvisionJob): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    const queue = this.queues.get(JobQueueService.QUEUES.MAILBOX_PROVISION);
    if (!queue) return null;

    const job = await queue.add('bulk-provision', params, {
      jobId: `bulk-provision:${params.companyId}:${Date.now()}`,
    });
    
    return job.id || null;
  }

  /**
   * Schedule mailbox status sync
   */
  async scheduleMailboxSync(mailboxId: string, userId: string, delay?: number): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    const queue = this.queues.get(JobQueueService.QUEUES.MAILBOX_SYNC);
    if (!queue) return null;

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
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null> {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

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
  async cleanQueue(queueName: string, gracePeriod: number = 3600000): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    await queue.clean(gracePeriod, 1000, 'completed');
    await queue.clean(gracePeriod, 1000, 'failed');
  }

  /**
   * Shutdown all workers and queues
   */
  async shutdown(): Promise<void> {
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

export const jobQueueService = new JobQueueService();
