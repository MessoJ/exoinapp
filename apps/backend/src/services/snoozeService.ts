import { prisma } from '../index';

// Snooze preset options
export const SNOOZE_PRESETS = {
  LATER_TODAY: 'later_today',
  TOMORROW: 'tomorrow',
  THIS_WEEKEND: 'this_weekend',
  NEXT_WEEK: 'next_week',
  CUSTOM: 'custom',
} as const;

interface SnoozeParams {
  emailId: string;
  userId: string;
  preset?: keyof typeof SNOOZE_PRESETS;
  customTime?: Date;
}

interface UnsnoozeResult {
  id: string;
  subject: string;
  folder: string;
}

class SnoozeService {
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Delay starting the processor to allow prisma to initialize
    setTimeout(() => {
      this.startProcessing();
    }, 2000);
    console.log('😴 Snooze service initialized');
  }

  // Calculate snooze time based on preset
  private calculateSnoozeTime(preset: keyof typeof SNOOZE_PRESETS): Date {
    const now = new Date();
    
    switch (preset) {
      case 'LATER_TODAY': {
        // 3 hours from now or 6 PM, whichever is later
        const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const sixPm = new Date(now);
        sixPm.setHours(18, 0, 0, 0);
        
        if (now.getHours() >= 18) {
          // If it's already past 6 PM, snooze until tomorrow 8 AM
          const tomorrow8am = new Date(now);
          tomorrow8am.setDate(tomorrow8am.getDate() + 1);
          tomorrow8am.setHours(8, 0, 0, 0);
          return tomorrow8am;
        }
        
        return threeHoursLater > sixPm ? threeHoursLater : sixPm;
      }
      
      case 'TOMORROW': {
        // Tomorrow at 8 AM
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        return tomorrow;
      }
      
      case 'THIS_WEEKEND': {
        // Saturday at 9 AM
        const saturday = new Date(now);
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
        saturday.setDate(saturday.getDate() + daysUntilSaturday);
        saturday.setHours(9, 0, 0, 0);
        return saturday;
      }
      
      case 'NEXT_WEEK': {
        // Next Monday at 8 AM
        const monday = new Date(now);
        const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
        monday.setDate(monday.getDate() + daysUntilMonday);
        monday.setHours(8, 0, 0, 0);
        return monday;
      }
      
      default:
        // Default to tomorrow 8 AM
        const defaultTime = new Date(now);
        defaultTime.setDate(defaultTime.getDate() + 1);
        defaultTime.setHours(8, 0, 0, 0);
        return defaultTime;
    }
  }

  // Snooze an email
  async snoozeEmail(params: SnoozeParams): Promise<{ success: boolean; snoozedUntil: Date; message: string }> {
    const { emailId, userId, preset, customTime } = params;

    // Verify email belongs to user
    const email = await prisma.email.findFirst({
      where: { id: emailId, userId },
    });

    if (!email) {
      return { success: false, snoozedUntil: new Date(), message: 'Email not found' };
    }

    if (email.snoozedUntil) {
      return { success: false, snoozedUntil: email.snoozedUntil, message: 'Email is already snoozed' };
    }

    // Calculate snooze time
    const snoozedUntil = customTime || this.calculateSnoozeTime(preset || 'TOMORROW');

    // Update email
    await prisma.email.update({
      where: { id: emailId },
      data: {
        snoozedUntil,
        snoozedFromFolder: email.folder,
        folder: 'SNOOZED' as any, // Move to snoozed "folder"
      },
    });

    console.log(`😴 Email ${emailId} snoozed until ${snoozedUntil.toISOString()}`);

    return { 
      success: true, 
      snoozedUntil, 
      message: `Email snoozed until ${snoozedUntil.toLocaleString()}` 
    };
  }

  // Cancel snooze (unsnooze immediately)
  async unsnoozeEmail(emailId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const email = await prisma.email.findFirst({
      where: { id: emailId, userId, snoozedUntil: { not: null } },
    });

    if (!email) {
      return { success: false, message: 'Snoozed email not found' };
    }

    // Restore to original folder
    await prisma.email.update({
      where: { id: emailId },
      data: {
        snoozedUntil: null,
        folder: (email.snoozedFromFolder as any) || 'INBOX',
        snoozedFromFolder: null,
        isRead: false, // Mark as unread to resurface
      },
    });

    console.log(`⏰ Email ${emailId} unsnoozed, moved back to ${email.snoozedFromFolder || 'INBOX'}`);

    return { success: true, message: 'Email unsnoozed' };
  }

  // Update snooze time
  async updateSnoozeTime(emailId: string, userId: string, newTime: Date): Promise<{ success: boolean; message: string }> {
    const email = await prisma.email.findFirst({
      where: { id: emailId, userId, snoozedUntil: { not: null } },
    });

    if (!email) {
      return { success: false, message: 'Snoozed email not found' };
    }

    await prisma.email.update({
      where: { id: emailId },
      data: { snoozedUntil: newTime },
    });

    return { success: true, message: `Snooze updated to ${newTime.toLocaleString()}` };
  }

  // Get all snoozed emails for a user
  async getSnoozedEmails(userId: string): Promise<any[]> {
    return prisma.email.findMany({
      where: {
        userId,
        snoozedUntil: { not: null },
      },
      orderBy: { snoozedUntil: 'asc' },
      include: { attachments: true },
    });
  }

  // Get time remaining for a snoozed email
  getTimeRemaining(snoozedUntil: Date): { hours: number; minutes: number; text: string } {
    const now = new Date();
    const diffMs = snoozedUntil.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { hours: 0, minutes: 0, text: 'Now' };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let text = '';
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      text = `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      text = `${hours}h ${minutes}m`;
    } else {
      text = `${minutes}m`;
    }

    return { hours, minutes, text };
  }

  // Start processing snoozed emails
  private startProcessing() {
    if (this.processingInterval) return;

    // Check every 30 seconds for emails to unsnooze
    this.processingInterval = setInterval(() => {
      this.processSnooze().catch(console.error);
    }, 30000);

    // Also run after a short delay to ensure DB is ready
    setTimeout(() => {
      this.processSnooze().catch(console.error);
    }, 1000);
  }

  // Stop processing
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Process snoozed emails that are ready to unsnooze
  private async processSnooze(): Promise<UnsnoozeResult[]> {
    const now = new Date();

    // Find emails that need to be unsnoozed
    const readyEmails = await prisma.email.findMany({
      where: {
        snoozedUntil: { lte: now },
      },
      take: 50, // Process up to 50 at a time
    });

    const results: UnsnoozeResult[] = [];

    for (const email of readyEmails) {
      try {
        // Restore to original folder and mark as unread
        const originalFolder = email.snoozedFromFolder || 'INBOX';
        
        await prisma.email.update({
          where: { id: email.id },
          data: {
            snoozedUntil: null,
            snoozedFromFolder: null,
            folder: originalFolder as any,
            isRead: false, // Mark as unread so it appears fresh
          },
        });

        results.push({
          id: email.id,
          subject: email.subject,
          folder: originalFolder,
        });

        console.log(`⏰ Auto-unsnoozed email: ${email.subject}`);

        // TODO: Send notification to user about unsnoozed email
        // await notificationService.notify(email.userId, {
        //   type: 'EMAIL_UNSNOOZED',
        //   emailId: email.id,
        //   subject: email.subject,
        // });

      } catch (error) {
        console.error(`Failed to unsnooze email ${email.id}:`, error);
      }
    }

    if (results.length > 0) {
      console.log(`⏰ Processed ${results.length} snoozed email(s)`);
    }

    return results;
  }
}

export const snoozeService = new SnoozeService();
