"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { saveTheme } from "@/app/actions";
import { parseTheme, THEME_COLOR_DARK, THEME_COLOR_LIGHT, type Theme } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  /** Applies instantly, then persists the cookie through a server action. */
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

// <html data-theme> is the single source of truth (set before paint by the boot script).
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getSnapshot = (): Theme => parseTheme(document.documentElement.dataset.theme);
// The static shell is always rendered as "system"; the client corrects it right after hydration.
const getServerSnapshot = (): Theme => "system";

type ThemeProviderProps = {
  /** Optional persistence override (the dev preview must not write cookies through the real action). */
  persist?: (theme: Theme) => Promise<void>;
  children: React.ReactNode;
};

export function ThemeProvider({ persist = saveTheme, children }: ThemeProviderProps) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback(
    (next: Theme) => {
      // Instant: flip the attribute first; the cookie follows.
      document.documentElement.dataset.theme = next;
      void persist(next).catch(() => {
        // The choice still applies for this session; it just wasn't saved.
      });
    },
    [persist],
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {/* React hoists <meta> into <head> and keeps it in sync with the theme. */}
      {theme === "system" ? (
        <>
          <meta name="theme-color" media="(prefers-color-scheme: light)" content={THEME_COLOR_LIGHT} />
          <meta name="theme-color" media="(prefers-color-scheme: dark)" content={THEME_COLOR_DARK} />
        </>
      ) : (
        <meta name="theme-color" content={theme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT} />
      )}
      {children}
    </ThemeContext.Provider>
  );
}
