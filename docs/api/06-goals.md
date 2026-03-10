# 6. Goals Module

> **Last Updated**: 2026-03-10

## 6.1 Overview

Goals let users define financial savings targets, track progress by allocating real transaction amounts toward each goal, and receive AI-driven forecasting on when they'll reach them.

### Architecture: Contribution-Based Model

Progress is **not** stored as a number on the goal. Instead, it is derived at read-time by summing all `goal_contributions` rows that belong to a goal:

```
goal.current_amount = SUM(goal_contributions.amount WHERE goal_id = goal.uuid)
```

This design means:

- Progress is always accurate and backed by real transactions
- Deleting a transaction automatically cascades and removes its contribution
- The same transaction can be partially allocated across **multiple** goals, as long as the sum of all allocations does not exceed the transaction's total amount
- Financial analytics (cashflow, categories) remain unaffected — goals are a read-only allocation layer on top of transactions, never modifying them

### Isolation from Analytics

Goals **never modify** transactions. `goal_contributions` is a separate join table. All existing cashflow endpoints continue to work exactly as before. Goal progress is computed independently.

## 6.2 Database Schema

### `goals` table

| Column              | Type        | Nullable | Description                                       |
| ------------------- | ----------- | -------- | ------------------------------------------------- |
| `uuid`              | UUID        | No       | Primary key                                       |
| `user_id`           | UUID        | No       | Owner (references `auth.users`)                   |
| `name`              | TEXT        | No       | Goal name (2–100 chars)                           |
| `description`       | TEXT        | Yes      | Optional description (max 500 chars)              |
| `target_amount`     | NUMERIC     | No       | The savings target                                |
| `type`              | TEXT        | No       | `"saving"` or `"spending"` (default `"saving"`)   |
| `source_account_id` | UUID        | No       | The account whose transactions can fund this goal |
| `start_date`        | DATE        | No       | When tracking begins (defaults to creation date)  |
| `end_date`          | DATE        | Yes      | Optional target completion date                   |
| `status`            | TEXT        | No       | `"active"` \| `"completed"` \| `"cancelled"`      |
| `metadata`          | JSONB       | Yes      | Reserved for future use                           |
| `created_at`        | TIMESTAMPTZ | No       | Auto-set on insert                                |
| `updated_at`        | TIMESTAMPTZ | No       | Auto-updated on change                            |

### `goal_contributions` table

| Column           | Type        | Nullable | Description                                                      |
| ---------------- | ----------- | -------- | ---------------------------------------------------------------- |
| `uuid`           | UUID        | No       | Primary key                                                      |
| `goal_id`        | UUID        | No       | FK → `goals.uuid` (CASCADE DELETE)                               |
| `transaction_id` | UUID        | No       | FK → `transactions.id` (CASCADE DELETE)                          |
| `amount`         | NUMERIC     | No       | Amount allocated from the transaction to this goal (must be > 0) |
| `contributed_at` | TIMESTAMPTZ | No       | Timestamp when the allocation was recorded                       |
| `created_at`     | TIMESTAMPTZ | No       | Auto-set on insert                                               |

**Unique constraint**: `(goal_id, transaction_id)` — a transaction can only be linked to the same goal once.

**Cascade**: Deleting a goal deletes all its contributions. Deleting a transaction deletes its contribution records across all goals.

---

## 6.3 TypeScript Interfaces

### Server-side (API canonical shapes)

