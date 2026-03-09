/**
 * Investment detail page with value history chart and actions.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Skeleton } from "@/components/feedback/Skeleton";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import {
  CashOutSheet,
  RecordValueSheet,
  ValueHistoryChart,
} from "@/features/investments/components";
import {
  useDeleteInvestment,
  useInvestmentDetail,
} from "@/features/investments/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";
import type { InvestmentType } from "@/types/investments";
import { formatCurrency, formatSignedCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { haptic } from "@/utils/haptics";

const TYPE_BADGE: Record<
  InvestmentType,
  { label: string; variant: BadgeVariant }
> = {
  stock: { label: "Stock", variant: "transfer" },
  crypto: { label: "Crypto", variant: "warning" },
  fund: { label: "Fund", variant: "savings" },
  savings: { label: "Savings", variant: "income" },
  other: { label: "Other", variant: "neutral" },
};

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, radius, shadows } = useThemeContext();
  const toast = useToast();

  const [showRecord, setShowRecord] = useState(false);
  const [showCashOut, setShowCashOut] = useState(false);

  const detail = useInvestmentDetail(id);
  const deleteInvestment = useDeleteInvestment();

  const inv = detail.data;

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Investment",
      "Are you sure you want to delete this investment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await haptic("heavy");
            await deleteInvestment.mutateAsync(id!);
            toast.success("Investment deleted.");
            router.back();
          },
        },
      ],
    );
  }, [deleteInvestment, id, router, toast]);

  if (detail.isLoading || !inv) {
    return (
      <PageLayout>
        <Skeleton
          height={24}
          width="40%"
          style={{ marginBottom: spacing.md }}
        />
        <Skeleton height={80} style={{ marginBottom: spacing.md }} />
        <Skeleton height={220} style={{ marginBottom: spacing.md }} />
        <Skeleton height={100} />
      </PageLayout>
    );
  }

  const gain = inv.absolute_gain ?? inv.current_value - inv.principal;
  const pct =
    inv.percentage_change ??
    (inv.principal > 0 ? (gain / inv.principal) * 100 : 0);
  const gainColor = gain >= 0 ? colors.income : colors.expense;
  const arrow = gain >= 0 ? "↑" : "↓";
  const tb = TYPE_BADGE[inv.type];

  return (
    <PageLayout>
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onPress={() => router.back()}
        style={{ alignSelf: "flex-start", marginBottom: spacing.sm }}
      >
        ← Back
      </Button>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text variant="headline" style={{ flex: 1 }}>
          {inv.name}
        </Text>
        <Badge variant={tb.variant}>{tb.label}</Badge>
      </View>

      <View style={{ height: spacing.md }} />

      {/* Key metrics */}
      <View
        style={[
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            padding: spacing.md,
          },
          shadows.sm,
        ]}
      >
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text variant="small" color="textSecondary">
              Current Value
            </Text>
            <Text variant="title">{formatCurrency(inv.current_value)}</Text>
          </View>
          <View style={styles.metric}>
            <Text variant="small" color="textSecondary">
              Principal
            </Text>
            <Text variant="title">{formatCurrency(inv.principal)}</Text>
          </View>
        </View>
        <View style={[styles.metricsRow, { marginTop: spacing.sm }]}>
          <View style={styles.metric}>
            <Text variant="small" color="textSecondary">
              Gain/Loss
            </Text>
            <Text variant="bodyBold" style={{ color: gainColor }}>
              {arrow} {formatSignedCurrency(gain)} ({pct.toFixed(1)}%)
            </Text>
          </View>
          <View style={styles.metric}>
            <Text variant="small" color="textSecondary">
              Status
            </Text>
            <Badge variant={inv.status === "active" ? "income" : "neutral"}>
              {inv.status === "active" ? "Active" : "Closed"}
            </Badge>
          </View>
        </View>
      </View>

      <View style={{ height: spacing.lg }} />

      {/* Value history chart */}
      <Text variant="bodyBold" style={{ marginBottom: spacing.sm }}>
        Value History
      </Text>
      <ValueHistoryChart history={inv.history} principal={inv.principal} />

      <View style={{ height: spacing.lg }} />

      {/* Value history list */}
      {inv.history.length > 0 && (
        <View
          style={[
            {
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.lg,
              padding: spacing.md,
            },
            shadows.sm,
          ]}
        >
          <Text variant="bodyBold" style={{ marginBottom: spacing.sm }}>
            History Entries
          </Text>
          {inv.history.map((h, i) => (
            <Animated.View
              key={h.uuid}
              entering={FadeInDown.delay(i * 40).duration(200)}
              style={[
                styles.historyRow,
                {
                  borderBottomWidth: i < inv.history.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <View>
                <Text variant="body">{formatCurrency(h.value)}</Text>
                {h.notes ? (
                  <Text variant="small" color="textTertiary">
                    {h.notes}
                  </Text>
                ) : null}
              </View>
              <Text variant="caption" color="textSecondary">
                {formatDate(h.recorded_at)}
              </Text>
            </Animated.View>
          ))}
        </View>
      )}

      <View style={{ height: spacing.lg }} />

      {/* Action buttons */}
      {inv.status === "active" && (
        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={() => setShowRecord(true)}
            style={{ flex: 1 }}
          >
            Record Value
          </Button>
          <View style={{ width: spacing.sm }} />
          <Button
            variant="secondary"
            onPress={() => setShowCashOut(true)}
            style={{ flex: 1 }}
          >
            Cash Out
          </Button>
        </View>
      )}

      <Button
        variant="destructive"
        onPress={handleDelete}
        loading={deleteInvestment.isPending}
        style={{ marginTop: spacing.sm }}
      >
        Delete
      </Button>

      <View style={{ height: spacing.xl }} />

      {/* Bottom sheets */}
      <BottomSheet visible={showRecord} onClose={() => setShowRecord(false)}>
        <RecordValueSheet
          investmentId={id!}
          currentValue={inv.current_value}
          onSuccess={() => setShowRecord(false)}
        />
      </BottomSheet>

      <BottomSheet visible={showCashOut} onClose={() => setShowCashOut(false)}>
        <CashOutSheet
          investmentId={id!}
          currentValue={inv.current_value}
          onSuccess={() => setShowCashOut(false)}
        />
      </BottomSheet>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    flex: 1,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
  },
});
