# 3. Accounts Module

## 3.1 Overview

Accounts represent financial wallets for the user. Currently two types are supported: **allowance** (spending money) and **savings**. Balances are **derived** from transactions — never stored directly.

## 3.2 Data Model

```typescript
type AccountType = "allowance" | "savings";

interface Account {
  id: string; // UUID, primary key
  user_uuid: string; // UUID, references the owner
  name: string; // User-defined account name
  type: AccountType; // "allowance" | "savings"
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

interface AccountWithBalance extends Account {
  balance: number; // Calculated from transactions (derived, never stored)
}
```

## 3.3 Endpoints

---

### `GET /api/accounts`

Returns all accounts for the authenticated user, each with a calculated balance.

**Auth**: Required

**Response `200 OK`**:

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_uuid": "u1234567-89ab-cdef-0123-456789abcdef",
      "name": "Main Allowance",
      "type": "allowance",
      "balance": 15250.75,
      "created_at": "2026-01-15T08:00:00.000Z",
      "updated_at": "2026-03-01T10:30:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "user_uuid": "u1234567-89ab-cdef-0123-456789abcdef",
      "name": "Emergency Savings",
      "type": "savings",
      "balance": 50000.0,
      "created_at": "2026-01-15T08:00:00.000Z",
      "updated_at": "2026-02-20T14:00:00.000Z"
    }
  ]
}
```

**Error Responses**:

| Status | Body                                         | Condition             |
| ------ | -------------------------------------------- | --------------------- |
| 401    | `{ "error": "Unauthorized: Missing token" }` | No Bearer token       |
| 500    | `{ "error": "<message>" }`                   | Server/database error |

---

### `GET /api/accounts/:id`

Returns a single account by ID.

**Auth**: Required

**Path Parameters**:

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| `id`      | UUID | Yes      | Account ID  |

**Response `200 OK`**:

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_uuid": "u1234567-89ab-cdef-0123-456789abcdef",
    "name": "Main Allowance",
    "type": "allowance",
    "created_at": "2026-01-15T08:00:00.000Z",
    "updated_at": "2026-03-01T10:30:00.000Z"
  }
}
```

---

### `GET /api/accounts/:id/balance`

Returns the derived balance for a specific account.

**Auth**: Required

**Path Parameters**:

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| `id`      | UUID | Yes      | Account ID  |

**Response `200 OK`**:

```json
{
  "data": {
    "balance": 15250.75
  }
}
```

**Balance Calculation**: Balance is computed server-side via the `get_account_balance` Supabase RPC function, which aggregates all transactions where the account appears as `from_account_id` (debits) or `to_account_id` (credits).