```typescript
// A goal as stored in the database
interface Goal {
  uuid: string; // UUID primary key
  user_id: string; // UUID of the owner
  name: string; // Goal name
  description?: string; // Optional description
  target_amount: number; // Savings target
  type: "saving" | "spending";
  source_account_id: string; // UUID of the linked account
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date?: string; // ISO date string (optional target date)
  status: string; // "active" | "completed" | "cancelled"
  metadata?: Record<string, any>;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// Goal with progress (returned by all GET endpoints)
interface GoalWithProgress extends Goal {
  current_amount: number; // SUM of all contributions — computed at read-time, NOT stored
}

// A single contribution record
interface GoalContribution {
  uuid: string; // Contribution primary key
  goal_id: string; // UUID of the parent goal
  transaction_id: string; // UUID of the linked transaction
  amount: number; // Amount allocated
  contributed_at: string; // ISO datetime of the allocation
  created_at: string; // ISO datetime of the record
}

// POST /api/goals body
interface CreateGoalPayload {
  name: string; // REQUIRED. 2–100 chars
  target_amount: number; // REQUIRED. Must be > 0
  source_account_id: string; // REQUIRED. UUID of the account
  type?: "saving" | "spending"; // Optional, defaults to "saving"
  start_date?: string; // Optional. ISO date (YYYY-MM-DD). Defaults to today
  end_date?: string; // Optional. ISO date (YYYY-MM-DD)
  description?: string; // Optional. Max 500 chars
}

// PUT /api/goals/:id body (all fields optional)
interface UpdateGoalPayload {
  name?: string;
  target_amount?: number;
  type?: "saving" | "spending";
  source_account_id?: string;
  end_date?: string;
  description?: string;
}

// POST /api/goals/:id/contributions body
interface CreateContributionPayload {
  transaction_id: string; // REQUIRED. UUID of the transaction
  amount: number; // REQUIRED. Must be > 0
}

// GET /api/goals/:id/prediction response
interface PredictionResult {
  prediction: string; // Human-readable forecast message
  monthsNeeded?: number; // Estimated months until the goal is reached
  estimatedCompletionDate?: string; // ISO date (YYYY-MM-DD)
  timeSeries: {
    period: string; // Label for the bucket (e.g. "2026-03" for monthly)
    amount: number; // Total contributions in that period
  }[];
}
```

---

## 6.4 Endpoints

All endpoints require `Authorization: Bearer <token>`.

### Quick Reference

| Method   | Path                                           | Description                             |
| -------- | ---------------------------------------------- | --------------------------------------- |
| `GET`    | `/api/goals`                                   | List all goals with progress            |
| `GET`    | `/api/goals/:id`                               | Get a single goal with progress         |
| `POST`   | `/api/goals`                                   | Create a new goal                       |
| `PUT`    | `/api/goals/:id`                               | Update a goal                           |
| `DELETE` | `/api/goals/:id`                               | Delete a goal (cascades contributions)  |
| `GET`    | `/api/goals/:id/contributions`                 | List all contributions for a goal       |
| `POST`   | `/api/goals/:id/contributions`                 | Add a contribution to a goal            |
| `DELETE` | `/api/goals/:id/contributions/:contributionId` | Remove a contribution                   |
| `GET`    | `/api/goals/:id/prediction`                    | Generate AI forecast from contributions |

---

### `GET /api/goals`

Returns all goals owned by the authenticated user, each with a computed `current_amount`.

**Response `200 OK`**:

```json
{
  "data": [
    {
      "uuid": "g1abc123-...",
      "user_id": "u1abc123-...",
      "name": "Emergency Fund",
      "description": "3 months of expenses",
      "target_amount": 90000,
      "type": "saving",
      "source_account_id": "a1abc123-...",
      "start_date": "2026-01-01",
      "end_date": "2026-12-31",
      "status": "active",
      "current_amount": 30000,
      "created_at": "2026-01-15T08:00:00.000Z",
      "updated_at": "2026-03-10T10:00:00.000Z"
    }
  ]
}
```

> `current_amount` is computed server-side as `SUM(goal_contributions.amount)`. It is **not** a column in the `goals` table.

---

### `GET /api/goals/:id`

Returns a single goal by its UUID.

**Path Parameters**:

| Parameter | Type | Description     |
| --------- | ---- | --------------- |
| `id`      | UUID | The goal's UUID |

**Response `200 OK`**: Same shape as a single item from the list above.

**Response `400 Bad Request`**:

```json
{ "error": "Goal not found" }
```

---

### `POST /api/goals`

Creates a new goal.

**Request Body**:

```json
{
  "name": "Emergency Fund",
  "target_amount": 90000,
  "source_account_id": "a1abc123-...",
  "type": "saving",
  "end_date": "2026-12-31",
  "description": "3 months of expenses"
}
```

| Field               | Type   | Required | Validation                                      |
| ------------------- | ------ | -------- | ----------------------------------------------- |
| `name`              | string | **Yes**  | 2–100 characters                                |
| `target_amount`     | number | **Yes**  | Must be > 0                                     |
| `source_account_id` | UUID   | **Yes**  | Must belong to the authenticated user           |
| `type`              | string | No       | `"saving"` or `"spending"`. Default: `"saving"` |
| `start_date`        | string | No       | ISO date (YYYY-MM-DD). Default: today           |
| `end_date`          | string | No       | ISO date (YYYY-MM-DD)                           |
| `description`       | string | No       | Max 500 characters                              |

