import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PageLayout } from "@/components/layout/PageLayout";
import { Text } from "@/components/ui/Text";
import { CategoryView, TimeSeriesView } from "@/features/analytics/components";
import { useThemeContext } from "@/providers/ThemeProvider";

type Tab = "cashflow" | "categories";

export default function AnalyticsScreen() {
  const { colors, spacing, radius, shadows } = useThemeContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("cashflow");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ["analytics"],
    });
    setRefreshing(false);
  }, [queryClient]);

  return (
    <PageLayout onRefresh={handleRefresh} refreshing={refreshing}>
      <Text variant="headline" style={{ marginBottom: spacing.md }}>
        Analytics
      </Text>

      {/* Tab bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.full,
            padding: 4,
            marginBottom: spacing.lg,
          },
          shadows.sm,
        ]}
      >
        {(
          [
            { key: "cashflow", label: "Cash Flow" },
            { key: "categories", label: "Categories" },
          ] as const
        ).map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              accessibilityRole="tab"
              accessibilityLabel={`${label} tab`}
              accessibilityState={{ selected: active }}
              style={[
                styles.tab,
                {
                  borderRadius: radius.full,
                  backgroundColor: active ? colors.accent : "transparent",
                },
              ]}
            >
              <Text
                variant="bodyBold"
                style={{ color: active ? "#FFFFFF" : colors.textSecondary }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "cashflow" ? <TimeSeriesView /> : <CategoryView />}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
});
