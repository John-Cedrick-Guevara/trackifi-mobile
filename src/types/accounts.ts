/**
 * Account types — mirrors backend docs/api/09-data-models.md §10.2
 */

export type AccountType = "allowance" | "savings";

export interface Account {
  id: string;
  user_uuid: string;
  name: string;
  type: AccountType;
  created_at: string;
  updated_at: string;
}

export interface AccountWithBalance extends Account {
  /** Derived from transactions — never stored directly */
  balance: number;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
}
