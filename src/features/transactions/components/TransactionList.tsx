/**
 * Infinite-scroll transaction list grouped by date.
 */

import React, { useCallback, useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Divider } from "@/components/ui/Divider";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { Transaction } from "@/types/transactions";
import { getDateGroupLabel } from "@/utils/date";

import { TransactionRow } from "./TransactionRow";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

interface ListItem {
  type: "header" | "transaction";
  key: string;
  label?: string;
  transaction?: Transaction;
  index: number;
}

export function TransactionList({
  transactions,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onRefresh,
  refreshing,
}: TransactionListProps) {
  const { spacing } = useThemeContext();

  // Group transactions by date
  const items = useMemo<ListItem[]>(() => {
    const result: ListItem[] = [];
    let lastGroup = "";
    let idx = 0;
    for (const txn of transactions) {
      const group = getDateGroupLabel(txn.date);
      if (group !== lastGroup) {
        result.push({
          type: "header",
          key: `h-${group}`,
          label: group,
          index: idx,
        });
        lastGroup = group;
      }
      result.push({
        type: "transaction",
        key: txn.id,
        transaction: txn,
        index: idx,
      });
      idx++;
    }
    return result;
  }, [transactions]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "header") {
        return (
          <View style={{ paddingTop: spacing.md, paddingBottom: spacing.xs }}>
            <Text variant="caption" color="textSecondary">
              {item.label}
            </Text>
            <Divider spacing={spacing.xs} />
          </View>
        );
      }
      return (
        <TransactionRow transaction={item.transaction!} index={item.index} />
      );
    },
    [spacing],
  );

  if (isLoading) {
    return (
      <View style={{ gap: spacing.sm, paddingTop: spacing.md }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={52} />
        ))}
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        message="Tap + to record your first transaction."
      />
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.key}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ padding: spacing.md }}>
            <Skeleton height={52} />
          </View>
        ) : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({});
