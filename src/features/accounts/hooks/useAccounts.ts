/**
 * React Query hooks for accounts data.
 */

import { useQuery } from "@tanstack/react-query";

import { getAccounts } from "@/services/accounts.api";
import { QueryKeys } from "@/utils/constants";

/** Fetch all accounts with balances. staleTime: 5 min */
export function useAccounts() {
  return useQuery({
    queryKey: QueryKeys.accounts,
    queryFn: getAccounts,
    staleTime: 5 * 60 * 1000,
  });
}
