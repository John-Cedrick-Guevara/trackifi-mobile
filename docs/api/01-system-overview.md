# 1. System Overview

## 1.1 Purpose

TrackiFi is a personal finance tracking platform that helps users manage their money through:

- **Accounts** — Allowance and Savings wallets with derived balances
- **Transactions** — Income, expense, and transfer recording
- **Cash Flow Analytics** — Time-series charts, category breakdowns, daily summaries
- **Goals** — Savings targets with AI-driven forecasting (exponential smoothing)
- **Investments** — Portfolio tracking with value history and cash-out workflows

## 1.2 Supported Clients

| Client                | Status        | Notes                     |
| --------------------- | ------------- | ------------------------- |
| Web (React + Vite)    | ✅ Production | SPA hosted separately     |
| Mobile (React Native) | 🔜 Planned    | Will consume the same API |

## 1.3 Architecture

```
┌──────────────┐        ┌─────────────────────────┐        ┌──────────────┐
│  Web Client  │───────▶│  Cloudflare Worker API   │───────▶│   Supabase   │
│  (React)     │  HTTPS │  (Hono framework)        │  HTTPS │  (Postgres)  │
└──────────────┘        │                           │        └──────────────┘
                        │  • JWT validation via     │
┌──────────────┐        │    Supabase Auth          │
│ Mobile Client│───────▶│  • Zod request validation │
│  (Planned)   │  HTTPS │  • RLS-enforced queries   │
└──────────────┘        └─────────────────────────┘
```

- **Runtime**: Cloudflare Workers (edge-deployed)
- **Framework**: [Hono](https://hono.dev) v4
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Auth**: Supabase Auth (JWT-based)
- **Validation**: Zod v4 with `@hono/zod-validator`

## 1.4 API Design Philosophy

- **RESTful** — Resource-oriented URLs, standard HTTP verbs
- **Stateless** — Every request carries its own auth token
- **RLS-enforced** — All database queries are scoped to the authenticated user via Supabase RLS policies
- **Edge-first** — Deployed globally on Cloudflare's edge network

## 1.5 Base URL

| Environment | Base URL                                            |
| ----------- | --------------------------------------------------- |
| Local Dev   | `http://localhost:8787`                             |
| Production  | `https://trackifi-api.<your-subdomain>.workers.dev` |

## 1.6 Versioning Strategy

Currently the API does **not** use path-based versioning. All endpoints are mounted under `/api/`.

```
/api/accounts
/api/transactions
/api/cashflows
/api/cashflows/analytics
/api/goals
/api/investments
```

> **Future**: When breaking changes are introduced, the API will migrate to `/api/v1/` prefixed routes. The current paths will be preserved as v1 aliases.

## 1.7 Route Mounting Order

Routes are mounted in specificity order (most specific first):

```typescript
app.route("/api/cashflows/analytics", cashFlowAnalytics);
app.route("/api/cashflows", cashflow);
app.route("/api/goals", goalsRoute);
app.route("/api/investments", investmentRoute);
app.route("/api/accounts", accountRoutes);
app.route("/api/transactions", transactionRoutes);
```

## 1.8 Health Check

```
GET /api/health
```

Returns server status and configuration diagnostics. **No authentication required.**

**Response `200 OK`**:

```json
{
  "status": "ok",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "config": {
    "supabaseUrl": "https://xxx.supabase.co",
    "hasAnonKey": true,
    "hasServiceKey": false,
    "usingKey": "ANON_KEY",
    "warning": null
  }
}
```
