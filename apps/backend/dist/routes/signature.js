"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = signatureRoutes;
const index_1 = require("../index");
async function signatureRoutes(fastify) {
    // Get current user's signature settings
    fastify.get('/settings', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
                phone: true,
                avatarUrl: true,
                signatureEnabled: true,
                signatureStyle: true,
                linkedinUrl: true,
                twitterUrl: true,
                instagramUrl: true,
                location: true,
                officeAddress: true,
                company: {
                    select: {
                        name: true,
                        website: true,
                        primaryColor: true,
                        secondaryColor: true,
                        logoUrl: true,
                    }
                }
            }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        return user;
    });
    // Update signature settings (only editable fields)
    fastify.put('/settings', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const { signatureEnabled, signatureStyle, signatureHtml, // Allow saving custom HTML directly
        linkedinUrl, twitterUrl, instagramUrl, location, officeAddress, phone, jobTitle, } = request.body;
        // First update the settings
        const userWithCompany = await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                signatureEnabled,
                signatureStyle,
                linkedinUrl,
                twitterUrl,
                instagramUrl,
                location,
                officeAddress,
                phone,
                jobTitle,
            },
            include: {
                company: true
            }
        });
        // If custom signatureHtml is provided, save it directly
        // Otherwise, regenerate from settings
        let finalSignatureHtml = signatureHtml;
        if (!signatureHtml && signatureEnabled) {
            // Generate the HTML based on current settings
            finalSignatureHtml = generateSignatureHTML(userWithCompany, userWithCompany.company, false);
        }
        // Update the signatureHtml field and return final user data
        const updatedUser = await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                signatureHtml: signatureEnabled ? finalSignatureHtml : null,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
                phone: true,
                avatarUrl: true,
                signatureEnabled: true,
                signatureStyle: true,
                signatureHtml: true,
                linkedinUrl: true,
                twitterUrl: true,
                instagramUrl: true,
                location: true,
                officeAddress: true,
                company: {
                    select: {
                        name: true,
                        website: true,
                        primaryColor: true,
                        secondaryColor: true,
                        logoUrl: true,
                    }
                }
            }
        });
        return updatedUser;
    });
    // Save custom signature HTML directly
    fastify.put('/html', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const { html } = request.body;
        const user = await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                signatureHtml: html,
                signatureEnabled: !!html,
            },
            select: {
                id: true,
                signatureEnabled: true,
                signatureHtml: true,
            }
        });
        return { success: true, html: user.signatureHtml };
    });
    // Generate HTML signature
    fastify.get('/html', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const { darkMode = 'false', regenerate = 'false' } = request.query;
        const isDark = darkMode === 'true';
        const forceRegenerate = regenerate === 'true';
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: true
            }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        if (!user.signatureEnabled) {
            return { html: '', enabled: false };
        }
        // If user has a stored signature and not forcing regeneration, return it
        if (user.signatureHtml && !forceRegenerate && !isDark) {
            return { html: user.signatureHtml, enabled: true };
        }
        // Generate fresh HTML (for dark mode or if no stored signature)
        const html = generateSignatureHTML(user, user.company, isDark);
        // If light mode and no stored signature, save it for future use
        if (!isDark && !user.signatureHtml) {
            await index_1.prisma.user.update({
                where: { id: userId },
                data: { signatureHtml: html }
            });
        }
        return { html, enabled: true };
    });
    // Get available signature styles
    fastify.get('/styles', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        return {
            styles: [
                {
                    id: 'executive',
                    name: 'Executive Link',
                    description: 'Professional signature with avatar, full contact info, and social links',
                    preview: 'Full signature with photo, details, logo, and social icons'
                },
                {
                    id: 'compact',
                    name: 'Compact',
                    description: 'Minimal signature with essential contact information',
                    preview: 'Logo + Name + Title + Basic contact info'
                }
            ]
        };
    });
    // Preview signature (for editor)
    fastify.post('/preview', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId, companyId } = request.user;
        const previewData = request.body;
        const { darkMode = false } = previewData;
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId },
            include: { company: true }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        // Merge preview data with user data
        const previewUser = {
            ...user,
            ...previewData,
        };
        const html = generateSignatureHTML(previewUser, user.company, darkMode);
        return { html };
    });
}
// Generate the HTML signature based on user settings - MATCHES FRONTEND EmailSignatureTemplate EXACTLY
function generateSignatureHTML(user, company, isDark = false) {
    const style = user.signatureStyle || 'executive';
    // Colors - matching the frontend ExoinEmailSignatures exactly
    const accentColor = '#F97316'; // Orange accent (always orange like frontend)
    const primaryColor = '#1E3A8A'; // Blue primary
    // Text colors based on theme - matching frontend exactly
    const textColor = isDark ? '#FFFFFF' : '#0F172A';
    const titleColor = '#EA580C'; // text-orange-600
    const contactTextColor = isDark ? '#CBD5E1' : '#475569'; // text-slate-600/300
    const addressColor = isDark ? '#64748B' : '#94A3B8'; // text-slate-400/500
    const borderColor = isDark ? '#334155' : '#E2E8F0'; // border-slate-200/700
    const iconBgColor = isDark ? '#1E293B' : '#F1F5F9'; // bg-slate-100/800
    const iconColor = isDark ? '#94A3B8' : '#64748B'; // text-slate-500/400
    const avatarBg = isDark ? '#1E293B' : '#E2E8F0'; // bg-slate-200/800
    const avatarBorder = isDark ? '#475569' : '#FFFFFF'; // border-white/slate-600
    const logoTextColor = isDark ? '#FFFFFF' : '#0F172A';
    const logoSubTextColor = isDark ? '#CBD5E1' : '#64748B';
    const socialIconColor = isDark ? '#94A3B8' : '#64748B';
    const confidentialityColor = isDark ? '#475569' : '#94A3B8';
    const confidentialityBoldColor = isDark ? '#64748B' : '#475569';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'John Doe';
    const initials = `${user.firstName?.charAt(0) || 'J'}${user.lastName?.charAt(0) || 'D'}`;
    const displayTitle = user.jobTitle || 'Chief Operations Officer';
    const displayPhone = user.phone || '+254 700 000 000';
    const displayEmail = user.email || 'john@exoin.africa';
    const displayLocation = user.location || 'Nairobi, Kenya';
    const displayWebsite = company?.website?.replace('https://', '').replace('http://', '') || 'www.exoin.africa';
    const displayAddress = user.officeAddress || 'Exoin Tower, Westlands Road';
    // Logo SVG - matching frontend SigLogo component exactly
    const logoFillColor = isDark ? '#FFFFFF' : '#1E3A8A';
    // Social icons - only show if URL exists
    const linkedinSvg = user.linkedinUrl ? `
    <a href="${user.linkedinUrl}" style="display:inline-block;width:20px;height:20px;margin-right:8px;text-decoration:none;">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="${socialIconColor}">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    </a>
  ` : '';
    const twitterSvg = user.twitterUrl ? `
    <a href="${user.twitterUrl}" style="display:inline-block;width:20px;height:20px;margin-right:8px;text-decoration:none;">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="${socialIconColor}">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    </a>
  ` : '';
    const instagramSvg = user.instagramUrl ? `
    <a href="${user.instagramUrl}" style="display:inline-block;width:20px;height:20px;text-decoration:none;">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${socialIconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    </a>
  ` : '';
    const hasSocialLinks = user.linkedinUrl || user.twitterUrl || user.instagramUrl;
    if (style === 'executive') {
        // This matches the EmailSignatureTemplate from ExoinEmailSignatures.jsx exactly
        return `
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;max-width:600px;width:100%;">
  <!-- Orange top border -->
  <tr>
    <td colspan="3" style="border-top:2px solid ${accentColor};padding-top:24px;"></td>
  </tr>
  <tr>
    <!-- Avatar Column -->
    <td style="vertical-align:top;padding-right:24px;width:64px;">
      <div style="width:64px;height:64px;border-radius:50%;background-color:${avatarBg};border:2px solid ${avatarBorder};box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);overflow:hidden;position:relative;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%">
          <tr>
            <td align="center" valign="middle" style="font-size:8px;font-weight:bold;color:${iconColor};opacity:0.5;">
              ${initials}
            </td>
          </tr>
        </table>
      </div>
    </td>
    
    <!-- Info Block Column -->
    <td style="vertical-align:top;padding-right:24px;">
      <!-- Name -->
      <div style="font-size:18px;font-weight:bold;color:${textColor};line-height:1;margin-bottom:4px;">
        ${fullName}
      </div>
      <!-- Title -->
      <div style="font-size:12px;font-weight:bold;color:${titleColor};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">
        ${displayTitle}
      </div>
      
      <!-- Contact Grid - 2 columns -->
      <table cellpadding="0" cellspacing="0" border="0" style="font-size:12px;font-weight:500;color:${contactTextColor};">
        <tr>
          <!-- Phone -->
          <td style="padding:4px 32px 4px 0;vertical-align:middle;">
            <a href="tel:${displayPhone}" style="color:${contactTextColor};text-decoration:none;display:flex;align-items:center;">
              <span style="background:${iconBgColor};padding:4px;border-radius:4px;display:inline-block;margin-right:8px;line-height:1;">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <span>${displayPhone}</span>
            </a>
          </td>
          <!-- Email -->
          <td style="padding:4px 0;vertical-align:middle;">
            <a href="mailto:${displayEmail}" style="color:${contactTextColor};text-decoration:none;display:flex;align-items:center;">
              <span style="background:${iconBgColor};padding:4px;border-radius:4px;display:inline-block;margin-right:8px;line-height:1;">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <span>${displayEmail}</span>
            </a>
          </td>
        </tr>
        <tr>
          <!-- Location -->
          <td style="padding:4px 32px 4px 0;vertical-align:middle;">
            <span style="display:flex;align-items:center;">
              <span style="background:${iconBgColor};padding:4px;border-radius:4px;display:inline-block;margin-right:8px;line-height:1;">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </span>
              <span>${displayLocation}</span>
            </span>
          </td>
          <!-- Website -->
          <td style="padding:4px 0;vertical-align:middle;">
            <a href="https://${displayWebsite}" style="color:${contactTextColor};text-decoration:none;display:flex;align-items:center;">
              <span style="background:${iconBgColor};padding:4px;border-radius:4px;display:inline-block;margin-right:8px;line-height:1;">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </span>
              <span>${displayWebsite}</span>
            </a>
          </td>
        </tr>
      </table>
      
      <!-- Address -->
      <div style="margin-top:8px;font-size:10px;color:${addressColor};">
        ${displayAddress}
      </div>
    </td>
    
    <!-- Logo & Social Column -->
    <td style="vertical-align:top;border-left:1px solid ${borderColor};padding-left:24px;width:140px;">
      <!-- Logo -->
      <div style="margin-bottom:16px;transform:scale(1.25);transform-origin:right top;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;padding-right:8px;">
              <svg viewBox="0 0 100 100" width="24" height="24">
                <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="${logoFillColor}"/>
                <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="${accentColor}"/>
              </svg>
            </td>
            <td style="vertical-align:middle;">
              <div style="font-size:14px;font-weight:900;color:${logoTextColor};letter-spacing:-0.5px;line-height:1;">EXOIN</div>
              <div style="font-size:6px;font-weight:600;color:${logoSubTextColor};letter-spacing:2px;text-align:right;margin-top:2px;">AFRICA</div>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Social Icons -->
      ${hasSocialLinks ? `
      <div style="display:flex;gap:8px;">
        ${linkedinSvg}${twitterSvg}${instagramSvg}
      </div>
      ` : ''}
    </td>
  </tr>
  
  <!-- Confidentiality Notice -->
  <tr>
    <td colspan="3" style="padding-top:24px;">
      <div style="border-top:1px solid ${borderColor};padding-top:16px;font-size:9px;color:${confidentialityColor};line-height:1.5;">
        <strong style="color:${confidentialityBoldColor};">Confidentiality Notice:</strong> This email is intended only for the person to whom it is addressed. If you are not the intended recipient, you are not authorized to read, print, retain, copy, disseminate, distribute, or use this message or any part thereof.
      </div>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
    `.trim();
    }
    // Compact style
    return `
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:2px solid ${accentColor};padding-top:12px;margin-top:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:400px;">
  <tr>
    <td style="vertical-align:middle;padding-right:12px;width:24px;">
      <svg viewBox="0 0 100 100" width="24" height="24">
        <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="${logoFillColor}"/>
        <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="${accentColor}"/>
      </svg>
    </td>
    <td style="vertical-align:middle;">
      <div style="font-size:14px;font-weight:bold;color:${textColor};">${fullName}</div>
      <div style="font-size:11px;color:${contactTextColor};">${displayTitle}${company?.name ? ` | ${company.name}` : ''}</div>
      <div style="font-size:11px;color:${addressColor};margin-top:4px;">
        📞 ${displayPhone} | ✉️ ${displayEmail}
      </div>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
  `.trim();
}
