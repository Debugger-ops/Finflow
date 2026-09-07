// app/libs/appearance.ts
// Applies the user's Appearance settings to the live UI by setting data-*
// attributes on <html>. The CSS in app/styles/theme.css reacts to these.
// Cached in localStorage so the choice survives reloads and applies instantly
// (the inline script in layout.tsx reads the same key to avoid a flash).

export type Appearance = {
  darkMode: boolean;
  compactView: boolean;
  fontSize: "small" | "medium" | "large" | "xlarge";
  language: string;
  theme: "default" | "blue" | "green" | "purple";
};

export const APPEARANCE_KEY = "finflow:appearance";

export const DEFAULT_APPEARANCE: Appearance = {
  darkMode: true,
  compactView: false,
  fontSize: "medium",
  language: "en",
  theme: "default",
};

// Accept a loose shape so callers holding generically-typed settings state
// (fontSize/theme as plain string) can pass it without casting.
export type AppearanceInput = {
  darkMode?: boolean;
  compactView?: boolean;
  fontSize?: string;
  language?: string;
  theme?: string;
};

/** Set the data-* attributes on <html> that drive the appearance CSS. */
export function applyAppearance(a: AppearanceInput): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  const darkMode = a.darkMode ?? DEFAULT_APPEARANCE.darkMode;
  const theme = a.theme ?? DEFAULT_APPEARANCE.theme;
  const fontSize = a.fontSize ?? DEFAULT_APPEARANCE.fontSize;
  const compactView = a.compactView ?? DEFAULT_APPEARANCE.compactView;
  const language = a.language ?? DEFAULT_APPEARANCE.language;

  el.setAttribute("data-mode", darkMode ? "dark" : "light");
  el.setAttribute("data-theme", theme);
  el.setAttribute("data-font-size", fontSize);
  el.setAttribute("data-density", compactView ? "compact" : "comfortable");
  if (language) el.setAttribute("lang", language);
  try {
    localStorage.setItem(
      APPEARANCE_KEY,
      JSON.stringify({ darkMode, compactView, fontSize, language, theme }),
    );
  } catch {
    /* storage unavailable — attributes are still applied for this session */
  }
}

/** Read the cached appearance (used for instant, flash-free application). */
export function readCachedAppearance(): Appearance | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    return raw ? { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}
