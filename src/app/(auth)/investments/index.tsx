/**
 * Investment portfolio list page.
 */

import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EmptyState } from "@/components/feedback/EmptyState";
import { QueryError } from "@/components/feedback/QueryError";
import { Skeleton } from "@/components/feedback/Skeleton";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { PageLayout } from "@/components/layout/PageLayout";
import { FAB } from "@/components/ui/FAB";
import { Text } from "@/components/ui/Text";
import {
  CreateInvestmentSheet,
  InvestmentCard,
  PortfolioSummaryCard,
} from "@/features/investments/components";
import { useInvestments } from "@/features/investments/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { Investment } from "@/types/investments";

type Filter = "all" | "active" | "closed";

export default function InvestmentsListScreen() {
  const { colors, spacing, radius } = useThemeContext();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const investments = useInvestments();
  const list = investments.data ?? [];

  const filtered = useMemo(() => {
    if (filter === "all") return list;
    return list.filter((i) => i.status === filter);
  }, [list, filter]);

  const handleRefresh = useCallback(async () => {
    await investments.refetch();
  }, [investments]);

  const renderItem = useCallback(
    ({ item, index }: { item: Investment; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 60).duration(300)}
        style={{ marginBottom: spacing.md }}
      >
        <InvestmentCard
          investment={item}
          onPress={() => router.push(`/(auth)/investments/${item.uuid}` as any)}
        />
      </Animated.View>
    ),
    [router, spacing.md],
  );

  const FILTERS: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Closed", value: "closed" },
  ];

  if (investments.isLoading) {
    return (
      <PageLayout>
        <Text variant="headline" style={{ marginBottom: spacing.lg }}>
          Investments
        </Text>
        <Skeleton height={100} style={{ marginBottom: spacing.md }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={90} style={{ marginBottom: spacing.md }} />
        ))}
      </PageLayout>
    );
  }

  if (investments.isError) {
    return (
      <PageLayout>
        <Text variant="headline" style={{ marginBottom: spacing.lg }}>
          Investments
        </Text>
        <QueryError
          error={investments.error}
          onRetry={() => investments.refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout scrollable={false}>
      <Text variant="headline" style={{ marginBottom: spacing.md }}>
        Investments
      </Text>

      {list.length > 0 && (
        <>
          <PortfolioSummaryCard investments={list} />
          <View style={{ height: spacing.md }} />

          {/* Filter chips */}
          <View style={[styles.filterRow, { marginBottom: spacing.md }]}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${f.label}`}
                accessibilityState={{ selected: filter === f.value }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      filter === f.value
                        ? `${colors.accent}20`
                        : colors.surface,
                    borderColor:
                      filter === f.value ? colors.accent : colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text
                  variant="small"
                  style={{
                    color:
                      filter === f.value ? colors.accent : colors.textSecondary,
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {filtered.length === 0 && list.length === 0 ? (
        <EmptyState
          title="Grow your wealth"
          message="Track your first investment and watch your portfolio grow."
          actionLabel="Add Investment"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={investments.isRefetching}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <FAB
        onPress={() => setShowCreate(true)}
        accessibilityLabel="Add investment"
      />

      <BottomSheet visible={showCreate} onClose={() => setShowCreate(false)}>
        <CreateInvestmentSheet onSuccess={() => setShowCreate(false)} />
      </BottomSheet>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
});
