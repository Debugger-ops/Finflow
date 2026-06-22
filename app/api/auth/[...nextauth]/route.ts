// app/api/auth/[...nextauth]/route.ts
// Thin route wrapper. All config lives in app/libs/auth.ts (single source).
// Re-exported here so existing imports from this path keep working.
import NextAuth from "next-auth";
import { authOptions } from "../../../libs/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
