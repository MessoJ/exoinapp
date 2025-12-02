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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const argon2 = __importStar(require("argon2"));
const index_1 = require("../index");
const ssoService_1 = require("../services/ssoService");
async function authRoutes(fastify) {
    // ==========================================
    // SSO / OAuth2 ENDPOINTS
    // ==========================================
    // Get available SSO providers
    fastify.get('/sso/providers', async (request, reply) => {
        const providers = ssoService_1.ssoService.getAvailableProviders();
        return {
            ssoEnabled: ssoService_1.ssoService.hasProviders(),
            providers,
        };
    });
    // Initiate SSO login flow
    fastify.get('/sso/login/:provider', async (request, reply) => {
        const { provider } = request.params;
        const { redirect } = request.query;
        // Build redirect URI for callback
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        const redirectUri = `${baseUrl}/api/auth/sso/callback`;
        // Generate authorization URL
        const authUrl = ssoService_1.ssoService.generateAuthorizationUrl(provider, redirectUri);
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
        const { code, state, error, error_description } = request.query;
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
        const stateData = ssoService_1.ssoService.validateState(state);
        if (!stateData) {
            return reply.redirect(`${frontendUrl}/login?sso_error=invalid_state`);
        }
        try {
            // Complete SSO flow
            const ssoSession = await ssoService_1.ssoService.completeSSOFlow(stateData.provider, code, stateData.redirectUri);
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
        }
        catch (err) {
            console.error('SSO callback error:', err);
            return reply.redirect(`${frontendUrl}/login?sso_error=authentication_failed`);
        }
    });
    // Link SSO account to existing user
    fastify.post('/sso/link/:provider', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { provider } = request.params;
        const { id: userId } = request.user;
        // Build redirect URI
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        const redirectUri = `${baseUrl}/api/auth/sso/link-callback`;
        // Generate authorization URL
        const authUrl = ssoService_1.ssoService.generateAuthorizationUrl(provider, redirectUri);
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
        const { code, state, error } = request.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const userId = request.cookies?.sso_link_user;
        reply.clearCookie('sso_link_user');
        if (error || !code || !state || !userId) {
            return reply.redirect(`${frontendUrl}/settings?sso_link=failed`);
        }
        const stateData = ssoService_1.ssoService.validateState(state);
        if (!stateData) {
            return reply.redirect(`${frontendUrl}/settings?sso_link=invalid_state`);
        }
        try {
            const ssoSession = await ssoService_1.ssoService.completeSSOFlow(stateData.provider, code, stateData.redirectUri);
            if (!ssoSession) {
                return reply.redirect(`${frontendUrl}/settings?sso_link=token_failed`);
            }
            // Check if this SSO identity is already linked to another user
            const existingLink = await index_1.prisma.user.findFirst({
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
            await index_1.prisma.user.update({
                where: { id: userId },
                data: {
                    ssoProvider: stateData.provider,
                    ssoExternalId: ssoSession.userInfo.id,
                    lastSsoLogin: new Date(),
                },
            });
            return reply.redirect(`${frontendUrl}/settings?sso_link=success`);
        }
        catch (err) {
            console.error('SSO link error:', err);
            return reply.redirect(`${frontendUrl}/settings?sso_link=failed`);
        }
    });
    // Unlink SSO from account
    fastify.delete('/sso/unlink', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        // Check if user has a password (required to unlink SSO)
        const user = await index_1.prisma.user.findUnique({
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
        await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                ssoProvider: null,
                ssoExternalId: null,
            },
        });
        return { success: true, message: 'SSO account unlinked' };
    });
    // Helper function to find or create user from SSO
    async function findOrCreateUserFromSSO(session) {
        const { userInfo, provider } = session;
        // First, try to find by SSO external ID
        let user = await index_1.prisma.user.findFirst({
            where: {
                ssoProvider: provider,
                ssoExternalId: userInfo.id,
            },
        });
        if (user) {
            // Update last SSO login
            await index_1.prisma.user.update({
                where: { id: user.id },
                data: { lastSsoLogin: new Date() },
            });
            return user;
        }
        // Try to find by email
        user = await index_1.prisma.user.findUnique({
            where: { email: userInfo.email },
        });
        if (user) {
            // Link SSO to existing user
            await index_1.prisma.user.update({
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
        user = await index_1.prisma.user.create({
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
        const { email, password, firstName, lastName, companyId } = request.body;
        // Check if user exists
        const existingUser = await index_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return reply.status(400).send({ error: 'User already exists' });
        }
        // Hash password
        const passwordHash = await argon2.hash(password);
        // Create user
        const user = await index_1.prisma.user.create({
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
        const { email, password } = request.body;
        // Find user
        const user = await index_1.prisma.user.findUnique({
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
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.user;
        const user = await index_1.prisma.user.findUnique({
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
