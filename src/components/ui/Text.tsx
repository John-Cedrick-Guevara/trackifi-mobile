/**
 * Themed Text component with typography variants.
 */

import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import type { ThemeColors, TypographyVariant } from "@/constants/tokens";
import { useThemeContext } from "@/providers/ThemeProvider";

export interface TextProps extends RNTextProps {
  /** Typography variant — defaults to 'body' */
  variant?: TypographyVariant;
  /** Override the default text color with a token key */
  color?: keyof ThemeColors;
  /** Centre-align text */
  align?: "left" | "center" | "right";
  children: React.ReactNode;
}

export function Text({
  variant = "body",
  color,
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const { colors, typography } = useThemeContext();
  const typo = typography[variant];

  return (
    <RNText
      style={[
        {
          color: color ? colors[color] : colors.textPrimary,
          fontSize: typo.fontSize,
          fontWeight: typo.fontWeight,
          lineHeight: typo.lineHeight,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

export default Text;
