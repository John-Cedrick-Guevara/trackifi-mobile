/**
 * Single transaction row used in TransactionList.
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { Transaction } from "@/types/transactions";
import { formatCurrency } from "@/utils/currency";
import { formatRelativeTime } from "@/utils/date";

interface TransactionRowProps {
  transaction: Transaction;
  index: number;
  onPress?: () => void;
}

const TYPE_CONFIG: Record<string, { color: string; prefix: string; label: string }> = {
  income:    { color: "income"   as const, prefix: "+", label: "Income" },
  allowance: { color: "income"   as const, prefix: "+", label: "Allowance" },
  expense:   { color: "expense"  as const, prefix: "-", label: "Expense" },
  transfer:  { color: "transfer" as const, prefix: "",  label: "Transfer" },
};

const FALLBACK_CONFIG = { color: "textSecondary" as const, prefix: "", label: "Transaction" };

export function TransactionRow({
  transaction,
  index,
  onPress,
}: TransactionRowProps) {
  const { colors, spacing, radius } = useThemeContext();
  const config = TYPE_CONFIG[transaction.transaction_type] ?? FALLBACK_CONFIG;
  const dotColor = colors[config.color as keyof typeof colors];

  const displayText =
    transaction.description || transaction.category || config.label;

  return (
    <Animated.View entering={FadeInDown.duration(250).delay(index * 30)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          {
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.sm,
            borderRadius: radius.md,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        {/* Type dot */}
        <View style={[styles.dot, { backgroundColor: dotColor }]} />

        {/* Center: description + category */}
        <View style={styles.center}>
          <Text variant="body" numberOfLines={1}>
            {displayText}
          </Text>
          <Text variant="small" color="textTertiary" numberOfLines={1}>
            {transaction.category ?? config.label}
          </Text>
        </View>

        {/* Right: amount + time */}
        <View style={styles.right}>
          <Text variant="bodyBold" style={{ color: dotColor }}>
            {config.prefix}
            {formatCurrency(Math.abs(transaction.amount))}
          </Text>
          <Text variant="small" color="textTertiary">
            {formatRelativeTime(transaction.date)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  center: {
    flex: 1,
    marginRight: 8,
  },
  right: {
    alignItems: "flex-end",
  },
});
