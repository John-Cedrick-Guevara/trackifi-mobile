import React from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/features/auth/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";

export default function MoreScreen() {
  const { signOut, user } = useAuth();
  const { spacing } = useThemeContext();

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
