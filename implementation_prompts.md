# Phase-by-Phase Implementation Prompts

Here are the phase-by-phase one-shot implementation prompts, each designed to be self-contained and actionable:

---

## Phase 1 — Foundation & Design System

```
ROLE
You are a Senior React Native / Expo Engineer.

OBJECTIVE
Implement the foundational design system and infrastructure layer for TrackiFi, an Expo 55 + Expo Router finance tracking app.

CONTEXT
- Project root: trackifi-mobile (Expo 55, Expo Router, TypeScript)
- Backend: Cloudflare Workers (Hono v4) + Supabase (PostgreSQL + JWT Auth)
- Backend API docs are in docs/api/ — use 09-data-models.md for TypeScript types and 10-mobile-integration.md for caching strategy

DELIVERABLES

1. DESIGN TOKENS — Create src/constants/tokens.ts
   - Typography scale: display (32/700), headline (24/600), title (20/600), body (16/400), bodyBold (16/600), caption (14/400), small (12/400)
   - Color system with Dark theme:
     - background: #0D0D0F, surface: #1A1A1E, surfaceElevated: #242428, border: #2A2A2E
     - textPrimary: #FFFFFF, textSecondary: #9CA3AF, textTertiary: #6B7280
     - Financial: income/gain: #22C55E, expense/loss: #EF4444, transfer: #3B82F6, savings: #8B5CF6, warning: #F59E0B
     - Accent: accent: #6366F1, accentLight: #818CF8
   - Light theme overrides: background: #F9FAFB, surface: #FFFFFF, surfaceElevated: #F3F4F6, border: #E5E7EB, textPrimary: #111827, textSecondary: #6B7280
   - Spacing: xs(4), sm(8), md(16), lg(24), xl(32), 2xl(48)
   - Border radius: sm(8), md(12), lg(16), xl(24), full(9999)

2. THEME PROVIDER — Create src/providers/ThemeProvider.tsx
   - React Context providing current theme (dark/light) and toggle
   - useTheme() hook returning typed color, spacing, typography, and radius tokens
   - Respect system color scheme preference with manual override

3. ATOM UI COMPONENTS — Create src/components/ui/
   - Text.tsx — Themed text with variant prop (display, headline, title, body, bodyBold, caption, small) + color override
   - Button.tsx — Variants: primary (accent bg), secondary (surface bg), ghost (transparent), destructive (loss bg). States: loading, disabled. Sizes: sm, md, lg
   - Input.tsx — Text input with label, placeholder, error message, left/right icons
   - Badge.tsx — Small pill: variants for income (green), expense (red), transfer (blue), savings (purple), neutral (gray)
   - Divider.tsx — Horizontal line using border color
   - Avatar.tsx — Circular with initials fallback, configurable size
   All components must use tokens from useTheme(), no hardcoded colors.

4. FEEDBACK COMPONENTS — Create src/components/feedback/
   - Skeleton.tsx — Animated placeholder with configurable width, height, borderRadius
   - EmptyState.tsx — Icon + title + message + optional CTA button
   - ErrorBoundary.tsx — Catches errors, shows retry button

5. LAYOUT COMPONENTS — Create src/components/layout/
   - PageLayout.tsx — ScrollView wrapper with safe area insets, pull-to-refresh support, consistent padding
   - BottomSheet.tsx — Slide-up panel (use react-native-gesture-handler + reanimated), backdrop, drag handle

6. TYPESCRIPT TYPES — Create src/types/ mirroring backend data models from docs/api/09-data-models.md exactly:
   - accounts.ts: AccountType, Account, AccountWithBalance, CreateAccountRequest
   - transactions.ts: TransactionType, Transaction, CreateIncomeRequest, CreateExpenseRequest, CreateTransferRequest, TransactionFilters
   - analytics.ts: TodaySummary, RecentTransaction, TimeSeriesEntry, CategoryBreakdown
   - goals.ts: Goal, CreateGoalPayload, UpdateGoalPayload, PredictionResponse
   - investments.ts: InvestmentType, InvestmentStatus, Investment, InvestmentValueHistory, CreateInvestmentPayload, UpdateValuePayload, CashOutPayload
   - api.ts: ApiResponse<T> wrapper { data: T }, ApiError union type (app | validation | auth | network), ZodValidationError shape

7. API CLIENT — Create src/services/api-client.ts
   - Class-based fetch wrapper with:
     - Auto-attaches Authorization: Bearer <token> from stored session
     - Handles 401 by refreshing token and retrying once
     - Handles 429 with exponential backoff (2^attempt * 1000ms, max 3 retries)
     - Normalizes all error responses into ApiError union type
     - Generic request<T>(endpoint, options) method
   - Export singleton instance

8. QUERY PROVIDER — Create src/providers/QueryProvider.tsx
   - TanStack React Query v5 QueryClient with defaults:
     - staleTime: 2 minutes
     - retry: 2
     - refetchOnWindowFocus: true
   - Wraps children with QueryClientProvider

9. UTILITY FUNCTIONS — Create src/utils/
   - currency.ts: formatCurrency(amount, currency?) → "₱1,500.00" format
   - date.ts: formatDate(iso), formatRelativeTime(iso), getStartOfDay/Week/Month
   - constants.ts: API_BASE_URL, default categories list, query key constants

INSTALL REQUIRED PACKAGES:
- @supabase/supabase-js
- @tanstack/react-query
- zustand
- react-hook-form
- @hookform/resolvers
- zod
- expo-secure-store

UPDATE ROOT LAYOUT (src/app/_layout.tsx):
- Wrap app with ThemeProvider → QueryProvider

CONSTRAINTS
- All components use StyleSheet.create, never inline styles
- All colors come from theme tokens, zero hardcoded values
- Export types/components with barrel (index.ts) files
- Strict TypeScript — no any types except where matching backend Record<string, any>
```

