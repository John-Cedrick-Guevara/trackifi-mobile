import { useCallback } from "react";

import { useAuthStore } from "@/features/auth/store";

/**
 * Primary auth hook — returns user, session, auth state, and actions.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const storeSignIn = useAuthStore((s) => s.signIn);
  const storeSignUp = useAuthStore((s) => s.signUp);
  const storeSignOut = useAuthStore((s) => s.signOut);

  const signIn = useCallback(
    (email: string, password: string) => storeSignIn(email, password),
    [storeSignIn],
  );

  const signUp = useCallback(
    (email: string, password: string) => storeSignUp(email, password),
    [storeSignUp],
  );

  const signOut = useCallback(() => storeSignOut(), [storeSignOut]);

  return { user, session, isAuthenticated, isLoading, signIn, signUp, signOut };
}
