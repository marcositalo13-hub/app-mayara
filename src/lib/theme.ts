// Theme preference shared by server and client. Client-safe (no server imports).

export const THEME_COOKIE = "theme";
export const THEME_MAX_AGE_S = 60 * 60 * 24 * 365; // 1 year

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  light: "Claro",
  dark: "Escuro",
  system: "Automático",
};

export function parseTheme(value: string | undefined | null): Theme {
  return (THEMES as readonly string[]).includes(value ?? "") ? (value as Theme) : "system";
}

// Browser/status bar colors: must match --background of each theme in globals.css.
export const THEME_COLOR_LIGHT = "#FFF7F9";
export const THEME_COLOR_DARK = "#1D1418";

/**
 * Runs synchronously in <head>, before the first paint: copies the cookie into
 * <html data-theme>. (The root layout can't read cookies itself: under Cache Components
 * that would make every route block instead of serving its static shell.)
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark|system)/);document.documentElement.dataset.theme=m?m[1]:"system"}catch(e){}})();`;