---

## Phase 2 — Authentication

```
ROLE
You are a Senior React Native / Expo Engineer.

OBJECTIVE
Implement the complete authentication system for TrackiFi using Supabase Auth with secure token management.

CONTEXT
- Project: Expo 55 + Expo Router + TypeScript
- Phase 1 (Foundation) is complete — design tokens, theme, atom components, API client, types, and providers are ready in src/
- Backend uses Supabase Auth (JWT) — see docs/api/02-authentication.md
- Auth is client-side via Supabase JS SDK; the TrackiFi API receives Bearer tokens
- Access tokens expire in 1 hour; refresh tokens last 60 days

DELIVERABLES

1. SUPABASE CLIENT — Create src/services/supabase.ts
   - Initialize with createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
   - Use expo-secure-store for token persistence on native
   - Use localStorage fallback for web
   - Export the typed client instance

2. AUTH STORE — Create src/features/auth/store.ts (Zustand)
   - State: { session, user, isLoading, isAuthenticated }
   - Actions: initialize(), signIn(email, password), signUp(email, password), signOut(), refreshSession()
   - initialize() should check for existing session on app start
   - Listen to supabase.auth.onAuthStateChange() for session updates
   - Update isAuthenticated based on session validity

3. AUTH HOOKS — Create src/features/auth/hooks/
   - useAuth() — returns { user, session, isAuthenticated, isLoading, signIn, signUp, signOut }
   - useSession() — convenience hook returning just the access token for API calls
   - Connect API client to auth store so it auto-reads the current token

4. AUTH GUARD — Create src/features/auth/components/AuthGuard.tsx
   - Wraps authenticated route group
   - If no session → redirect to /(public)/login
   - If session exists → render children
   - Shows loading spinner while checking session

5. AUTH FORMS — Create src/features/auth/components/
   - LoginForm.tsx:
     - Email + password inputs using the Input atom component
     - "Sign In" Button (primary variant)
     - "Don't have an account? Sign Up" link
     - Form validation with react-hook-form + zod: email required + valid format, password required + min 6 chars
     - Loading state on button during API call
     - Error display for invalid credentials
   - RegisterForm.tsx:
     - Email + password + confirm password inputs
     - "Create Account" Button
     - "Already have an account? Sign In" link
     - Validation: email valid, password min 6, passwords match
     - Success message for email confirmation

6. ROUTE STRUCTURE — Update src/app/
   - src/app/_layout.tsx: Root layout — initialize auth on mount, wrap with AuthProvider concept
   - src/app/(public)/_layout.tsx: Stack navigator for auth screens
   - src/app/(public)/login.tsx: Renders LoginForm, full-page centered layout
   - src/app/(public)/register.tsx: Renders RegisterForm, full-page centered layout
   - src/app/(auth)/_layout.tsx: Tab navigator wrapped with AuthGuard, redirects to login if unauthenticated
   - Tab bar with 5 tabs: Dashboard, Transactions, Analytics, Investments, More

7. AUTH UI DESIGN
   - Login/Register pages should use the app's design system:
     - Dark background (background token)
     - App logo or "TrackiFi" text in display variant at top
     - Card-style form container (surfaceElevated background, lg border radius)
     - Accent-colored primary button
     - Error messages in loss/red color
     - Smooth opacity animation on screen transitions

CONSTRAINTS
- Tokens stored in expo-secure-store on native, localStorage on web
- Never expose SUPABASE_SERVICE_ROLE_KEY on client
- Auto-refresh tokens before expiry using onAuthStateChange
- After sign out, clear all React Query cache and redirect to login
- All error messages should be user-friendly (transform Supabase errors)
```

---

## Phase 3 — Dashboard

