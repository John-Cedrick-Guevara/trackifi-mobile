/**
 * React Query hooks for Goals.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store";
import {
  createGoal,
  deleteGoal,
  getGoalPrediction,
  getGoals,
  updateGoal,
} from "@/services/goals.api";
import type { CreateGoalPayload, UpdateGoalPayload } from "@/types/goals";
import { QueryKeys } from "@/utils/constants";

/** Fetch all goals for the current user. staleTime: 5 min */
export function useGoals() {
  return useQuery({
    queryKey: QueryKeys.goals,
    queryFn: getGoals,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch AI prediction for a goal. staleTime: 30 min, enabled only with goalId */
export function useGoalPrediction(goalId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: QueryKeys.goalPrediction(goalId ?? ""),
    queryFn: () => getGoalPrediction(goalId!, userId!),
    enabled: !!goalId && !!userId,
    staleTime: 30 * 60 * 1000,
    retry: false,
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

/** Update a goal. Invalidates goals list. */
export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGoalPayload) => updateGoal(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeys.goals });
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
