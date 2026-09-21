import { useState, useEffect } from "react";

export type WebsiteThemePreference = "system" | "light" | "dark";

export function useWebsiteTheme(initialProp?: WebsiteThemePreference) {
  const [themePreference, setThemePreference] = useState<WebsiteThemePreference>(() => {
    try {
      const saved = localStorage.getItem("website-theme-preference") as WebsiteThemePreference | null;
      if (saved && (saved === "system" || saved === "light" || saved === "dark")) {
        return saved;
      }
    } catch {}
    return initialProp || "system";
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // If initialProp changes from dashboard
  useEffect(() => {
    if (initialProp) {
      const saved = localStorage.getItem("website-theme-preference");
      if (!saved) {
        setThemePreference(initialProp);
      }
    }
  }, [initialProp]);

  const isDark = themePreference === "system" ? systemIsDark : themePreference === "dark";

  const setAndSavePreference = (pref: WebsiteThemePreference) => {
    setThemePreference(pref);
    try {
      localStorage.setItem("website-theme-preference", pref);
    } catch {}
  };

  const cycleTheme = () => {
    if (themePreference === "system") {
      setAndSavePreference("light");
    } else if (themePreference === "light") {
      setAndSavePreference("dark");
    } else {
      setAndSavePreference("system");
    }
  };

  return {
    themePreference,
    setThemePreference: setAndSavePreference,
    cycleTheme,
    isDark,
    resolvedTheme: (isDark ? "dark" : "light") as "dark" | "light",
  };
}
