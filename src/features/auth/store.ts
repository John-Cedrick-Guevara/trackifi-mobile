/**
 * Auth store (Zustand) — manages session state and auth actions.
 */

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { resetQueryCache } from "@/providers/QueryProvider";
import { setTokenAccessors } from "@/services/api-client";
import { supabase } from "@/services/supabase";

// ---------------------------------------------------------------------------
// Friendly error messages
// ---------------------------------------------------------------------------

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "User already registered": "An account with this email already exists.",
  "Email not confirmed": "Please check your email and verify your account.",
  "Password should be at least 6 characters":
    "Password must be at least 6 characters.",
  "Email rate limit exceeded": "Too many attempts. Please try again later.",
};

function friendlyError(message: string): string {
  return ERROR_MAP[message] ?? message;
}

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Auth listener cleanup (handles hot-reload)
// ---------------------------------------------------------------------------

let _unsubscribe: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()((set, get) => {
  // Wire the API client so it always reads the current access token
  setTokenAccessors(
    async () => get().session?.access_token ?? null,
    () => get().refreshSession(),
  );

  return {
    session: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,

    initialize: async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }

      // Clean up previous listener (handles hot-reload)
      _unsubscribe?.();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        });
      });

      _unsubscribe = () => subscription.unsubscribe();
    },

    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(friendlyError(error.message));
    },

    signUp: async (email, password) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(friendlyError(error.message));
    },

    signOut: async () => {
      await supabase.auth.signOut();
      resetQueryCache();
      set({ session: null, user: null, isAuthenticated: false });
    },

    refreshSession: async () => {
      const { data } = await supabase.auth.refreshSession();
      return data.session?.access_token ?? null;
    },
  };
});
