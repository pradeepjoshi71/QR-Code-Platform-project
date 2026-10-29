import { WorkOS, GeneratePortalLinkIntent } from '@workos-inc/node';

// ---------------------------------------------------------------------------
// WorkOS Lazy Singleton Client (QR-P11.1 Enterprise SSO)
// Initialized dynamically on-demand inside request handlers.
// Zero module-scope evaluation guarantees `next build` passes seamlessly
// even when WORKOS_API_KEY is unset in the build environment.
// ---------------------------------------------------------------------------

let _workos: WorkOS | null = null;

export function getWorkOS(): WorkOS {
  if (!_workos) {
    const apiKey = process.env.WORKOS_API_KEY;
    if (!apiKey) {
      throw new Error(
        'WORKOS_API_KEY is not configured in environment. Please add it to .env.local.'
      );
    }
    const clientId = process.env.WORKOS_CLIENT_ID;
    _workos = new WorkOS(apiKey, { clientId });
  }
  return _workos;
}

export function getWorkOSRedirectUri(): string {
  if (process.env.WORKOS_REDIRECT_URI) {
    return process.env.WORKOS_REDIRECT_URI;
  }
  const baseUrl =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';

  return `${baseUrl.replace(/\/$/, '')}/api/auth/sso/callback`;
}

/**
 * Generates a WorkOS Admin Portal session link for the given WorkOS organization ID.
 * The Admin Portal allows tenant IT admins to configure SAML 2.0 or OIDC.
 */
export async function getAdminPortalLink(workosOrganizationId: string): Promise<string> {
  const workos = getWorkOS();
  const { link } = await workos.portal.generateLink({
    organization: workosOrganizationId,
    intent: GeneratePortalLinkIntent.SSO,
  });
  return link;
}

/**
 * Initiates the WorkOS SSO flow by extracting the domain from the user's email
 * and generating the authorization URL where the user will be redirected to their IdP.
 */
export async function getAuthorizationUrl(email: string): Promise<string> {
  const workos = getWorkOS();
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!clientId) {
    throw new Error('WORKOS_CLIENT_ID is not configured in environment.');
  }

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[1]) {
    throw new Error('A valid email address with a domain is required for SSO.');
  }
  const domain = parts[1];

  const redirectUri = getWorkOSRedirectUri();

  return await workos.sso.getAuthorizationUrl({
    clientId,
    redirectUri,
    domain,
  });
}

/**
 * Exchanges an incoming authorization code for the authenticated user's SSO profile.
 * Returns { email, firstName, lastName, workosOrgId }.
 */
export async function handleSsoCallback(code: string): Promise<{
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  workosOrgId: string | null;
}> {
  const workos = getWorkOS();
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!clientId) {
    throw new Error('WORKOS_CLIENT_ID is not configured in environment.');
  }

  const { profile } = await workos.sso.getProfileAndToken({
    code,
    clientId,
  });

  return {
    email: profile.email.toLowerCase().trim(),
    firstName: profile.firstName ?? null,
    lastName: profile.lastName ?? null,
    workosOrgId: profile.organizationId ?? null,
  };
}
