import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import { AuthMethod, type OAuthProfile } from '../types/identity.types.js';

// ——— Provider registry ——————————————————————————————————————————————————————
// Each provider must implement: exchangeCode(code, redirectUri) → OAuthProfile
// In production: install the provider SDK and call their token + userinfo endpoints.
// These are interface stubs — swap in real implementations per-provider.

type ProviderHandler = (code: string, redirectUri: string) => Promise<OAuthProfile>;

const PROVIDERS = new Map<AuthMethod, ProviderHandler>();

// Google — production: exchange code via https://oauth2.googleapis.com/token then
// call https://www.googleapis.com/oauth2/v3/userinfo
PROVIDERS.set(AuthMethod.Google, async (_code, _redirectUri) => {
  throw new AppError('Google OAuth not configured for this environment', 503, 'OAUTH_NOT_CONFIGURED');
});

// Apple — production: verify id_token (JWT) signed by Apple's public keys
PROVIDERS.set(AuthMethod.Apple, async (_code, _redirectUri) => {
  throw new AppError('Apple Sign-In not configured for this environment', 503, 'OAUTH_NOT_CONFIGURED');
});

// Facebook — production: call https://graph.facebook.com/me?fields=id,email,name
PROVIDERS.set(AuthMethod.Facebook, async (_code, _redirectUri) => {
  throw new AppError('Facebook OAuth not configured for this environment', 503, 'OAUTH_NOT_CONFIGURED');
});

// Microsoft — production: MSAL / Azure AD
PROVIDERS.set(AuthMethod.Microsoft, async (_code, _redirectUri) => {
  throw new AppError('Microsoft OAuth not configured for this environment', 503, 'OAUTH_NOT_CONFIGURED');
});

// GitHub — production: call https://api.github.com/user
PROVIDERS.set(AuthMethod.GitHub, async (_code, _redirectUri) => {
  throw new AppError('GitHub OAuth not configured for this environment', 503, 'OAUTH_NOT_CONFIGURED');
});

// LinkedIn — production: call https://api.linkedin.com/v2/me
PROVIDERS.set(AuthMethod.LinkedIn, async (_code, _redirectUri) => {
  throw new AppError('LinkedIn OAuth not configured for this environment', 503, 'OAUTH_NOT_CONFIGURED');
});

// Enterprise SSO (SAML/OIDC) — production: use passport-saml or openid-client
PROVIDERS.set(AuthMethod.EnterpriseSAML, async (_code, _redirectUri) => {
  throw new AppError('Enterprise SAML not configured', 503, 'OAUTH_NOT_CONFIGURED');
});
PROVIDERS.set(AuthMethod.EnterpriseOIDC, async (_code, _redirectUri) => {
  throw new AppError('Enterprise OIDC not configured', 503, 'OAUTH_NOT_CONFIGURED');
});

// ——— OAuth connection lookup ——————————————————————————————————————————————
async function findExistingUser(provider: AuthMethod, providerId: string): Promise<string | null> {
  const row = await db.queryNullable(client =>
    client.from('identity_oauth')
      .select('user_id')
      .eq('provider', provider)
      .eq('provider_id', providerId)
      .single<{ user_id: string }>()
  );
  return row?.user_id ?? null;
}

async function findUserByEmail(email: string): Promise<{ id: string; role: string; identity_type: string } | null> {
  return db.queryNullable(client =>
    client.from('profiles')
      .select('id, role, identity_type')
      .eq('email', email.toLowerCase())
      .single<{ id: string; role: string; identity_type: string }>()
  );
}

async function createOAuthUser(profile: OAuthProfile): Promise<string> {
  const created = await db.query(client =>
    client.from('profiles').insert({
      email:        profile.email.toLowerCase(),
      full_name:    profile.name ?? profile.email.split('@')[0],
      role:         'customer',
      identity_type:'customer',
      status:       'active',
    }).select('id').single<{ id: string }>()
  );
  return created.id;
}

async function linkOAuth(userId: string, profile: OAuthProfile): Promise<void> {
  await db.query(client =>
    client.from('identity_oauth').upsert({
      user_id:     userId,
      provider:    profile.provider,
      provider_id: profile.id,
      email:       profile.email,
      raw_profile: profile.raw ?? {},
    }, { onConflict: 'provider,provider_id' }).select()
  );
}

export const OAuthService = {
  async authenticate(provider: AuthMethod, code: string, redirectUri: string): Promise<{
    userId:    string;
    email:     string;
    isNewUser: boolean;
  }> {
    const handler = PROVIDERS.get(provider);
    if (!handler) throw new AppError(`OAuth provider '${provider}' is not supported`, 400, 'UNSUPPORTED_PROVIDER');

    const profile  = await handler(code, redirectUri);
    let   userId   = await findExistingUser(provider, profile.id);
    let   isNewUser = false;

    if (!userId) {
      // Try linking to existing account by email
      const existing = await findUserByEmail(profile.email);
      if (existing) {
        userId = existing.id;
      } else {
        userId    = await createOAuthUser(profile);
        isNewUser = true;
      }
      await linkOAuth(userId, profile);
    }

    return { userId, email: profile.email, isNewUser };
  },

  registerProvider(method: AuthMethod, handler: ProviderHandler): void {
    PROVIDERS.set(method, handler);
  },
};
