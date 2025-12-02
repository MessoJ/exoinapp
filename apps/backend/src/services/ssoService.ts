/**
 * SSO Service - OAuth2/OIDC Authentication Service
 * 
 * Supports multiple identity providers:
 * - Google (OAuth2)
 * - Microsoft 365 (OAuth2/OIDC)
 * - Keycloak (OIDC)
 * - Generic OIDC providers
 * 
 * Features:
 * - Token exchange and validation
 * - User auto-provisioning from SSO
 * - Linked identity management
 * - Session management with SSO tokens
 */

import crypto from 'crypto';

interface SSOProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'oidc';
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  jwksUri?: string;
  issuer?: string;
}

interface SSOUserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
  raw: Record<string, any>;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

interface SSOSession {
  provider: string;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: Date;
  userInfo: SSOUserInfo;
}

class SSOService {
  private providers: Map<string, SSOProvider> = new Map();
  private stateStore: Map<string, { provider: string; redirectUri: string; timestamp: number }> = new Map();
  private readonly STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.loadProvidersFromEnv();
    this.cleanupExpiredStates();
  }

  /**
   * Load SSO providers from environment variables
   */
  private loadProvidersFromEnv(): void {
    // Google OAuth2
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.registerProvider({
        id: 'google',
        name: 'Google',
        type: 'oauth2',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['openid', 'email', 'profile'],
      });
      console.log('✅ Google SSO provider configured');
    }

    // Microsoft 365 OAuth2
    const msClientId = process.env.MICROSOFT_CLIENT_ID;
    const msClientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const msTenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    
    if (msClientId && msClientSecret) {
      this.registerProvider({
        id: 'microsoft',
        name: 'Microsoft 365',
        type: 'oidc',
        clientId: msClientId,
        clientSecret: msClientSecret,
        authorizationUrl: `https://login.microsoftonline.com/${msTenantId}/oauth2/v2.0/authorize`,
        tokenUrl: `https://login.microsoftonline.com/${msTenantId}/oauth2/v2.0/token`,
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scopes: ['openid', 'email', 'profile', 'User.Read', 'Mail.Read'],
        jwksUri: `https://login.microsoftonline.com/${msTenantId}/discovery/v2.0/keys`,
        issuer: `https://login.microsoftonline.com/${msTenantId}/v2.0`,
      });
      console.log('✅ Microsoft 365 SSO provider configured');
    }

    // Keycloak OIDC
    const kcHost = process.env.KEYCLOAK_HOST;
    const kcRealm = process.env.KEYCLOAK_REALM;
    const kcClientId = process.env.KEYCLOAK_CLIENT_ID;
    const kcClientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
    
    if (kcHost && kcRealm && kcClientId && kcClientSecret) {
      const baseUrl = `${kcHost}/realms/${kcRealm}`;
      this.registerProvider({
        id: 'keycloak',
        name: 'Enterprise SSO',
        type: 'oidc',
        clientId: kcClientId,
        clientSecret: kcClientSecret,
        authorizationUrl: `${baseUrl}/protocol/openid-connect/auth`,
        tokenUrl: `${baseUrl}/protocol/openid-connect/token`,
        userInfoUrl: `${baseUrl}/protocol/openid-connect/userinfo`,
        scopes: ['openid', 'email', 'profile'],
        jwksUri: `${baseUrl}/protocol/openid-connect/certs`,
        issuer: baseUrl,
      });
      console.log('✅ Keycloak SSO provider configured');
    }

    // Generic OIDC Provider
    if (process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET) {
      const issuer = process.env.OIDC_ISSUER;
      this.registerProvider({
        id: 'oidc',
        name: process.env.OIDC_NAME || 'SSO Login',
        type: 'oidc',
        clientId: process.env.OIDC_CLIENT_ID,
        clientSecret: process.env.OIDC_CLIENT_SECRET,
        authorizationUrl: `${issuer}/authorize`,
        tokenUrl: `${issuer}/token`,
        userInfoUrl: `${issuer}/userinfo`,
        scopes: (process.env.OIDC_SCOPES || 'openid email profile').split(' '),
        jwksUri: `${issuer}/.well-known/jwks.json`,
        issuer,
      });
      console.log('✅ Generic OIDC provider configured');
    }
  }

  /**
   * Register a new SSO provider
   */
  registerProvider(provider: SSOProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Get available providers (public info only)
   */
  getAvailableProviders(): Array<{ id: string; name: string; type: string }> {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
    }));
  }

  /**
   * Check if any SSO providers are configured
   */
  hasProviders(): boolean {
    return this.providers.size > 0;
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): SSOProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Generate authorization URL for a provider
   */
  generateAuthorizationUrl(providerId: string, redirectUri: string): string | null {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      provider: providerId,
      redirectUri,
      timestamp: Date.now(),
    });

    const params = new URLSearchParams({
      client_id: provider.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: provider.scopes.join(' '),
      state,
      access_type: 'offline', // For refresh tokens (Google)
      prompt: 'consent', // Force consent to get refresh token
    });

    return `${provider.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Validate state token
   */
  validateState(state: string): { provider: string; redirectUri: string } | null {
    const stateData = this.stateStore.get(state);
    if (!stateData) return null;

    // Check if expired
    if (Date.now() - stateData.timestamp > this.STATE_EXPIRY) {
      this.stateStore.delete(state);
      return null;
    }

    this.stateStore.delete(state);
    return stateData;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    providerId: string,
    code: string,
    redirectUri: string
  ): Promise<TokenResponse | null> {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
    });

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Token exchange failed for ${providerId}:`, errorText);
        return null;
      }

      return await response.json() as TokenResponse;
    } catch (error) {
      console.error(`Token exchange error for ${providerId}:`, error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    providerId: string,
    refreshToken: string
  ): Promise<TokenResponse | null> {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
    });

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json() as TokenResponse;
    } catch (error) {
      console.error(`Token refresh error for ${providerId}:`, error);
      return null;
    }
  }

  /**
   * Get user info from provider
   */
  async getUserInfo(providerId: string, accessToken: string): Promise<SSOUserInfo | null> {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    try {
      const response = await fetch(provider.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error(`User info fetch failed for ${providerId}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      // Normalize user info based on provider
      return this.normalizeUserInfo(providerId, data);
    } catch (error) {
      console.error(`User info error for ${providerId}:`, error);
      return null;
    }
  }

  /**
   * Normalize user info across different providers
   */
  private normalizeUserInfo(providerId: string, data: Record<string, any>): SSOUserInfo {
    switch (providerId) {
      case 'google':
        return {
          id: data.id,
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          name: data.name,
          picture: data.picture,
          emailVerified: data.verified_email,
          raw: data,
        };

      case 'microsoft':
        return {
          id: data.id,
          email: data.mail || data.userPrincipalName,
          firstName: data.givenName,
          lastName: data.surname,
          name: data.displayName,
          picture: undefined, // MS Graph requires separate call for photo
          emailVerified: true, // M365 accounts are verified
          raw: data,
        };

      case 'keycloak':
      case 'oidc':
      default:
        return {
          id: data.sub || data.id,
          email: data.email,
          firstName: data.given_name || data.firstName,
          lastName: data.family_name || data.lastName,
          name: data.name || data.preferred_username,
          picture: data.picture,
          emailVerified: data.email_verified,
          raw: data,
        };
    }
  }

  /**
   * Complete SSO flow - exchange code and get user info
   */
  async completeSSOFlow(
    providerId: string,
    code: string,
    redirectUri: string
  ): Promise<SSOSession | null> {
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(providerId, code, redirectUri);
    if (!tokens) return null;

    // Get user info
    const userInfo = await this.getUserInfo(providerId, tokens.access_token);
    if (!userInfo) return null;

    return {
      provider: providerId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresAt: tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : undefined,
      userInfo,
    };
  }

  /**
   * Cleanup expired state tokens
   */
  private cleanupExpiredStates(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [state, data] of this.stateStore.entries()) {
        if (now - data.timestamp > this.STATE_EXPIRY) {
          this.stateStore.delete(state);
        }
      }
    }, 60000); // Clean every minute
  }
}

// Export singleton
export const ssoService = new SSOService();

// Export types
export type { SSOProvider, SSOUserInfo, TokenResponse, SSOSession };
