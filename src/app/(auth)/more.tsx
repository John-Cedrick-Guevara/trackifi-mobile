import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/features/auth/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";

function MenuRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors, spacing, radius } = useThemeContext();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.md,
          padding: spacing.md,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text variant="body">{label}</Text>
      <Text variant="body" color="textTertiary">
        →
      </Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  const { signOut, user } = useAuth();
  const { spacing } = useThemeContext();
  const router = useRouter();

  return (
    <PageLayout>
      <Text variant="headline">More</Text>
      <Text
        variant="body"
        color="textSecondary"
        style={{ marginTop: spacing.sm }}
      >
        {user?.email}
      </Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <MenuRow
          label="Goals"
          onPress={() => router.push("/(auth)/goals" as any)}
        />
        <MenuRow
          label="Settings"
          onPress={() => router.push("/(auth)/settings" as any)}
        />
      </View>

      <Button
        variant="destructive"
        onPress={signOut}
        style={{ marginTop: spacing.xl }}
      >
        Sign Out
      </Button>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
