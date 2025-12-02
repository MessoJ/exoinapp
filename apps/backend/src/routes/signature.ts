import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export default async function signatureRoutes(fastify: FastifyInstance) {
  
  // Get current user's signature settings
  fastify.get('/settings', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;
    
    const user = await prisma.user.findUnique({
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
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;
    const {
      signatureEnabled,
      signatureStyle,
      signatureHtml, // Allow saving custom HTML directly
      linkedinUrl,
      twitterUrl,
      instagramUrl,
      location,
      officeAddress,
      phone,
      jobTitle,
    } = request.body as any;

    // First update the settings
    const userWithCompany = await prisma.user.update({
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
    const updatedUser = await prisma.user.update({
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
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;
    const { html } = request.body as any;

    const user = await prisma.user.update({
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
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;
    const { darkMode = 'false', regenerate = 'false' } = request.query as any;
    const isDark = darkMode === 'true';
    const forceRegenerate = regenerate === 'true';

    const user = await prisma.user.findUnique({
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
      await prisma.user.update({
        where: { id: userId },
        data: { signatureHtml: html }
      });
    }

    return { html, enabled: true };
  });

  // Get available signature styles
  fastify.get('/styles', {
    preHandler: [(fastify as any).authenticate]
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
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId, companyId } = (request as any).user;
    const previewData = request.body as any;
    const { darkMode = false } = previewData;

    const user = await prisma.user.findUnique({
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

// Generate EMAIL-CLIENT COMPATIBLE HTML signature
// Rules: No SVG, No flexbox, No CSS transforms, Tables only, All inline styles
function generateSignatureHTML(user: any, company: any, isDark: boolean = false): string {
  const style = user.signatureStyle || 'executive';
  
  // Colors
  const accentColor = '#F97316'; // Orange
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const titleColor = '#EA580C';
  const contactTextColor = isDark ? '#CBD5E1' : '#475569';
  const addressColor = isDark ? '#64748B' : '#94A3B8';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const avatarBg = isDark ? '#1E293B' : '#E2E8F0';
  const logoTextColor = isDark ? '#FFFFFF' : '#1E3A8A';
  const confidentialityColor = isDark ? '#64748B' : '#94A3B8';
  const bgColor = isDark ? '#1E1E1E' : '#FFFFFF';

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'John Doe';
  const initials = `${user.firstName?.charAt(0) || 'J'}${user.lastName?.charAt(0) || 'D'}`;
  const displayTitle = user.jobTitle || 'Chief Operations Officer';
  const displayPhone = user.phone || '+254 700 000 000';
  const displayEmail = user.email || 'john@exoin.africa';
  const displayLocation = user.location || 'Nairobi, Kenya';
  const displayWebsite = company?.website?.replace('https://', '').replace('http://', '') || 'exoin.africa';
  const displayAddress = user.officeAddress || 'Exoin Tower, Westlands Road';

  // Social links using Unicode/text (email-safe)
  const linkedinLink = user.linkedinUrl ? `<a href="${user.linkedinUrl}" style="color:${accentColor};text-decoration:none;font-weight:bold;margin-right:12px;">in</a>` : '';
  const twitterLink = user.twitterUrl ? `<a href="${user.twitterUrl}" style="color:${accentColor};text-decoration:none;font-weight:bold;margin-right:12px;">𝕏</a>` : '';
  const instagramLink = user.instagramUrl ? `<a href="${user.instagramUrl}" style="color:${accentColor};text-decoration:none;font-weight:bold;">📷</a>` : '';
  const hasSocialLinks = user.linkedinUrl || user.twitterUrl || user.instagramUrl;

  if (style === 'executive') {
    return `
<!--[if mso]><table width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr><td><![endif]-->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;margin-top:20px;background-color:${bgColor};">
  <tr>
    <td colspan="3" style="border-top:3px solid ${accentColor};padding-top:20px;"></td>
  </tr>
  <tr>
    <td width="70" valign="top" style="padding-right:15px;">
      <table cellpadding="0" cellspacing="0" border="0" width="60" height="60" style="border-radius:30px;background-color:${avatarBg};border:2px solid ${borderColor};">
        <tr>
          <td align="center" valign="middle" style="font-size:18px;font-weight:bold;color:${contactTextColor};">
            ${initials}
          </td>
        </tr>
      </table>
    </td>
    <td valign="top" style="padding-right:20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-size:18px;font-weight:bold;color:${textColor};padding-bottom:2px;">
            ${fullName}
          </td>
        </tr>
        <tr>
          <td style="font-size:11px;font-weight:bold;color:${titleColor};text-transform:uppercase;letter-spacing:1px;padding-bottom:12px;">
            ${displayTitle}
          </td>
        </tr>
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" border="0" style="font-size:12px;color:${contactTextColor};">
              <tr>
                <td style="padding:3px 25px 3px 0;">
                  <a href="tel:${displayPhone}" style="color:${contactTextColor};text-decoration:none;">📞 ${displayPhone}</a>
                </td>
                <td style="padding:3px 0;">
                  <a href="mailto:${displayEmail}" style="color:${contactTextColor};text-decoration:none;">✉️ ${displayEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:3px 25px 3px 0;">
                  📍 ${displayLocation}
                </td>
                <td style="padding:3px 0;">
                  <a href="https://${displayWebsite}" style="color:${contactTextColor};text-decoration:none;">🌐 ${displayWebsite}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="font-size:10px;color:${addressColor};padding-top:6px;">
            ${displayAddress}
          </td>
        </tr>
      </table>
    </td>
    <td width="100" valign="top" style="border-left:1px solid ${borderColor};padding-left:15px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:10px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:20px;font-weight:900;color:${logoTextColor};letter-spacing:-1px;">EXOIN</td>
              </tr>
              <tr>
                <td style="font-size:7px;font-weight:600;color:${addressColor};letter-spacing:3px;text-align:right;">AFRICA</td>
              </tr>
            </table>
          </td>
        </tr>
        ${hasSocialLinks ? `
        <tr>
          <td style="font-size:16px;padding-top:5px;">
            ${linkedinLink}${twitterLink}${instagramLink}
          </td>
        </tr>
        ` : ''}
      </table>
    </td>
  </tr>
  <tr>
    <td colspan="3" style="padding-top:15px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="border-top:1px solid ${borderColor};padding-top:10px;font-size:9px;color:${confidentialityColor};line-height:1.4;">
            <strong>Confidentiality Notice:</strong> This email is intended only for the person to whom it is addressed. If you are not the intended recipient, you are not authorized to read, print, retain, copy, disseminate, distribute, or use this message or any part thereof.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
    `.trim();
  }

  // Compact style
  return `
<!--[if mso]><table width="400" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:400px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;margin-top:20px;border-top:2px solid ${accentColor};padding-top:10px;">
  <tr>
    <td valign="middle" style="padding:10px 0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:14px;font-weight:bold;color:${textColor};">${fullName}</td>
        </tr>
        <tr>
          <td style="font-size:11px;color:${contactTextColor};">${displayTitle}${company?.name ? ` • ${company.name}` : ''}</td>
        </tr>
        <tr>
          <td style="font-size:11px;color:${addressColor};padding-top:4px;">
            📞 ${displayPhone} &nbsp;|&nbsp; ✉️ ${displayEmail}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
  `.trim();
}
