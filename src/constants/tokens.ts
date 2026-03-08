/**
 * TrackiFi Design System Tokens
 *
 * Single source of truth for typography, colors, spacing, and radii.
 * Backend API docs reference: docs/api/09-data-models.md
 */

import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const Typography = {
  display: { fontSize: 32, fontWeight: "700" as const, lineHeight: 40 },
  headline: { fontSize: 24, fontWeight: "600" as const, lineHeight: 32 },
  title: { fontSize: 20, fontWeight: "600" as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: "600" as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
} as const;

export type TypographyVariant = keyof typeof Typography;

// ---------------------------------------------------------------------------
// Font families (platform-specific)
// ---------------------------------------------------------------------------

export const FontFamilies = Platform.select({
  ios: {
    sans: "System",
    mono: "Menlo",
  },
  android: {
    sans: "Roboto",
    mono: "monospace",
  },
  default: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "monospace",
  },
})!;

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const sharedColors = {
  // Financial / semantic — consistent across both themes
  income: "#22C55E",
  gain: "#22C55E",
  expense: "#EF4444",
  loss: "#EF4444",
  transfer: "#3B82F6",
  savings: "#8B5CF6",
  warning: "#F59E0B",

  // Accent
  accent: "#6366F1",
  accentLight: "#818CF8",

  // Utility
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

export const DarkColors = {
  ...sharedColors,
  background: "#0D0D0F",
  surface: "#1A1A1E",
  surfaceElevated: "#242428",
  border: "#2A2A2E",
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textTertiary: "#6B7280",
} as const;

export const LightColors = {
  ...sharedColors,
  background: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceElevated: "#F3F4F6",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
} as const;

export type ThemeColors = typeof DarkColors | typeof LightColors;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export type SpacingToken = keyof typeof Spacing;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof Radius;

// ---------------------------------------------------------------------------
// Shadows (platform-adaptive)
// ---------------------------------------------------------------------------

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    default: {},
  })!,
  md: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: { elevation: 4 },
    default: {},
  })!,
  lg: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: { elevation: 8 },
    default: {},
  })!,
} as const;

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