```
ROLE
You are a Senior React Native / Expo Engineer.

OBJECTIVE
Implement the Dashboard (home) screen for TrackiFi — the first screen users see after login, providing a financial overview at a glance.

CONTEXT
- Project: Expo 55 + Expo Router + TypeScript
- Phases 1-2 complete: design system, auth, API client, types, providers all ready
- Backend API docs: docs/api/03-accounts.md, docs/api/05-cashflow-analytics.md
- API endpoints needed:
  - GET /api/accounts → returns { data: AccountWithBalance[] }
  - GET /api/cashflows/analytics/today → returns { inflow: number, outflow: number }
  - GET /api/cashflows/analytics/recent → returns RecentTransaction[] (last 20, legacy format)

DELIVERABLES

1. API SERVICE FUNCTIONS — Create src/services/accounts.api.ts and src/services/analytics.api.ts
   - getAccounts(): Promise<AccountWithBalance[]>
   - getAccountBalance(id: string): Promise<{ balance: number }>
   - getTodaySummary(): Promise<TodaySummary>
   - getRecentTransactions(): Promise<RecentTransaction[]>
   All use the API client singleton with proper typing.

2. REACT QUERY HOOKS — Create src/features/accounts/hooks/ and src/features/analytics/hooks/
   - useAccounts() → queryKey: ['accounts'], staleTime: 5 min
   - useTodaySummary() → queryKey: ['analytics', 'today'], staleTime: 30 sec, refetchInterval: 30 sec
   - useRecentTransactions() → queryKey: ['analytics', 'recent'], staleTime: 2 min

3. ACCOUNT COMPONENTS — Create src/features/accounts/components/
   - AccountCard.tsx: Shows account name, type badge (allowance/savings), balance formatted as currency. Tap to navigate to account detail (future).
   - BalanceSummary.tsx: Shows total balance across all accounts in display typography. Subtitle: "Total Balance". If multiple accounts, show each below with smaller text.

4. ANALYTICS COMPONENTS — Create src/features/analytics/components/
   - TodaySummaryCard.tsx: Card with two columns — Inflow (green, income color) and Outflow (red, expense color). Shows formatted amounts. Net = inflow - outflow shown below.
   - RecentTransactionsList.tsx: FlatList of last 20 transactions. Each row shows:
     - Type indicator (colored dot: green for "in", red for "out", blue for "transfer")
     - Category name (from metadata.category_name)
     - Formatted amount with +/- prefix
     - Relative time (e.g., "2h ago")
     - Uses the RecentTransaction type: { uuid, amount, type: "in"|"out"|"transfer", metadata: { category_name }, logged_at }
   - Tap row → future: navigate to transaction detail

5. DASHBOARD PAGE — Update src/app/(auth)/index.tsx
   - PageLayout with pull-to-refresh (refetches all queries)
   - Content order:
     a. Greeting: "Good morning/afternoon/evening, [user email or name]"
     b. BalanceSummary (total balance + per-account)
     c. TodaySummaryCard (today's inflow vs outflow)
     d. "Recent Transactions" section header
     e. RecentTransactionsList (last 20)
   - Floating Action Button (FAB) at bottom-right → navigates to transaction creation (Phase 4)
   - Loading state: Skeleton placeholders for each section
   - Error state: ErrorBoundary with retry for each section independently
   - Empty state: If no accounts → "Set up your first account" CTA

6. FAB COMPONENT — Create src/components/ui/FAB.tsx
   - Circular button with accent color, "+" icon
   - Positioned absolute bottom-right with safe area margin
   - Shadow/elevation for visual depth
   - onPress callback prop

DESIGN REQUIREMENTS
- Dashboard should feel premium and data-rich
- Use surfaceElevated cards with lg border radius and md padding
- Account balances in display font size
- Income amounts always in income/green color, expenses in expense/red
- Smooth fade-in animation when data loads (use Reanimated FadeIn)
- Cards should have subtle shadow on both themes

CONSTRAINTS
- All data fetched via React Query — no local state for server data
- Pull-to-refresh invalidates all dashboard queries
- Skeleton loading, not spinners
- Handle empty data gracefully (no crashes on null/undefined)
```

---

## Phase 4 — Transactions