**Response `201 Created`**:

```json
{
  "data": {
    "uuid": "g1abc123-...",
    "name": "Emergency Fund",
    "target_amount": 90000,
    "current_amount": 0,
    "source_account_id": "a1abc123-...",
    "type": "saving",
    "start_date": "2026-03-10",
    "end_date": "2026-12-31",
    "description": "3 months of expenses",
    "status": "active",
    "created_at": "2026-03-10T10:00:00.000Z",
    "updated_at": "2026-03-10T10:00:00.000Z"
  }
}
```

**Error Responses**:

| Status | Body                                                      | Cause                                        |
| ------ | --------------------------------------------------------- | -------------------------------------------- |
| 400    | `{ "error": "Goal name must be at least 2 characters" }`  | Validation: name too short                   |
| 400    | `{ "error": "Target amount must be positive" }`           | Validation: target_amount ≤ 0                |
| 400    | `{ "error": "Invalid source account ID" }`                | Validation: source_account_id is not a UUID  |
| 400    | `{ "error": "Source account not found or unauthorized" }` | The account UUID doesn't belong to this user |

---

### `PUT /api/goals/:id`

Updates fields on an existing goal. All body fields are optional — only send what you want to change.

**Request Body** (all fields optional):

```json
{
  "name": "Updated Name",
  "target_amount": 100000,
  "end_date": "2027-01-01",
  "description": "Updated description"
}
```

**Response `200 OK`**: Same shape as `GET /api/goals/:id` (includes updated `current_amount`).

**Error Responses**:

| Status | Body                                                      | Cause                                        |
| ------ | --------------------------------------------------------- | -------------------------------------------- |
| 400    | `{ "error": "Source account not found or unauthorized" }` | New source_account_id doesn't belong to user |
| 400    | `{ "error": "Target amount must be positive" }`           | target_amount ≤ 0                            |

---

### `DELETE /api/goals/:id`

Deletes a goal and all its contributions (cascade). Linked transactions are **not** deleted.

**Response `200 OK`**:

```json
{ "success": true }
```

---

### `GET /api/goals/:id/contributions`

Returns all contributions for a goal, ordered newest first.

**Response `200 OK`**:

```json
{
  "data": [
    {
      "uuid": "c1abc123-...",
      "goal_id": "g1abc123-...",
      "transaction_id": "t1abc123-...",
      "amount": 10000,
      "contributed_at": "2026-03-10T10:30:00.000Z",
      "created_at": "2026-03-10T10:30:00.000Z"
    }
  ]
}
```

---

### `POST /api/goals/:id/contributions`

Allocates part (or all) of a transaction toward this goal. This is how `current_amount` grows.

**Request Body**:

```json
{
  "transaction_id": "t1abc123-...",
  "amount": 10000
}
```

| Field            | Type   | Required | Validation           |
| ---------------- | ------ | -------- | -------------------- |
| `transaction_id` | UUID   | **Yes**  | Must be a valid UUID |
| `amount`         | number | **Yes**  | Must be > 0          |

**Validation chain** (server performs these checks in order):

1. The `transaction_id` must be a valid UUID.
2. The transaction must belong to the authenticated user.
3. The transaction must involve the goal's `source_account_id` (either `from_account_id` or `to_account_id`).
4. The `amount` must not exceed the transaction's total amount.
5. The sum of all allocations of this transaction across **all goals** must not exceed the transaction's total amount.

**Response `201 Created`**:

```json
{
  "data": {
    "uuid": "c1abc123-...",
    "goal_id": "g1abc123-...",
    "transaction_id": "t1abc123-...",
    "amount": 10000,
    "contributed_at": "2026-03-10T10:30:00.000Z",
    "created_at": "2026-03-10T10:30:00.000Z"
  }
}
```

**Error Responses**:

| Status | Body                                                                                                                            | Cause                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 400    | `{ "error": "Invalid transaction ID" }`                                                                                         | transaction_id is not a valid UUID                |
| 400    | `{ "error": "Contribution amount must be positive" }`                                                                           | amount ≤ 0                                        |
| 400    | `{ "error": "Goal not found or unauthorized" }`                                                                                 | Goal doesn't belong to this user                  |
| 400    | `{ "error": "Transaction not found or unauthorized" }`                                                                          | Transaction doesn't belong to this user           |
| 400    | `{ "error": "Transaction does not involve the goal's source account" }`                                                         | The transaction is not from/to the goal's account |
| 400    | `{ "error": "Contribution amount exceeds transaction amount" }`                                                                 | amount > transaction.amount                       |
| 400    | `{ "error": "Over-allocation: transaction has {total} total, {allocated} already allocated. Maximum additional: {remaining}" }` | Cross-goal allocation limit exceeded              |

