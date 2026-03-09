import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { QueryError } from "@/components/feedback/QueryError";
import { Skeleton } from "@/components/feedback/Skeleton";
import { PageLayout } from "@/components/layout/PageLayout";
import { FAB } from "@/components/ui/FAB";
import { Text } from "@/components/ui/Text";
import { BalanceSummary } from "@/features/accounts/components/BalanceSummary";
import { useAccounts } from "@/features/accounts/hooks";
import { RecentTransactionsList } from "@/features/analytics/components/RecentTransactionsList";
import { TodaySummaryCard } from "@/features/analytics/components/TodaySummaryCard";
import {
  useRecentTransactions,
  useTodaySummary,
} from "@/features/analytics/hooks";
import { useAuth } from "@/features/auth/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import { QueryKeys } from "@/utils/constants";

// ---------------------------------------------------------------------------
// Greeting helper
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ---------------------------------------------------------------------------
// Skeleton placeholders
// ---------------------------------------------------------------------------

function BalanceSkeleton() {
  const { spacing, radius, colors, shadows } = useThemeContext();
  return (
    <View
      style={[
        styles.skeletonCard,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        shadows.sm,
      ]}
    >
      <Skeleton width={100} height={14} />
      <Skeleton width="60%" height={36} style={{ marginTop: spacing.sm }} />
    </View>
  );
}

function TodaySkeleton() {
  const { spacing, radius, colors, shadows } = useThemeContext();
  return (
    <View
      style={[
        styles.skeletonCard,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        shadows.sm,
      ]}
    >
      <Skeleton width={50} height={14} />
      <View style={[styles.skeletonRow, { marginTop: spacing.sm }]}>
        <Skeleton width="45%" height={20} />
        <Skeleton width="45%" height={20} />
      </View>
    </View>
  );
}

function TransactionsSkeleton() {
  const { spacing } = useThemeContext();
  return (
    <View style={{ gap: spacing.sm }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} height={48} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dashboard screen
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
  const { user } = useAuth();
  const { spacing } = useThemeContext();
  const queryClient = useQueryClient();

  const accounts = useAccounts();
  const todaySummary = useTodaySummary();
  const recentTxns = useRecentTransactions();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: QueryKeys.accounts });
    await queryClient.invalidateQueries({ queryKey: QueryKeys.todaySummary });
    await queryClient.invalidateQueries({
      queryKey: QueryKeys.recentTransactions,
    });
    setRefreshing(false);
  }, [queryClient]);

  const hasAccounts = accounts.data && accounts.data.length > 0;

  return (
    <View style={styles.root}>
      <PageLayout
        onRefresh={handleRefresh}
        refreshing={refreshing}
        bottomPadding={80}
      >
        {/* Greeting */}
        <Text variant="headline">
          {getGreeting()}, {user?.email?.split("@")[0] ?? "User"}
        </Text>
        <View style={{ height: spacing.lg }} />

        {/* Balance */}
        <ErrorBoundary>
          {accounts.isLoading ? (
            <BalanceSkeleton />
          ) : accounts.isError ? (
            <QueryError
              error={accounts.error}
              onRetry={() => accounts.refetch()}
            />
          ) : !hasAccounts ? (
            <EmptyState
              title="No accounts yet"
              message="Set up your first account to start tracking your finances."
              actionLabel="Get Started"
              onAction={() => {}}
            />
          ) : (
            <BalanceSummary accounts={accounts.data} />
          )}
        </ErrorBoundary>
        <View style={{ height: spacing.md }} />

        {/* Today Summary */}
        <ErrorBoundary>
          {todaySummary.isLoading ? (
            <TodaySkeleton />
          ) : todaySummary.isError ? (
            <QueryError
              error={todaySummary.error}
              onRetry={() => todaySummary.refetch()}
            />
          ) : todaySummary.data ? (
            <TodaySummaryCard summary={todaySummary.data} />
          ) : null}
        </ErrorBoundary>
        <View style={{ height: spacing.lg }} />

        {/* Recent Transactions */}
        <ErrorBoundary>
          <Text variant="title">Recent Transactions</Text>
          <View style={{ height: spacing.sm }} />
          {recentTxns.isLoading ? (
            <TransactionsSkeleton />
          ) : recentTxns.isError ? (
            <QueryError
              error={recentTxns.error}
              onRetry={() => recentTxns.refetch()}
            />
          ) : recentTxns.data && recentTxns.data.length > 0 ? (
            <RecentTransactionsList transactions={recentTxns.data} />
          ) : (
            <Text variant="body" color="textSecondary">
              No recent transactions
            </Text>
          )}
        </ErrorBoundary>
      </PageLayout>

      {/* FAB — placeholder for Phase 4 navigation */}
      <FAB onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  skeletonCard: {
    width: "100%",
  },
  skeletonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
