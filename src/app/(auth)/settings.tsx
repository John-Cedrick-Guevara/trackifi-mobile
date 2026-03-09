/**
 * Settings screen — theme, currency, account info, sign out.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { PageLayout } from "@/components/layout/PageLayout";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/features/auth/hooks";
import { useCurrencyStore } from "@/features/settings/store";
import { useThemeContext, type ThemeMode } from "@/providers/ThemeProvider";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
  { key: "system", label: "System" },
];

const CURRENCY_OPTIONS = ["₱", "$", "€", "£", "¥"] as const;

const STORAGE_KEY_THEME = "@trackifi/theme-mode";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const { colors, spacing, radius, shadows, mode, setMode } = useThemeContext();
  const { user, signOut } = useAuth();
  const { symbol, setSymbol } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);

  // Restore persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_THEME).then((stored) => {
      if (stored === "dark" || stored === "light" || stored === "system") {
        setMode(stored);
      }
      setMounted(true);
    });
  }, [setMode]);

  const handleThemeChange = useCallback(
    (m: ThemeMode) => {
      setMode(m);
      AsyncStorage.setItem(STORAGE_KEY_THEME, m);
    },
    [setMode],
  );

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  }, [signOut]);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "—";

  if (!mounted) return null;

  return (
    <PageLayout>
      <Text variant="headline" style={{ marginBottom: spacing.lg }}>
        Settings
      </Text>

      {/* Theme */}
      <SectionLabel>Theme</SectionLabel>
      <View
        style={[
          styles.chipRow,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            padding: spacing.sm,
          },
          shadows.sm,
        ]}
      >
        {THEME_OPTIONS.map(({ key, label }) => {
          const active = mode === key;
          return (
            <Pressable
              key={key}
              onPress={() => handleThemeChange(key)}
              accessibilityRole="button"
              accessibilityLabel={`Set theme to ${label}`}
              style={[
                styles.chip,
                {
                  borderRadius: radius.full,
                  backgroundColor: active ? colors.accent : "transparent",
                },
              ]}
            >
              <Text
                variant="bodyBold"
                style={{ color: active ? "#FFF" : colors.textSecondary }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: spacing.lg }} />

      {/* Currency */}
      <SectionLabel>Currency</SectionLabel>
      <View
        style={[
          styles.chipRow,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            padding: spacing.sm,
          },
          shadows.sm,
        ]}
      >
        {CURRENCY_OPTIONS.map((c) => {
          const active = symbol === c;
          return (
            <Pressable
              key={c}
              onPress={() => setSymbol(c)}
              accessibilityRole="button"
              accessibilityLabel={`Set currency symbol to ${c}`}
              style={[
                styles.chip,
                {
                  borderRadius: radius.full,
                  backgroundColor: active ? colors.accent : "transparent",
                  minWidth: 48,
                },
              ]}
            >
              <Text
                variant="bodyBold"
                style={{ color: active ? "#FFF" : colors.textSecondary }}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: spacing.xl }} />

      {/* Account info */}
      <SectionLabel>Account</SectionLabel>
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
        <InfoRow label="Email" value={user?.email ?? "—"} />
        <InfoRow label="Member since" value={memberSince} />
      </View>

      <View style={{ height: spacing.xl }} />

      {/* About */}
      <SectionLabel>About</SectionLabel>
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
        <InfoRow label="Version" value="1.0.0" />
        <Text
          variant="small"
          color="textTertiary"
          style={{ marginTop: spacing.sm }}
        >
          Built with ❤️
        </Text>
      </View>

      <View style={{ height: spacing.xl }} />

      {/* Sign out */}
      <Pressable
        onPress={handleSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        style={({ pressed }) => [
          styles.signOut,
          {
            backgroundColor: colors.loss,
            borderRadius: radius.md,
            padding: spacing.md,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text variant="bodyBold" style={{ color: "#FFF" }}>
          Sign Out
        </Text>
      </Pressable>
    </PageLayout>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: string }) {
  const { spacing } = useThemeContext();
  return (
    <Text
      variant="caption"
      color="textTertiary"
      style={{ marginBottom: spacing.sm, textTransform: "uppercase" }}
    >
      {children}
    </Text>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { spacing } = useThemeContext();
  return (
    <View style={[styles.infoRow, { paddingVertical: spacing.xs }]}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
  },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  signOut: {
    alignItems: "center",
  },
});