```
ROLE
You are a Senior React Native / Expo Engineer.

OBJECTIVE
Implement the complete Transactions feature for TrackiFi — listing, filtering, pagination, and creating income/expense/transfer transactions.

CONTEXT
- Project: Expo 55 + Expo Router + TypeScript
- Phases 1-3 complete: design system, auth, dashboard, API client, accounts hooks all ready
- Backend API docs: docs/api/04-transactions.md
- API endpoints:
  - GET /api/transactions — query params: transaction_type?, account_id?, start_date?, end_date?, limit (max 100, default 20), offset
  - POST /api/transactions/income — body: { amount, to_account_id, date?, category?, description?, metadata? }
  - POST /api/transactions/expense — body: { amount, from_account_id, date?, category?, description?, metadata? }
  - POST /api/transactions/transfer — body: { amount, from_account_id, to_account_id, date?, description?, metadata? }
  - Responses wrapped in { data: Transaction | Transaction[], message?: string }
  - Validation errors: { success: false, error: { issues: [...], name: "ZodError" } }

DELIVERABLES

1. API SERVICE — Create src/services/transactions.api.ts
   - getTransactions(filters: TransactionFilters): Promise<Transaction[]>
   - createIncome(data: CreateIncomeRequest): Promise<Transaction>
   - createExpense(data: CreateExpenseRequest): Promise<Transaction>
   - createTransfer(data: CreateTransferRequest): Promise<Transaction>

2. REACT QUERY HOOKS — Create src/features/transactions/hooks/
   - useTransactions(filters) → useInfiniteQuery with queryKey: ['transactions', filters]
     - getNextPageParam: increment offset by limit
     - Flatten pages into single list
   - useCreateIncome() → useMutation, onSuccess: invalidate ['accounts', 'transactions', 'analytics']
   - useCreateExpense() → useMutation, same invalidation + ['analytics', 'category']
   - useCreateTransfer() → useMutation, invalidate ['accounts', 'transactions']
   - All mutations should use optimistic updates:
     - Prepend new transaction to list cache
     - Update account balance cache
     - Rollback on error

3. FILTER STATE — Create src/features/transactions/store.ts (Zustand)
   - State: { typeFilter, accountFilter, startDate, endDate }
   - Actions: setTypeFilter, setAccountFilter, setDateRange, clearFilters
   - Defaults: no filters applied, limit: 20

4. TRANSACTION COMPONENTS — Create src/features/transactions/components/
   - TransactionRow.tsx:
     - Left: category icon or colored dot by type
     - Center: description (or category fallback), account name below in caption
     - Right: formatted amount with +/- and type color, date below in caption
     - Types: income/allowance → green "+₱X", expense → red "-₱X", transfer → blue "₱X"
   - TransactionList.tsx:
     - FlatList with useInfiniteQuery integration
     - Group transactions by date (section headers: "Today", "Yesterday", "Mar 5, 2026")
     - onEndReached → fetchNextPage
     - Pull-to-refresh → invalidate and refetch
     - Loading: skeleton rows
     - Empty: EmptyState "No transactions yet"
   - FilterBar.tsx:
     - Horizontal scrollable chip filters:
       - Type: All | Income | Expense | Transfer (using ChipFilter or Badge component)
       - Account: dropdown or chip showing selected account name
       - Date range: "This Week" | "This Month" | "Custom"
     - Active filters shown with accent color
     - Clear all button when filters active
   - TransactionForm.tsx (rendered in BottomSheet):
     - Segmented control at top: Income | Expense | Transfer
     - Form fields change based on selected type:
       - Income: amount, to_account_id (picker from useAccounts), category, description, date
       - Expense: amount, from_account_id (picker), category, description, date
       - Transfer: amount, from_account_id (picker), to_account_id (picker), description, date
     - Amount input: large font, numpad keyboard type
     - Category picker: scrollable chips for common categories (Food & Dining, Transportation, Shopping, Entertainment, Health, Education, Allowance, Savings, Other)
     - Date picker: defaults to now, optional override
     - Submit button: "Add Income" / "Add Expense" / "Transfer"
     - Validation with react-hook-form + zod matching backend schemas
     - Loading state on submit
     - Success: close sheet + toast notification
     - Error: inline error messages

5. TRANSACTIONS PAGE — Create src/app/(auth)/transactions.tsx
   - PageLayout with:
     - Header: "Transactions" in headline
     - FilterBar below header (sticky)
     - TransactionList (infinite scroll)
     - FAB → opens TransactionForm in BottomSheet
   - When filters change → new query with updated params

DESIGN REQUIREMENTS
- Transaction rows should be clean and scannable
- Amount is the most prominent element (bodyBold, right-aligned)
- Date group headers use caption text with divider
- Filter chips use sm border radius, accent highlight when active
- Form uses large amount input (display or headline size)
- Smooth sheet animation for transaction form
- Success feedback: brief green toast "Transaction added!"

CONSTRAINTS
- Infinite scroll, NOT numbered pagination
- Offset-based: page N starts at offset = (N-1) * 20
- Filter changes should reset to offset 0
- Amount must always be > 0 (validated client-side and server-side)
- Transfer: from and to accounts must differ (validate client-side)
- Category is optional but recommended (UI should encourage it)
```

---

## Phase 5 — Analytics

