/**
 * Small pill badge with semantic colour variants.
 */

import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";

export type BadgeVariant =
  | "income"
  | "expense"
  | "transfer"
  | "savings"
  | "neutral"
  | "warning"
  | "accent";

export interface BadgeProps {
  /** Display text */
  children: string;
  /** Semantic variant */
  variant?: BadgeVariant;
  /** Container style override */
  style?: ViewStyle;
}

export function Badge({ children, variant = "neutral", style }: BadgeProps) {
  const { colors, radius } = useThemeContext();

  const colorMap: Record<BadgeVariant, { bg: string; text: string }> = {
    income: { bg: `${colors.income}20`, text: colors.income },
    expense: { bg: `${colors.expense}20`, text: colors.expense },
    transfer: { bg: `${colors.transfer}20`, text: colors.transfer },
    savings: { bg: `${colors.savings}20`, text: colors.savings },
    neutral: { bg: `${colors.textTertiary}20`, text: colors.textSecondary },
    warning: { bg: `${colors.warning}20`, text: colors.warning },
    accent: { bg: `${colors.accent}20`, text: colors.accent },
  };

  const c = colorMap[variant];

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: c.bg, borderRadius: radius.full },
        style,
      ]}
    >
      <Text variant="small" style={{ color: c.text }}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});

export default Badge;
