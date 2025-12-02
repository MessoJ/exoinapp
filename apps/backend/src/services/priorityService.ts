import { prisma } from '../index';
import { Email } from '@prisma/client';

// Priority scoring weights
const PRIORITY_WEIGHTS = {
  // Sender relationship strength
  PREVIOUS_REPLIES: 10,        // We replied to them before
  PREVIOUS_RECEIVES: 5,        // We received multiple emails from them
  DIRECT_RECIPIENT: 8,         // Directly in TO: not CC:
  
  // Content signals
  URGENT_KEYWORDS: 15,         // Subject contains urgent keywords
  IMPORTANT_KEYWORDS: 10,      // Subject contains important keywords
  QUESTION_MARK: 3,            // Subject contains question (likely needs response)
  REPLY_THREAD: 5,             // This is a reply in an ongoing thread
  
  // Engagement signals
  RECENTLY_INTERACTED: 5,      // We interacted with this sender recently
  
  // Negative signals (lower priority)
  BULK_SENDER: -10,            // Sender sends many emails (newsletter-like)
  AUTOMATED_EMAIL: -15,        // Likely automated (noreply, marketing)
  
  // Special handling
  STARRED: 100,                // User marked as important
  UNREAD: 2,                   // Unread gets slight boost
};

// Keywords that indicate urgency
const URGENT_KEYWORDS = [
  'urgent', 'asap', 'immediately', 'critical', 'emergency',
  'deadline', 'today', 'now', 'priority', 'important',
];

// Keywords for important but not urgent
const IMPORTANT_KEYWORDS = [
  'invoice', 'payment', 'contract', 'agreement', 'proposal',
  'meeting', 'action required', 'please review', 'confirmation',
  'approval', 'decision', 'feedback', 'follow up', 'follow-up',
];

// Patterns that indicate automated/bulk emails
const AUTOMATED_PATTERNS = [
  /noreply@/i,
  /no-reply@/i,
  /donotreply@/i,
  /notifications?@/i,
  /newsletter@/i,
  /marketing@/i,
  /updates?@/i,
  /info@/i,
  /support@/i,
  /mailer-daemon/i,
  /postmaster@/i,
];

export interface PriorityScore {
  emailId: string;
  score: number;
  factors: string[];
}

export interface PrioritizedInbox {
  importantAndUnread: Email[];
  starred: Email[];
  everythingElse: Email[];
  priorityScores: Record<string, PriorityScore>;
}

