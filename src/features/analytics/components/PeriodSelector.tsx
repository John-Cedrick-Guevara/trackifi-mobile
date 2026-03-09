/**
 * Period selector — segmented control (Daily/Weekly/Monthly) + date range nav.
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { TimeView } from "@/types/analytics";
import { formatShortDate } from "@/utils/date";

const TIME_VIEWS: { label: string; value: TimeView }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

interface PeriodSelectorProps {
  timeView: TimeView;
  onTimeViewChange: (view: TimeView) => void;
  startDate: string;
  endDate: string;
  onPrev: () => void;
  onNext: () => void;
}

export function PeriodSelector({
  timeView,
  onTimeViewChange,
  startDate,
  endDate,
  onPrev,
  onNext,
}: PeriodSelectorProps) {
  const { colors, spacing, radius } = useThemeContext();

  return (
    <View>
      {/* Segment control */}
      <View
        style={[
          styles.segment,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: 2,
          },
        ]}
      >
        {TIME_VIEWS.map((tv) => (
          <Pressable
            key={tv.value}
            onPress={() => onTimeViewChange(tv.value)}
            style={[
              styles.segmentItem,
              {
                backgroundColor:
                  timeView === tv.value ? colors.accent : "transparent",
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              variant="caption"
              style={{
                color:
                  timeView === tv.value ? colors.white : colors.textSecondary,
              }}
            >
              {tv.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date range nav */}
      <View style={[styles.dateRow, { marginTop: spacing.sm }]}>
        <Pressable onPress={onPrev} style={styles.arrow}>
          <Text variant="bodyBold" color="accent">
            ‹
          </Text>
        </Pressable>
        <Text variant="caption" color="textSecondary">
          {formatShortDate(startDate)} — {formatShortDate(endDate)}
        </Text>
        <Pressable onPress={onNext} style={styles.arrow}>
          <Text variant="bodyBold" color="accent">
            ›
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