**Over-allocation example**:

A transaction for ₱70,000 has already been allocated ₱30,000 to Goal A. Attempting to allocate ₱50,000 to Goal B returns:

```json
{
  "error": "Over-allocation: transaction has 70000 total, 30000 already allocated. Maximum additional: 40000"
}
```

---

### `DELETE /api/goals/:id/contributions/:contributionId`

Removes a contribution. The linked transaction is **not** deleted. The goal's `current_amount` decreases by the removed amount on the next read.

**Response `200 OK`**:

```json
{ "success": true }
```

**Error Responses**:

| Status | Body                                            | Cause                            |
| ------ | ----------------------------------------------- | -------------------------------- |
| 400    | `{ "error": "Goal not found or unauthorized" }` | Goal doesn't belong to this user |

---

### `GET /api/goals/:id/prediction`

Generates an AI forecast based on the contribution time-series for this goal.

**Query Parameters**:

| Parameter  | Type   | Required | Values                           | Default     |
| ---------- | ------ | -------- | -------------------------------- | ----------- |
| `interval` | string | No       | `"daily"` `"weekly"` `"monthly"` | `"monthly"` |

**Response `200 OK` — Forecast available**:

```json
{
  "prediction": "At your current contribution pace, you will reach this goal in approximately 6 months.",
  "monthsNeeded": 6,
  "estimatedCompletionDate": "2026-09-10",
  "timeSeries": [
    { "period": "2026-01", "amount": 5000 },
    { "period": "2026-02", "amount": 8000 },
    { "period": "2026-03", "amount": 12000 }
  ]
}
```

**Response `400 Bad Request` — Not enough data**:

```json
{
  "error": "Not enough contribution data to generate a prediction",
  "timeSeries": []
}
```

**Response `400 Bad Request` — Goal already reached**:

```json
{
  "error": "Goal already reached",
  "timeSeries": [...]
}
```

**Response `400 Bad Request` — Unreachable**:

```json
{
  "error": "Goal unreachable with current contribution trend",
  "timeSeries": [...]
}
```

**All prediction error responses**:

| Error message                                             | Meaning                                      |
| --------------------------------------------------------- | -------------------------------------------- |
| `"Not enough contribution data to generate a prediction"` | Fewer than 2 contribution time buckets exist |
| `"Goal already reached"`                                  | `current_amount >= target_amount`            |
| `"Goal unreachable with current contribution trend"`      | Smoothed trend is zero or negative           |
| `"Goal unreachable within 10 years with current trend"`   | Projection exceeded 120 months (safety cap)  |

---

## 6.5 Forecasting Algorithm

The prediction endpoint uses **Holt's Double Exponential Smoothing** applied to the goal's own contribution time-series (not generic account transactions).

### Parameters

| Parameter   | Value | Description                                               |
| ----------- | ----- | --------------------------------------------------------- |
| α (alpha)   | 0.3   | Level smoothing — how fast to respond to new data         |
| β (beta)    | 0.2   | Trend smoothing — how strongly to weight recent direction |
| MAX_PERIODS | 120   | Safety cap (~10 years). Prevents infinite loops           |

### Algorithm Steps

1. **Fetch contributions** for the goal and group by the requested `interval` (daily/weekly/monthly) into a time-series.
2. **Check preconditions**: if < 2 buckets, return "not enough data."
3. **Initialize smoothing**: `level = first bucket amount`, `trend = second bucket − first bucket`.
4. **Smooth historical series**: iterate over all buckets applying:
   ```
   newLevel = α × value + (1 − α) × (level + trend)
   newTrend = β × (newLevel − level) + (1 − β) × trend
   ```
5. **Project forward**: accumulate `level + period × trend` across future periods until the remaining amount is covered.
6. **Convert to months**: map projected periods to calendar months based on `interval`.
7. **Return** `monthsNeeded`, `estimatedCompletionDate` (today + monthsNeeded), and the full `timeSeries`.

### Time-series bucket format

