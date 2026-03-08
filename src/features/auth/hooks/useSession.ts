import { useAuthStore } from "@/features/auth/store";

/**
 * Convenience hook — returns just the current access token for API calls.
 */
export function useSession() {
  return useAuthStore((s) => s.session?.access_token ?? null);
}