```
ROLE
You are a Senior React Native / Expo Engineer.

OBJECTIVE
Implement the Analytics screen for TrackiFi — visual insights into spending/earning patterns using time series charts and category breakdowns.

CONTEXT
- Project: Expo 55 + Expo Router + TypeScript
- Phases 1-4 complete: design system, auth, dashboard, transactions all ready
- Backend API docs: docs/api/05-cashflow-analytics.md
- API endpoints:
  - GET /api/cashflows/analytics/timeseries — params: timeView (daily|weekly|monthly), startDate (ISO), endDate (ISO)
    - Response: TimeSeriesEntry[] → [{ period, inflow, outflow, savings }]
  - GET /api/cashflows/analytics/by-category — params: startDate, endDate, type? (in|out, default: out)
    - Response: CategoryBreakdown[] → [{ category, amount, percentage }] sorted by amount desc
  - Data rules: transfers excluded, inflow = allowance-type, outflow = expense-type, savings = income-type

DELIVERABLES

1. API SERVICE — Create src/services/analytics.api.ts (extend existing)
   - getTimeSeries(timeView, startDate, endDate): Promise<TimeSeriesEntry[]>
   - getCategoryBreakdown(startDate, endDate, type?): Promise<CategoryBreakdown[]>

2. REACT QUERY HOOKS — Create/extend src/features/analytics/hooks/
   - useTimeSeries({ timeView, startDate, endDate }) → queryKey: ['analytics', 'timeseries', params], staleTime: 10 min
   - useCategoryBreakdown({ startDate, endDate, type }) → queryKey: ['analytics', 'category', params], staleTime: 10 min

3. CHART COMPONENTS — Create src/components/charts/
   Choose and install a React Native compatible charting library (react-native-gifted-charts recommended for cross-platform)

   - TimeSeriesChart.tsx:
     - Grouped bar chart showing inflow (green), outflow (red), and savings (purple) per period
     - X-axis: period labels (formatted dates or month names)
     - Y-axis: currency values
     - Tooltip on tap showing exact values
     - Responsive width

   - CategoryPieChart.tsx:
     - Donut/ring chart with category segments
     - Each segment colored distinctly (use a harmonious palette)
     - Center: total amount
     - Legend below: ranked list with category name, amount, percentage bar
     - Tap segment → highlight and show detail

4. ANALYTICS COMPONENTS — Create src/features/analytics/components/
   - PeriodSelector.tsx:
     - Segmented control: Daily | Weekly | Monthly
     - Date range display with left/right arrows to navigate periods
     - "This Week", "This Month", "Last 3 Months" quick-select buttons

   - TimeSeriesView.tsx:
     - PeriodSelector at top
     - TimeSeriesChart below
     - Summary row: Total Inflow | Total Outflow | Net
     - Loading: skeleton chart placeholder

   - CategoryView.tsx:
     - Toggle: Spending (out) | Earnings (in)
     - Date range selector (same as timeseries)
     - CategoryPieChart
     - Ranked category list below chart:
       - Category name + colored indicator
       - Amount (formatted currency)
       - Percentage bar (relative width)
     - Loading: skeleton placeholders

5. ANALYTICS PAGE — Create src/app/(auth)/analytics.tsx
   - PageLayout with tabs/segments at top:
     - Tab 1: "Cash Flow" → TimeSeriesView
     - Tab 2: "Categories" → CategoryView
   - Default view: Cash Flow, monthly, last 3 months
   - Pull-to-refresh invalidates analytics queries

DESIGN REQUIREMENTS
- Charts should be the hero of this page — large, clear, and colorful
- Use financial color scheme: green (inflow), red (outflow), purple (savings)
- Category breakdown colors: use a curated palette of 8-10 distinct colors
- Period selector should feel native (segment control style)
- Smooth transitions between daily/weekly/monthly
- Numbers should be formatted as currency throughout
- Empty chart state: "Not enough data" with illustration

CONSTRAINTS
- timeView required for timeseries (validated by backend)
- startDate and endDate required for both endpoints
- Default date range: last 3 months for monthly, last 2 weeks for daily, last 8 weeks for weekly
- Handle empty responses gracefully (no data for period)
- Chart must be performant with up to 90 daily data points
```

---

## Phase 6 — Goals

