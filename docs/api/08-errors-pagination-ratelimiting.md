# 8. Error Handling Standard

## 8.1 Error Response Formats

The API uses two error response formats depending on the error source:

### Application Errors

```json
{
  "error": "Human-readable error message"
}
```

### Server Errors (500)

In development, stack traces are included:

```json
{
  "error": "Unexpected error occurred",
  "stack": "Error: ...\n    at ..."
}
```

In production, `stack` is omitted.

### Zod Validation Errors

When request body validation fails via `@hono/zod-validator`, the response follows Zod's structure:

```json
{
  "success": false,
  "error": {
    "issues": [
      {
        "code": "too_small",
        "minimum": 1,
        "type": "string",
        "inclusive": true,
        "exact": false,
        "message": "Name is required",
        "path": ["name"]
      }
    ],
    "name": "ZodError"
  }
}
```

## 8.2 Common Error Codes

| HTTP Status | Error String                                             | Description                        |
| ----------- | -------------------------------------------------------- | ---------------------------------- |
| 400         | `"Missing required parameters: ..."`                     | Required query params not provided |
| 400         | `"Invalid timeView. Must be: daily, weekly, or monthly"` | Bad enum value                     |
| 400         | `"Invalid type. Must be 'in' or 'out'"`                  | Bad enum value                     |
| 400         | `"Withdrawal amount exceeds current value"`              | Business logic error               |
| 400         | `"Source and destination accounts must be different"`    | Transfer validation                |
| 401         | `"Unauthorized: Missing token"`                          | No `Authorization` header          |
| 401         | `"Unauthorized: Invalid token"`                          | JWT is expired or invalid          |
| 404         | `"Not Found"`                                            | Route does not exist               |
| 500         | `"<database error message>"`                             | Supabase/Postgres error            |
| 500         | `"Invalid account or unauthorized"`                      | Account ownership check failed     |

## 8.3 404 Not Found (Catch-All)

Any request to an undefined route returns:

```json
{
  "error": "Not Found",
  "path": "https://trackifi-api.example.workers.dev/api/unknown",
  "method": "GET"
}
```

## 8.4 Global Error Handler

All unhandled exceptions are caught by the global `app.onError` handler:

```json
{
  "error": "Internal server error message"
}
```

---

# 9. Pagination Standard

## 9.1 Current Implementation

The Transactions module supports **offset-based pagination** via query parameters:

| Parameter | Type    | Default | Max | Description                |
| --------- | ------- | ------- | --- | -------------------------- |
| `limit`   | integer | 20      | 100 | Number of records per page |
| `offset`  | integer | 0       | —   | Number of records to skip  |

**Example**:

```
GET /api/transactions?limit=20&offset=40
```

This returns records 41–60.

## 9.2 Response Format

Currently, pagination metadata is not included in responses. The response is:

```json
{
  "data": [
    /* array of transactions */
  ]
}
```

## 9.3 Recommended Future Format

For full mobile support, responses should include pagination metadata:

```json
{
  "data": [
    /* ... */
  ],
  "meta": {
    "page": 3,
    "limit": 20,
    "offset": 40,
    "total": 143,
    "has_more": true
  }
}
```

## 9.4 Fixed-Limit Endpoints

Some analytics endpoints use fixed limits:

| Endpoint                              | Limit | Notes                               |
| ------------------------------------- | ----- | ----------------------------------- |
| `GET /api/cashflows/analytics/recent` | 20    | Always returns last 20 transactions |

---

# 10. Rate Limiting

## 10.1 Current State

The API **does not** currently implement rate limiting. Cloudflare Workers have implicit limits:

| Resource            | Limit                       |
| ------------------- | --------------------------- |
| Requests/day (free) | 100,000                     |
| CPU time/request    | 10 ms (free) / 30 ms (paid) |
| Supabase API        | 500 req/sec (free tier)     |

## 10.2 Recommended Implementation

For production, implement rate limiting using Cloudflare's Rate Limiting rules or a custom middleware:

**Response Headers** (recommended):

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709913600
```

**Rate Limited Response (429)**:

```json
{
  "error": "Too many requests. Please retry after 60 seconds."
}
```

**Recommended Limits**:

| Tier          | Requests/minute | Burst |
| ------------- | --------------- | ----- |
| Free          | 60              | 10    |
| Authenticated | 120             | 20    |

**Retry Strategy**:

- Check `X-RateLimit-Remaining` header
- On 429, use exponential backoff: wait `2^attempt` seconds
- Respect `X-RateLimit-Reset` timestamp
