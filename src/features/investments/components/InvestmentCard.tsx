/**
 * Investment list item card.
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { Investment, InvestmentType } from "@/types/investments";
import { formatCurrency, formatSignedCurrency } from "@/utils/currency";

interface InvestmentCardProps {
  investment: Investment;
  onPress?: () => void;
}

const TYPE_BADGE: Record<
  InvestmentType,
  { label: string; variant: BadgeVariant }
> = {
  stock: { label: "Stock", variant: "transfer" },
  crypto: { label: "Crypto", variant: "warning" },
  fund: { label: "Fund", variant: "savings" },
  savings: { label: "Savings", variant: "income" },
  other: { label: "Other", variant: "neutral" },
};

export function InvestmentCard({ investment, onPress }: InvestmentCardProps) {
  const { colors, spacing, radius, shadows } = useThemeContext();

  const gain =
    investment.absolute_gain ?? investment.current_value - investment.principal;
  const pct =
    investment.percentage_change ??
    (investment.principal > 0 ? (gain / investment.principal) * 100 : 0);
  const gainColor = gain >= 0 ? colors.income : colors.expense;
  const arrow = gain >= 0 ? "↑" : "↓";
  const tb = TYPE_BADGE[investment.type];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.md,
          opacity: pressed ? 0.9 : 1,
        },
        shadows.sm,
      ]}
    >
      <View style={styles.headerRow}>
        <Text variant="title" style={{ flex: 1 }} numberOfLines={1}>
          {investment.name}
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          <Badge variant={tb.variant}>{tb.label}</Badge>
          {investment.status === "closed" && (
            <Badge variant="neutral">Closed</Badge>
          )}
        </View>
      </View>

      <Text variant="bodyBold" style={{ marginTop: spacing.sm }}>
        {formatCurrency(investment.current_value)}
      </Text>

      <Text
        variant="caption"
        style={{ color: gainColor, marginTop: spacing.xs }}
      >
        {arrow} {formatSignedCurrency(gain)} ({pct.toFixed(1)}%)
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
