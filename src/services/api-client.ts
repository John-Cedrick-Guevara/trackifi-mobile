/**
 * TrackiFi API Client
 *
 * Centralised HTTP layer that:
 * - Auto-attaches Authorization: Bearer <token>
 * - Retries on 401 after token refresh (once)
 * - Retries on 429 with exponential backoff
 * - Normalises all errors into ApiError union type
 *
 * @see docs/api/08-errors-pagination-ratelimiting.md
 * @see docs/api/10-mobile-integration.md §11.7
 */

import type { ApiError, ZodValidationError } from "@/types/api";
import { API_BASE_URL } from "@/utils/constants";

// ---------------------------------------------------------------------------
// Token accessor (will be wired to auth store in Phase 2)
// ---------------------------------------------------------------------------

type TokenAccessor = () => Promise<string | null>;
type TokenRefresher = () => Promise<string | null>;

let _getToken: TokenAccessor = async () => null;
let _refreshToken: TokenRefresher = async () => null;

/**
 * Wire the auth store's getToken / refreshToken once auth is initialised.
 * Called from AuthProvider during setup.
 */
export function setTokenAccessors(get: TokenAccessor, refresh: TokenRefresher) {
  _getToken = get;
  _refreshToken = refresh;
}

// ---------------------------------------------------------------------------
// Error normalisation helpers
// ---------------------------------------------------------------------------

function isZodError(body: unknown): body is ZodValidationError {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    (body as ZodValidationError).success === false &&
    "error" in body &&
    typeof (body as ZodValidationError).error === "object" &&
    (body as ZodValidationError).error?.name === "ZodError"
  );
}

async function normaliseError(response: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const status = response.status;

  // Zod validation errors
  if (status === 400 && isZodError(body)) {
    return { type: "validation", issues: body.error.issues, status: 400 };
  }

  // Auth errors
  if (status === 401) {
    const msg =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: string }).error)
        : "Unauthorized";
    return { type: "auth", message: msg, status: 401 };
  }

  // 404
  if (status === 404) {
    const b = body as { error?: string; path?: string; method?: string } | null;
    return {
      type: "not_found",
      message: b?.error ?? "Not Found",
      path: b?.path ?? "",
      method: b?.method ?? "",
      status: 404,
    };
  }

  // Rate limited
  if (status === 429) {
    const retryHeader = response.headers.get("X-RateLimit-Reset");
    return {
      type: "rate_limit",
      message: "Too many requests. Please wait a moment and try again.",
      retryAfter: retryHeader ? Number(retryHeader) : undefined,
      status: 429,
    };
  }

  // Generic app error
  const msg =
    typeof body === "object" && body !== null && "error" in body
      ? String((body as { error: string }).error)
      : `Request failed with status ${status}`;

  return { type: "app", message: msg, status };
}

// ---------------------------------------------------------------------------
// ApiClient class
// ---------------------------------------------------------------------------

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic typed request.
   * Returns the parsed JSON body of type T (typically `ApiResponse<T>['data']`).
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    _attempt = 0,
  ): Promise<T> {
    const MAX_RETRIES = 3;

    // Build headers
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    // Attach auth token
    const token = await _getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const url = `${this.baseUrl}${endpoint}`;

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (err) {
      throw {
        type: "network",
        message: "Network error. Please check your connection and try again.",
        originalError: err instanceof Error ? err : new Error(String(err)),
      } satisfies ApiError;
    }

    // Success
    if (response.ok) {
      const json = await response.json();
      // Some endpoints return `{ data: T }`, some return T directly
      return json.data !== undefined ? json.data : json;
    }

    // 401 — try refreshing the token once
    if (response.status === 401 && _attempt === 0) {
      const newToken = await _refreshToken();
      if (newToken) {
        return this.request<T>(endpoint, options, _attempt + 1);
      }
    }

    // 429 — exponential backoff
    if (response.status === 429 && _attempt < MAX_RETRIES) {
      const waitMs = Math.pow(2, _attempt) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
      return this.request<T>(endpoint, options, _attempt + 1);
    }

    // Normalise and throw
    throw await normaliseError(response);
  }

  // Convenience methods

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const apiClient = new ApiClient(API_BASE_URL);