class PriorityService {
  /**
   * Calculate priority score for a single email
   */
  async calculatePriorityScore(email: Email, userId: string): Promise<PriorityScore> {
    let score = 0;
    const factors: string[] = [];

    // Check if starred (highest priority)
    if (email.isStarred) {
      score += PRIORITY_WEIGHTS.STARRED;
      factors.push('starred');
    }

    // Check if unread
    if (!email.isRead) {
      score += PRIORITY_WEIGHTS.UNREAD;
      factors.push('unread');
    }

    // Check if direct recipient (in TO: not CC:)
    const userEmails = await this.getUserEmails(userId);
    const isDirectRecipient = email.toAddresses.some(addr => 
      userEmails.some(ue => addr.toLowerCase().includes(ue.toLowerCase()))
    );
    if (isDirectRecipient) {
      score += PRIORITY_WEIGHTS.DIRECT_RECIPIENT;
      factors.push('direct-recipient');
    }

    // Check sender relationship
    const senderStats = await this.getSenderStats(userId, email.fromAddress);
    
    if (senderStats.repliedTo > 0) {
      score += PRIORITY_WEIGHTS.PREVIOUS_REPLIES * Math.min(senderStats.repliedTo, 5);
      factors.push('replied-before');
    }
    
    if (senderStats.receivedFrom > 5) {
      score += PRIORITY_WEIGHTS.PREVIOUS_RECEIVES;
      factors.push('frequent-sender');
    }

    if (senderStats.lastInteraction) {
      const daysSinceInteraction = (Date.now() - senderStats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceInteraction < 7) {
        score += PRIORITY_WEIGHTS.RECENTLY_INTERACTED;
        factors.push('recent-interaction');
      }
    }

    // Check for bulk sender (many emails from same address)
    if (senderStats.receivedFrom > 50) {
      score += PRIORITY_WEIGHTS.BULK_SENDER;
      factors.push('bulk-sender');
    }

    // Check for automated email patterns
    const isAutomated = AUTOMATED_PATTERNS.some(pattern => 
      pattern.test(email.fromAddress)
    );
    if (isAutomated) {
      score += PRIORITY_WEIGHTS.AUTOMATED_EMAIL;
      factors.push('automated');
    }

    // Check subject for keywords
    const subjectLower = email.subject.toLowerCase();
    
    if (URGENT_KEYWORDS.some(kw => subjectLower.includes(kw))) {
      score += PRIORITY_WEIGHTS.URGENT_KEYWORDS;
      factors.push('urgent-keywords');
    }

    if (IMPORTANT_KEYWORDS.some(kw => subjectLower.includes(kw))) {
      score += PRIORITY_WEIGHTS.IMPORTANT_KEYWORDS;
      factors.push('important-keywords');
    }

    if (subjectLower.includes('?')) {
      score += PRIORITY_WEIGHTS.QUESTION_MARK;
      factors.push('question');
    }

    // Check if this is a reply (ongoing conversation)
    if (subjectLower.startsWith('re:') || subjectLower.startsWith('fwd:')) {
      score += PRIORITY_WEIGHTS.REPLY_THREAD;
      factors.push('thread-reply');
    }

    return { emailId: email.id, score, factors };
  }

  /**
   * Get user's email addresses (primary + aliases)
   */
  private async getUserEmails(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    
    // For now, just return the primary email
    // Could expand to include aliases from mailboxes
    return user ? [user.email] : [];
  }

  /**
   * Get statistics about a sender relationship with the user
   */
  private async getSenderStats(userId: string, senderAddress: string) {
    // Count emails received from this sender
    const receivedFrom = await prisma.email.count({
      where: {
        userId,
        fromAddress: { contains: senderAddress, mode: 'insensitive' },
      }
    });

    // Count emails we sent TO this address (replies)
    const repliedTo = await prisma.email.count({
      where: {
        userId,
        folder: 'SENT',
        toAddresses: { has: senderAddress },
      }
    });

    // Get last interaction
    const lastEmail = await prisma.email.findFirst({
      where: {
        userId,
        OR: [
          { fromAddress: { contains: senderAddress, mode: 'insensitive' } },
          { toAddresses: { has: senderAddress } },
        ]
      },
      orderBy: { sentAt: 'desc' },
      select: { sentAt: true }
    });

    return {
      receivedFrom,
      repliedTo,
      lastInteraction: lastEmail?.sentAt || null,
    };
  }

  /**
   * Get prioritized inbox - splits inbox into sections
   */
  async getPrioritizedInbox(userId: string, limit = 100): Promise<PrioritizedInbox> {
    // Fetch all inbox emails
    const emails = await prisma.email.findMany({
      where: { 
        userId, 
        folder: 'INBOX',
        snoozedUntil: null, // Exclude snoozed emails
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        attachments: {
          select: { id: true, filename: true, mimeType: true, size: true }
        }
      }
    });

    // Calculate priority scores for all emails
    const priorityScores: Record<string, PriorityScore> = {};
    const scoredEmails: Array<{ email: Email; score: PriorityScore }> = [];

    for (const email of emails) {
      const score = await this.calculatePriorityScore(email, userId);
      priorityScores[email.id] = score;
      scoredEmails.push({ email, score });
    }

    // Starred emails (separate section)
    const starred = scoredEmails
      .filter(({ email }) => email.isStarred)
      .map(({ email }) => email);

    // Important & Unread (high score + unread, excluding starred)
    const importantThreshold = 15; // Adjust threshold as needed
    const importantAndUnread = scoredEmails
      .filter(({ email, score }) => 
        !email.isStarred && 
        !email.isRead && 
        score.score >= importantThreshold
      )
      .sort((a, b) => b.score.score - a.score.score)
      .map(({ email }) => email);

    // Everything else (not starred, not important & unread)
    const everythingElse = scoredEmails
      .filter(({ email, score }) => 
        !email.isStarred && 
        (email.isRead || score.score < importantThreshold)
      )
      .sort((a, b) => b.score.score - a.score.score)
      .map(({ email }) => email);

    return {
      importantAndUnread,
      starred,
      everythingElse,
      priorityScores,
    };
  }

