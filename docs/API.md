# API Documentation

**Base URL:** `/api/v1`
**Authentication:** Bearer token in `Authorization` header (obtained from signup/login)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Wallets](#wallets)
3. [Categories](#categories)
4. [Transactions](#transactions)
5. [Error Responses](#error-responses)

---

## Authentication

### POST /auth/signup

Create a new user account and receive a JWT token.

**Access:** Public (no auth required)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

**Errors:**
- `409 Conflict` — Email already in use
- `400 Bad Request` — Invalid email or password format

---

### POST /auth/login

Authenticate and receive a JWT token.

**Access:** Public (no auth required)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

**Errors:**
- `401 Unauthorized` — Invalid email or password
- `400 Bad Request` — Invalid email or password format

---

### GET /auth/me

Get the current authenticated user's profile.

**Access:** Authenticated (requires valid JWT)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**Errors:**
- `401 Unauthorized` — Missing or invalid token

---

### POST /auth/logout

Logout the current user (server-side cleanup).

**Access:** Authenticated (requires valid JWT)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

**Errors:**
- `401 Unauthorized` — Missing or invalid token

---

## Wallets

Wallets represent accounts where money is stored (cash, bank, e-wallet, etc.).

### GET /wallets

Get all wallets for the authenticated user.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:** None

**Response:** `200 OK`
```json
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Cash",
    "type": "cash",
    "balance": "1500.50",
    "created_at": "2026-03-15T10:30:00Z",
    "updated_at": "2026-03-15T10:30:00Z",
    "deleted_at": null
  },
  {
    "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Bank Account",
    "type": "bank",
    "balance": "5000.00",
    "created_at": "2026-03-15T11:00:00Z",
    "updated_at": "2026-03-15T11:00:00Z",
    "deleted_at": null
  }
]
```

**Errors:**
- `401 Unauthorized` — Missing or invalid token

---

### POST /wallets

Create a new wallet.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Savings Account",
  "type": "bank",
  "balance": 10000.00
}
```

**Wallet Types:** `cash`, `bank`, `e_wallet`, `other`

**Response:** `201 Created`
```json
{
  "id": "b2c3d4e5-f6g7-48h9-i0j1-k2l3m4n5o6p7",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Savings Account",
  "type": "bank",
  "balance": "10000.00",
  "created_at": "2026-03-15T12:00:00Z",
  "updated_at": "2026-03-15T12:00:00Z",
  "deleted_at": null
}
```

**Errors:**
- `400 Bad Request` — Invalid wallet type or missing required fields
- `401 Unauthorized` — Missing or invalid token
- `409 Conflict` — Wallet with the same name and type already exists for this user

---

### GET /wallets/:id

Get a specific wallet by ID.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**URL Parameters:**
- `id` (UUID) — The wallet ID

**Response:** `200 OK`
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cash",
  "type": "cash",
  "balance": "1500.50",
  "created_at": "2026-03-15T10:30:00Z",
  "updated_at": "2026-03-15T10:30:00Z",
  "deleted_at": null
}
```

**Errors:**
- `400 Bad Request` — Invalid UUID format
- `401 Unauthorized` — Missing or invalid token
- `404 Not Found` — Wallet not found or belongs to a different user

---

### PATCH /wallets/:id

Update a wallet.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (UUID) — The wallet ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "type": "bank",
  "balance": 12000.50
}
```

**Response:** `200 OK`
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Name",
  "type": "bank",
  "balance": "12000.50",
  "created_at": "2026-03-15T10:30:00Z",
  "updated_at": "2026-03-15T13:00:00Z",
  "deleted_at": null
}
```

**Errors:**
- `400 Bad Request` — Invalid UUID format or invalid wallet type
- `401 Unauthorized` — Missing or invalid token
- `404 Not Found` — Wallet not found or belongs to a different user
- `409 Conflict` — Updated name conflicts with existing wallet

---

### DELETE /wallets/:id

Delete a wallet (soft delete).

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**URL Parameters:**
- `id` (UUID) — The wallet ID

**Response:** `204 No Content`

**Errors:**
- `400 Bad Request` — Invalid UUID format
- `401 Unauthorized` — Missing or invalid token
- `404 Not Found` — Wallet not found or belongs to a different user

---

## Categories

Categories are tags for transactions (e.g., Food, Transport, Salary).

### GET /categories

Get all categories for the authenticated user.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "c1d2e3f4-g5h6-47i8-j9k0-l1m2n3o4p5q6",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Food",
    "type": "expense",
    "description": "Groceries and dining",
    "created_at": "2026-03-15T10:30:00Z",
    "updated_at": "2026-03-15T10:30:00Z",
    "deleted_at": null
  },
  {
    "id": "d2e3f4g5-h6i7-48j9-k0l1-m2n3o4p5q6r7",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Salary",
    "type": "income",
    "description": "Monthly salary income",
    "created_at": "2026-03-15T11:00:00Z",
    "updated_at": "2026-03-15T11:00:00Z",
    "deleted_at": null
  }
]
```

**Errors:**
- `401 Unauthorized` — Missing or invalid token

---

### POST /categories

Create a new category.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Transport",
  "type": "expense",
  "description": "Gas, public transport, taxi"
}
```

