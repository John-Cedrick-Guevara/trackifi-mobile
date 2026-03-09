/**
 * Lightweight toast notification system.
 *
 * Usage:
 *   import { useToast, ToastContainer } from "@/providers/ToastProvider";
 *
 *   // In a component:
 *   const toast = useToast();
 *   toast.success("Transaction added!");
 *
 *   // In the root layout:
 *   <ToastContainer />
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const AUTO_DISMISS_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (m) => show("success", m),
      error: (m) => show("error", m),
      info: (m) => show("info", m),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Container (renders above everything)
// ---------------------------------------------------------------------------

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useThemeContext();

  const bgMap: Record<ToastType, string> = {
    success: colors.income,
    error: colors.expense,
    info: colors.accent,
  };

  if (toasts.length === 0) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + spacing.sm }]}
      pointerEvents="box-none"
    >
      {toasts.map((t) => (
        <Animated.View
          key={t.id}
          entering={FadeInUp.duration(250)}
          exiting={FadeOutUp.duration(200)}
        >
          <Pressable
            onPress={() => onDismiss(t.id)}
            style={[
              styles.toast,
              {
                backgroundColor: bgMap[t.type],
                borderRadius: radius.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                marginBottom: spacing.xs,
              },
            ]}
          >
            <Text variant="bodyBold" style={{ color: "#FFF" }}>
              {t.message}
            </Text>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    alignSelf: "stretch",
    alignItems: "center",
  },
});
