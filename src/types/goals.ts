/**
 * Goal types — mirrors backend docs/api/06-goals.md
 *
 * Key design: `current_amount` is computed server-side from the
 * `goal_contributions` table — it is NOT a stored column.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type GoalType = "saving" | "spending";
export type GoalStatus = "active" | "completed" | "cancelled";

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

/** A goal as stored in the database. */
export interface Goal {
  uuid: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  type: GoalType;
  source_account_id: string;
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date?: string; // ISO date (YYYY-MM-DD), optional
  status: GoalStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Goal with computed progress — returned by all GET endpoints. */
export interface GoalWithProgress extends Goal {
  /** SUM of all contributions — computed at read-time, NOT stored. */
  current_amount: number;
}

/** A single contribution record linking a transaction to a goal. */
export interface GoalContribution {
  uuid: string;
  goal_id: string;
  transaction_id: string;
  amount: number;
  contributed_at: string; // ISO datetime
  created_at: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

/** POST /api/goals body */
export interface CreateGoalPayload {
  name: string; // 2–100 chars
  target_amount: number; // > 0
  source_account_id: string; // UUID of the account
  type?: GoalType; // defaults to "saving"
  start_date?: string; // ISO date, defaults to today
  end_date?: string; // ISO date, optional
  description?: string; // max 500 chars
}

/** PUT /api/goals/:id body (all fields optional) */
export interface UpdateGoalPayload {
  name?: string;
  target_amount?: number;
  type?: GoalType;
  source_account_id?: string;
  end_date?: string;
  description?: string;
}

/** POST /api/goals/:id/contributions body */
export interface CreateContributionPayload {
  transaction_id: string;
  amount: number; // > 0
}

// ---------------------------------------------------------------------------
// Prediction
// ---------------------------------------------------------------------------

/** GET /api/goals/:id/prediction response (success case) */
export interface PredictionResult {
  prediction: string; // Human-readable forecast message
  monthsNeeded?: number;
  estimatedCompletionDate?: string; // ISO date
  timeSeries: {
    period: string;
    amount: number;
  }[];
}

/** Prediction interval options */
export type PredictionInterval = "daily" | "weekly" | "monthly";
