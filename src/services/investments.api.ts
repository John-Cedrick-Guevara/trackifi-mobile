/**
 * Investments API service.
 * @see docs/api/07-investments.md
 */

import { apiClient } from "@/services/api-client";
import type {
  CashOutPayload,
  CreateInvestmentPayload,
  Investment,
  InvestmentWithHistory,
  UpdateValuePayload,
} from "@/types/investments";

/** Fetch all investments. */
export function getInvestments(): Promise<Investment[]> {
  return apiClient.get<Investment[]>("/api/investments");
}

/** Fetch a single investment with value history. */
export function getInvestmentDetail(
  id: string,
): Promise<InvestmentWithHistory> {
  return apiClient.get<InvestmentWithHistory>(
    `/api/investments/${encodeURIComponent(id)}`,
  );
}

/** Create a new investment (also creates an expense transaction). */
export function createInvestment(
  data: CreateInvestmentPayload,
): Promise<Investment> {
  return apiClient.post<Investment>("/api/investments", data);
}

/** Record a new value snapshot. */
export function recordValue(
  id: string,
  data: UpdateValuePayload,
): Promise<{ uuid: string; current_value: number; updated_at: string }> {
  return apiClient.post(
    `/api/investments/${encodeURIComponent(id)}/value`,
    data,
  );
}

/** Cash out from an investment (also creates an income transaction). */
export function cashOut(
  id: string,
  data: CashOutPayload,
): Promise<{
  uuid: string;
  current_value: number;
  principal: number;
  status: string;
  updated_at: string;
}> {
  return apiClient.post(
    `/api/investments/${encodeURIComponent(id)}/cashout`,
    data,
  );
}

/** Delete an investment. */
export function deleteInvestment(id: string): Promise<void> {
  return apiClient.delete(`/api/investments/${encodeURIComponent(id)}`);
}
