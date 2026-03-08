# Goal Projection Feature Plan (User Pattern + Time-to-Goal)

## 1) Current Repository Context (What exists today)

### Existing product capabilities
- The app already tracks:
  - User profile and onboarding goal capture (`users`, `goals`).
  - Account-based transactions (`income`, `expense`, `transfer`) with derived balances.
  - Investment positions and value history.
  - Analytics views for trends and category-level spending/income.
- Backend is a Hono API on Cloudflare Workers using Supabase auth + RLS.
- Frontend is React + TanStack Query/Router + charting components for analytics.

### Data model readiness for this feature
- **Directly usable now**:
  - `goals` (target amount/date range).
  - `transactions` (cash flow behavior).
  - `investments` + `investment_value_history` (holdings growth and changes).
  - `insights` table for generated recommendations.
- **Potential gap**:
  - Current `schema.sql` still reflects an older schema that doesn't include `accounts`/`transactions`, while server/services and README are built around `transactions` + derived balances. Treat current production DB migrations as source of truth.

## 2) Feature Goal Definition

Predict **how long it will take a user to reach their goal** using observed behavior from transactions and holdings.

Primary output examples:
- "At current pace, you will reach ₱100,000 in ~8.4 months (P50 confidence)."
- "If monthly spending decreases by 10%, ETA improves by 1.2 months."
- "With expected investment growth, ETA range is 6.8–10.1 months."

## 3) Logical Model (How it should work)

### Inputs
- Active user goals (`goals.status = active`).
- Last N months of transactions (recommend 6–12 months).
- Current account balances and net monthly contribution behavior.
- Investment current value + history (for optional growth scenarios).

### Feature engineering
1. **Monthly net contribution baseline**
   - Inflow minus outflow from transaction stream.
   - Exclude pure internal transfers to avoid double counting.
2. **Savings/investment flow decomposition**
   - Identify recurring deposits and recurring expenses.
   - Separate one-off anomalies (e.g., unusual large outlier transactions).
3. **Volatility and confidence bands**
   - Compute std-dev of monthly net contribution.
   - Produce conservative/base/optimistic scenarios.
4. **Holdings growth estimate**
   - If sufficient history exists, estimate monthly return trend for investments.
   - If data sparse, use conservative default and clearly label as assumption.

### Forecast engine
For each active goal:
1. Compute remaining amount = `target_amount - current_progress`.
2. Estimate monthly progress =
   - `monthly_net_contribution`
   - `+ expected_investment_growth` (scenario-based).
3. ETA (months) = `remaining_amount / projected_monthly_progress`.
4. If projected progress <= 0, return "goal unreachable at current behavior" plus action suggestions.
5. Store generated insight rows in `insights` with trigger type like `goal_projection`.

### UX behavior
- Show ETA badge + confidence range.
- Show "why" card (top 3 drivers: recurring expense category impact, net contribution trend, investment trend).
- Add scenario sliders (e.g., cut dining by x%, add monthly savings y).
- Refresh forecast after every new transaction/investment update (or on scheduled batch + cache).

## 4) Architecture and Technology Recommendation

## Preferred architecture in this repo
Because backend runs on Cloudflare Workers (TypeScript), keep the **serving API path in TypeScript** and use Python for model computation as a sidecar batch service.

### Option A (recommended): Hybrid TS + Python
- **Python service** (FastAPI or scheduled job):
  - Pull user financial series from Supabase.
  - Train/compute forecasts and write compact prediction outputs to a table (e.g., `goal_forecasts`) plus `insights`.
- **Worker API**:
  - Expose `/api/goals/forecast` by reading precomputed forecasts.
  - Fallback to lightweight TS calculation if no precompute exists.
- **Why this fits**:
  - Keeps frontend/backend integration consistent with existing stack.
  - Enables richer Python analytics without forcing Python runtime into Cloudflare Worker execution path.

### Option B: TypeScript-only forecast (fastest to ship)
- Implement deterministic formulas in existing Worker service.
- Good for V1 if you want no extra infra.
- You can later swap in Python-generated forecasts.

### Python stack suggestions
- Data: `pandas`, `numpy`, `scipy`.
- Modeling: start simple with robust heuristics + linear trend/EMA; optionally add `statsmodels` later.
- Validation: backtesting with rolling-window MAE/MAPE.
- Orchestration: GitHub Actions cron / Cloudflare Cron trigger calling Python endpoint / external worker.

## 5) Implementation Plan (Phased)

### Phase 1 — Deterministic V1 (1–2 weeks)
- Add forecast schema/table (e.g., `goal_forecasts`).
- Build backend endpoint returning ETA and simple confidence interval.
- Use last 6 months net contribution + optional investment growth.
- Render card on dashboard/analytics with actionable suggestions.

### Phase 2 — Pattern intelligence (2–4 weeks)
- Add recurring-transaction detection and anomaly filtering.
- Add scenario simulator in UI.
- Persist generated explanations to `insights` for history.

### Phase 3 — Python model integration (optional, 2–4+ weeks)
- Deploy Python compute job for richer forecasting.
- Introduce model versioning + quality metrics.
- A/B compare against deterministic baseline.

## 6) Success Criteria

### Product KPIs
- Forecast coverage: % of active-goal users receiving a forecast.
- User actionability: % users interacting with suggestions/scenarios.
- Retention impact: lift in weekly active users among goal-set users.

### Model KPIs
- Forecast error (MAE/MAPE) on historical backtests.
- Calibration quality: actual outcomes within predicted interval frequency.
- Stability: ETA change bounded unless major new transaction occurs.

### System KPIs
- Forecast API latency target: p95 < 300ms for cached/precomputed reads.
- Freshness SLA: recompute within X minutes/hours after new transactions.
- Failure mode: if model unavailable, return deterministic fallback with flag.

## 7) Risks and Guardrails

- Sparse data users: gate with minimum history threshold and show "insufficient data".
- Data quality drift: watch for schema mismatch (`cash_flow` legacy vs `transactions` current).
- Interpretability: always provide top drivers and assumptions.
- Privacy/safety: keep all computation inside your controlled infra and enforce existing RLS boundaries.

## 8) Immediate Next Steps

1. Confirm canonical DB schema/migrations and ensure `schema.sql` is aligned.
2. Define V1 forecast contract (`goal_id`, `eta_months`, `confidence`, `drivers`, `assumptions`, `model_version`).
3. Implement deterministic endpoint in Worker first.
4. Add a small dashboard widget + analytics details panel.
5. Add backtest script (can be Python) and baseline quality report before launch.
