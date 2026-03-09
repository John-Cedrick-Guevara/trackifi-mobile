/**
 * React Query hooks for Investments.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cashOut,
  createInvestment,
  deleteInvestment,
  getInvestmentDetail,
  getInvestments,
  recordValue,
} from "@/services/investments.api";
import type {
  CashOutPayload,
  CreateInvestmentPayload,
  UpdateValuePayload,
} from "@/types/investments";
import { QueryKeys } from "@/utils/constants";

/** Fetch all investments. staleTime: 5 min */
export function useInvestments() {
  return useQuery({
    queryKey: QueryKeys.investments,
    queryFn: getInvestments,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single investment with history. staleTime: 5 min */
export function useInvestmentDetail(id: string | undefined) {
  return useQuery({
    queryKey: QueryKeys.investmentDetail(id ?? ""),
    queryFn: () => getInvestmentDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Create investment. Invalidates investments, accounts, transactions. */
export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvestmentPayload) => createInvestment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeys.investments });
      qc.invalidateQueries({ queryKey: QueryKeys.accounts });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/** Record a new value. Invalidates investments list + detail. */
export function useRecordValue(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateValuePayload) => recordValue(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeys.investments });
      qc.invalidateQueries({ queryKey: QueryKeys.investmentDetail(id) });
    },
  });
}

/** Cash out. Invalidates investments, accounts, transactions. */
export function useCashOut(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CashOutPayload) => cashOut(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeys.investments });
      qc.invalidateQueries({ queryKey: QueryKeys.investmentDetail(id) });
      qc.invalidateQueries({ queryKey: QueryKeys.accounts });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/** Delete investment. Invalidates investments list. */
export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvestment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeys.investments });
    },
  });
}
