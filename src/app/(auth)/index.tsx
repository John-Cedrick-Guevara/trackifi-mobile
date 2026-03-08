import React from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/features/auth/hooks";

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <PageLayout>
      <Text variant="headline">Dashboard</Text>
      <Text variant="body" color="textSecondary">
        Welcome, {user?.email ?? "User"}
      </Text>
    </PageLayout>
  );
}
