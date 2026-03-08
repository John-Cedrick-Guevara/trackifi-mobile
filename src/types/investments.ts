/**
 * Investment types — mirrors backend docs/api/09-data-models.md §10.5
 */

export type InvestmentType = "stock" | "crypto" | "fund" | "savings" | "other";
export type InvestmentStatus = "active" | "closed";

export interface Investment {
  uuid: string;
  user_uuid: string;
  name: string;
  type: InvestmentType;
  principal: number;
  current_value: number;
  start_date: string;
  status: InvestmentStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** Calculated: current_value - principal */
  absolute_gain?: number;
  /** Calculated: (absolute_gain / principal) * 100 */
  percentage_change?: number;
}

export interface InvestmentWithHistory extends Investment {
  history: InvestmentValueHistory[];
}

export interface InvestmentValueHistory {
  uuid: string;
  investment_uuid: string;
  value: number;
  recorded_at: string;
  notes?: string;
  created_at: string;
}

export interface CreateInvestmentPayload {
  name: string;
  type: InvestmentType;
  principal: number;
  start_date: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateValuePayload {
  value: number;
  recorded_at?: string;
  notes?: string;
}

export interface CashOutPayload {
  amount: number;
  date: string;
  notes?: string;
}
