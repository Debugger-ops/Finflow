// app/libs/auth.ts
import NextAuth, { AuthOptions, Session, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import  { connectDB } from "./mongoConnect"; // ✅ Corrected relative path
import User from "../models/User"; // ✅ Uses alias if tsconfig allows; else use "../../models/User"
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();

        const user = await User.findOne({ email: credentials?.email });
        if (!user) throw new Error("No user found with this email");

        const isValid = await bcrypt.compare(
          credentials!.password,
          user.password
        );
        if (!isValid) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        } as NextAuthUser;
      },
    }),
  ],
  session: {
    strategy: "jwt" as const, // ✅ Explicitly set as const for correct typing
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: Record<string, any>;
      user?: NextAuthUser;
    }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: Record<string, any>;
    }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
        };
      }
      return session;
    },
  },
};

// ✅ Export auth helpers
export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
