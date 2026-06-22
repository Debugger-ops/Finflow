import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "../globals.css";
import { Providers } from "./providers";

// Fonts loaded once here via next/font (self-hosted, no layout shift) instead
// of a render-blocking @import url(...Google Fonts...) repeated in every page CSS.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans-google",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display-google",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinFlow",
  description: "Personal finance, investing, and payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${syne.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