```
ROLE
You are a Senior React Native / Expo Engineer.

OBJECTIVE
Implement the Goals feature for TrackiFi — savings goal tracking with AI-powered forecasting using Holt's Double Exponential Smoothing predictions.

CONTEXT
- Project: Expo 55 + Expo Router + TypeScript
- Phases 1-5 complete: design system, auth, dashboard, transactions, analytics all ready
- Backend API docs: docs/api/06-goals.md
- API endpoints:
  - GET /api/goals/generate-prediction — params: goalId (UUID), userId (UUID)
    - Success: { prediction: string, monthsNeeded: number, estimatedCompletionDate: "YYYY-MM-DD" }
    - Goal reached: { prediction: "Goal already reached", success: true }
    - Error 400: { error: "Not enough data for prediction" } or { error: "Goal unreachable with current spending habits" }
- Goal data model: { uuid, user_id, name, amount, description, type: "saving"|"spending", start_date, end_date, status, metadata }
- NOTE: Goals CRUD may need to go through Supabase client directly (no CRUD endpoints exposed in API yet — only prediction endpoint exists). Check with backend team or implement via Supabase client.

DELIVERABLES

1. API SERVICE — Create src/services/goals.api.ts
   - getGoalPrediction(goalId, userId): Promise<PredictionResponse>
   - For CRUD (if no backend endpoints): use Supabase client directly
     - getGoals(): query goals table filtered by user
     - createGoal(payload: CreateGoalPayload): insert into goals table
     - updateGoal(payload: UpdateGoalPayload): update goals table
     - deleteGoal(uuid: string): delete from goals table

2. REACT QUERY HOOKS — Create src/features/goals/hooks/
   - useGoals() → queryKey: ['goals'], staleTime: 5 min
   - useGoalPrediction(goalId) → queryKey: ['goals', goalId, 'prediction'], staleTime: 30 min, enabled only when goalId is provided
   - useCreateGoal() → useMutation, invalidates ['goals']
   - useUpdateGoal() → useMutation, invalidates ['goals']
   - useDeleteGoal() → useMutation, invalidates ['goals']

3. GOAL COMPONENTS — Create src/features/goals/components/
   - GoalProgressCard.tsx:
     - Goal name (title typography)
     - Target amount: "₱50,000" in bodyBold
     - Progress bar: currentSavings / targetAmount
       - Color: green (>66%), amber (33-66%), red (<33%)
     - Percentage label: "64% reached"
     - Type badge: "Saving" or "Spending"
     - Status badge: "Active" | "Completed" | "Cancelled"
     - Tap → navigate to goal detail

   - PredictionWidget.tsx:
     - Card showing AI prediction results:
       - If prediction available: "🎯 X months to go" in headline + "Estimated: Nov 2026" + human-readable prediction text
       - If goal reached: "🎉 Goal already reached!" with celebration icon
       - If not enough data: "📊 Need more transactions for prediction" with explanation
       - If unreachable: "⚠️ Goal may not be reachable" with suggestion to adjust
     - Refresh button to regenerate prediction
     - Loading: skeleton card

   - GoalForm.tsx (in BottomSheet):
     - Fields: name, target amount (large numpad input), description, type (saving/spending toggle), start date, end date
     - Validation: name required, amount > 0, end_date > start_date
     - Mode: create or edit (pre-fills values)
     - Submit button: "Create Goal" / "Update Goal"

4. GOAL PAGES
   - src/app/(auth)/goals/index.tsx — Goals List:
     - Header: "Goals" with "+" button
     - List of GoalProgressCard components
     - FAB → opens GoalForm for creation
     - Empty: "Set your first savings goal" illustration + CTA
     - Sort: active first, then by end_date

   - src/app/(auth)/goals/[id].tsx — Goal Detail:
     - Full GoalProgressCard (expanded)
     - PredictionWidget (auto-fetches prediction)
     - Goal info section: description, dates, type
     - Action buttons: "Edit" → GoalForm, "Delete" → confirmation modal
     - Back navigation

5. NAVIGATION — Add "Goals" to the "More" tab or as a list item in More/Settings screen
   - More tab → list: Goals, Settings
   - OR: Goals as its own tab (if 5 tabs: Dashboard, Transactions, Analytics, Investments, Goals)

DESIGN REQUIREMENTS
- Progress bars should be visually prominent with gradient fills
- Prediction widget should feel like an "AI insight" — slightly different card style (surfaceElevated with subtle accent border)
- Goal cards should motivate: celebration colors for high progress
- Use Reanimated for progress bar animation on load
- Empty state should be encouraging: "Start tracking your dreams"

CONSTRAINTS
- currentSavings is derived from user's savings account balance (fetch via useAccounts)
- Prediction requires minimum 4 transactions to work
- Cache predictions for 30 minutes (expensive computation)
- Handle all prediction edge cases from backend (not enough data, unreachable, already reached)
- Goals CRUD should work optimistically
```

---

## Phase 7 — Investments

