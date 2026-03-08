# TrackiFi Backend API Documentation

> **Version**: 1.0.0  
> **Last Updated**: 2026-03-08  
> **Runtime**: Cloudflare Workers (Hono v4)  
> **Database**: Supabase (PostgreSQL + RLS)  
> **Auth**: Supabase Auth (JWT)

---

## Table of Contents

| #   | Section                                                                      | File                                   | Description                                        |
| --- | ---------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| 1   | [System Overview](./01-system-overview.md)                                   | `01-system-overview.md`                | Architecture, base URL, versioning, health check   |
| 2   | [Authentication & Security](./02-authentication.md)                          | `02-authentication.md`                 | JWT flow, token validation, RLS, CORS              |
| 3   | [Accounts Module](./03-accounts.md)                                          | `03-accounts.md`                       | Allowance & savings accounts with derived balances |
| 4   | [Transactions Module](./04-transactions.md)                                  | `04-transactions.md`                   | Income, expense, transfer CRUD + filtering         |
| 5   | [Cash Flow & Analytics](./05-cashflow-analytics.md)                          | `05-cashflow-analytics.md`             | Quick entry, today summary, timeseries, categories |
| 6   | [Goals Module](./06-goals.md)                                                | `06-goals.md`                          | Savings goals + exponential smoothing forecasting  |
| 7   | [Investments Module](./07-investments.md)                                    | `07-investments.md`                    | Portfolio tracking, value history, cash-out        |
| 8   | [Errors, Pagination & Rate Limiting](./08-errors-pagination-ratelimiting.md) | `08-errors-pagination-ratelimiting.md` | Error formats, pagination, rate limits             |
| 9   | [Data Models](./09-data-models.md)                                           | `09-data-models.md`                    | Complete TypeScript interfaces for all entities    |
| 10  | [Mobile Integration](./10-mobile-integration.md)                             | `10-mobile-integration.md`             | Latency, caching, offline sync, idempotency        |

---

## Quick Reference — All Endpoints

### Health

| Method | Path          | Auth | Description                        |
| ------ | ------------- | ---- | ---------------------------------- |
| `GET`  | `/api/health` | No   | Server status & config diagnostics |

### Accounts

| Method | Path                        | Auth | Description                     |
| ------ | --------------------------- | ---- | ------------------------------- |
| `GET`  | `/api/accounts`             | Yes  | List all accounts with balances |
| `GET`  | `/api/accounts/:id`         | Yes  | Get single account              |
| `GET`  | `/api/accounts/:id/balance` | Yes  | Get derived account balance     |

### Transactions

| Method | Path                         | Auth | Description                      |
| ------ | ---------------------------- | ---- | -------------------------------- |
| `GET`  | `/api/transactions`          | Yes  | List transactions (with filters) |
| `POST` | `/api/transactions/income`   | Yes  | Create income transaction        |
| `POST` | `/api/transactions/expense`  | Yes  | Create expense transaction       |
| `POST` | `/api/transactions/transfer` | Yes  | Create transfer transaction      |

### Cash Flow

| Method | Path                         | Auth | Description             |
| ------ | ---------------------------- | ---- | ----------------------- |
| `POST` | `/api/cashflows/quick-entry` | Yes  | Legacy quick cash entry |

### Cash Flow Analytics

| Method | Path                                   | Auth | Description                          |
| ------ | -------------------------------------- | ---- | ------------------------------------ |
| `GET`  | `/api/cashflows/analytics/today`       | Yes  | Today's inflow/outflow summary       |
| `GET`  | `/api/cashflows/analytics/recent`      | Yes  | Last 20 transactions (legacy format) |
| `GET`  | `/api/cashflows/analytics/timeseries`  | Yes  | Aggregated time series data          |
| `GET`  | `/api/cashflows/analytics/by-category` | Yes  | Category spending breakdown          |

### Goals

| Method | Path                             | Auth | Description                |
| ------ | -------------------------------- | ---- | -------------------------- |
| `GET`  | `/api/goals/generate-prediction` | Yes  | AI-powered goal prediction |

### Investments

| Method   | Path                           | Auth | Description                       |
| -------- | ------------------------------ | ---- | --------------------------------- |
| `GET`    | `/api/investments`             | Yes  | List all investments with gains   |
| `GET`    | `/api/investments/:id`         | Yes  | Get investment with value history |
| `POST`   | `/api/investments`             | Yes  | Create new investment             |
| `POST`   | `/api/investments/:id/value`   | Yes  | Record new value                  |
| `POST`   | `/api/investments/:id/cashout` | Yes  | Withdraw from investment          |
| `DELETE` | `/api/investments/:id`         | Yes  | Delete investment                 |

---

## Authentication Quick Start

```bash
# All requests require:
Authorization: Bearer <supabase_access_token>
```

Tokens are obtained client-side via Supabase Auth SDK. See [Authentication docs](./02-authentication.md) for full details.

---

## Tech Stack

| Layer      | Technology                   |
| ---------- | ---------------------------- |
| Runtime    | Cloudflare Workers           |
| Framework  | Hono v4                      |
| Database   | Supabase (PostgreSQL)        |
| Auth       | Supabase Auth (JWT)          |
| Validation | Zod v4 + @hono/zod-validator |
| Security   | Row Level Security (RLS)     |
| Deploy     | `wrangler deploy`            |
