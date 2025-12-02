import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as argon2 from 'argon2';
import { prisma } from '../index';
import { ssoService, SSOSession } from '../services/ssoService';

// Extend Fastify types for cookie support
declare module 'fastify' {
  interface FastifyRequest {
    cookies?: Record<string, string>;
  }
  interface FastifyReply {
    setCookie(name: string, value: string, options?: any): FastifyReply;
    clearCookie(name: string, options?: any): FastifyReply;
  }
}

export default async function authRoutes(fastify: FastifyInstance) {
  
  // ==========================================
  // SSO / OAuth2 ENDPOINTS
  // ==========================================

  // Get available SSO providers
  fastify.get('/sso/providers', async (request, reply) => {
    const providers = ssoService.getAvailableProviders();
    return {
      ssoEnabled: ssoService.hasProviders(),
      providers,
    };
  });

  // Initiate SSO login flow
  fastify.get('/sso/login/:provider', async (request, reply) => {
    const { provider } = request.params as { provider: string };
    const { redirect } = request.query as { redirect?: string };
    
    // Build redirect URI for callback
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const redirectUri = `${baseUrl}/api/auth/sso/callback`;
    
    // Generate authorization URL
    const authUrl = ssoService.generateAuthorizationUrl(provider, redirectUri);
    
    if (!authUrl) {
      return reply.status(400).send({ error: 'Unknown SSO provider' });
    }
    
    // Store the original redirect destination in a cookie
    if (redirect) {
      reply.setCookie('sso_redirect', redirect, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
      });
    }
    
    return reply.redirect(authUrl);
  });

  // SSO callback handler
  fastify.get('/sso/callback', async (request, reply) => {
    const { code, state, error, error_description } = request.query as {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Handle OAuth errors
    if (error) {
      console.error('SSO error:', error, error_description);
      return reply.redirect(`${frontendUrl}/login?sso_error=${encodeURIComponent(error_description || error)}`);
    }
    
    if (!code || !state) {
      return reply.redirect(`${frontendUrl}/login?sso_error=missing_code_or_state`);
    }
    
    // Validate state token
    const stateData = ssoService.validateState(state);
    if (!stateData) {
      return reply.redirect(`${frontendUrl}/login?sso_error=invalid_state`);
    }
    
    try {
      // Complete SSO flow
      const ssoSession = await ssoService.completeSSOFlow(
        stateData.provider,
        code,
        stateData.redirectUri
      );
      
      if (!ssoSession) {
        return reply.redirect(`${frontendUrl}/login?sso_error=token_exchange_failed`);
      }
      
      // Find or create user
      let user = await findOrCreateUserFromSSO(ssoSession);
      
      // Generate app JWT
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        ssoProvider: stateData.provider,
      });
      
      // Get redirect destination from cookie
      const ssoRedirect = request.cookies?.sso_redirect || '/';
      reply.clearCookie('sso_redirect');
      
      // Redirect to frontend with token
      return reply.redirect(`${frontendUrl}/sso-callback?token=${token}&redirect=${encodeURIComponent(ssoRedirect)}`);
      
    } catch (err) {
      console.error('SSO callback error:', err);
      return reply.redirect(`${frontendUrl}/login?sso_error=authentication_failed`);
    }
  });

  // Link SSO account to existing user
  fastify.post('/sso/link/:provider', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { provider } = request.params as { provider: string };
    const { id: userId } = (request as any).user;
    
    // Build redirect URI
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const redirectUri = `${baseUrl}/api/auth/sso/link-callback`;
    
    // Generate authorization URL
    const authUrl = ssoService.generateAuthorizationUrl(provider, redirectUri);
    
    if (!authUrl) {
      return reply.status(400).send({ error: 'Unknown SSO provider' });
    }
    
    // Store user ID for linking
    reply.setCookie('sso_link_user', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
    
    return { authUrl };
  });

  // SSO link callback
  fastify.get('/sso/link-callback', async (request, reply) => {
    const { code, state, error } = request.query as {
      code?: string;
      state?: string;
      error?: string;
    };
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const userId = request.cookies?.sso_link_user;
    
    reply.clearCookie('sso_link_user');
    
    if (error || !code || !state || !userId) {
      return reply.redirect(`${frontendUrl}/settings?sso_link=failed`);
    }
    
    const stateData = ssoService.validateState(state);
    if (!stateData) {
      return reply.redirect(`${frontendUrl}/settings?sso_link=invalid_state`);
    }
    
    try {
      const ssoSession = await ssoService.completeSSOFlow(
        stateData.provider,
        code,
        stateData.redirectUri
      );
      
      if (!ssoSession) {
        return reply.redirect(`${frontendUrl}/settings?sso_link=token_failed`);
      }
      
      // Check if this SSO identity is already linked to another user
      const existingLink = await prisma.user.findFirst({
        where: {
          ssoProvider: stateData.provider,
          ssoExternalId: ssoSession.userInfo.id,
          NOT: { id: userId },
        },
      });
      
      if (existingLink) {
        return reply.redirect(`${frontendUrl}/settings?sso_link=already_linked`);
      }
      
      // Link SSO to user
      await prisma.user.update({
        where: { id: userId },
        data: {
          ssoProvider: stateData.provider,
          ssoExternalId: ssoSession.userInfo.id,
          lastSsoLogin: new Date(),
        },
      });
      
      return reply.redirect(`${frontendUrl}/settings?sso_link=success`);
      
    } catch (err) {
      console.error('SSO link error:', err);
      return reply.redirect(`${frontendUrl}/settings?sso_link=failed`);
    }
  });

  // Unlink SSO from account
  fastify.delete('/sso/unlink', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { id: userId } = (request as any).user;
    
    // Check if user has a password (required to unlink SSO)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, ssoProvider: true },
    });
    
    if (!user?.ssoProvider) {
      return reply.status(400).send({ error: 'No SSO account linked' });
    }
    
    if (!user.passwordHash) {
      return reply.status(400).send({ 
        error: 'Cannot unlink SSO without a password. Please set a password first.' 
      });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        ssoProvider: null,
        ssoExternalId: null,
      },
    });
    
    return { success: true, message: 'SSO account unlinked' };
  });

  // Helper function to find or create user from SSO
  async function findOrCreateUserFromSSO(session: SSOSession) {
    const { userInfo, provider } = session;
    
    // First, try to find by SSO external ID
    let user = await prisma.user.findFirst({
      where: {
        ssoProvider: provider,
        ssoExternalId: userInfo.id,
      },
    });
    
    if (user) {
      // Update last SSO login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSsoLogin: new Date() },
      });
      return user;
    }
    
    // Try to find by email
    user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });
    
    if (user) {
      // Link SSO to existing user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ssoProvider: provider,
          ssoExternalId: userInfo.id,
          lastSsoLogin: new Date(),
          // Update name if not set
          firstName: user.firstName || userInfo.firstName || userInfo.name?.split(' ')[0],
          lastName: user.lastName || userInfo.lastName || userInfo.name?.split(' ').slice(1).join(' '),
          avatarUrl: user.avatarUrl || userInfo.picture,
        },
      });
      return user;
    }
    
    // Create new user from SSO
    const [firstName, ...lastNameParts] = (userInfo.name || userInfo.email.split('@')[0]).split(' ');
    const lastName = lastNameParts.join(' ') || userInfo.lastName || '';
    
    user = await prisma.user.create({
      data: {
        email: userInfo.email,
        firstName: userInfo.firstName || firstName,
        lastName: userInfo.lastName || lastName,
        avatarUrl: userInfo.picture,
        passwordHash: '', // SSO users don't need password
        ssoProvider: provider,
        ssoExternalId: userInfo.id,
        lastSsoLogin: new Date(),
        companyId: 'exoin-africa-001', // Default company
        role: 'STAFF', // Default role for SSO users
      },
    });
    
    return user;
  }

  // ==========================================
  // TRADITIONAL AUTH ENDPOINTS
  // ==========================================

  // Register
  fastify.post('/register', async (request, reply) => {
    const { email, password, firstName, lastName, companyId } = request.body as any;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(400).send({ error: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await argon2.hash(password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        companyId: companyId || 'exoin-africa-001', // Default company
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        jobTitle: true,
      }
    });
    
    // Generate JWT
    const token = fastify.jwt.sign({ 
      id: user.id, 
      email: user.email,
      role: user.role 
    });
    
    return { user, token };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;
    
    // Find user
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          }
        }
      }
    });
    
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = fastify.jwt.sign({ 
      id: user.id, 
      email: user.email,
      role: user.role,
      companyId: user.companyId 
    });
    
    return { 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        jobTitle: user.jobTitle,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        company: user.company,
        linkedinUrl: user.linkedinUrl,
        twitterUrl: user.twitterUrl,
        instagramUrl: user.instagramUrl,
        location: user.location,
        officeAddress: user.officeAddress,
        signatureStyle: user.signatureStyle,
      }, 
      token 
    };
  });

  // Get current user (protected)
  fastify.get('/me', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = (request as any).user;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        company: true
      }
    });
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      jobTitle: user.jobTitle,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      company: user.company,
      linkedinUrl: user.linkedinUrl,
      twitterUrl: user.twitterUrl,
      instagramUrl: user.instagramUrl,
      location: user.location,
      officeAddress: user.officeAddress,
      signatureStyle: user.signatureStyle,
    };
  });
}
