/**
 * Transactions API service functions.
 * @see docs/api/04-transactions.md
 */

import type {
  CreateExpenseRequest,
  CreateIncomeRequest,
  CreateTransferRequest,
  Transaction,
  TransactionFilters,
} from "@/types/transactions";
import { apiClient } from "./api-client";

/** Fetch transactions with optional filters. */
export function getTransactions(
  filters: TransactionFilters,
): Promise<Transaction[]> {
  const params: Record<string, string> = {};
  if (filters.transaction_type)
    params.transaction_type = filters.transaction_type;
  if (filters.account_id) params.account_id = filters.account_id;
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  if (filters.limit != null) params.limit = String(filters.limit);
  if (filters.offset != null) params.offset = String(filters.offset);

  return apiClient.get<Transaction[]>("/api/transactions", params);
}

/** Create an income transaction. */
export function createIncome(data: CreateIncomeRequest): Promise<Transaction> {
  return apiClient.post<Transaction>("/api/transactions/income", data);
}

/** Create an expense transaction. */
export function createExpense(
  data: CreateExpenseRequest,
): Promise<Transaction> {
  return apiClient.post<Transaction>("/api/transactions/expense", data);
}

/** Create a transfer transaction. */
export function createTransfer(
  data: CreateTransferRequest,
): Promise<Transaction> {
  return apiClient.post<Transaction>("/api/transactions/transfer", data);
}
