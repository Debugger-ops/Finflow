"use client";

// Applies the user's saved Appearance settings on every page load:
// 1. instantly from the localStorage cache (no flash), then
// 2. refreshed from the server so it follows the account across devices.
import { useEffect } from "react";
import { applyAppearance, readCachedAppearance } from "./libs/appearance";

export default function AppearanceSync() {
  useEffect(() => {
    const cached = readCachedAppearance();
    if (cached) applyAppearance(cached);

    let cancelled = false;
    fetch("/api/profile/appearance")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.success && data.data) applyAppearance(data.data);
      })
      .catch(() => {
        /* not signed in or offline — cached/default appearance stays */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
