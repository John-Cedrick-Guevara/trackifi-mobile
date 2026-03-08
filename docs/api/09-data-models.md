# 10. Data Models — Complete TypeScript Reference

All interfaces below match the actual backend implementation and can be used directly in frontend/mobile typed clients.

## 10.1 Environment

```typescript
type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
};
```

## 10.2 Account

```typescript
type AccountType = "allowance" | "savings";

interface Account {
  id: string;
  user_uuid: string;
  name: string;
  type: AccountType;
  created_at: string;
  updated_at: string;
}

interface AccountWithBalance extends Account {
  balance: number; // Derived, never stored
}

interface CreateAccountRequest {
  name: string;
  type: AccountType;
}
```

## 10.3 Transaction

```typescript
type TransactionType = "income" | "expense" | "transfer";

interface Transaction {
  id: string;
  user_uuid: string;
  amount: number;
  transaction_type: TransactionType;
  from_account_id: string | null;
  to_account_id: string | null;
  date: string;
  category: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CreateIncomeRequest {
  amount: number;
  to_account_id: string;
  date?: string;
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface CreateExpenseRequest {
  amount: number;
  from_account_id: string;
  date?: string;
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface CreateTransferRequest {
  amount: number;
  from_account_id: string;
  to_account_id: string;
  date?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface TransactionFilters {
  transaction_type?: TransactionType;
  account_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
```

## 10.4 Goal

```typescript
interface Goal {
  uuid: string;
  user_id: string;
  name: string;
  amount: number;
  description: string;
  type: "saving" | "spending";
  end_date: Date;
  start_date: Date;
  status?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

interface CreateGoalPayload {
  user_id: string;
  name: string;
  amount: number;
  description: string;
  type: "saving" | "spending";
  end_date: Date;
  start_date: Date;
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

interface PredictionResponse {
  prediction: string;
  success: boolean;
  monthsNeeded?: number;
  estimatedCompletionDate?: string;
}

interface ExponentialSmoothingParams {
  alpha: number;
  beta: number;
  monthlyData: { year: number; month: number; amount: number }[];
  goalAmount: number;
  currentAmount: number;
}
```

## 10.5 Investment

```typescript
type InvestmentType = "stock" | "crypto" | "fund" | "savings" | "other";
type InvestmentStatus = "active" | "closed";

interface Investment {
  uuid: string;
  user_uuid: string;
  name: string;
  type: InvestmentType;
  principal: number;
  current_value: number;
  start_date: string;
  status: InvestmentStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  absolute_gain?: number;
  percentage_change?: number;
}

interface InvestmentValueHistory {
  uuid: string;
  investment_uuid: string;
  value: number;
  recorded_at: string;
  notes?: string;
  created_at: string;
}

interface CreateInvestmentPayload {
  name: string;
  type: InvestmentType;
  principal: number;
  start_date: string;
  metadata?: Record<string, any>;
}

interface UpdateValuePayload {
  value: number;
  recorded_at?: string;
  notes?: string;
}

interface CashOutPayload {
  amount: number;
  date: string;
  notes?: string;
}
```

## 10.6 Cash Flow (Legacy)

```typescript
interface QuickEntryFormData {
  amount: string;
  type: "cash_in" | "cash_out";
  category: string;
  selectedTags: string[];
}
```

## 10.7 Analytics Response Types

```typescript
interface TodaySummary {
  inflow: number;
  outflow: number;
}

interface RecentTransaction {
  uuid: string;
  amount: number;
  type: "in" | "out" | "transfer";
  metadata: {
    category_name: string;
    [key: string]: any;
  };
  logged_at: string;
}

interface TimeSeriesEntry {
  period: string; // "YYYY-MM-DD" | "YYYY-MM"
  inflow: number;
  outflow: number;
  savings: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}
```

## 10.8 Database Tables (Reference)

| Table                      | PK          | Owner FK                    | RLS |
| -------------------------- | ----------- | --------------------------- | --- |
| `users`                    | `id` (uuid) | `auth.uid() = id`           | ✅  |
| `categories`               | `uuid`      | `user_uuid`                 | ✅  |
| `cash_flow`                | `uuid`      | `user_uuid`                 | ✅  |
| `goals`                    | `uuid`      | `user_id`                   | ✅  |
| `insights`                 | `uuid`      | `user_uuid`                 | ✅  |
| `investments`              | `uuid`      | `user_uuid`                 | ✅  |
| `investment_value_history` | `uuid`      | via `investments.user_uuid` | ✅  |
| `reflections`              | `uuid`      | `user_uuid`                 | ✅  |
| `accounts`                 | `id`        | `user_uuid`                 | ✅  |
| `transactions`             | `id`        | `user_uuid`                 | ✅  |
