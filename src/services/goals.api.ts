/**
 * Goals API service.
 *
 * Prediction endpoint uses the TrackiFi API.
 * CRUD operations use Supabase client directly (no REST endpoints yet).
 *
 * @see docs/api/06-goals.md
 */

import { apiClient } from "@/services/api-client";
import { supabase } from "@/services/supabase";
import type {
  CreateGoalPayload,
  Goal,
  PredictionResponse,
  UpdateGoalPayload,
} from "@/types/goals";

// ---------------------------------------------------------------------------
// Prediction (via API)
// ---------------------------------------------------------------------------

/** Fetch AI-powered goal prediction. */
export function getGoalPrediction(
  goalId: string,
  userId: string,
): Promise<PredictionResponse> {
  return apiClient.get<PredictionResponse>("/api/goals/generate-prediction", {
    goalId,
    userId,
  });
}

// ---------------------------------------------------------------------------
// CRUD (via Supabase)
// ---------------------------------------------------------------------------

/** Fetch all goals for the current user. */
export async function getGoals(): Promise<Goal[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("status", { ascending: true })
    .order("end_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Goal[];
}

/** Create a new goal. */
export async function createGoal(payload: CreateGoalPayload): Promise<Goal> {
  const { data, error } = await supabase
    .from("goals")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Goal;
}

/** Update an existing goal. */
export async function updateGoal(payload: UpdateGoalPayload): Promise<Goal> {
  const { uuid, ...fields } = payload;
  const { data, error } = await supabase
    .from("goals")
    .update(fields)
    .eq("uuid", uuid)
    .select()
    .single();

  if (error) throw error;
  return data as Goal;
}

/** Delete a goal. */
export async function deleteGoal(uuid: string): Promise<void> {
  const { error } = await supabase.from("goals").delete().eq("uuid", uuid);
  if (error) throw error;
}
