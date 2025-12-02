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
exports.twoFactorService = void 0;
const OTPAuth = __importStar(require("otplib"));
const crypto = __importStar(require("crypto"));
const qrcode_1 = __importDefault(require("qrcode"));
const index_1 = require("../index");
// Configure TOTP settings
OTPAuth.authenticator.options = {
    digits: 6,
    step: 30, // 30 second window
    window: 1, // Allow 1 step variance
};
class TwoFactorService {
    constructor() {
        this.appName = 'Exoin Africa';
    }
    /**
     * Generate a new TOTP secret for a user
     */
    async setupTwoFactor(userId, email) {
        try {
            // Generate secret
            const secret = OTPAuth.authenticator.generateSecret();
            // Generate backup codes
            const backupCodes = this.generateBackupCodes(10);
            // Hash backup codes for storage
            const hashedBackupCodes = backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
            // Store secret temporarily (not enabled yet)
            await index_1.prisma.user.update({
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
            const qrCode = await qrcode_1.default.toDataURL(otpauthUrl);
            return {
                secret,
                qrCode,
                backupCodes,
            };
        }
        catch (error) {
            console.error('2FA setup error:', error);
            return null;
        }
    }
    /**
     * Verify TOTP code for a user
     */
    async verifyToken(userId, token) {
        try {
            const user = await index_1.prisma.user.findUnique({
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
                await index_1.prisma.user.update({
                    where: { id: userId },
                    data: { totpLastUsed: new Date() },
                });
            }
            return isValid;
        }
        catch (error) {
            console.error('User 2FA verify error:', error);
            return false;
        }
    }
    /**
     * Enable 2FA after verifying first code
     */
    async enableTwoFactor(userId, token) {
        try {
            const user = await index_1.prisma.user.findUnique({
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
            const hashedCodes = backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
            // Enable 2FA
            await index_1.prisma.user.update({
                where: { id: userId },
                data: {
                    totpEnabled: true,
                    totpLastUsed: new Date(),
                    totpBackupCodes: hashedCodes,
                },
            });
            return { success: true, backupCodes };
        }
        catch (error) {
            console.error('Enable 2FA error:', error);
            return { success: false, error: 'Failed to enable 2FA' };
        }
    }
    /**
     * Disable 2FA for a user
     */
    async disableTwoFactor(userId, token) {
        try {
            // Verify current token first
            const isValid = await this.verifyToken(userId, token);
            if (!isValid) {
                return false;
            }
            // Disable 2FA
            await index_1.prisma.user.update({
                where: { id: userId },
                data: {
                    totpSecret: null,
                    totpEnabled: false,
                    totpBackupCodes: [],
                },
            });
            return true;
        }
        catch (error) {
            console.error('Disable 2FA error:', error);
            return false;
        }
    }
    /**
     * Verify a backup code
     */
    async verifyBackupCode(userId, code) {
        try {
            const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    totpBackupCodes: true,
                    totpEnabled: true,
                },
            });
            if (!user || !user.totpEnabled)
                return false;
            const backupCodes = user.totpBackupCodes || [];
            const codeIndex = backupCodes.indexOf(hashedCode);
            if (codeIndex === -1)
                return false;
            // Remove used backup code
            const newCodes = [...backupCodes];
            newCodes.splice(codeIndex, 1);
            await index_1.prisma.user.update({
                where: { id: userId },
                data: { totpBackupCodes: newCodes },
            });
            return true;
        }
        catch (error) {
            console.error('Backup code verify error:', error);
            return false;
        }
    }
    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(userId, token) {
        try {
            // Verify current token first
            const isValid = await this.verifyToken(userId, token);
            if (!isValid) {
                return null;
            }
            // Generate new backup codes
            const newCodes = this.generateBackupCodes(10);
            const hashedCodes = newCodes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
            await index_1.prisma.user.update({
                where: { id: userId },
                data: {
                    totpBackupCodes: hashedCodes,
                },
            });
            return newCodes;
        }
        catch (error) {
            console.error('Regenerate backup codes error:', error);
            return null;
        }
    }
    /**
     * Generate random backup codes
     */
    generateBackupCodes(count) {
        const codes = [];
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
    async isTwoFactorEnabled(userId) {
        try {
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    totpEnabled: true,
                },
            });
            return user?.totpEnabled || false;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get 2FA status for user
     */
    async getTwoFactorStatus(userId) {
        try {
            const user = await index_1.prisma.user.findUnique({
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
        }
        catch (error) {
            return { enabled: false, backupCodesRemaining: 0 };
        }
    }
}
exports.twoFactorService = new TwoFactorService();
