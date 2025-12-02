"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// HTML Sanitizer - Basic implementation
const sanitizeHtml = (html) => {
    // Basic XSS prevention - in production, use a proper library like DOMPurify
    // Remove script tags and event handlers
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
        .replace(/javascript:/gi, '');
};
// Email service class
class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.fromAddress = process.env.SMTP_FROM_EMAIL || 'noreply@exoinafrica.com';
        this.fromName = process.env.SMTP_FROM_NAME || 'Exoin Africa';
        this.initTransporter();
    }
    initTransporter() {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        const secure = process.env.SMTP_SECURE === 'true';
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        if (!host || !user || !pass) {
            console.warn('⚠️  SMTP not configured. Email sending will be simulated.');
            this.isConfigured = false;
            return;
        }
        try {
            this.transporter = nodemailer_1.default.createTransport({
                host,
                port,
                secure,
                auth: { user, pass },
                // Timeout settings
                connectionTimeout: 10000, // 10 seconds
                greetingTimeout: 10000,
                socketTimeout: 30000, // 30 seconds for large emails
                // TLS options
                tls: {
                    rejectUnauthorized: process.env.NODE_ENV === 'production',
                },
                // Debug mode for development
                debug: process.env.NODE_ENV === 'development',
                logger: process.env.NODE_ENV === 'development',
            });
            this.isConfigured = true;
            console.log('✅ SMTP transporter initialized');
        }
        catch (error) {
            console.error('❌ Failed to initialize SMTP transporter:', error);
            this.isConfigured = false;
        }
    }
    // Verify SMTP connection
    async verifyConnection() {
        if (!this.transporter || !this.isConfigured) {
            return {
                success: false,
                message: 'SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.'
            };
        }
        try {
            await this.transporter.verify();
            return { success: true, message: 'SMTP connection verified successfully' };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, message: `SMTP connection failed: ${errorMessage}` };
        }
    }
    // Send email
    async sendEmail(options) {
        // Format recipients
        const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
        const ccAddresses = options.cc || [];
        const bccAddresses = options.bcc || [];
        // Validate at least one recipient
        if (toAddresses.length === 0) {
            return {
                success: false,
                messageId: '',
                accepted: [],
                rejected: [],
                error: 'At least one recipient is required',
            };
        }
        // Sanitize HTML content
        const sanitizedHtml = options.html ? sanitizeHtml(options.html) : undefined;
        // If SMTP not configured, simulate sending
        if (!this.transporter || !this.isConfigured) {
            console.log('📧 Simulating email send (SMTP not configured):');
            console.log(`   To: ${toAddresses.join(', ')}`);
            console.log(`   Subject: ${options.subject}`);
            return {
                success: true,
                messageId: `<simulated-${Date.now()}@local>`,
                accepted: toAddresses,
                rejected: [],
            };
        }
        try {
            // Build mail options
            const mailOptions = {
                from: `"${this.fromName}" <${this.fromAddress}>`,
                to: toAddresses.join(', '),
                cc: ccAddresses.length > 0 ? ccAddresses.join(', ') : undefined,
                bcc: bccAddresses.length > 0 ? bccAddresses.join(', ') : undefined,
                subject: options.subject,
                text: options.text,
                html: sanitizedHtml,
                attachments: options.attachments,
                replyTo: options.replyTo,
                priority: options.priority,
                headers: {
                    'X-Application': 'ExoinApp',
                    'X-Mailer': 'Exoin Mail Service',
                    ...options.headers,
                },
            };
            // Send email
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:');
            console.log(`   Message ID: ${result.messageId}`);
            console.log(`   Accepted: ${result.accepted?.join(', ')}`);
            return {
                success: true,
                messageId: result.messageId,
                accepted: result.accepted || [],
                rejected: result.rejected || [],
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to send email:', errorMessage);
            return {
                success: false,
                messageId: '',
                accepted: [],
                rejected: toAddresses,
                error: errorMessage,
            };
        }
    }
    // Send email with template
    async sendTemplateEmail(templateName, to, variables, options) {
        // Template definitions
        const templates = {
            welcome: {
                subject: 'Welcome to Exoin Africa!',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1E3A8A;">Welcome, {{name}}!</h1>
            <p>Thank you for joining Exoin Africa. We're excited to have you on board.</p>
            <p>Your account has been created successfully.</p>
            <a href="{{loginUrl}}" style="display: inline-block; background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Get Started</a>
          </div>
        `,
                text: 'Welcome, {{name}}! Thank you for joining Exoin Africa.',
            },
            invoice: {
                subject: 'Invoice #{{invoiceNumber}} from Exoin Africa',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1E3A8A;">Invoice #{{invoiceNumber}}</h1>
            <p>Dear {{clientName}},</p>
            <p>Please find attached your invoice for <strong>{{total}}</strong>.</p>
            <p>Due date: {{dueDate}}</p>
            <p>Thank you for your business!</p>
          </div>
        `,
                text: 'Invoice #{{invoiceNumber}} - Amount: {{total}} - Due: {{dueDate}}',
            },
            quotation: {
                subject: 'Quotation #{{quotationNumber}} from Exoin Africa',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1E3A8A;">Quotation #{{quotationNumber}}</h1>
            <p>Dear {{clientName}},</p>
            <p>Please find attached your quotation for <strong>{{total}}</strong>.</p>
            <p>This quotation is valid until {{validUntil}}.</p>
            <p>Please don't hesitate to contact us if you have any questions.</p>
          </div>
        `,
                text: 'Quotation #{{quotationNumber}} - Amount: {{total}} - Valid until: {{validUntil}}',
            },
        };
        const template = templates[templateName];
        if (!template) {
            return {
                success: false,
                messageId: '',
                accepted: [],
                rejected: [],
                error: `Template "${templateName}" not found`,
            };
        }
        // Replace variables in template
        let html = template.html;
        let text = template.text;
        let subject = template.subject;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value);
            text = text.replace(regex, value);
            subject = subject.replace(regex, value);
        }
        return this.sendEmail({
            to,
            subject,
            html,
            text,
            ...options,
        });
    }
    // Get configuration status
    getStatus() {
        return {
            configured: this.isConfigured,
            fromAddress: this.fromAddress,
            fromName: this.fromName,
        };
    }
    // Update configuration (for runtime updates)
    updateConfig(config) {
        if (config.fromAddress)
            this.fromAddress = config.fromAddress;
        if (config.fromName)
            this.fromName = config.fromName;
        if (config.host && config.auth) {
            this.transporter = nodemailer_1.default.createTransport({
                host: config.host,
                port: config.port || 587,
                secure: config.secure || false,
                auth: config.auth,
            });
            this.isConfigured = true;
        }
    }
}
exports.EmailService = EmailService;
// Export singleton instance
exports.emailService = new EmailService();
