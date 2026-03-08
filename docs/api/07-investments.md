# 7. Investments Module

## 7.1 Overview

The Investments module lets users track financial instruments (stocks, crypto, mutual funds, savings instruments, etc.) with full value history, gain/loss calculations, and cash-out workflows. Investment operations automatically record corresponding transactions.

## 7.2 Data Model

```typescript
type InvestmentType = "stock" | "crypto" | "fund" | "savings" | "other";
type InvestmentStatus = "active" | "closed";

interface Investment {
  uuid: string; // UUID, primary key
  user_uuid: string; // UUID, owner
  name: string; // Investment name
  type: InvestmentType; // Asset type
  principal: number; // Original amount invested
  current_value: number; // Latest market value
  start_date: string; // ISO 8601 date
  status: InvestmentStatus; // "active" | "closed"
  metadata?: Record<string, any>; // Flexible JSON
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  // Calculated fields (returned by API, not stored)
  absolute_gain?: number; // current_value - principal
  percentage_change?: number; // (absolute_gain / principal) * 100
}

interface InvestmentValueHistory {
  uuid: string; // UUID
  investment_uuid: string; // FK to Investment
  value: number; // Recorded value
  recorded_at: string; // ISO 8601 timestamp
  notes?: string; // Description
  created_at: string; // ISO 8601 timestamp
}

interface CreateInvestmentPayload {
  name: string; // Required
  type: InvestmentType; // Required
  principal: number; // Required, > 0
  start_date: string; // Required, ISO 8601
  metadata?: Record<string, any>;
}

interface UpdateValuePayload {
  value: number; // Required, >= 0
  recorded_at?: string; // Optional, defaults to now()
  notes?: string;
}

interface CashOutPayload {
  amount: number; // Required, > 0
  date: string; // Required, ISO 8601
  notes?: string;
}
```

## 7.3 Endpoints

---

### `POST /api/investments`

Create a new investment. This performs three operations atomically:

1. Creates the investment record
2. Adds initial value history entry
3. Records an expense transaction against the user's allowance account

**Auth**: Required

**Request Body**:

```json
{
  "name": "FMETF ETF",
  "type": "fund",
  "principal": 10000,
  "start_date": "2026-03-01",
  "metadata": { "broker": "COL Financial" }
}
```

**Response `200 OK`**:

```json
{
  "data": {
    "uuid": "i1234567-89ab-cdef-0123-456789abcdef",
    "user_uuid": "u1234567-89ab-cdef-0123-456789abcdef",
    "name": "FMETF ETF",
    "type": "fund",
    "principal": 10000,
    "current_value": 10000,
    "start_date": "2026-03-01",
    "status": "active",
    "metadata": { "broker": "COL Financial" },
    "created_at": "2026-03-01T00:00:00.000Z",
    "updated_at": "2026-03-01T00:00:00.000Z"
  }
}
```

---

### `GET /api/investments`

List all investments with calculated gains.

**Auth**: Required

**Response `200 OK`**:

```json
{
  "data": [
    {
      "uuid": "i1234567-89ab-cdef-0123-456789abcdef",
      "name": "FMETF ETF",
      "type": "fund",
      "principal": 10000,
      "current_value": 11500,
      "start_date": "2026-03-01",
      "status": "active",
      "absolute_gain": 1500,
      "percentage_change": 15.0,
      "created_at": "2026-03-01T00:00:00.000Z",
      "updated_at": "2026-03-08T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/investments/:id`

Get a single investment with full value history.

**Auth**: Required

**Response `200 OK`**:

```json
{
  "data": {
    "uuid": "i1234567-89ab-cdef-0123-456789abcdef",
    "name": "FMETF ETF",
    "type": "fund",
    "principal": 10000,
    "current_value": 11500,
    "absolute_gain": 1500,
    "percentage_change": 15.0,
    "history": [
      {
        "uuid": "h1...",
        "value": 10000,
        "recorded_at": "2026-03-01T00:00:00.000Z",
        "notes": "Initial investment"
      },
      {
        "uuid": "h2...",
        "value": 10500,
        "recorded_at": "2026-03-15T00:00:00.000Z",
        "notes": "Market update"
      },
      {
        "uuid": "h3...",
        "value": 11500,
        "recorded_at": "2026-03-08T00:00:00.000Z",
        "notes": null
      }
    ]
  }
}
```

---

### `POST /api/investments/:id/value`

Record a new value for an investment (e.g., after a market update).

**Auth**: Required

**Request Body**:

```json
{
  "value": 12000,
  "recorded_at": "2026-03-15T00:00:00.000Z",
  "notes": "Monthly portfolio review"
}
```

**Response `200 OK`**:

```json
{
  "data": {
    "uuid": "i1234567-89ab-cdef-0123-456789abcdef",
    "current_value": 12000,
    "updated_at": "2026-03-15T00:00:00.000Z"
  }
}
```

---

### `POST /api/investments/:id/cashout`

Withdraw money from an investment. This performs:

1. Reduces `current_value` and proportionally reduces `principal`
2. Sets status to `"closed"` if value reaches 0
3. Adds value history entry
4. Records an income transaction to the user's allowance account

**Auth**: Required

**Request Body**:

```json
{
  "amount": 5000,
  "date": "2026-03-08",
  "notes": "Partial withdrawal for emergency"
}
```

**Response `200 OK`**:

```json
{
  "data": {
    "uuid": "i1234567-89ab-cdef-0123-456789abcdef",
    "current_value": 7000,
    "principal": 5833.33,
    "status": "active",
    "updated_at": "2026-03-08T00:00:00.000Z"
  }
}
```

**Error**: `{ "error": "Withdrawal amount exceeds current value" }` → `400`

---

### `DELETE /api/investments/:id`

Delete an investment record.

**Auth**: Required

**Response `200 OK`**:

```json
{
  "message": "Investment deleted successfully"
}
```

## 7.4 Error Responses

| Status | Body                                         | Condition                              |
| ------ | -------------------------------------------- | -------------------------------------- |
| 400    | `{ "error": "<validation message>" }`        | Zod validation or business logic error |
| 401    | `{ "error": "Unauthorized: Missing token" }` | No Bearer token                        |
| 404    | `{ "error": "<message>" }`                   | Investment not found                   |
