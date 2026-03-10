/**
 * React Query hooks for Goals.
 *
 * @see docs/api/06-goals.md
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createContribution,
  createGoal,
  deleteContribution,
  deleteGoal,
  getContributions,
  getGoal,
  getGoalPrediction,
  getGoals,
  updateGoal,
} from "@/services/goals.api";
import type {
  CreateContributionPayload,
  CreateGoalPayload,
  PredictionInterval,
  UpdateGoalPayload,
} from "@/types/goals";
import { QueryKeys } from "@/utils/constants";

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

/** Fetch all goals with `current_amount`. staleTime: 5 min */
export function useGoals() {
  return useQuery({
    queryKey: QueryKeys.goals,
    queryFn: getGoals,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single goal with `current_amount`. staleTime: 5 min */
export function useGoal(goalId: string | undefined) {
  return useQuery({
    queryKey: QueryKeys.goalDetail(goalId ?? ""),
    queryFn: () => getGoal(goalId!),
    enabled: !!goalId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Create a goal. Invalidates goals list. */
export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => createGoal(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeys.goals });
    },
  });
}

/** Update a goal. Invalidates goals list + detail. */
export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGoalPayload }) =>
      updateGoal(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QueryKeys.goals });
      qc.invalidateQueries({ queryKey: QueryKeys.goalDetail(id) });
    },
  });
}

/** Delete a goal. Invalidates goals list. */
export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteGoal(uuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeys.goals });
    },
  });
}

// ---------------------------------------------------------------------------
// Contributions
// ---------------------------------------------------------------------------

/** Fetch all contributions for a goal. staleTime: 2 min */
export function useContributions(goalId: string | undefined) {
  return useQuery({
    queryKey: QueryKeys.goalContributions(goalId ?? ""),
    queryFn: () => getContributions(goalId!),
    enabled: !!goalId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Add a contribution. Invalidates contributions, goal detail, and goals list. */
export function useCreateContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      goalId,
      payload,
    }: {
      goalId: string;
      payload: CreateContributionPayload;
    }) => createContribution(goalId, payload),
    onSuccess: (_data, { goalId }) => {
      qc.invalidateQueries({
        queryKey: QueryKeys.goalContributions(goalId),
      });
      qc.invalidateQueries({ queryKey: QueryKeys.goalDetail(goalId) });
      qc.invalidateQueries({ queryKey: QueryKeys.goals });
      qc.invalidateQueries({
        queryKey: QueryKeys.goalPrediction(goalId),
      });
    },
  });
}

/** Remove a contribution. Invalidates contributions, goal detail, and goals list. */
export function useDeleteContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      goalId,
      contributionId,
    }: {
      goalId: string;
      contributionId: string;
    }) => deleteContribution(goalId, contributionId),
    onSuccess: (_data, { goalId }) => {
      qc.invalidateQueries({
        queryKey: QueryKeys.goalContributions(goalId),
      });
      qc.invalidateQueries({ queryKey: QueryKeys.goalDetail(goalId) });
      qc.invalidateQueries({ queryKey: QueryKeys.goals });
      qc.invalidateQueries({
        queryKey: QueryKeys.goalPrediction(goalId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Prediction
// ---------------------------------------------------------------------------

/** Fetch AI prediction for a goal. staleTime: 30 min */
export function useGoalPrediction(
  goalId: string | undefined,
  interval: PredictionInterval = "monthly",
) {
  return useQuery({
    queryKey: QueryKeys.goalPrediction(goalId ?? ""),
    queryFn: () => getGoalPrediction(goalId!, interval),
    enabled: !!goalId,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
