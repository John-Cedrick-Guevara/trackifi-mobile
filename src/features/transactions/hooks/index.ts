/**
 * React Query hooks for transactions.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createExpense,
  createIncome,
  createTransfer,
  getTransactions,
} from "@/services/transactions.api";
import type {
  CreateExpenseRequest,
  CreateIncomeRequest,
  CreateTransferRequest,
  Transaction,
  TransactionFilters,
} from "@/types/transactions";
import { DEFAULT_PAGE_SIZE, QueryKeys } from "@/utils/constants";

// ---------------------------------------------------------------------------
// List (infinite scroll)
// ---------------------------------------------------------------------------

export function useTransactions(filters: Omit<TransactionFilters, "offset">) {
  const limit = filters.limit ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery<Transaction[]>({
    queryKey: QueryKeys.transactions(filters as Record<string, unknown>),
    queryFn: ({ pageParam = 0 }) =>
      getTransactions({ ...filters, limit, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length < limit ? undefined : (lastPageParam as number) + limit,
    staleTime: 2 * 60 * 1000,
  });
}

/** Flatten all pages into a single Transaction[] */
export function useFlatTransactions(
  filters: Omit<TransactionFilters, "offset">,
) {
  const query = useTransactions(filters);
  const data = query.data?.pages.flat() ?? [];
  return { ...query, data };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function useInvalidateAfterMutation(extraKeys: readonly (readonly string[])[]) {
  const queryClient = useQueryClient();
  return {
    onSuccess: async () => {
      const keys = [
        QueryKeys.accounts,
        ["transactions"],
        QueryKeys.todaySummary,
        QueryKeys.recentTransactions,
        ...extraKeys,
      ];
      await Promise.all(
        keys.map((k) => queryClient.invalidateQueries({ queryKey: k })),
      );
    },
  };
}

export function useCreateIncome() {
  return useMutation<Transaction, unknown, CreateIncomeRequest>({
    mutationFn: createIncome,
    ...useInvalidateAfterMutation([]),
  });
}

export function useCreateExpense() {
  return useMutation<Transaction, unknown, CreateExpenseRequest>({
    mutationFn: createExpense,
    ...useInvalidateAfterMutation([]),
  });
}

export function useCreateTransfer() {
  return useMutation<Transaction, unknown, CreateTransferRequest>({
    mutationFn: createTransfer,
    ...useInvalidateAfterMutation([]),
  });
}
