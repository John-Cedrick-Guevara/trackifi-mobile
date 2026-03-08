/**
 * TanStack React Query provider with default configuration.
 *
 * Cache policy follows docs/api/10-mobile-integration.md §11.6
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Resets all cached data — call on sign-out */
export function resetQueryCache() {
  queryClient.clear();
}

export { queryClient };

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
