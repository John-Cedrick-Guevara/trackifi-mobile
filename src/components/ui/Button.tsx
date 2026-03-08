/**
 * Button component with variant, size, loading, and disabled states.
 */

import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from "react-native";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<
  PressableProps,
  "children" | "style"
> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Button label */
  children: string;
  /** Show loading spinner and disable interactions */
  loading?: boolean;
  /** Fully rounded pill shape */
  pill?: boolean;
  /** Additional style */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const sizeMap: Record<
  ButtonSize,
  { height: number; paddingH: number; fontSize: number }
> = {
  sm: { height: 36, paddingH: 12, fontSize: 14 },
  md: { height: 48, paddingH: 20, fontSize: 16 },
  lg: { height: 56, paddingH: 28, fontSize: 18 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Button({
  variant = "primary",
  size = "md",
  children,
  loading = false,
  disabled = false,
  pill = false,
  style,
  ...rest
}: ButtonProps) {
  const { colors, radius } = useThemeContext();
  const s = sizeMap[size];
  const isDisabled = disabled || loading;

  // Resolve colours per variant
  const bg: Record<ButtonVariant, string> = {
    primary: colors.accent,
    secondary: colors.surface,
    ghost: colors.transparent,
    destructive: colors.loss,
  };

  const textColor: Record<ButtonVariant, string> = {
    primary: colors.white,
    secondary: colors.textPrimary,
    ghost: colors.accent,
    destructive: colors.white,
  };

  const borderColor: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: colors.border,
    ghost: undefined,
    destructive: undefined,
  };

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.paddingH,
          backgroundColor: bg[variant],
          borderRadius: pill ? radius.full : radius.md,
          borderWidth: borderColor[variant] ? 1 : 0,
          borderColor: borderColor[variant],
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <Text
          variant={size === "sm" ? "caption" : "bodyBold"}
          style={{ color: textColor[variant] }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Button;
