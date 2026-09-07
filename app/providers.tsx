"use client";

import { SessionProvider } from "next-auth/react";
import AppearanceSync from "./AppearanceSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppearanceSync />
      {children}
    </SessionProvider>
  );
}
