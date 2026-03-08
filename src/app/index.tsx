import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuthStore } from "@/features/auth/store";
import { useThemeContext } from "@/providers/ThemeProvider";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { colors } = useThemeContext();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace("/(auth)");
    } else {
      router.replace("/(public)/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View style={[styles.loader, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
