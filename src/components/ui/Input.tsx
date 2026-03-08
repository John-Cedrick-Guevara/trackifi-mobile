/**
 * Themed text input with label, error display, and optional icons.
 */

import React, { forwardRef } from "react";
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from "react-native";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";

export interface InputProps extends RNTextInputProps {
  /** Field label shown above the input */
  label?: string;
  /** Error message shown below the input */
  error?: string;
  /** Element rendered inside the input at the start */
  leftIcon?: React.ReactNode;
  /** Element rendered inside the input at the end */
  rightIcon?: React.ReactNode;
  /** Container style override */
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<RNTextInput, InputProps>(function Input(
  { label, error, leftIcon, rightIcon, containerStyle, style, ...rest },
  ref,
) {
  const { colors, spacing, radius, typography } = useThemeContext();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.loss : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}

        <RNTextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontSize: typography.body.fontSize,
              fontWeight: typography.body.fontWeight,
            },
            style,
          ]}
          {...rest}
        />

        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>

      {error && (
        <Text variant="small" color="loss" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    height: 48,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
  },
  icon: {
    marginHorizontal: 4,
  },
  error: {
    marginTop: 4,
  },
});

export default Input;
