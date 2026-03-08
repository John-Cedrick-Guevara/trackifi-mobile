/**
 * Page layout wrapper with safe area, scroll, and pull-to-refresh.
 */

import React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeContext } from "@/providers/ThemeProvider";

export interface PageLayoutProps {
  children: React.ReactNode;
  /** Disable scrolling (e.g. when using FlatList inside) */
  scrollable?: boolean;
  /** Pull-to-refresh handler */
  onRefresh?: () => void;
  /** Whether a refresh is in progress */
  refreshing?: boolean;
  /** Extra bottom padding (e.g. for FAB clearance) */
  bottomPadding?: number;
  /** Container style override */
  style?: ViewStyle;
}

export function PageLayout({
  children,
  scrollable = true,
  onRefresh,
  refreshing = false,
  bottomPadding = 0,
  style,
}: PageLayoutProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useThemeContext();

  const inner = (
    <View
      style={[
        styles.content,
        {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.md + bottomPadding + insets.bottom,
        },
      ]}
    >
      {children}
    </View>
  );

  if (!scrollable) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
          style,
        ]}
      >
        {inner}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }, style]}
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        ) : undefined
      }
    >
      {inner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default PageLayout;