**Category Types:** `expense`, `income`

**Response:** `201 Created`
```json
{
  "id": "e3f4g5h6-i7j8-49k0-l1m2-n3o4p5q6r7s8",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Transport",
  "type": "expense",
  "description": "Gas, public transport, taxi",
  "created_at": "2026-03-15T12:00:00Z",
  "updated_at": "2026-03-15T12:00:00Z",
  "deleted_at": null
}
```

**Errors:**
- `400 Bad Request` — Invalid category type or missing required fields
- `401 Unauthorized` — Missing or invalid token
- `409 Conflict` — Category with the same name and type already exists for this user

---

### GET /categories/:id

Get a specific category by ID.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**URL Parameters:**
- `id` (UUID) — The category ID

**Response:** `200 OK`
```json
{
  "id": "c1d2e3f4-g5h6-47i8-j9k0-l1m2n3o4p5q6",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Food",
  "type": "expense",
  "description": "Groceries and dining",
  "created_at": "2026-03-15T10:30:00Z",
  "updated_at": "2026-03-15T10:30:00Z",
  "deleted_at": null
}
```

**Errors:**
- `400 Bad Request` — Invalid UUID format
- `401 Unauthorized` — Missing or invalid token
- `404 Not Found` — Category not found or belongs to a different user

---

### PATCH /categories/:id

Update a category.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (UUID) — The category ID

**Request Body:** (all fields optional)
```json
{
  "name": "Groceries",
  "type": "expense",
  "description": "Supermarket and food shopping"
}
```

**Response:** `200 OK`
```json
{
  "id": "c1d2e3f4-g5h6-47i8-j9k0-l1m2n3o4p5q6",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Groceries",
  "type": "expense",
  "description": "Supermarket and food shopping",
  "created_at": "2026-03-15T10:30:00Z",
  "updated_at": "2026-03-15T13:00:00Z",
  "deleted_at": null
}
```

**Errors:**
- `400 Bad Request` — Invalid UUID format or invalid category type
- `401 Unauthorized` — Missing or invalid token
- `404 Not Found` — Category not found or belongs to a different user
- `409 Conflict` — Updated name conflicts with existing category

---

### DELETE /categories/:id

Delete a category (soft delete).

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**URL Parameters:**
- `id` (UUID) — The category ID

**Response:** `204 No Content`

**Errors:**
- `400 Bad Request` — Invalid UUID format
- `401 Unauthorized` — Missing or invalid token
- `404 Not Found` — Category not found or belongs to a different user

---

## Transactions

All transaction endpoints require authentication.

**Posting logic (double-entry):**
- `expense` — one posting with negative amount on the specified wallet
- `income` — one posting with positive amount on the specified wallet
- `transfer` — two postings: negative on `from_wallet_id`, positive on `to_wallet_id`

Wallet balances are updated atomically inside a database transaction.

### GET /transactions

List transactions with server-side pagination.

**Query Parameters:**

| Parameter    | Type   | Default        | Description                                 |
|--------------|--------|----------------|---------------------------------------------|
| `page`       | number | `1`            | Page number (min: 1)                        |
| `limit`      | number | `20`           | Items per page (min: 1, max: 100)           |
| `sort_by`    | string | `occurred_at`  | Sort field: `occurred_at`, `amount`, `type` |
| `sort_order` | string | `desc`         | Sort direction: `asc`, `desc`               |
| `search`     | string | —              | Filter by note (case-insensitive)           |
| `month`      | string | —              | Filter by month in `YYYY-MM` format         |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "expense",
      "note": "Coffee",
      "categoryId": "...",
      "occurredAt": "2026-03-15T10:00:00.000Z",
      "createdAt": "2026-03-15T10:00:00.000Z",
      "updatedAt": "2026-03-15T10:00:00.000Z",
      "deletedAt": null,
      "category": { "id": "...", "name": "Food", "type": "expense" },
      "postings": [
        {
          "id": "...",
          "walletId": "...",
          "amount": "-50000",
          "wallet": { "id": "...", "name": "Cash", "type": "cash" }
        }
      ]
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

---

