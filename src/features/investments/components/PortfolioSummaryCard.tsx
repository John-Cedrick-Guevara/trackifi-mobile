/**
 * Portfolio summary card with total value and gain/loss.
 */

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { Investment } from "@/types/investments";
import { formatCurrency, formatSignedCurrency } from "@/utils/currency";

interface PortfolioSummaryCardProps {
  investments: Investment[];
}

export function PortfolioSummaryCard({
  investments,
}: PortfolioSummaryCardProps) {
  const { colors, spacing, radius, shadows } = useThemeContext();

  const { totalValue, totalGain, totalPrincipal, overallPct } = useMemo(() => {
    const tv = investments.reduce((s, i) => s + i.current_value, 0);
    const tp = investments.reduce((s, i) => s + i.principal, 0);
    const tg = tv - tp;
    const op = tp > 0 ? (tg / tp) * 100 : 0;
    return {
      totalValue: tv,
      totalGain: tg,
      totalPrincipal: tp,
      overallPct: op,
    };
  }, [investments]);

  const gainColor = totalGain >= 0 ? colors.income : colors.expense;
  const arrow = totalGain >= 0 ? "↑" : "↓";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
        },
        shadows.md,
      ]}
    >
      <Text variant="caption" color="textSecondary">
        Portfolio Value
      </Text>
      <Text variant="display" style={{ marginTop: spacing.xs }}>
        {formatCurrency(totalValue)}
      </Text>

      <View style={[styles.gainRow, { marginTop: spacing.sm }]}>
        <Text variant="bodyBold" style={{ color: gainColor }}>
          {arrow} {formatSignedCurrency(totalGain)} ({overallPct.toFixed(1)}%)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  gainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
