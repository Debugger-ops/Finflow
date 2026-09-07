import type { Metadata, Viewport } from "next";
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

// viewportFit: "cover" is what makes env(safe-area-inset-*) resolve on iOS, so
// the fixed mobile tab bar clears the home indicator. maximumScale is left
// unset deliberately — blocking pinch-zoom is an accessibility failure.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#060912" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6fc" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Apply saved appearance before first paint to avoid a flash of the wrong theme.
  const noFlash = `(function(){try{var d=document.documentElement;var a=JSON.parse(localStorage.getItem('finflow:appearance')||'{}');d.setAttribute('data-mode',a.darkMode===false?'light':'dark');d.setAttribute('data-theme',a.theme||'default');d.setAttribute('data-font-size',a.fontSize||'medium');d.setAttribute('data-density',a.compactView?'compact':'comfortable');if(a.language)d.setAttribute('lang',a.language);}catch(e){}})();`;

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable}`}
      data-mode="dark"
      data-theme="default"
      data-font-size="medium"
      data-density="comfortable"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