```
ROLE
You are a Senior React Native / Expo Engineer.

OBJECTIVE
Implement the complete Investments feature for TrackiFi — portfolio tracking with performance metrics, value history charts, and cash-out workflows.

CONTEXT
- Project: Expo 55 + Expo Router + TypeScript
- Phases 1-6 complete: full app with auth, dashboard, transactions, analytics, goals
- Backend API docs: docs/api/07-investments.md
- API endpoints:
  - GET /api/investments → { data: Investment[] } — each with absolute_gain, percentage_change calculated
  - GET /api/investments/:id → { data: Investment & { history: InvestmentValueHistory[] } }
  - POST /api/investments → body: { name, type, principal, start_date, metadata? } — atomically creates record + expense transaction
  - POST /api/investments/:id/value → body: { value, recorded_at?, notes? } — records new value
  - POST /api/investments/:id/cashout → body: { amount, date, notes? } — reduces value, creates income transaction
  - DELETE /api/investments/:id → { message: "Investment deleted successfully" }
- Investment types: stock, crypto, fund, savings, other
- Investment status: active, closed

DELIVERABLES

1. API SERVICE — Create src/services/investments.api.ts
   - getInvestments(): Promise<Investment[]>
   - getInvestmentDetail(id): Promise<Investment & { history: InvestmentValueHistory[] }>
   - createInvestment(data: CreateInvestmentPayload): Promise<Investment>
   - recordValue(id, data: UpdateValuePayload): Promise<{ uuid, current_value, updated_at }>
   - cashOut(id, data: CashOutPayload): Promise<{ uuid, current_value, principal, status, updated_at }>
   - deleteInvestment(id): Promise<void>

2. REACT QUERY HOOKS — Create src/features/investments/hooks/
   - useInvestments() → queryKey: ['investments'], staleTime: 5 min
   - useInvestmentDetail(id) → queryKey: ['investments', id], staleTime: 5 min
   - useCreateInvestment() → invalidates ['investments', 'accounts', 'transactions'] (creates expense transaction)
   - useRecordValue(id) → invalidates ['investments'] (list + detail)
   - useCashOut(id) → invalidates ['investments', 'accounts', 'transactions'] (creates income transaction)
   - useDeleteInvestment(id) → invalidates ['investments']

3. INVESTMENT COMPONENTS — Create src/features/investments/components/
   - PortfolioSummaryCard.tsx:
     - Total portfolio value (sum of all current_value)
     - Total gain/loss (sum of absolute_gain) with color
     - Overall percentage change (weighted average)
     - Card with premium styling: gradient or accent border

   - InvestmentCard.tsx:
     - Investment name (title)
     - Type badge: stock (blue), crypto (orange), fund (purple), savings (green), other (gray)
     - Current value (bodyBold)
     - Gain/loss: "+₱1,500 (+15.0%)" in green or "-₱500 (-5.0%)" in red
     - Status indicator if closed
     - Tap → navigate to detail

   - ValueHistoryChart.tsx:
     - Line chart showing value over time from history entries
     - X-axis: dates (recorded_at)
     - Y-axis: currency values
     - Data points with tooltips on tap
     - Principal line as reference (horizontal dashed line)
     - Color: above principal = green line, below = red line

   - CreateInvestmentSheet.tsx (BottomSheet):
     - Fields: name, type (picker: stock/crypto/fund/savings/other), principal amount (large numpad), start date, notes (optional metadata)
     - Validation: name required, type required, principal > 0, start_date required
     - Warning: "This will deduct ₱X from your allowance account"
     - Submit: "Create Investment"

   - RecordValueSheet.tsx (BottomSheet):
     - Current value displayed for reference
     - New value input (large numpad)
     - Date (defaults to now)
     - Notes (optional)
     - Submit: "Update Value"

   - CashOutSheet.tsx (BottomSheet):
     - Current value displayed
     - Amount to withdraw (large numpad, max = current value)
     - Date (required)
     - Notes (optional)
     - Validation: amount > 0, amount <= current value
     - Warning: "This will add ₱X to your allowance account"
     - Submit: "Cash Out"

4. INVESTMENT PAGES
   - src/app/(auth)/investments/index.tsx — Portfolio List:
     - PortfolioSummaryCard at top
     - List of InvestmentCard components
     - Filter: All | Active | Closed (chip filters)
     - FAB → opens CreateInvestmentSheet
     - Empty: "Start tracking your investments"

   - src/app/(auth)/investments/[id].tsx — Investment Detail:
     - Header: investment name + type badge
     - Key metrics: current value, principal, gain/loss (amount + %), status
     - ValueHistoryChart
     - Value history list (below chart): date + value + notes for each entry
     - Action buttons row:
       - "Record Value" → RecordValueSheet
       - "Cash Out" → CashOutSheet
       - "Delete" → confirmation alert
     - Back navigation

5. TAB INTEGRATION — Investments as its own tab (4th tab)
   - Tab icon: trending-up chart icon
   - Badge showing total gain/loss indicator (optional)

DESIGN REQUIREMENTS
- Portfolio summary should feel like a premium financial dashboard
- Gain is green with "↑" indicator, loss is red with "↓"
- Investment type badges should be distinct and recognizable
- Value history chart should be the hero of the detail page
- Cash-out flow should feel secure: confirmation step required
- Use subtle animations for value changes

CONSTRAINTS
- Creating an investment atomically creates an expense transaction (backend handles this)
- Cash out atomically creates an income transaction (backend handles this)
- Cash out amount cannot exceed current value (validate client + server)
- Delete requires confirmation modal
- Value ≥ 0 for record value (can be 0 if investment lost all value)
- Investment types map to specific colors for visual consistency
```

---

## Phase 8 — Polish, Settings & Quality

