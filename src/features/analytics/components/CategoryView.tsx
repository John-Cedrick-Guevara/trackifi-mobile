/**
 * Category breakdown analytics view with type toggle and pie chart.
 */

import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";

import { useCategoryBreakdown } from "../hooks";

type FlowType = "out" | "in";

function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);
  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function CategoryView() {
  const { colors, spacing, radius, shadows } = useThemeContext();
  const [flowType, setFlowType] = useState<FlowType>("out");
  const [range] = useState(getDefaultDateRange);

  const params = useMemo(
    () => ({
      startDate: range.start,
      endDate: range.end,
      type: flowType as "in" | "out",
    }),
    [range, flowType],
  );

  const { data, isLoading } = useCategoryBreakdown(params);

  const handleToggle = useCallback((type: FlowType) => {
    setFlowType(type);
  }, []);

  return (
    <View>
      {/* Flow type toggle */}
      <View
        style={[
          styles.toggleRow,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.full,
            padding: 4,
          },
          shadows.sm,
        ]}
      >
        {(["out", "in"] as const).map((t) => {
          const active = flowType === t;
          return (
            <Pressable
              key={t}
              onPress={() => handleToggle(t)}
              style={[
                styles.toggleBtn,
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
                {t === "out" ? "Spending" : "Earnings"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: spacing.lg }} />

      {isLoading ? (
        <View style={{ gap: spacing.md }}>
          <Skeleton height={220} borderRadius={radius.lg} />
          <Skeleton height={100} borderRadius={radius.lg} />
        </View>
      ) : (
        <CategoryPieChart data={data ?? []} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
});
