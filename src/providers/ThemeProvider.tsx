/**
 * TrackiFi Theme Provider
 *
 * Provides dark/light theme context with system preference detection,
 * manual override, and all design tokens (colors, typography, spacing, radii).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import {
  DarkColors,
  LightColors,
  Radius,
  Shadows,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/constants/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  /** Current resolved theme (always 'light' or 'dark') */
  theme: ResolvedTheme;
  /** User preference – may be 'system' */
  mode: ThemeMode;
  /** Toggle between light ↔ dark; if currently system, goes to the opposite of resolved */
  toggleTheme: () => void;
  /** Set an explicit mode */
  setMode: (mode: ThemeMode) => void;
  /** Colour tokens for the active theme */
  colors: ThemeColors;
  /** Typography scale */
  typography: typeof Typography;
  /** Spacing tokens */
  spacing: typeof Spacing;
  /** Border-radius tokens */
  radius: typeof Radius;
  /** Platform-adaptive shadow presets */
  shadows: typeof Shadows;
  /** True when the resolved theme is dark */
  isDark: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Optional initial mode override (default: 'system') */
  initialMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  initialMode = "system",
}: ThemeProviderProps) {
  const systemScheme = useSystemColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (mode === "system") {
      return systemScheme === "dark" ? "dark" : "light";
    }
    return mode;
  }, [mode, systemScheme]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === "system") {
        return resolvedTheme === "dark" ? "light" : "dark";
      }
      return prev === "dark" ? "light" : "dark";
    });
  }, [resolvedTheme]);

  const value: ThemeContextValue = useMemo(
    () => ({
      theme: resolvedTheme,
      mode,
      toggleTheme,
      setMode,
      colors: resolvedTheme === "dark" ? DarkColors : LightColors,
      typography: Typography,
      spacing: Spacing,
      radius: Radius,
      shadows: Shadows,
      isDark: resolvedTheme === "dark",
    }),
    [resolvedTheme, mode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the current theme context including colors, typography, spacing, etc.
 * Must be rendered inside a `<ThemeProvider>`.
 */
export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within a <ThemeProvider>");
  }
  return ctx;
}