```
ROLE
You are a Senior React Native / Expo Engineer and UX Designer.

OBJECTIVE
Implement the Settings screen and apply final polish to the entire TrackiFi app — loading states, error handling, empty states, animations, haptic feedback, and overall UX refinement.

CONTEXT
- Project: Expo 55 + Expo Router + TypeScript
- Phases 1-7 complete: all features implemented (auth, dashboard, transactions, analytics, goals, investments)
- This phase focuses on production-quality UX and the Settings page

DELIVERABLES

1. SETTINGS PAGE — Create src/app/(auth)/settings.tsx (or under More tab)
   - Theme toggle: Dark / Light / System (persist preference in AsyncStorage)
   - Currency display preference (₱, $, €) — stored locally, used by formatCurrency utility
   - Account section: display user email, member since date
   - About: app version, "Built with ❤️" text
   - Sign Out button (destructive variant):
     - Confirmation alert: "Are you sure you want to sign out?"
     - On confirm: clear session, clear all React Query cache, redirect to login
   - Navigation: Settings accessible from "More" tab or 5th tab

2. SKELETON LOADING SCREENS — Audit every page, ensure skeleton loading:
   - Dashboard: skeleton for balance card, today summary, transaction rows
   - Transactions: skeleton rows (6-8 placeholder rows)
   - Analytics: skeleton chart placeholder (gray rectangle with rounded corners), skeleton legend items
   - Goals: skeleton goal cards
   - Investments: skeleton portfolio card, skeleton investment cards
   - Every skeleton should use the Skeleton atom with proper dimensions matching real content
   - Use Reanimated shimmer/pulse animation on skeletons

3. ERROR HANDLING — Audit every page for error recovery:
   - Per-query error handling: if a query fails, show inline error with "Retry" button
   - Network errors: "No internet connection" banner at top of screen
   - Auth errors (401): automatic token refresh → retry → if still fails, sign out
   - Server errors (500): "Something went wrong" with retry
   - Validation errors: parse Zod error format → show per-field errors on forms
   - Never show raw error strings to users — map to friendly messages
   - Global ErrorBoundary at root layout: catches unhandled React errors

4. EMPTY STATES — Ensure every list has a compelling empty state:
   - Dashboard (no accounts): "Welcome to TrackiFi! Set up your accounts to get started" + illustration
   - Transactions (no history): "No transactions yet. Tap + to record your first one" + illustration
   - Analytics (no data): "Start adding transactions to see your financial insights" + illustration
   - Goals (no goals): "Dream big! Create your first savings goal" + illustration
   - Investments (no investments): "Grow your wealth. Track your first investment" + illustration
   - Use EmptyState component with icon/illustration, title, message, CTA button

5. ANIMATIONS & TRANSITIONS
   - Page transitions: use Expo Router's built-in transitions (slide for stack, none for tabs)
   - List items: FadeInDown animation on initial load using Reanimated entering prop
   - Cards: subtle scale press feedback (Pressable with Reanimated scale transform)
   - Bottom sheets: smooth spring animation on open/close
   - Progress bars (goals): animated fill from 0 to actual percentage on mount
   - Chart rendering: animated bars/lines growing from zero
   - Pull-to-refresh: native RefreshControl

6. HAPTIC FEEDBACK (Native Only)
   - Install expo-haptics
   - Light haptic on: tab switch, filter selection
   - Medium haptic on: successful transaction creation, investment creation
   - Heavy haptic on: delete confirmation
   - No haptics on web (guard with Platform.OS check)

7. TOAST NOTIFICATIONS — Implement or install a toast system
   - Success: "Transaction added!" (green accent)
   - Error: "Failed to save. Try again." (red accent)
   - Info: "Refreshing data..." (neutral)
   - Position: top of screen, auto-dismiss after 3 seconds
   - Swipe to dismiss

8. ACCESSIBILITY
   - All interactive elements have accessibilityLabel
   - Amounts read as currency: "One thousand five hundred pesos"
   - Charts have accessible descriptions
   - Minimum touch target: 44x44 points
   - Support for larger text sizes (Dynamic Type on iOS)

9. PERFORMANCE AUDIT
   - Ensure FlatList uses keyExtractor, getItemLayout where possible
   - Memoize expensive components with React.memo
   - Ensure charts don't re-render on unrelated state changes
   - React Query: verify no unnecessary refetches
   - Bundle check: no unused imports or dead code

DESIGN REQUIREMENTS
- Loading states should feel natural, not jarring
- Error states should be helpful, not scary
- Empty states should be inviting and actionable
- Animations should be subtle (200-300ms), not distracting
- The entire app should feel cohesive — consistent spacing, colors, typography everywhere
- Dark mode should be the default, light mode should feel equally polished

CONSTRAINTS
- No blocking spinners — always use skeleton or inline loading
- Every error must be recoverable (retry button or actionable message)
- Haptics must be guarded for web platform
- Animations must respect "Reduce Motion" accessibility setting
- Toast must work on both native and web
- Settings preferences persist across sessions (AsyncStorage)
```
