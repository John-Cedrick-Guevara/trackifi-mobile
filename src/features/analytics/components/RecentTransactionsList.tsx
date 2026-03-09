/**
 * Recent transactions list — FlatList of last 20 transactions.
 */

import React, { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { RecentTransaction } from "@/types/analytics";
import { formatCurrency } from "@/utils/currency";
import { formatRelativeTime } from "@/utils/date";

interface RecentTransactionsListProps {
  transactions: RecentTransaction[];
}

const TYPE_COLORS = {
  in: "income",
  out: "expense",
  transfer: "transfer",
} as const;

function TransactionRow({
  item,
  index,
}: {
  item: RecentTransaction;
  index: number;
}) {
  const { colors, spacing, radius } = useThemeContext();

  const dotColor = colors[TYPE_COLORS[item.type]];
  const amountPrefix =
    item.type === "in" ? "+" : item.type === "out" ? "-" : "";
  const amountColor =
    item.type === "in"
      ? colors.income
      : item.type === "out"
        ? colors.expense
        : colors.transfer;

  return (
    <Animated.View entering={FadeInDown.duration(250).delay(index * 30)}>
      <Pressable
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
        <View style={[styles.dot, { backgroundColor: dotColor }]} />

        <View style={styles.center}>
          <Text variant="body" numberOfLines={1}>
            {item.metadata.category_name || "Uncategorized"}
          </Text>
          <Text variant="small" color="textTertiary">
            {formatRelativeTime(item.logged_at)}
          </Text>
        </View>

        <Text variant="bodyBold" style={{ color: amountColor }}>
          {amountPrefix}
          {formatCurrency(Math.abs(item.amount))}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function RecentTransactionsList({
  transactions,
}: RecentTransactionsListProps) {
  const renderItem = useCallback(
    ({ item, index }: { item: RecentTransaction; index: number }) => (
      <TransactionRow item={item} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: RecentTransaction) => item.uuid, []);

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      scrollEnabled={false}
    />
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
});
