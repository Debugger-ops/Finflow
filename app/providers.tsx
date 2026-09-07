"use client";

import { SessionProvider } from "next-auth/react";
import AppearanceSync from "./AppearanceSync";
import AppNav from "./components/AppNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppearanceSync />
      {/* One shared nav for every signed-in screen. It hides itself on the
          landing and auth pages and when there is no session. */}
      <AppNav />
      {children}
    </SessionProvider>
  );
}
