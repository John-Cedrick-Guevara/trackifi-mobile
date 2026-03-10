/**
 * Goals API service.
 *
 * All operations go through the REST API via `apiClient`.
 * Supabase is no longer used directly for goals.
 *
 * @see docs/api/06-goals.md
 */

import { apiClient } from "@/services/api-client";
import type {
  CreateContributionPayload,
  CreateGoalPayload,
  GoalContribution,
  GoalWithProgress,
  PredictionInterval,
  PredictionResult,
  UpdateGoalPayload,
} from "@/types/goals";

// ---------------------------------------------------------------------------
// Goals CRUD
// ---------------------------------------------------------------------------

/** Fetch all goals (with computed `current_amount`). */
export function getGoals(): Promise<GoalWithProgress[]> {
  return apiClient.get<GoalWithProgress[]>("/api/goals");
}

/** Fetch a single goal by UUID (with computed `current_amount`). */
export function getGoal(id: string): Promise<GoalWithProgress> {
  return apiClient.get<GoalWithProgress>(`/api/goals/${encodeURIComponent(id)}`);
}

/** Create a new goal. */
export function createGoal(payload: CreateGoalPayload): Promise<GoalWithProgress> {
  return apiClient.post<GoalWithProgress>("/api/goals", payload);
}

/** Update an existing goal. */
export function updateGoal(
  id: string,
  payload: UpdateGoalPayload,
): Promise<GoalWithProgress> {
  return apiClient.put<GoalWithProgress>(
    `/api/goals/${encodeURIComponent(id)}`,
    payload,
  );
}

/** Delete a goal (cascades contributions). */
export function deleteGoal(id: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(
    `/api/goals/${encodeURIComponent(id)}`,
  );
}

// ---------------------------------------------------------------------------
// Contributions
// ---------------------------------------------------------------------------

/** List all contributions for a goal, newest first. */
export function getContributions(goalId: string): Promise<GoalContribution[]> {
  return apiClient.get<GoalContribution[]>(
    `/api/goals/${encodeURIComponent(goalId)}/contributions`,
  );
}

/** Add a contribution to a goal. */
export function createContribution(
  goalId: string,
  payload: CreateContributionPayload,
): Promise<GoalContribution> {
  return apiClient.post<GoalContribution>(
    `/api/goals/${encodeURIComponent(goalId)}/contributions`,
    payload,
  );
}

/** Remove a contribution from a goal. */
export function deleteContribution(
  goalId: string,
  contributionId: string,
): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(
    `/api/goals/${encodeURIComponent(goalId)}/contributions/${encodeURIComponent(contributionId)}`,
  );
}

// ---------------------------------------------------------------------------
// Prediction
// ---------------------------------------------------------------------------

/** Generate AI forecast from contribution time-series. */
export function getGoalPrediction(
  goalId: string,
  interval: PredictionInterval = "monthly",
): Promise<PredictionResult> {
  return apiClient.get<PredictionResult>(
    `/api/goals/${encodeURIComponent(goalId)}/prediction`,
    { interval },
  );
}
