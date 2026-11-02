import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export default async function signatureRoutes(fastify: FastifyInstance) {
  
  // Handler for getting signature settings
  const handleGetSignatureSettings = async (request: any, reply: any) => {
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
  };

  // Get current user's signature settings
  fastify.get('/settings', {
    preHandler: [(fastify as any).authenticate]
  }, handleGetSignatureSettings);

  fastify.get('/', {
    preHandler: [(fastify as any).authenticate]
  }, handleGetSignatureSettings);

  // Handler for updating signature settings
  const handleUpdateSignatureSettings = async (request: any, reply: any) => {
    const { id: userId } = (request as any).user;
    const {
      signatureEnabled,
      signatureStyle,
      signatureHtml,
      linkedinUrl,
      twitterUrl,
      instagramUrl,
      location,
      officeAddress,
      phone,
      jobTitle,
    } = request.body as any;

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

    let finalSignatureHtml = signatureHtml;
    if (!signatureHtml && signatureEnabled) {
      finalSignatureHtml = generateSignatureHTML(userWithCompany, userWithCompany.company, false);
    }

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
  };

  // Update signature settings
  fastify.put('/settings', {
    preHandler: [(fastify as any).authenticate]
  }, handleUpdateSignatureSettings);

  fastify.put('/', {
    preHandler: [(fastify as any).authenticate]
  }, handleUpdateSignatureSettings);

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
      },
      select: {
        id: true,
        signatureHtml: true,
      }
    });

    return user;
  });

  // Get rendered signature HTML (for copy/paste into email clients)
  fastify.get('/html', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;
    const { darkMode = 'false' } = request.query as any;
    const isDark = darkMode === 'true';

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true
      }
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (user.signatureHtml) {
      return { html: user.signatureHtml };
    }

    const html = generateSignatureHTML(user, user.company, isDark);
    return { html };
  });

  // Toggle signature enabled/disabled
  fastify.post('/toggle', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;
    const { enabled } = request.body as any;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        signatureEnabled: enabled,
      },
      select: {
        id: true,
        signatureEnabled: true,
      }
    });

    return user;
  });
}

function generateSignatureHTML(user: any, company: any, isDark: boolean): string {
  const primaryColor = company?.primaryColor || '#1E3A8A';
  const secondaryColor = company?.secondaryColor || '#F97316';
  
  const textColor = isDark ? '#f1f5f9' : '#0F172A';
  const titleColor = secondaryColor;
  const contactTextColor = isDark ? '#94a3b8' : '#334155';
  const addressColor = isDark ? '#64748b' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const confidentialityColor = isDark ? '#64748b' : '#94A3B8';
  const accentColor = secondaryColor;

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Team Member';
  const displayTitle = user.jobTitle || 'Executive';
  const displayPhone = user.phone || '0739443244';
  const displayEmail = user.email;
  const displayLocation = user.location || 'Nairobi, Kenya';
  const displayAddress = user.officeAddress || 'Westlands Tower, Waiyaki Way';

  const hasSocialLinks = user.linkedinUrl || user.twitterUrl || user.instagramUrl;
  
  const linkedinLink = user.linkedinUrl ? `<a href="${user.linkedinUrl}" style="text-decoration:none;margin-right:6px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="14" height="14" style="vertical-align:middle;" alt="LinkedIn" /></a>` : '';
  const twitterLink = user.twitterUrl ? `<a href="${user.twitterUrl}" style="text-decoration:none;margin-right:6px;"><img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" width="14" height="14" style="vertical-align:middle;" alt="Twitter" /></a>` : '';
  const instagramLink = user.instagramUrl ? `<a href="${user.instagramUrl}" style="text-decoration:none;"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" width="14" height="14" style="vertical-align:middle;" alt="Instagram" /></a>` : '';

  if (user.signatureStyle === 'minimal') {
    return `
<!--[if mso]><table width="500" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:500px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;margin-top:20px;">
  <tr>
    <td style="padding-bottom:8px;">
      <span style="font-size:15px;font-weight:bold;color:${textColor};">${fullName}</span>
      <span style="font-size:13px;color:${titleColor};margin-left:8px;">| &nbsp;${displayTitle}</span>
    </td>
  </tr>
  <tr>
    <td style="border-top:1px solid ${borderColor};padding-top:8px;font-size:11px;color:${contactTextColor};line-height:1.5;">
      <span><strong>${company?.name || 'Exoin Africa'}</strong></span> &nbsp;•&nbsp; 
      <span>${displayPhone}</span> &nbsp;•&nbsp; 
      <a href="mailto:${displayEmail}" style="color:${primaryColor};text-decoration:none;">${displayEmail}</a>
      ${company?.website ? `&nbsp;•&nbsp; <a href="${company.website}" style="color:${primaryColor};text-decoration:none;">${company.website.replace(/^https?:\/\//, '')}</a>` : ''}
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
    `.trim();
  }

  return `
<!--[if mso]><table width="520" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;margin-top:20px;">
  <tr>
    <td valign="top" style="padding-right:15px;border-right:2px solid ${accentColor};">
      <div style="font-weight:900;font-size:18px;color:${primaryColor};letter-spacing:-0.5px;">EXOIN</div>
      <div style="font-size:8px;font-weight:bold;color:${secondaryColor};letter-spacing:2px;text-transform:uppercase;">AFRICA</div>
    </td>
    <td style="width:15px;"></td>
    <td valign="top">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-size:14px;font-weight:bold;color:${textColor};">${fullName}</td>
        </tr>
        <tr>
          <td style="font-size:11px;color:${titleColor};font-weight:600;padding-bottom:5px;">${displayTitle}</td>
        </tr>
        <tr>
          <td style="font-size:11px;color:${contactTextColor};line-height:1.5;">
            📞 ${displayPhone} &nbsp;|&nbsp; ✉️ <a href="mailto:${displayEmail}" style="color:${primaryColor};text-decoration:none;">${displayEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="font-size:10px;color:${addressColor};padding-top:2px;">
            🏢 ${displayAddress}, ${displayLocation}
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
</table>
<!--[if mso]></td></tr></table><![endif]-->
  `.trim();
}
