declare module '@workos-inc/node' {
  export interface WorkOSOptions {
    clientId?: string;
  }

  export interface WorkOSOrganization {
    id: string;
    name: string;
    allowProfilesOutsideOrganization?: boolean;
    domains?: Array<{ id: string; domain: string; state: string }>;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface GeneratePortalLinkOptions {
    organization: string;
    intent: 'sso' | 'dsync' | 'audit_logs' | 'log_streams';
    returnUrl?: string;
  }

  export interface GetAuthorizationUrlOptions {
    clientId?: string;
    redirectUri: string;
    domain?: string;
    connection?: string;
    organization?: string;
    state?: string;
    provider?: string;
  }

  export interface Profile {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    organizationId?: string | null;
    connectionId?: string;
    connectionType?: string;
    idpId?: string;
    rawAttributes?: Record<string, unknown>;
  }

  export interface ProfileAndTokenResponse {
    profile: Profile;
    token?: string;
  }

  export class WorkOS {
    constructor(apiKey: string, options?: WorkOSOptions);

    readonly portal: {
      generateLink(options: GeneratePortalLinkOptions): Promise<{ link: string }>;
    };

    readonly sso: {
      getAuthorizationUrl(options: GetAuthorizationUrlOptions): Promise<string>;
      getProfileAndToken(options: { code: string; clientId?: string }): Promise<ProfileAndTokenResponse>;
    };

    readonly organizations: {
      createOrganization(options: { name: string; domains?: string[] }): Promise<WorkOSOrganization>;
      getOrganization(id: string): Promise<WorkOSOrganization>;
    };
  }
}
