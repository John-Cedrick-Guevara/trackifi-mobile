/**
 * Accounts API service functions.
 * @see docs/api/03-accounts.md
 */

import type { AccountWithBalance } from "@/types/accounts";
import { apiClient } from "./api-client";

/** Fetch all accounts with computed balances. */
export function getAccounts(): Promise<AccountWithBalance[]> {
  return apiClient.get<AccountWithBalance[]>("/api/accounts");
}

/** Fetch a single account's balance. */
export function getAccountBalance(id: string): Promise<{ balance: number }> {
  return apiClient.get<{ balance: number }>(
    `/api/accounts/${encodeURIComponent(id)}/balance`,
  );
}
