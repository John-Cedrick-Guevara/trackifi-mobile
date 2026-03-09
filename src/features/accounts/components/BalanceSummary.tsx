/**
 * Balance summary — total balance across all accounts in display typography.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { AccountWithBalance } from "@/types/accounts";
import { formatCurrency } from "@/utils/currency";

interface BalanceSummaryProps {
  accounts: AccountWithBalance[];
}

export function BalanceSummary({ accounts }: BalanceSummaryProps) {
  const { colors, spacing, radius, shadows } = useThemeContext();

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        shadows.sm,
      ]}
    >
      <Text variant="caption" color="textSecondary">
        Total Balance
      </Text>
      <Text variant="display" style={{ marginTop: spacing.xs }}>
        {formatCurrency(totalBalance)}
      </Text>

      {accounts.length > 1 && (
        <View style={{ marginTop: spacing.sm }}>
          {accounts.map((account) => (
            <View key={account.id} style={styles.accountRow}>
              <Text variant="caption" color="textSecondary">
                {account.name}
              </Text>
              <Text variant="caption" color="textSecondary">
                {formatCurrency(account.balance)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
});