  /**
   * Get email priority insights (for UI display)
   */
  async getEmailPriorityInsight(emailId: string, userId: string): Promise<{
    score: number;
    level: 'high' | 'medium' | 'low';
    reasons: string[];
  } | null> {
    const email = await prisma.email.findFirst({
      where: { id: emailId, userId }
    });

    if (!email) return null;

    const priorityScore = await this.calculatePriorityScore(email, userId);
    
    // Map factors to user-friendly reasons
    const reasonMap: Record<string, string> = {
      'starred': 'You starred this email',
      'direct-recipient': 'Sent directly to you',
      'replied-before': 'You\'ve replied to this sender before',
      'frequent-sender': 'Frequent correspondent',
      'recent-interaction': 'Recent interaction with sender',
      'urgent-keywords': 'Contains urgent keywords',
      'important-keywords': 'Contains important keywords',
      'question': 'Appears to be a question',
      'thread-reply': 'Part of an ongoing conversation',
      'bulk-sender': 'Bulk sender (newsletters, etc.)',
      'automated': 'Automated email',
    };

    const reasons = priorityScore.factors
      .filter(f => !['unread'].includes(f))
      .map(f => reasonMap[f] || f);

    const level = 
      priorityScore.score >= 25 ? 'high' :
      priorityScore.score >= 10 ? 'medium' : 
      'low';

    return {
      score: priorityScore.score,
      level,
      reasons,
    };
  }

  /**
   * Get smart inbox counts for the UI
   */
  async getSmartInboxCounts(userId: string): Promise<{
    importantAndUnread: number;
    starred: number;
    everythingElse: number;
    total: number;
  }> {
    // Get starred count
    const starred = await prisma.email.count({
      where: { userId, folder: 'INBOX', isStarred: true, snoozedUntil: null }
    });

    // Get total inbox
    const total = await prisma.email.count({
      where: { userId, folder: 'INBOX', snoozedUntil: null }
    });

    // Get all unread emails for importance check
    const unreadEmails = await prisma.email.findMany({
      where: { 
        userId, 
        folder: 'INBOX', 
        isRead: false, 
        isStarred: false,
        snoozedUntil: null 
      },
      take: 200,
    });

    // Count important unread (simplified - just check for keywords and direct recipients)
    let importantAndUnread = 0;
    const userEmails = await this.getUserEmails(userId);
    
    for (const email of unreadEmails) {
      const subjectLower = email.subject.toLowerCase();
      const isUrgent = URGENT_KEYWORDS.some(kw => subjectLower.includes(kw));
      const isImportant = IMPORTANT_KEYWORDS.some(kw => subjectLower.includes(kw));
      const isDirect = email.toAddresses.some(addr => 
        userEmails.some(ue => addr.toLowerCase().includes(ue.toLowerCase()))
      );
      
      if (isUrgent || isImportant || isDirect) {
        importantAndUnread++;
      }
    }

    return {
      importantAndUnread,
      starred,
      everythingElse: total - starred - importantAndUnread,
      total,
    };
  }
}

export const priorityService = new PriorityService();