### GET /transactions/:id

Get a single transaction by ID.

**Response:** `200 OK` — transaction object (same shape as items in the list above)

**Errors:**
- `400 Bad Request` — Invalid UUID format
- `404 Not Found` — Transaction not found or belongs to a different user

---

### POST /transactions

Create a new transaction (expense, income, or transfer). Wallet balances are updated atomically.

**Request Body — expense or income:**
```json
{
  "type": "expense",
  "amount": 50000,
  "occurred_at": "2026-03-15T10:00:00Z",
  "wallet_id": "550e8400-e29b-41d4-a716-446655440000",
  "category_id": "550e8400-e29b-41d4-a716-446655440001",
  "note": "Coffee"
}
```

**Request Body — transfer:**
```json
{
  "type": "transfer",
  "amount": 100000,
  "occurred_at": "2026-03-15T10:00:00Z",
  "from_wallet_id": "550e8400-e29b-41d4-a716-446655440000",
  "to_wallet_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Response:** `201 Created` — created transaction object

**Errors:**
- `400 Bad Request` — Validation failed (invalid type, missing required fields, non-positive amount)

---

### PATCH /transactions/:id

Update a transaction's note, category, or occurred date. Type and amount cannot be changed after creation.

**Request Body:**
```json
{
  "note": "Updated note",
  "category_id": "550e8400-e29b-41d4-a716-446655440001",
  "occurred_at": "2026-03-16T09:00:00Z"
}
```

**Response:** `200 OK` — updated transaction object

**Errors:**
- `400 Bad Request` — Invalid UUID or date format
- `404 Not Found` — Transaction not found or belongs to a different user

---

### DELETE /transactions/:id

Soft-delete a transaction and reverse its wallet balance effects atomically.

**Response:** `204 No Content`

**Errors:**
- `400 Bad Request` — Invalid UUID format
- `404 Not Found` — Transaction not found or belongs to a different user

---

## Error Responses

All errors follow this standard format:

```json
{
  "status_code": 400,
  "message": "Error description",
  "path": "/api/v1/wallets/invalid-id",
  "timestamp": "2026-03-15T13:30:00Z"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — Request succeeded |
| `201` | Created — Resource created successfully |
| `204` | No Content — Request succeeded with no response body |
| `400` | Bad Request — Invalid input or validation error |
| `401` | Unauthorized — Missing or invalid authentication token |
| `404` | Not Found — Resource not found |
| `409` | Conflict — Duplicate or conflicting resource |
| `500` | Internal Server Error — Server encountered an unexpected error |

---

## Frontend Implementation Notes

### Authentication Flow

1. **Sign up:** POST `/auth/signup` → receive token
2. **Log in:** POST `/auth/login` → receive token
3. **Store token:** Save in memory (or session storage for persistence)
4. **Use token:** Add `Authorization: Bearer <token>` to all subsequent requests
5. **Log out:** POST `/auth/logout` → clear local token

### Request Headers

Every authenticated request must include:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json (for POST/PATCH requests)
```

### Pagination

Wallet and category listing endpoints return all records (no pagination yet). Pagination will be added to the transaction module.

### Data Types

- **IDs** — UUIDs (string format)
- **Amounts** — Decimal strings (e.g., `"1500.50"`) for precision
- **Timestamps** — ISO 8601 format (e.g., `"2026-03-15T10:30:00Z"`)
- **Enums** — String values (wallet types, category types)

### Soft Delete Behavior

Deleted resources:
- Are not returned in list endpoints
- Return `404 Not Found` when accessed by ID
- Cannot be undeleted
- Have `deleted_at` timestamp set in the database

---

## Example: Complete Workflow

```bash
# 1. Sign up
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
# Response: { "token": "...", "user": { "id": "...", "email": "user@example.com" } }

# 2. Create a wallet
TOKEN="<jwt-from-signup>"
curl -X POST http://localhost:3000/api/v1/wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cash",
    "type": "cash",
    "balance": 0
  }'
# Response: { "id": "...", "name": "Cash", "type": "cash", "balance": "0.00", ... }

# 3. List wallets
curl -X GET http://localhost:3000/api/v1/wallets \
  -H "Authorization: Bearer $TOKEN"
# Response: [{ "id": "...", "name": "Cash", ... }]

# 4. Create a category
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Food",
    "type": "expense",
    "description": "Groceries and dining"
  }'
# Response: { "id": "...", "name": "Food", "type": "expense", ... }

# 5. List categories
curl -X GET http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer $TOKEN"
# Response: [{ "id": "...", "name": "Food", ... }]

# 6. Get current user
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
# Response: { "id": "...", "email": "user@example.com" }
```
