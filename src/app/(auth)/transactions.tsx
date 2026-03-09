import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { BottomSheet } from "@/components/layout/BottomSheet";
import { FAB } from "@/components/ui/FAB";
import { Text } from "@/components/ui/Text";
import { FilterBar } from "@/features/transactions/components/FilterBar";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { useFlatTransactions } from "@/features/transactions/hooks";
import { useTransactionFilterStore } from "@/features/transactions/store";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TransactionsScreen() {
  const { colors, spacing } = useThemeContext();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const typeFilter = useTransactionFilterStore((s) => s.typeFilter);
  const accountFilter = useTransactionFilterStore((s) => s.accountFilter);
  const startDate = useTransactionFilterStore((s) => s.startDate);
  const endDate = useTransactionFilterStore((s) => s.endDate);
  const limit = useTransactionFilterStore((s) => s.limit);

  const filters = {
    transaction_type: typeFilter,
    account_id: accountFilter,
    start_date: startDate,
    end_date: endDate,
    limit,
  };

  const {
    data: transactions,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFlatTransactions(filters);

  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    setRefreshing(false);
  }, [queryClient]);

  const handleFormSuccess = useCallback(() => {
    setSheetOpen(false);
  }, []);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <Text variant="headline">Transactions</Text>
        <FilterBar />
      </View>

      <View style={styles.list}>
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </View>

      <FAB onPress={() => setSheetOpen(true)} />

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <TransactionForm onSuccess={handleFormSuccess} />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
