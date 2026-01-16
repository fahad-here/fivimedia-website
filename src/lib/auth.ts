import { hash } from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

// Extend next-auth types
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
