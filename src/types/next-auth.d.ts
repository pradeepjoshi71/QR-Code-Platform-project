import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      activeOrgId?: string;
      activeOrgName?: string;
      activeOrgRole?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    activeOrgId?: string;
    activeOrgName?: string;
    activeOrgRole?: string;
  }
}
