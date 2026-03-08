# 5. Cash Flow & Analytics Module

## 5.1 Overview

The Cash Flow module provides two sub-features:

1. **Quick Entry** (Legacy) — Rapid cash in/out recording to the `cash_flow` table
2. **Analytics** — Aggregated views of transaction data for dashboards and charts

## 5.2 Quick Entry (Legacy)

### `POST /api/cashflows/quick-entry`

Creates a quick cash flow entry in the legacy `cash_flow` table.

**Auth**: Required

**Request Body**:

```json
{
  "amount": "1,500.00",
  "type": "cash_in",
  "category": "Allowance",
  "selectedTags": ["weekly", "parents"]
}
```

**Request Schema**:

```typescript
interface QuickEntryFormData {
  amount: string; // String with optional commas, required
  type: "cash_in" | "cash_out"; // Required
  category: string; // Required, non-empty
  selectedTags: string[]; // Required array of tag strings
}
```

**Response `200 OK`**:

```json
{
  "message": "Quick entry created successfully"
}
```

**Validation**:

- `amount` must be a non-empty string
- `type` must be `"cash_in"` or `"cash_out"`
- `category` must be a non-empty string
- `selectedTags` must be an array of strings

---

## 5.3 Analytics Endpoints

All analytics endpoints are mounted at `/api/cashflows/analytics/`.

---

### `GET /api/cashflows/analytics/today`

Returns today's inflow and outflow summary, aggregated from the `transactions` table.

**Auth**: Required

**Response `200 OK`**:

```json
{
  "inflow": 5000,
  "outflow": 1250.5
}
```

**Logic**:

- `inflow` = sum of all `allowance`-type transactions today
- `outflow` = sum of all `expense`-type transactions today
- Transfers are excluded from net cash flow totals

---

### `GET /api/cashflows/analytics/recent`

Returns the 20 most recent transactions, mapped to a legacy-compatible format.

**Auth**: Required

**Response `200 OK`**:

```json
[
  {
    "uuid": "t1234567-89ab-cdef-0123-456789abcdef",
    "amount": 350.5,
    "type": "out",
    "metadata": {
      "category_name": "Food & Dining"
    },
    "logged_at": "2026-03-08T14:30:00.000Z"
  },
  {
    "uuid": "t2345678-9abc-def0-1234-56789abcdef0",
    "amount": 5000,
    "type": "in",
    "metadata": {
      "category_name": "Allowance"
    },
    "logged_at": "2026-03-08T12:00:00.000Z"
  }
]
```

**Mapping**:
| DB `transaction_type` | Mapped `type` |
|----------------------|---------------|
| `allowance` | `"in"` |
| `income` | `"in"` |
| `expense` | `"out"` |
| `transfer` | `"transfer"` |

---

### `GET /api/cashflows/analytics/timeseries`

Returns aggregated cash flow time series data for chart rendering.

**Auth**: Required

**Query Parameters**:

| Parameter   | Type   | Required | Description                           |
| ----------- | ------ | -------- | ------------------------------------- |
| `timeView`  | string | **Yes**  | `"daily"`, `"weekly"`, or `"monthly"` |
| `startDate` | string | **Yes**  | ISO 8601 date (e.g. `2026-01-01`)     |
| `endDate`   | string | **Yes**  | ISO 8601 date (e.g. `2026-03-31`)     |

**Example Request**:

```
GET /api/cashflows/analytics/timeseries?timeView=monthly&startDate=2026-01-01&endDate=2026-03-31
```

**Response `200 OK`**:

```json
[
  { "period": "2026-01", "inflow": 20000, "outflow": 12500, "savings": 5000 },
  { "period": "2026-02", "inflow": 20000, "outflow": 15000, "savings": 3000 },
  { "period": "2026-03", "inflow": 20000, "outflow": 11000, "savings": 7000 }
]
```

**Period Key Formats**:
| `timeView` | Period Format | Example |
|------------|---------------|---------|
| `daily` | `YYYY-MM-DD` | `2026-03-08` |
| `weekly` | `YYYY-MM-DD` (Monday) | `2026-03-02` |
| `monthly` | `YYYY-MM` | `2026-03` |

**Data Rules**:

- Transfers and investment-related transactions are excluded
- `inflow` = allowance-type transactions
- `outflow` = expense-type transactions
- `savings` = income-type transactions

**Error Responses**:

| Status | Body                                                                       | Condition       |
| ------ | -------------------------------------------------------------------------- | --------------- |
| 400    | `{ "error": "Missing required parameters: timeView, startDate, endDate" }` | Missing params  |
| 400    | `{ "error": "Invalid timeView. Must be: daily, weekly, or monthly" }`      | Bad enum value  |
| 401    | `{ "error": "Unauthorized: Missing token" }`                               | No Bearer token |

---

### `GET /api/cashflows/analytics/by-category`

Returns spending or income breakdown by category with percentages.

**Auth**: Required

**Query Parameters**:

| Parameter   | Type   | Required | Description                          |
| ----------- | ------ | -------- | ------------------------------------ |
| `startDate` | string | **Yes**  | ISO 8601 date                        |
| `endDate`   | string | **Yes**  | ISO 8601 date                        |
| `type`      | string | No       | `"in"` or `"out"` (default: `"out"`) |

**Example Request**:

```
GET /api/cashflows/analytics/by-category?startDate=2026-03-01&endDate=2026-03-31&type=out
```

**Response `200 OK`**:

```json
[
  { "category": "Food & Dining", "amount": 8500, "percentage": 42.5 },
  { "category": "Transportation", "amount": 5000, "percentage": 25.0 },
  { "category": "Shopping", "amount": 3500, "percentage": 17.5 },
  { "category": "Entertainment", "amount": 2000, "percentage": 10.0 },
  { "category": "Health", "amount": 1000, "percentage": 5.0 }
]
```

**Data Rules**:

- Results sorted by `amount` descending
- Investment-related transactions are excluded
- `percentage` is relative to the total within the filtered set
- Transactions without a category appear as `"Uncategorized"`
- `type: "in"` maps to DB type `"income"`, `type: "out"` maps to `"expense"`
