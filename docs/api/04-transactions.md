# 4. Transactions Module

## 4.1 Overview

Transactions are the core financial records. Every money movement is a transaction. Three types exist:

- **`allowance`** — Money in to an allowance account (e.g., weekly pocket money)
- **`income`** — Money in to a savings account
- **`expense`** — Money out from an account
- **`transfer`** — Money moved between two accounts (neither income nor expense)

> **Note**: The `transaction_type` stored in the database uses `allowance` for allowance-type income and `income` for savings-type income. The `TransactionType` TypeScript type uses `"income" | "expense" | "transfer"` for the API-facing interface.

## 4.2 Data Model

```typescript
type TransactionType = "income" | "expense" | "transfer";

interface Transaction {
  id: string; // UUID, primary key
  user_uuid: string; // UUID, owner
  amount: number; // Always positive
  transaction_type: TransactionType; // "income" | "expense" | "transfer"
  from_account_id: string | null; // Source account (expenses, transfers)
  to_account_id: string | null; // Destination account (income, transfers)
  date: string; // ISO 8601 datetime
  category: string | null; // e.g. "Food & Dining", "Transportation"
  description: string | null; // Free-text note
  metadata: Record<string, any>; // Flexible JSON (e.g. investment_uuid)
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

### Request Schemas

```typescript
interface CreateIncomeRequest {
  amount: number; // Required, must be > 0
  to_account_id: string; // Required, valid UUID
  date?: string; // ISO 8601, defaults to now()
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface CreateExpenseRequest {
  amount: number; // Required, must be > 0
  from_account_id: string; // Required, valid UUID
  date?: string; // ISO 8601, defaults to now()
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface CreateTransferRequest {
  amount: number; // Required, must be > 0
  from_account_id: string; // Required, valid UUID
  to_account_id: string; // Required, valid UUID, must differ from source
  date?: string; // ISO 8601, defaults to now()
  description?: string;
  metadata?: Record<string, any>;
}

interface TransactionFilters {
  transaction_type?: TransactionType; // Filter by type
  account_id?: string; // Filter by account (matches from OR to)
  start_date?: string; // ISO 8601 datetime
  end_date?: string; // ISO 8601 datetime
  limit?: number; // Max 100, default 20
  offset?: number; // For pagination
}
```

## 4.3 Endpoints

---

### `POST /api/transactions/income`

Create an income transaction. The `to_account_id` determines the sub-type:

- If the target account type is `savings` → stored as `transaction_type: "income"`
- If the target account type is `allowance` → stored as `transaction_type: "allowance"`

**Auth**: Required

**Request Body**:

```json
{
  "amount": 5000,
  "to_account_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2026-03-08T12:00:00.000Z",
  "category": "Allowance",
  "description": "Weekly allowance from parents"
}
```

**Response `200 OK`**:

```json
{
  "data": {
    "id": "t1234567-89ab-cdef-0123-456789abcdef",
    "user_uuid": "u1234567-89ab-cdef-0123-456789abcdef",
    "amount": 5000,
    "transaction_type": "allowance",
    "from_account_id": null,
    "to_account_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "date": "2026-03-08T12:00:00.000Z",
    "category": "Allowance",
    "description": "Weekly allowance from parents",
    "metadata": {},
    "created_at": "2026-03-08T12:00:00.000Z",
    "updated_at": "2026-03-08T12:00:00.000Z"
  },
  "message": "Income created successfully"
}
```

**Validation Rules**:

- `amount` must be a positive number
- `to_account_id` must be a valid UUID and belong to the authenticated user

---

### `POST /api/transactions/expense`

Create an expense transaction.

**Auth**: Required

**Request Body**:

```json
{
  "amount": 350.5,
  "from_account_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2026-03-08T14:30:00.000Z",
  "category": "Food & Dining",
  "description": "Lunch at Jollibee"
}
```

**Response `200 OK`**:

```json
{
  "data": {
    "id": "t2345678-9abc-def0-1234-56789abcdef0",
    "user_uuid": "u1234567-89ab-cdef-0123-456789abcdef",
    "amount": 350.5,
    "transaction_type": "expense",
    "from_account_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "to_account_id": null,
    "date": "2026-03-08T14:30:00.000Z",
    "category": "Food & Dining",
    "description": "Lunch at Jollibee",
    "metadata": {},
    "created_at": "2026-03-08T14:30:00.000Z",
    "updated_at": "2026-03-08T14:30:00.000Z"
  },
  "message": "Expense created successfully"
}
```

---

### `POST /api/transactions/transfer`

Transfer money between two accounts owned by the same user.

**Auth**: Required

**Request Body**:

```json
{
  "amount": 2000,
  "from_account_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "to_account_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "description": "Move to savings"
}
```

**Response `200 OK`**:

```json
{
  "data": {
    "id": "t3456789-abcd-ef01-2345-6789abcdef01",
    "user_uuid": "u1234567-89ab-cdef-0123-456789abcdef",
    "amount": 2000,
    "transaction_type": "transfer",
    "from_account_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "to_account_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "date": "2026-03-08T15:00:00.000Z",
    "category": null,
    "description": "Move to savings",
    "metadata": {},
    "created_at": "2026-03-08T15:00:00.000Z",
    "updated_at": "2026-03-08T15:00:00.000Z"
  },
  "message": "Transfer created successfully"
}
```

**Validation**: Source and destination accounts must be different.

---

### `GET /api/transactions`

Retrieve transaction history with optional filters. Results are ordered by `date` descending.

**Auth**: Required

**Query Parameters**:

| Parameter          | Type     | Required | Description                                                      |
| ------------------ | -------- | -------- | ---------------------------------------------------------------- |
| `transaction_type` | string   | No       | `"income"`, `"expense"`, or `"transfer"`                         |
| `account_id`       | UUID     | No       | Filter by account (matches `from_account_id` OR `to_account_id`) |
| `start_date`       | ISO 8601 | No       | Inclusive start date                                             |
| `end_date`         | ISO 8601 | No       | Inclusive end date                                               |
| `limit`            | integer  | No       | Max rows (1–100), default: 20                                    |
| `offset`           | integer  | No       | Skip N rows for pagination                                       |

**Example Request**:

```
GET /api/transactions?transaction_type=expense&start_date=2026-03-01T00:00:00.000Z&limit=10
```

**Response `200 OK`**:

```json
{
  "data": [
    {
      "id": "t2345678-9abc-def0-1234-56789abcdef0",
      "user_uuid": "u1234567-89ab-cdef-0123-456789abcdef",
      "amount": 350.5,
      "transaction_type": "expense",
      "from_account_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "to_account_id": null,
      "date": "2026-03-08T14:30:00.000Z",
      "category": "Food & Dining",
      "description": "Lunch at Jollibee",
      "metadata": {},
      "created_at": "2026-03-08T14:30:00.000Z",
      "updated_at": "2026-03-08T14:30:00.000Z"
    }
  ]
}
```

## 4.4 Error Responses

| Status | Body                                             | Condition                              |
| ------ | ------------------------------------------------ | -------------------------------------- |
| 400    | `{ "error": { ... } }`                           | Zod validation failure                 |
| 401    | `{ "error": "Unauthorized: Missing token" }`     | No Bearer token                        |
| 500    | `{ "error": "<message>" }`                       | Database or server error               |
| 500    | `{ "error": "Invalid account or unauthorized" }` | Account not found or not owned by user |
