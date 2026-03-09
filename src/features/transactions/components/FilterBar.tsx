/**
 * Horizontal filter bar for transactions.
 */

import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { TransactionType } from "@/types/transactions";
import { useTransactionFilterStore } from "../store";

const TYPE_OPTIONS: { label: string; value: TransactionType | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
  { label: "Transfer", value: "transfer" },
];

const DATE_OPTIONS: { label: string; value: string }[] = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  const { colors, radius, spacing } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? `${colors.accent}20` : colors.surface,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: active ? colors.accent : colors.border,
          paddingHorizontal: spacing.sm + 4,
          paddingVertical: spacing.xs + 2,
          marginRight: spacing.sm,
        },
      ]}
    >
      <Text
        variant="caption"
        style={{ color: active ? colors.accent : colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FilterBar() {
  const { spacing } = useThemeContext();

  const typeFilter = useTransactionFilterStore((s) => s.typeFilter);
  const startDate = useTransactionFilterStore((s) => s.startDate);
  const setTypeFilter = useTransactionFilterStore((s) => s.setTypeFilter);
  const setDateRange = useTransactionFilterStore((s) => s.setDateRange);
  const clearFilters = useTransactionFilterStore((s) => s.clearFilters);

  const hasFilters = typeFilter !== undefined || startDate !== undefined;

  const handleDateOption = (value: string) => {
    const now = new Date();
    if (value === "week") {
      const start = new Date(now);
      const day = start.getDay();
      start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
      start.setHours(0, 0, 0, 0);
      setDateRange(start.toISOString(), now.toISOString());
    } else if (value === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateRange(start.toISOString(), now.toISOString());
    }
  };

  const activeDateOption = (() => {
    if (!startDate) return undefined;
    const now = new Date();
    const start = new Date(startDate);
    // Rough check for "this month"
    if (
      start.getFullYear() === now.getFullYear() &&
      start.getMonth() === now.getMonth() &&
      start.getDate() === 1
    ) {
      return "month";
    }
    return "week";
  })();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: spacing.sm }}
    >
      {TYPE_OPTIONS.map((opt) => (
        <FilterChip
          key={opt.label}
          label={opt.label}
          active={typeFilter === opt.value}
          onPress={() => setTypeFilter(opt.value)}
        />
      ))}

      <View style={styles.separator} />

      {DATE_OPTIONS.map((opt) => (
        <FilterChip
          key={opt.value}
          label={opt.label}
          active={activeDateOption === opt.value}
          onPress={() => handleDateOption(opt.value)}
        />
      ))}

      {hasFilters && (
        <FilterChip label="Clear" active={false} onPress={clearFilters} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
  },
  separator: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 4,
  },
});
