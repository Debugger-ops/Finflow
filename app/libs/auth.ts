// app/libs/auth.ts
// Single source of truth for NextAuth (v4) options. Both the [...nextauth]
// route and getServerSession() import from here so config can't drift.
import { AuthOptions, Session, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "./mongoConnect";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { env } from "./env";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        if (!credentials?.email || !credentials.password) return null;

        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || "",
        } as NextAuthUser;
      },
    }),
  ],

  session: { strategy: "jwt", maxAge: 60 * 60 * 24 }, // 1 day
  secret: env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.name = user.name;
        token.email = user.email;
        token.image = (user as any).image;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: Record<string, any> }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        (session.user as any).image = token.image;
      }
      return session;
    },
  },
};
