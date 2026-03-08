# 2. Authentication & Security

## 2.1 Overview

TrackiFi uses **Supabase Auth** for authentication. The API itself does **not** implement auth endpoints — authentication is handled client-side via the Supabase JS SDK. The backend receives a JWT access token in every request and validates it against Supabase.

## 2.2 Authentication Flow

```
┌────────┐         ┌───────────────┐         ┌──────────────────┐
│ Client │────①───▶│ Supabase Auth │────②───▶│ Returns JWT      │
│        │◀───②────│               │         │ (access + refresh)│
│        │────③───▶│ TrackiFi API  │────④───▶│ Validates JWT    │
│        │◀───⑤────│ (Hono Worker) │         │ via Supabase     │
└────────┘         └───────────────┘         └──────────────────┘
```

1. Client calls Supabase Auth directly (sign up / sign in)
2. Client receives `access_token` and `refresh_token`
3. Client sends API requests with `Authorization: Bearer <access_token>`
4. API validates the token using `supabase.auth.getUser(token)`
5. API returns data scoped to the authenticated user

## 2.3 Supabase Auth Endpoints (Client-Side)

These are called directly from the client using the Supabase JS SDK, **not** through the TrackiFi API:

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "securepassword123",
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "securepassword123",
});
// data.session.access_token → use for API calls
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Refresh Token

```typescript
const { data, error } = await supabase.auth.refreshSession();
```

## 2.4 Authorization Header Format

All TrackiFi API requests **must** include:

```
Authorization: Bearer <access_token>
```

**Example request:**

```bash
curl -X GET https://trackifi-api.example.workers.dev/api/accounts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 2.5 Token Validation (Server-Side)

Every route handler extracts and validates the token:

```typescript
const token = c.req.header("Authorization")?.split(" ")[1];

if (!token) {
  return c.json({ error: "Unauthorized: Missing token" }, 401);
}

// Supabase validates the JWT and returns user info
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser(token);

if (authError || !user) {
  return { error: new Error("Unauthorized: Invalid token") };
}
```

## 2.6 Token Expiration

| Token Type    | Default Expiry | Notes                           |
| ------------- | -------------- | ------------------------------- |
| Access Token  | 1 hour         | Must be refreshed before expiry |
| Refresh Token | 60 days        | Used to get a new access token  |

## 2.7 Row Level Security (RLS)

All database tables have RLS enabled. Even if a request bypasses API-level checks, the database enforces data isolation:

- Users can only read/write their **own** data
- The API uses `SUPABASE_ANON_KEY` (not `SERVICE_ROLE_KEY`) to ensure RLS is enforced
- Admin policies exist for `auth.role() = 'admin'`

## 2.8 Authentication Error Responses

**401 Unauthorized — Missing Token**

```json
{
  "error": "Unauthorized: Missing token"
}
```

**401 Unauthorized — Invalid/Expired Token**

```json
{
  "error": "Unauthorized: Invalid token"
}
```

## 2.9 CORS Configuration

```typescript
cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS", "DELETE", "PUT"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: false,
});
```

> **Mobile Note**: `origin: "*"` allows requests from any origin, which works for mobile apps out of the box. For production, consider restricting to known origins.
