import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/Text";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { useThemeContext } from "@/providers/ThemeProvider";

export default function RegisterScreen() {
  const { colors, spacing } = useThemeContext();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="display" color="accent" align="center">
          TrackiFi
        </Text>

        <View style={styles.formWrap}>
          <RegisterForm />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  formWrap: {
    width: "100%",
    alignItems: "center",
  },
});
