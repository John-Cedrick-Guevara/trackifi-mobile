/**
 * Error boundary with retry button.
 * Catches unhandled JS errors within its subtree.
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

interface Props {
  children: ReactNode;
  /** Optional fallback component */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to crash reporting service in production
    console.error("ErrorBoundary caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text variant="title" align="center">
            Something went wrong
          </Text>
          <Text
            variant="body"
            color="textSecondary"
            align="center"
            style={styles.message}
          >
            An unexpected error occurred. Please try again.
          </Text>
          <Button variant="primary" onPress={this.handleRetry}>
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  message: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default ErrorBoundary;
