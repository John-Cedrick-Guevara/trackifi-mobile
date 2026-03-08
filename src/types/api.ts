/**
 * API response / error types — normalized for frontend consumption.
 * Matches backend error shapes from docs/api/08-errors-pagination-ratelimiting.md
 */

// ---------------------------------------------------------------------------
// Response wrappers
// ---------------------------------------------------------------------------

/** Standard backend response envelope */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Future pagination metadata (recommended format from backend docs) */
export interface PaginationMeta {
  page: number;
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Zod validation issue as returned by @hono/zod-validator */
export interface ZodIssue {
  code: string;
  message: string;
  path: (string | number)[];
  minimum?: number;
  type?: string;
  inclusive?: boolean;
  exact?: boolean;
}

/** Backend Zod validation error shape */
export interface ZodValidationError {
  success: false;
  error: {
    issues: ZodIssue[];
    name: "ZodError";
  };
}

/** Normalised error union used throughout the frontend */
export type ApiError =
  | { type: "app"; message: string; status: number }
  | { type: "validation"; issues: ZodIssue[]; status: 400 }
  | { type: "auth"; message: string; status: 401 }
  | {
      type: "not_found";
      message: string;
      path: string;
      method: string;
      status: 404;
    }
  | { type: "rate_limit"; message: string; retryAfter?: number; status: 429 }
  | { type: "network"; message: string; originalError: Error };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isValidationError(
  error: ApiError,
): error is Extract<ApiError, { type: "validation" }> {
  return error.type === "validation";
}

export function isAuthError(
  error: ApiError,
): error is Extract<ApiError, { type: "auth" }> {
  return error.type === "auth";
}

export function getErrorMessage(error: ApiError): string {
  switch (error.type) {
    case "validation":
      return error.issues.map((i) => i.message).join(", ");
    case "network":
      return "Network error. Please check your connection and try again.";
    case "auth":
      return "Session expired. Please sign in again.";
    case "rate_limit":
      return "Too many requests. Please wait a moment and try again.";
    default:
      return error.message;
  }
}
