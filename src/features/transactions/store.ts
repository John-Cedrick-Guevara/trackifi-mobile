/**
 * Transaction filter state (Zustand).
 */

import { create } from "zustand";

import type { TransactionType } from "@/types/transactions";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";

interface TransactionFilterState {
  typeFilter: TransactionType | undefined;
  accountFilter: string | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
  limit: number;
  setTypeFilter: (type: TransactionType | undefined) => void;
  setAccountFilter: (accountId: string | undefined) => void;
  setDateRange: (start: string | undefined, end: string | undefined) => void;
  clearFilters: () => void;
}

export const useTransactionFilterStore = create<TransactionFilterState>()(
  (set) => ({
    typeFilter: undefined,
    accountFilter: undefined,
    startDate: undefined,
    endDate: undefined,
    limit: DEFAULT_PAGE_SIZE,

    setTypeFilter: (type) => set({ typeFilter: type }),
    setAccountFilter: (accountId) => set({ accountFilter: accountId }),
    setDateRange: (start, end) => set({ startDate: start, endDate: end }),
    clearFilters: () =>
      set({
        typeFilter: undefined,
        accountFilter: undefined,
        startDate: undefined,
        endDate: undefined,
      }),
  }),
);
