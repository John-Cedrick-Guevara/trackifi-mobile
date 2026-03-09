/**
 * Goals list page.
 */

import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EmptyState } from "@/components/feedback/EmptyState";
import { QueryError } from "@/components/feedback/QueryError";
import { Skeleton } from "@/components/feedback/Skeleton";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { PageLayout } from "@/components/layout/PageLayout";
import { FAB } from "@/components/ui/FAB";
import { Text } from "@/components/ui/Text";
import { useAccounts } from "@/features/accounts/hooks";
import { GoalForm, GoalProgressCard } from "@/features/goals/components";
import { useGoals } from "@/features/goals/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { Goal } from "@/types/goals";

export default function GoalsListScreen() {
  const { spacing } = useThemeContext();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const goals = useGoals();
  const accounts = useAccounts();

  // Derive current savings from savings-type accounts
  const currentSavings = useMemo(() => {
    if (!accounts.data) return 0;
    return accounts.data
      .filter((a) => a.type === "savings")
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts.data]);

  // Sort: active first, then by end_date
  const sorted = useMemo(() => {
    if (!goals.data) return [];
    return [...goals.data].sort((a, b) => {
      const aActive = (a.status ?? "active") === "active" ? 0 : 1;
      const bActive = (b.status ?? "active") === "active" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
    });
  }, [goals.data]);

  const handleRefresh = useCallback(async () => {
    await goals.refetch();
  }, [goals]);

  const renderItem = useCallback(
    ({ item, index }: { item: Goal; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 60).duration(300)}
        style={{ marginBottom: spacing.md }}
      >
        <GoalProgressCard
          goal={item}
          currentSavings={currentSavings}
          onPress={() => router.push(`/(auth)/goals/${item.uuid}` as any)}
        />
      </Animated.View>
    ),
    [currentSavings, router, spacing.md],
  );

  if (goals.isLoading) {
    return (
      <PageLayout>
        <Text variant="headline" style={{ marginBottom: spacing.lg }}>
          Goals
        </Text>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={120} style={{ marginBottom: spacing.md }} />
        ))}
      </PageLayout>
    );
  }

  if (goals.isError) {
    return (
      <PageLayout>
        <Text variant="headline" style={{ marginBottom: spacing.lg }}>
          Goals
        </Text>
        <QueryError error={goals.error} onRetry={() => goals.refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout scrollable={false}>
      <Text variant="headline" style={{ marginBottom: spacing.lg }}>
        Goals
      </Text>

      {sorted.length === 0 ? (
        <EmptyState
          title="Dream big!"
          message="Create your first savings goal and start tracking your progress."
          actionLabel="Create Goal"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={goals.isRefetching}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <FAB
        onPress={() => setShowForm(true)}
        accessibilityLabel="Create new goal"
      />

      <BottomSheet visible={showForm} onClose={() => setShowForm(false)}>
        <GoalForm onSuccess={() => setShowForm(false)} />
      </BottomSheet>
    </PageLayout>
  );
}
