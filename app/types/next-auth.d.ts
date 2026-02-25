import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;           // your DB _id
      name?: string | null;
      email?: string | null;
      bio?: string | null;
      image?: string | null;
      createdAt?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string;
    email?: string;
    bio?: string;
    image?: string;
    createdAt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string;
    email?: string;
    bio?: string;
    image?: string;
    createdAt?: string;
  }
}
