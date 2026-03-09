/**
 * Account card — shows name, type badge, and formatted balance.
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { AccountWithBalance } from "@/types/accounts";
import { formatCurrency } from "@/utils/currency";

interface AccountCardProps {
  account: AccountWithBalance;
  onPress?: () => void;
}

export function AccountCard({ account, onPress }: AccountCardProps) {
  const { colors, spacing, radius, shadows } = useThemeContext();

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            padding: spacing.md,
            opacity: pressed ? 0.85 : 1,
          },
          shadows.sm,
        ]}
      >
        <View style={styles.header}>
          <Text variant="bodyBold">{account.name}</Text>
          <Badge variant={account.type === "savings" ? "savings" : "income"}>
            {account.type}
          </Badge>
        </View>
        <Text variant="title" style={{ marginTop: spacing.xs }}>
          {formatCurrency(account.balance)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
