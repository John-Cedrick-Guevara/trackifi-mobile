# 11. Mobile Integration Notes

## 11.1 API Compatibility

The TrackiFi API is fully stateless and uses standard HTTP + JSON, making it compatible with any mobile HTTP client (e.g., `fetch`, `axios`, Ky, or platform-specific networking libraries).

## 11.2 Authentication for Mobile

1. Use the **Supabase JS SDK** (or platform SDK for React Native / Flutter):

   ```typescript
   import { createClient } from "@supabase/supabase-js";
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
   ```

2. Sign in / Sign up via Supabase Auth
3. Extract `session.access_token`
4. Include it in all API requests:

   ```
   Authorization: Bearer <access_token>
   ```

5. Implement token refresh using `supabase.auth.onAuthStateChange()` or manual refresh via `supabase.auth.refreshSession()`

## 11.3 Expected Latency

| Endpoint Type                        | Expected Latency |
| ------------------------------------ | ---------------- |
| Simple CRUD (accounts, transactions) | 50–200ms         |
| Analytics (timeseries, by-category)  | 100–500ms        |
| Goal prediction                      | 200–1000ms       |
| Investment with history              | 100–300ms        |

> Latency varies by geographic proximity to the nearest Cloudflare edge node and Supabase region.

## 11.4 Offline Sync Considerations

The API currently **does not support offline sync**. Recommendations for mobile:

### Optimistic UI

1. Apply changes locally immediately
2. Send request to API in background
3. Revert local state on failure

### Queue-Based Sync

1. Store pending operations in local SQLite / AsyncStorage
2. On connectivity restore, replay operations in order
3. Handle conflicts (e.g., deleted resources)

### Recommended Local Data

Cache these locally for offline reading:

- Accounts list (refresh on app foreground)
- Recent transactions (last 50)
- Current goals list
- Investment portfolio summary

## 11.5 Idempotent Endpoints

| Endpoint                             | Idempotent? | Notes                   |
| ------------------------------------ | ----------- | ----------------------- |
| `GET /api/accounts`                  | ✅ Yes      | Safe to retry           |
| `GET /api/transactions`              | ✅ Yes      | Safe to retry           |
| `GET /api/investments`               | ✅ Yes      | Safe to retry           |
| `GET /api/goals/generate-prediction` | ✅ Yes      | Recalculates every time |
| `GET /api/cashflows/analytics/*`     | ✅ Yes      | Safe to retry           |
| `POST /api/transactions/*`           | ❌ No       | May create duplicates   |
| `POST /api/investments`              | ❌ No       | May create duplicates   |
| `POST /api/investments/:id/value`    | ❌ No       | Adds history entry      |
| `POST /api/investments/:id/cashout`  | ❌ No       | Mutates investment      |
| `DELETE /api/investments/:id`        | ✅ Yes      | Second call is no-op    |

### Preventing Duplicate Writes

For non-idempotent POST endpoints, mobile clients should:

1. Generate a client-side `idempotency_key` (UUID v4) before each request
2. Store it in `metadata.idempotency_key`
3. Before creating, check if a transaction with that key already exists
4. **Future API enhancement**: Server-side idempotency key support

## 11.6 Recommended Caching Strategies

| Data                | Cache Duration | Strategy                      |
| ------------------- | -------------- | ----------------------------- |
| Account list        | 5 minutes      | Stale-while-revalidate        |
| Account balances    | 1 minute       | Refresh on transaction create |
| Transaction history | 2 minutes      | Invalidate on mutation        |
| Analytics (today)   | 30 seconds     | Auto-refresh                  |
| Analytics (monthly) | 10 minutes     | Stale-while-revalidate        |
| Investments list    | 5 minutes      | Stale-while-revalidate        |
| Goal prediction     | 30 minutes     | Manual refresh                |

### Cache Invalidation Rules

| Action                  | Invalidate                              |
| ----------------------- | --------------------------------------- |
| Create income           | Accounts, transactions, today analytics |
| Create expense          | Accounts, transactions, today analytics |
| Create transfer         | Accounts, transactions                  |
| Create investment       | Accounts, transactions, investments     |
| Cash out investment     | Accounts, transactions, investments     |
| Update investment value | Investments                             |
| Delete investment       | Investments                             |

## 11.7 Network Error Handling

```typescript
// Recommended retry logic for mobile
async function apiRequest(url: string, options: RequestInit, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 401) {
        // Token expired — refresh and retry
        await refreshAccessToken();
        continue;
      }

      if (response.status === 429) {
        // Rate limited — exponential backoff
        const waitMs = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      // Network error — exponential backoff
      const waitMs = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}
```

## 11.8 Platform-Specific Notes

### React Native

- Use `@supabase/supabase-js` with `AsyncStorage` adapter
- Configure `fetch` polyfill if needed for older versions
- Use `NetInfo` for connectivity detection

### Flutter

- Use `supabase_flutter` package
- Store tokens in `flutter_secure_storage`
- Use `connectivity_plus` for network detection

### Swift (iOS)

- Use `supabase-swift` SDK
- Store tokens in Keychain
- Use `NWPathMonitor` for connectivity
