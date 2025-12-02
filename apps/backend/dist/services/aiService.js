"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Initialize Gemini AI
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Safety settings to avoid harmful content generation
const safetySettings = [
    { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];
class AIService {
    constructor() {
        this.isConfigured = !!process.env.GEMINI_API_KEY;
        if (this.isConfigured) {
            this.model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                safetySettings,
            });
            console.log('🤖 AI Service initialized with Gemini');
        }
        else {
            console.warn('⚠️ AI Service: GEMINI_API_KEY not set. AI features disabled.');
        }
    }
    // Check if AI is available
    isAvailable() {
        return this.isConfigured;
    }
    /**
     * Smart Compose - Get autocomplete suggestions as user types
     */
    async getSmartComposeSuggestion(params) {
        if (!this.isConfigured)
            return null;
        const { currentText, emailContext, recipientInfo, tone = 'professional', isReply = false } = params;
        // Don't suggest if text is too short
        if (currentText.length < 10)
            return null;
        try {
            const prompt = `You are an email assistant. Complete the following email text naturally.
${emailContext ? `Context: ${emailContext}` : ''}
${recipientInfo ? `Recipient: ${recipientInfo}` : ''}
Tone: ${tone}
${isReply ? 'This is a reply email.' : 'This is a new email.'}

Current text: "${currentText}"

Provide ONLY the suggested completion (not the full text).
Keep it brief (1-2 sentences max).
Match the writing style of the current text.
Do not repeat what's already written.
If the text seems complete, respond with empty string.`;
            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            // Clean up the response
            if (response.toLowerCase().startsWith('suggestion:')) {
                return response.substring(11).trim();
            }
            return response || null;
        }
        catch (error) {
            console.error('Smart compose error:', error);
            return null;
        }
    }
    /**
     * Smart Reply - Generate quick reply options
     */
    async generateSmartReplies(params) {
        if (!this.isConfigured)
            return [];
        const { emailContent, senderName, subject, tone = 'professional' } = params;
        try {
            const prompt = `Analyze this email and generate 3 short, appropriate reply options.
Each reply should be 1-2 sentences max.
Vary the responses: one positive/accepting, one neutral/acknowledging, one declining/redirecting.

From: ${senderName || 'Sender'}
Subject: ${subject || '(no subject)'}
Email content:
"${emailContent.substring(0, 1500)}"

Tone: ${tone}

Return ONLY a JSON array with 3 strings, no explanations. Example format:
["Reply 1 text", "Reply 2 text", "Reply 3 text"]`;
            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            // Parse JSON response
            try {
                const parsed = JSON.parse(response);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.slice(0, 3);
                }
            }
            catch {
                // If JSON parsing fails, try to extract replies manually
                const lines = response.split('\n').filter((l) => l.trim());
                return lines.slice(0, 3).map((l) => l.replace(/^[\d\.\-\*\)]+\s*/, '').replace(/^["']|["']$/g, ''));
            }
            return [];
        }
        catch (error) {
            console.error('Smart reply error:', error);
            return [];
        }
    }
    /**
     * Summarize email or thread
     */
    async summarizeEmail(params) {
        if (!this.isConfigured)
            return null;
        const { emailContent, includeActionItems = true, maxLength = 200 } = params;
        try {
            const prompt = `Summarize this email concisely in ${maxLength} characters or less.
${includeActionItems ? 'Also identify any action items or requests.' : ''}

Email content:
"${emailContent.substring(0, 3000)}"

Return a JSON object with this format:
{
  "summary": "Brief summary here",
  "keyPoints": ["point 1", "point 2"],
  "actionItems": ["action 1", "action 2"]
}

If there are no action items, return empty array.
Return ONLY valid JSON, no explanations.`;
            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            // Clean up JSON (remove markdown code blocks if present)
            let cleanJson = response;
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```$/g, '');
            }
            const parsed = JSON.parse(cleanJson);
            return {
                summary: parsed.summary || '',
                keyPoints: parsed.keyPoints || [],
                actionItems: parsed.actionItems || [],
            };
        }
        catch (error) {
            console.error('Summarize error:', error);
            return null;
        }
    }
    /**
     * Rewrite text with different style
     */
    async rewriteText(params) {
        if (!this.isConfigured)
            return null;
        const { text, style } = params;
        const styleInstructions = {
            'formal': 'Rewrite this in a formal, professional business tone.',
            'friendly': 'Rewrite this in a warm, friendly tone while remaining professional.',
            'concise': 'Rewrite this to be more concise and direct. Remove unnecessary words.',
            'expand': 'Expand this text with more detail and context while keeping the same meaning.',
            'fix-grammar': 'Fix any grammar, spelling, or punctuation errors. Keep the same meaning and style.',
        };
        try {
            const prompt = `${styleInstructions[style]}

Original text:
"${text}"

Return ONLY the rewritten text, no explanations or quotes.`;
            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        }
        catch (error) {
            console.error('Rewrite error:', error);
            return null;
        }
    }
    /**
     * Generate subject line suggestions
     */
    async suggestSubjectLines(emailBody, count = 3) {
        if (!this.isConfigured)
            return [];
        try {
            const prompt = `Generate ${count} email subject line suggestions for this email.
Make them clear, concise, and professional.

Email body:
"${emailBody.substring(0, 1000)}"

Return ONLY a JSON array of strings, no explanations. Example:
["Subject 1", "Subject 2", "Subject 3"]`;
            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            let cleanJson = response;
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```$/g, '');
            }
            const parsed = JSON.parse(cleanJson);
            return Array.isArray(parsed) ? parsed.slice(0, count) : [];
        }
        catch (error) {
            console.error('Subject suggestion error:', error);
            return [];
        }
    }
    /**
     * Check email tone and professionalism
     */
    async analyzeTone(text) {
        if (!this.isConfigured)
            return null;
        try {
            const prompt = `Analyze the tone of this email text.

Text:
"${text}"

Return a JSON object with:
{
  "tone": "the detected tone (e.g., professional, casual, frustrated, friendly)",
  "professionalism": "high" or "medium" or "low",
  "suggestions": ["suggestion 1", "suggestion 2"] // ways to improve the email
}

Return ONLY valid JSON, no explanations.`;
            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            let cleanJson = response;
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```$/g, '');
            }
            return JSON.parse(cleanJson);
        }
        catch (error) {
            console.error('Tone analysis error:', error);
            return null;
        }
    }
    /**
     * Extract key information from email
     */
    async extractKeyInfo(emailContent) {
        if (!this.isConfigured)
            return null;
        try {
            const prompt = `Extract key information from this email.

Email:
"${emailContent.substring(0, 2000)}"

Return a JSON object:
{
  "dates": ["any dates or deadlines mentioned"],
  "people": ["names of people mentioned"],
  "topics": ["main topics or subjects discussed"],
  "sentiment": "positive" or "neutral" or "negative"
}

Return ONLY valid JSON.`;
            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            let cleanJson = response;
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```$/g, '');
            }
            return JSON.parse(cleanJson);
        }
        catch (error) {
            console.error('Extract info error:', error);
            return null;
        }
    }
    /**
     * Smart Categorization - Auto-label emails based on content
     */
    async categorizeEmail(params) {
        if (!this.isConfigured)
            return null;
        try {
            const prompt = `Analyze this email and categorize it.

From: ${params.fromAddress}
Subject: ${params.subject}
Content: "${params.content.substring(0, 1500)}"

Categorize into ONE primary category:
- WORK: Work-related, projects, tasks, meetings
- FINANCE: Invoices, receipts, banking, payments
- SOCIAL: Social networks, personal messages
- SHOPPING: Orders, shipping, e-commerce
- TRAVEL: Flights, hotels, bookings
- NEWSLETTERS: News updates, subscriptions
- PROMOTIONS: Marketing, sales, offers
- UPDATES: Notifications, alerts, system updates
- SUPPORT: Customer service, help desk
- PERSONAL: Friends, family, personal matters

Also determine:
1. Suggested labels (up to 3 specific labels like "Project Alpha", "Urgent", "Client: Acme")
2. Is it urgent? (deadlines, action required, time-sensitive)
3. Is it a promotion/marketing?
4. Is it a newsletter?

Return ONLY valid JSON:
{
  "category": "CATEGORY_NAME",
  "confidence": 0.0-1.0,
  "suggestedLabels": ["label1", "label2"],
  "isUrgent": true/false,
  "isPromotion": true/false,
  "isNewsletter": true/false
}`;
            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            let cleanJson = response;
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```$/g, '');
            }
            return JSON.parse(cleanJson);
        }
        catch (error) {
            console.error('Categorize email error:', error);
            return null;
        }
    }
    /**
     * Detect phishing and security threats
     */
    async analyzeSecurityThreats(params) {
        if (!this.isConfigured)
            return null;
        try {
            const prompt = `Analyze this email for security threats and phishing indicators.

From: ${params.fromAddress}
Subject: ${params.subject}
Content: "${params.content.substring(0, 1500)}"
Links found: ${params.links.slice(0, 10).join(', ')}

Check for:
1. Phishing indicators (urgency, impersonation, suspicious requests)
2. Suspicious sender patterns (misspelled domains, unusual addresses)
3. Dangerous link patterns (URL shorteners to unknown sites, mismatched display text)
4. Social engineering tactics

Return ONLY valid JSON:
{
  "threatLevel": "safe" or "suspicious" or "dangerous",
  "reasons": ["list of specific concerns found"],
  "phishingScore": 0.0-1.0,
  "recommendations": ["what the user should do"]
}`;
            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            let cleanJson = response;
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```$/g, '');
            }
            return JSON.parse(cleanJson);
        }
        catch (error) {
            console.error('Security analysis error:', error);
            return null;
        }
    }
}
exports.aiService = new AIService();