| Interval  | `period` format                   | Example      |
| --------- | --------------------------------- | ------------ |
| `daily`   | `YYYY-MM-DD`                      | `2026-03-10` |
| `weekly`  | `YYYY-MM-DD` (Monday of the week) | `2026-03-09` |
| `monthly` | `YYYY-MM`                         | `2026-03`    |

---

## 6.6 Frontend Values and Their Sources

This section explains exactly what the mobile / frontend client displays and where each value comes from.

### Goal Card (list view)

| Displayed Value | Source                                   | Notes                                             |
| --------------- | ---------------------------------------- | ------------------------------------------------- |
| Goal name       | `goal.name`                              | From `goals` table                                |
| Current saved   | `goal.current_amount`                    | Computed server-side: `SUM(contributions.amount)` |
| Target amount   | `goal.target_amount`                     | From `goals` table                                |
| Progress %      | `(current_amount / target_amount) × 100` | Capped at 100%, floored at 0%                     |
| Target date     | `goal.end_date`                          | Optional — hide if null                           |
| Status badge    | `goal.status`                            | `"active"` \| `"completed"` \| `"cancelled"`      |

### Goal Detail Panel (expanded view)

| Displayed Value            | Source                               | Notes                                            |
| -------------------------- | ------------------------------------ | ------------------------------------------------ |
| Current saved              | `goal.current_amount`                | SUM of contributions                             |
| Target amount              | `goal.target_amount`                 | From goal                                        |
| Progress bar %             | Computed from the two above          |                                                  |
| Remaining amount           | `target_amount − current_amount`     | Computed client-side                             |
| AI completion date         | `prediction.estimatedCompletionDate` | From `GET /prediction`. ISO date string          |
| AI forecast message        | `prediction.prediction`              | Human-readable string from the server            |
| Months to go               | `prediction.monthsNeeded`            | From `GET /prediction`, nullable                 |
| Target date                | `goal.end_date`                      | Optional. Hidden if null                         |
| Contribution count         | `contributions.length`               | Count of items from `GET /contributions`         |
| Contribution history chart | `prediction.timeSeries`              | Array of `{ period, amount }` from `/prediction` |
| Contribution list items    | `contributions[]`                    | Each item from `GET /contributions`              |
| Contribution amount        | `contribution.amount`                | From `goal_contributions` table                  |
| Contribution date          | `contribution.contributed_at`        | From `goal_contributions` table                  |

### Add Contribution Form

| UI Element           | Populated from                            | Notes                                                                                                    |
| -------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Transaction dropdown | `GET /api/transactions?account_id=...`    | Filtered to the goal's `source_account_id`. Already-contributed transactions are excluded from the list. |
| Amount input         | User input                                | Validated: must be > 0 and ≤ transaction amount                                                          |
| Inline error message | `POST /contributions` error response body | Shown directly in the form (e.g. over-allocation message)                                                |

---

## 6.7 Common Error Responses (All Endpoints)

| Status | Body                                         | Cause                                       |
| ------ | -------------------------------------------- | ------------------------------------------- |
| 401    | `{ "error": "Unauthorized: Missing token" }` | No `Authorization` header                   |
| 401    | `{ "error": "Unauthorized: Invalid token" }` | Token is expired or invalid                 |
| 400    | `{ "error": "<message>" }`                   | Business rule violation (see each endpoint) |

All error responses follow the same envelope:

```json
{ "error": "Human-readable error message" }
```

---

## 6.8 Recommended Mobile Implementation Order

1. **On goals list screen load**: call `GET /api/goals` → render cards with `current_amount` and progress bars.
2. **On goal tap**: call `GET /api/goals/:id/contributions` and `GET /api/goals/:id/prediction` in parallel.
3. **Display prediction**: show `estimatedCompletionDate` and `prediction` string. If prediction returns a 400, show a fallback message (e.g. "Add more contributions to see a forecast.").
4. **Add contribution flow**:
   a. Fetch transactions for the goal's `source_account_id`.
   b. Exclude any `transaction_id` already in the contributions list.
   c. Let the user pick a transaction and enter an amount.
   d. `POST /api/goals/:id/contributions`.
   e. On `201`: refresh goal and contributions query.
   f. On `400`: **display the `error` field directly to the user** — especially important for over-allocation messages which include the exact numbers available.
5. **Remove contribution**: `DELETE /api/goals/:id/contributions/:contributionId` → refresh goal.
6. **Create goal**: collect `name`, `target_amount`, `source_account_id`. `end_date` and `description` are optional. `POST /api/goals`.
