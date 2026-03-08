# 6. Goals Module

## 6.1 Overview

Goals let users define financial savings targets and receive AI-driven forecasting on when they'll reach them. The forecasting uses **Holt's Double Exponential Smoothing** to predict future savings based on historical transaction patterns.

## 6.2 Data Model

### Database Schema (`goals` table)

```typescript
interface Goal {
  uuid: string; // UUID, primary key
  user_id: string; // UUID, owner
  name: string; // Goal name
  amount: number; // Target amount (maps to DB `target_amount`)
  description: string; // Goal description
  type: "saving" | "spending"; // Goal type
  start_date: Date; // When tracking begins
  end_date: Date; // Target completion date
  status?: string; // "active" (default) | "completed" | "cancelled"
  metadata?: Record<string, any>; // Flexible JSON
  created_at: Date; // Auto-generated
  updated_at: Date; // Auto-updated
}

interface CreateGoalPayload {
  user_id: string;
  name: string;
  amount: number;
  description: string;
  type: "saving" | "spending";
  start_date: Date;
  end_date: Date;
}

interface UpdateGoalPayload {
  uuid: string;
  user_id: string;
  name?: string;
  amount?: number;
  description?: string;
  type?: "saving" | "spending";
  start_date?: Date;
  end_date?: Date;
}
```

## 6.3 Endpoints

---

### `GET /api/goals/generate-prediction`

Generates an AI-powered prediction for when a goal will be reached based on historical savings patterns.

**Auth**: Required

**Query Parameters**:

| Parameter | Type | Required | Description                 |
| --------- | ---- | -------- | --------------------------- |
| `goalId`  | UUID | **Yes**  | The goal to predict for     |
| `userId`  | UUID | **Yes**  | The authenticated user's ID |

**Example Request**:

```
GET /api/goals/generate-prediction?goalId=g1234567-89ab-cdef-0123-456789abcdef&userId=u1234567-89ab-cdef-0123-456789abcdef
```

**Response `200 OK` — Prediction Available**:

```json
{
  "prediction": "At your current pace, you will reach this goal in 8 months.",
  "monthsNeeded": 8,
  "estimatedCompletionDate": "2026-11-08"
}
```

**Response `200 OK` — Goal Already Reached**:

```json
{
  "prediction": "Goal already reached",
  "success": true
}
```

**Response `400 Bad Request` — Not Enough Data**:

```json
{
  "error": "Not enough data for prediction"
}
```

**Response `400 Bad Request` — Unreachable**:

```json
{
  "error": "Goal unreachable with current spending habits"
}
```

## 6.4 Forecasting Algorithm

The prediction engine uses **Holt's Double Exponential Smoothing** with the following parameters:

| Parameter  | Value | Description            |
| ---------- | ----- | ---------------------- |
| α (alpha)  | 0.3   | Level smoothing factor |
| β (beta)   | 0.2   | Trend smoothing factor |
| MAX_MONTHS | 120   | Safety cap (10 years)  |

### Algorithm Steps

1. **Fetch the goal** — Get `target_amount` from the `goals` table
2. **Get current savings balance** — Dynamically fetch the savings account balance
3. **Calculate remaining** — `remaining = target_amount - current_savings_balance`
4. **Fetch transactions** — Get all non-transfer transactions for the user
5. **Aggregate monthly** — Group transactions by month, calculate net savings per month (`income - expense`)
6. **Initialize smoothing** — Set `level = first_month_amount`, `trend = month2 - month1`
7. **Smooth historical data** — Apply exponential smoothing across all months
8. **Project forward** — Iterate future months accumulating `level + month * trend` until the goal is reached

### Edge Cases

| Condition                   | Result                                                  |
| --------------------------- | ------------------------------------------------------- |
| < 4 transactions            | `"Not enough data for prediction"`                      |
| `remaining ≤ 0`             | `"Goal already reached"`                                |
| `level ≤ 0 && trend ≤ 0`    | `"Goal unreachable with current spending habits"`       |
| `monthsNeeded > 120`        | `"Goal unreachable within 10 years with current trend"` |
| `projectedContribution = 0` | `"Goal unreachable with current trend"`                 |

### Prediction Response Schema

```typescript
interface PredictionResponse {
  prediction: string; // Human-readable prediction text
  success: boolean; // Whether prediction was successful
  monthsNeeded?: number; // Estimated months to goal
  estimatedCompletionDate?: string; // ISO 8601 date (YYYY-MM-DD)
}
```

## 6.5 Error Responses

| Status | Body                                                         | Condition          |
| ------ | ------------------------------------------------------------ | ------------------ |
| 400    | `{ "error": "Missing required parameters: goalId, userId" }` | Missing params     |
| 400    | `{ "error": "<prediction message>" }`                        | Prediction failure |
| 401    | `{ "error": "Unauthorized: Missing token" }`                 | No Bearer token    |
| 500    | `{ "error": "<message>" }`                                   | Database error     |
