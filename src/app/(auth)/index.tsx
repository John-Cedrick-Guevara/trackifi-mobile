import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { QueryError } from "@/components/feedback/QueryError";
import { Skeleton } from "@/components/feedback/Skeleton";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { PageLayout } from "@/components/layout/PageLayout";
import { FAB } from "@/components/ui/FAB";
import { Text } from "@/components/ui/Text";
import { useAccounts } from "@/features/accounts/hooks";
import { useTodaySummary } from "@/features/analytics/hooks";
import { useAuth } from "@/features/auth/hooks";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { TransactionRow } from "@/features/transactions/components/TransactionRow";
import { useFlatTransactions } from "@/features/transactions/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { AccountWithBalance } from "@/types/accounts";
import { QueryKeys } from "@/utils/constants";
import { formatCurrency } from "@/utils/currency";

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

function CardSkeleton() {
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
// Summary bar indicator
// ---------------------------------------------------------------------------

function DualBar({
  inflowTotal,
  expenseTotal,
  masked,
}: {
  inflowTotal: number;
  expenseTotal: number;
  masked: boolean;
}) {
  const { colors, spacing, radius } = useThemeContext();
  const max = Math.max(inflowTotal, expenseTotal, 1);
  const hidden = "•••••";

  return (
    <View style={{ flex: 1, justifyContent: "center", gap: spacing.sm }}>
      {/* Inflow bar */}
      <View>
        <Text variant="small" color="textSecondary">
          Inflow
        </Text>
        <View
          style={[
            styles.barTrack,
            { backgroundColor: colors.border, borderRadius: radius.sm },
          ]}
        >
          <View
            style={[
              styles.barFill,
              {
                width: `${(inflowTotal / max) * 100}%`,
                backgroundColor: colors.income,
                borderRadius: radius.sm,
              },
            ]}
          />
        </View>
        <Text variant="small" style={{ color: colors.income, marginTop: 2 }}>
          {masked ? hidden : formatCurrency(inflowTotal)}
        </Text>
      </View>
      {/* Expense bar */}
      <View>
        <Text variant="small" color="textSecondary">
          Expenses
        </Text>
        <View
          style={[
            styles.barTrack,
            { backgroundColor: colors.border, borderRadius: radius.sm },
          ]}
        >
          <View
            style={[
              styles.barFill,
              {
                width: `${(expenseTotal / max) * 100}%`,
                backgroundColor: colors.expense,
                borderRadius: radius.sm,
              },
            ]}
          />
        </View>
        <Text variant="small" style={{ color: colors.expense, marginTop: 2 }}>
          {masked ? hidden : formatCurrency(expenseTotal)}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Account type card
// ---------------------------------------------------------------------------

function AccountTypeCard({
  label,
  total,
  masked,
}: {
  label: string;
  total: number;
  masked: boolean;
}) {
  const { colors, spacing, radius, shadows } = useThemeContext();
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.halfCard,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        shadows.sm,
      ]}
    >
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="title" style={{ marginTop: spacing.xs }}>
        {masked ? "•••••" : formatCurrency(total)}
      </Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Dashboard screen
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { spacing, colors, radius, shadows } = useThemeContext();
  const queryClient = useQueryClient();

  const accounts = useAccounts();
  const todaySummary = useTodaySummary();
  const recentTxns = useFlatTransactions({ limit: 10 });

  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: QueryKeys.accounts });
    await queryClient.invalidateQueries({ queryKey: QueryKeys.todaySummary });
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    setRefreshing(false);
  }, [queryClient]);

  const hasAccounts = accounts.data && accounts.data.length > 0;

  // Derive account type totals
  const { allowanceTotal, savingsTotal, totalBalance } = useMemo(() => {
    if (!accounts.data)
      return { allowanceTotal: 0, savingsTotal: 0, totalBalance: 0 };
    const al = accounts.data
      .filter((a: AccountWithBalance) => a.type === "allowance")
      .reduce((s: number, a: AccountWithBalance) => s + a.balance, 0);
    const sv = accounts.data
      .filter((a: AccountWithBalance) => a.type === "savings")
      .reduce((s: number, a: AccountWithBalance) => s + a.balance, 0);
    return { allowanceTotal: al, savingsTotal: sv, totalBalance: al + sv };
  }, [accounts.data]);

  const handleFormSuccess = useCallback(() => {
    setSheetOpen(false);
  }, []);

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

        {/* ---- Top Section: Balance (Allowance) + Dual Bar ---- */}
        <ErrorBoundary>
          {accounts.isLoading ? (
            <CardSkeleton />
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
            <Animated.View
              entering={FadeIn.duration(300)}
              style={[
                styles.topSection,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                },
                shadows.sm,
              ]}
            >
              {/* Primary: Allowance balance */}
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <View style={styles.balanceLabelRow}>
                  <Text variant="caption" color="textSecondary">
                    Balance (Allowance)
                  </Text>
                  <Pressable
                    onPress={() => setBalanceVisible((v) => !v)}
                    hitSlop={12}
                    accessibilityLabel={
                      balanceVisible ? "Hide balance" : "Show balance"
                    }
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
                <Text variant="display" style={{ marginTop: spacing.xs }}>
                  {balanceVisible ? formatCurrency(allowanceTotal) : "•••••"}
                </Text>
              </View>
              {/* Dual bar indicators */}
              <DualBar
                inflowTotal={todaySummary.data?.inflow ?? 0}
                expenseTotal={todaySummary.data?.outflow ?? 0}
                masked={!balanceVisible}
              />
            </Animated.View>
          )}
        </ErrorBoundary>
        <View style={{ height: spacing.md }} />

        {/* ---- Second Section: Two-column Allowance / Savings ---- */}
        <ErrorBoundary>
          {accounts.isLoading ? (
            <View style={styles.twoCol}>
              <View style={styles.halfCard}>
                <Skeleton height={70} />
              </View>
              <View style={{ width: spacing.sm }} />
              <View style={styles.halfCard}>
                <Skeleton height={70} />
              </View>
            </View>
          ) : hasAccounts ? (
            <View style={styles.twoCol}>
              <AccountTypeCard
                label="Total Allowance"
                total={allowanceTotal}
                masked={!balanceVisible}
              />
              <View style={{ width: spacing.sm }} />
              <AccountTypeCard
                label="Total Savings"
                total={savingsTotal}
                masked={!balanceVisible}
              />
            </View>
          ) : null}
        </ErrorBoundary>
        <View style={{ height: spacing.md }} />

        {/* ---- Third Section: Total Balance ---- */}
        <ErrorBoundary>
          {accounts.isLoading ? (
            <CardSkeleton />
          ) : hasAccounts ? (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={[
                {
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  width: "100%",
                },
                shadows.sm,
              ]}
            >
              <Text variant="caption" color="textSecondary">
                Total Balance
              </Text>
              <Text variant="display" style={{ marginTop: spacing.xs }}>
                {balanceVisible ? formatCurrency(totalBalance) : "•••••"}
              </Text>
              <Text
                variant="small"
                color="textSecondary"
                style={{ marginTop: 2 }}
              >
                Allowance + Savings
              </Text>
            </Animated.View>
          ) : null}
        </ErrorBoundary>
        <View style={{ height: spacing.lg }} />

        {/* ---- Recent Transactions ---- */}
        <ErrorBoundary>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text variant="title">Recent Transactions</Text>
            <Pressable onPress={() => router.push("/(auth)/transactions")} hitSlop={12}>
              <Text variant="bodyBold" style={{ color: colors.accent }}>
                See All
              </Text>
            </Pressable>
          </View>
          <View style={{ height: spacing.sm }} />
          {recentTxns.isLoading ? (
            <TransactionsSkeleton />
          ) : recentTxns.isError ? (
            <QueryError
              error={recentTxns.error}
              onRetry={() => recentTxns.refetch()}
            />
          ) : recentTxns.data && recentTxns.data.length > 0 ? (
            <View>
              {recentTxns.data.map((txn, index) => (
                <TransactionRow key={txn.id} transaction={txn} index={index} />
              ))}
            </View>
          ) : (
            <Text variant="body" color="textSecondary">
              No recent transactions
            </Text>
          )}
        </ErrorBoundary>
      </PageLayout>

      {/* FAB — opens transaction creation */}
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
  skeletonCard: {
    width: "100%",
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  twoCol: {
    flexDirection: "row",
  },
  halfCard: {
    flex: 1,
  },
  balanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    height: 6,
    width: "100%",
    overflow: "hidden",
    marginTop: 4,
  },
  barFill: {
    height: 6,
  },
});
