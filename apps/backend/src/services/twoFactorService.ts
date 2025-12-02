import * as OTPAuth from 'otplib';
import * as crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '../index';

// Configure TOTP settings
OTPAuth.authenticator.options = {
  digits: 6,
  step: 30, // 30 second window
  window: 1, // Allow 1 step variance
};

interface TwoFactorSetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface TwoFactorEnableResult {
  success: boolean;
  backupCodes?: string[];
  error?: string;
}

class TwoFactorService {
  private appName: string = 'Exoin Africa';

  /**
   * Generate a new TOTP secret for a user
   */
  async setupTwoFactor(userId: string, email: string): Promise<TwoFactorSetupResult | null> {
    try {
      // Generate secret
      const secret = OTPAuth.authenticator.generateSecret();
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes(10);
      
      // Hash backup codes for storage
      const hashedBackupCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );

      // Store secret temporarily (not enabled yet)
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: secret,
          totpBackupCodes: hashedBackupCodes,
          totpEnabled: false,
        },
      });

      // Generate otpauth URL
      const otpauthUrl = OTPAuth.authenticator.keyuri(email, this.appName, secret);
      
      // Generate QR code as data URL
      const qrCode = await QRCode.toDataURL(otpauthUrl);

      return {
        secret,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      console.error('2FA setup error:', error);
      return null;
    }
  }

  /**
   * Verify TOTP code for a user
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          totpSecret: true,
          totpEnabled: true,
        },
      });

      if (!user || !user.totpEnabled || !user.totpSecret) {
        return false;
      }

      // Try TOTP verification
      const isValid = OTPAuth.authenticator.verify({ 
        token, 
        secret: user.totpSecret 
      });

      if (isValid) {
        // Update last used timestamp
        await prisma.user.update({
          where: { id: userId },
          data: { totpLastUsed: new Date() },
        });
      }

      return isValid;
    } catch (error) {
      console.error('User 2FA verify error:', error);
      return false;
    }
  }

  /**
   * Enable 2FA after verifying first code
   */
  async enableTwoFactor(userId: string, token: string): Promise<TwoFactorEnableResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          totpSecret: true,
          totpBackupCodes: true,
        },
      });

      if (!user || !user.totpSecret) {
        return { success: false, error: '2FA not set up. Please run setup first.' };
      }

      // Verify the token
      const isValid = OTPAuth.authenticator.verify({ 
        token, 
        secret: user.totpSecret 
      });

      if (!isValid) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Generate fresh backup codes
      const backupCodes = this.generateBackupCodes(10);
      const hashedCodes = backupCodes.map(code =>
        crypto.createHash('sha256').update(code).digest('hex')
      );

      // Enable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpEnabled: true,
          totpLastUsed: new Date(),
          totpBackupCodes: hashedCodes,
        },
      });

      return { success: true, backupCodes };
    } catch (error) {
      console.error('Enable 2FA error:', error);
      return { success: false, error: 'Failed to enable 2FA' };
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Verify current token first
      const isValid = await this.verifyToken(userId, token);
      if (!isValid) {
        return false;
      }

      // Disable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: null,
          totpEnabled: false,
          totpBackupCodes: [],
        },
      });

      return true;
    } catch (error) {
      console.error('Disable 2FA error:', error);
      return false;
    }
  }

  /**
   * Verify a backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          totpBackupCodes: true,
          totpEnabled: true,
        },
      });

      if (!user || !user.totpEnabled) return false;

      const backupCodes = user.totpBackupCodes || [];
      const codeIndex = backupCodes.indexOf(hashedCode);
      
      if (codeIndex === -1) return false;

      // Remove used backup code
      const newCodes = [...backupCodes];
      newCodes.splice(codeIndex, 1);
      
      await prisma.user.update({
        where: { id: userId },
        data: { totpBackupCodes: newCodes },
      });

      return true;
    } catch (error) {
      console.error('Backup code verify error:', error);
      return false;
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, token: string): Promise<string[] | null> {
    try {
      // Verify current token first
      const isValid = await this.verifyToken(userId, token);
      if (!isValid) {
        return null;
      }

      // Generate new backup codes
      const newCodes = this.generateBackupCodes(10);
      const hashedCodes = newCodes.map(code =>
        crypto.createHash('sha256').update(code).digest('hex')
      );

      await prisma.user.update({
        where: { id: userId },
        data: {
          totpBackupCodes: hashedCodes,
        },
      });

      return newCodes;
    } catch (error) {
      console.error('Regenerate backup codes error:', error);
      return null;
    }
  }

  /**
   * Generate random backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          totpEnabled: true,
        },
      });

      return user?.totpEnabled || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get 2FA status for user
   */
  async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
    lastUsed?: Date;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          totpEnabled: true,
          totpBackupCodes: true,
          totpLastUsed: true,
        },
      });

      return {
        enabled: user?.totpEnabled || false,
        backupCodesRemaining: user?.totpBackupCodes?.length || 0,
        lastUsed: user?.totpLastUsed || undefined,
      };
    } catch (error) {
      return { enabled: false, backupCodesRemaining: 0 };
    }
  }
}

export const twoFactorService = new TwoFactorService();
