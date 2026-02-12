import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

// Extend default Session and User types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      bio?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    bio?: string;
    image?: string;
  }
}
