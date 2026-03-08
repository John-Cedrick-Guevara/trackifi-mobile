import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useAuthStore } from "@/features/auth/store";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider, useThemeContext } from "@/providers/ThemeProvider";

// ---------------------------------------------------------------------------
// Redirect based on auth state
// ---------------------------------------------------------------------------

function AuthRedirect() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inPublicGroup = segments[0] === "(public)";

    if (!isAuthenticated && !inPublicGroup) {
      router.replace("/(public)/login");
    } else if (isAuthenticated && inPublicGroup) {
      router.replace("/(auth)/index");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return null;
}

// ---------------------------------------------------------------------------
// Root content
// ---------------------------------------------------------------------------

function RootContent() {
  const { isDark } = useThemeContext();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthRedirect />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(public)" />
      </Stack>
    </NavThemeProvider>
  );
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </QueryProvider>
  );
}
