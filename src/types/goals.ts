/**
 * Goal types — mirrors backend docs/api/09-data-models.md §10.4
 */

export type GoalType = "saving" | "spending";
export type GoalStatus = "active" | "completed" | "cancelled";

export interface Goal {
  uuid: string;
  user_id: string;
  name: string;
  /** Target amount (maps to DB `target_amount`) */
  amount: number;
  description: string;
  type: GoalType;
  start_date: string;
  end_date: string;
  status?: GoalStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalPayload {
  user_id: string;
  name: string;
  amount: number;
  description: string;
  type: GoalType;
  start_date: string;
  end_date: string;
}

export interface UpdateGoalPayload {
  uuid: string;
  user_id: string;
  name?: string;
  amount?: number;
  description?: string;
  type?: GoalType;
  start_date?: string;
  end_date?: string;
}

export interface PredictionResponse {
  prediction: string;
  success: boolean;
  monthsNeeded?: number;
  estimatedCompletionDate?: string;
}
