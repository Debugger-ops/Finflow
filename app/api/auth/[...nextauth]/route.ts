import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "../../../libs/mongoConnect"; 
import User from "../../../models/User";                
import bcrypt from "bcryptjs";

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

        // Find user in MongoDB
        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;

        // Compare hashed password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // Return user object — must include id
        // We ensure all custom fields are strings/dates for the token
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          bio: user.bio || "",
          image: user.image || "",
          createdAt: user.createdAt?.toISOString(),
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 day
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Casting to 'any' allows us to persist custom fields like bio and createdAt
        // without TypeScript blocking the production build.
        const u = user as any;
        token.id = u.id;
        token.name = u.name;
        token.email = u.email;
        token.bio = u.bio;
        token.image = u.image;
        token.createdAt = u.createdAt;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        // Casting both to 'any' ensures the session object matches the token data
        const t = token as any;
        const s = session as any;
        
        s.user.id = t.id;
        s.user.name = t.name;
        s.user.email = t.email;
        s.user.bio = t.bio;
        s.user.image = t.image;
        s.user.createdAt = t.createdAt;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
