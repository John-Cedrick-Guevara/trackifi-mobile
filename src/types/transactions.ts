/**
 * Transaction types — mirrors backend docs/api/09-data-models.md §10.3
 */

export type TransactionType = "income" | "expense" | "transfer" | "allowance";

export interface Transaction {
  id: string;
  user_uuid: string;
  amount: number;
  transaction_type: TransactionType;
  from_account_id: string | null;
  to_account_id: string | null;
  date: string;
  category: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomeRequest {
  amount: number;
  to_account_id: string;
  date?: string;
  category?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateExpenseRequest {
  amount: number;
  from_account_id: string;
  date?: string;
  category?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTransferRequest {
  amount: number;
  from_account_id: string;
  to_account_id: string;
  date?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionFilters {
  transaction_type?: TransactionType;
  account_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
