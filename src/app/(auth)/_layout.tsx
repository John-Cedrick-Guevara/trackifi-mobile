import { Tabs } from "expo-router";
import React from "react";

import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { useThemeContext } from "@/providers/ThemeProvider";

export default function AuthLayout() {
  const { colors } = useThemeContext();

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
        <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
        <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
        <Tabs.Screen name="investments" options={{ title: "Investments" }} />
        <Tabs.Screen name="more" options={{ title: "More" }} />
      </Tabs>
    </AuthGuard>
  );
}
