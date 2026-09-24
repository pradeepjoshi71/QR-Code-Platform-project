// ---------------------------------------------------------------------------
// Vercel Domains API Wrapper (QR-P10.1)
// Lazy-initialization pattern matching Resend & Stripe — zero eager evaluation
// at module scope so `next build` passes seamlessly even if VERCEL_API_TOKEN
// is unset during build time.
// ---------------------------------------------------------------------------

interface VercelConfig {
  token: string;
  projectId: string;
  teamId?: string;
}

export interface DomainStatusResult {
  domain: string;
  verified: boolean;
  vercelConfigured: boolean;
}

export function getVercelConfig(): VercelConfig {
  const token = process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('VERCEL_API_TOKEN is not configured. Add it to .env.local.');
  }

  const projectId = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME;
  if (!projectId) {
    throw new Error('VERCEL_PROJECT_ID is not configured. Add it to .env.local.');
  }

  return {
    token,
    projectId,
    teamId: process.env.VERCEL_TEAM_ID,
  };
}

function getBaseHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function getTeamParam(teamId?: string): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
}

/**
 * Adds a custom domain to the Vercel project via Vercel REST API.
 * POST https://api.vercel.com/v9/projects/{projectId}/domains
 */
export async function addDomainToProject(domain: string): Promise<DomainStatusResult> {
  const { token, projectId, teamId } = getVercelConfig();
  const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains${getTeamParam(teamId)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: getBaseHeaders(token),
    body: JSON.stringify({ name: domain }),
  });

  const data = (await res.json()) as {
    name?: string;
    verified?: boolean;
    error?: { code?: string; message?: string };
  };

  if (!res.ok) {
    // If the domain is already assigned to this project, fetch its status rather than failing
    if (data.error?.code === 'domain_already_in_use' || data.error?.code === 'domain_already_exists') {
      return getDomainStatus(domain);
    }
    throw new Error(data.error?.message || `Failed to add domain to Vercel (HTTP ${res.status}).`);
  }

  // Check initial configuration status
  let vercelConfigured = false;
  try {
    const status = await getDomainStatus(domain);
    vercelConfigured = status.vercelConfigured;
  } catch {
    // Non-fatal if config check immediately after addition is not yet ready
  }

  return {
    domain,
    verified: Boolean(data.verified),
    vercelConfigured,
  };
}

/**
 * Retrieves the verification and DNS configuration status of a domain.
 * Combines project domain details and Vercel domain config endpoint.
 */
export async function getDomainStatus(domain: string): Promise<DomainStatusResult> {
  const { token, projectId, teamId } = getVercelConfig();
  const teamParam = getTeamParam(teamId);

  // 1. Fetch domain record from project
  const projectDomainUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}${teamParam}`;
  const projectDomainRes = await fetch(projectDomainUrl, {
    headers: getBaseHeaders(token),
  });

  if (!projectDomainRes.ok) {
    const errorData = (await projectDomainRes.json()) as { error?: { message?: string } };
    throw new Error(errorData.error?.message || `Failed to fetch domain status (HTTP ${projectDomainRes.status}).`);
  }

  const domainData = (await projectDomainRes.json()) as { verified?: boolean };

  // 2. Fetch DNS configuration status (misconfigured flag)
  let vercelConfigured = false;
  const configUrl = `https://api.vercel.com/v6/domains/${encodeURIComponent(domain)}/config${teamParam}`;
  const configRes = await fetch(configUrl, {
    headers: getBaseHeaders(token),
  });

  if (configRes.ok) {
    const configData = (await configRes.json()) as { misconfigured?: boolean };
    vercelConfigured = !configData.misconfigured;
  }

  return {
    domain,
    verified: Boolean(domainData.verified),
    vercelConfigured,
  };
}

/**
 * Removes a custom domain from the Vercel project via Vercel REST API.
 * DELETE https://api.vercel.com/v9/projects/{projectId}/domains/{domain}
 */
export async function removeDomainFromProject(domain: string): Promise<{ success: boolean }> {
  const { token, projectId, teamId } = getVercelConfig();
  const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}${getTeamParam(teamId)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: getBaseHeaders(token),
  });

  if (!res.ok && res.status !== 404) {
    const errorData = (await res.json()) as { error?: { message?: string } };
    throw new Error(errorData.error?.message || `Failed to remove domain from Vercel (HTTP ${res.status}).`);
  }

  return { success: true };
}
