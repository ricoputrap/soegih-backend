# Soegih - Project Specification Document

DATE: Thursday, 12 March 2026

---

## A. Product Requirements

### 1. Who is the product for?

For the MVP, this is a single-user personal finance app built for the developer's own use. In future development phases, it will be shipped as a public paid SaaS product. Architecture decisions should avoid hard-coding single-user assumptions where it doesn't cost extra effort.

### 2. What problems does it solve?

Lack of visibility into spending patterns, wallet balances, and net worth over time. The app supports both manual transaction entry and an AI chat interface for natural language input, giving the user flexibility in how they log transactions.

### 3. What does the project do?

Manages wallets, expense/income categories, and transactions (expense, income, transfer). Provides a dashboard with monthly expense/income totals, net worth, and expense distribution by category. Supports manual transaction entry and an AI chat interface that parses natural language into structured transactions for user confirmation before saving.

---

## B. Technical Design

### 1. Tech Stack

| Layer         | Choice                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend      | React + Vite (CSR), deployed on Netlify; TanStack Router (file-based); TanStack Table for data tables; TanStack Query for data fetching; React Hook Form + Zod (form handling & validation) |
| Backend       | NestJS + TypeScript                                                                                                                                                                         |
| AI Service    | Python FastAPI + LangChain                                                                                                                                                                  |
| ORM           | Prisma                                                                                                                                                                                      |
| Database      | Postgres via Supabase                                                                                                                                                                       |
| Auth          | Supabase Auth (email/password signup & login, JWT session management)                                                                                                                       |
| AI Model      | OpenAI API (`gpt-4o-mini`) via LangChain; **Note:** Deprecated (retiring Azure support by March 31, 2026)                                                                                   |
| Logging       | Backend: Pino via `nestjs-pino`; Frontend: Sentry (error tracking & session replay)                                                                                                         |
| Reverse proxy | Caddy (auto HTTPS, routing for backend & AI service)                                                                                                                                        |
| E2E Testing   | Playwright (browser automation & end-to-end testing)                                                                                                                                        |
| Deployment    | Frontend: Netlify; Backend + AI service: Docker Compose on VPS                                                                                                                              |

### 2. UI/UX Design Principles

**Responsive strategy:** Desktop-first. All views are fully usable on mobile and tablet.

**Desktop view — data tables:**
All list views (wallets, categories, transactions) render as sortable data tables.

- Clicking a column header toggles sort asc → desc → none.
- Each table has a search input and pagination controls.
- **Wallets & categories:** all records returned in a single API response; sorting, filtering, and pagination handled client-side via TanStack Table.
- **Transactions:** records are potentially large; sorting, searching, and pagination are handled server-side. The frontend sends `page`, `limit`, `sort_by`, `sort_order`, and `search` as query parameters and renders the returned page of data.

**Mobile/tablet view — cards:**
List items render as cards following modern mobile conventions (e.g., name prominent, secondary details below, action buttons accessible via tap). The same client-side vs. server-side data handling rules apply.

### 2.3. Form Handling & Validation Strategy

**Library:** React Hook Form + Zod for all forms across the application.

**Rationale:**

- React Hook Form provides minimal bundle size (~8KB), zero dependencies, and excellent performance with selective re-renders
- Zod enables type-safe schema validation that mirrors TypeScript types, reducing duplication between validation logic and type definitions
- Together they provide straightforward DX for simple forms (auth, wallet/category CRUD) while supporting medium complexity (transaction entry with conditional fields)

**Usage pattern:**

All forms follow this structure:

1. Define a Zod schema that describes form shape, validation rules, and constraints
2. Use `useForm()` hook with `zodResolver()` to integrate schema validation
3. Register fields and handle submission
4. Display field-level errors from validation state

**Example: Wallet creation form**

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const walletSchema = z.object({
  name: z.string().min(1, 'Wallet name is required'),
  type: z.enum(['cash', 'bank', 'e_wallet', 'other']),
  balance: z.number().min(0, 'Balance cannot be negative'),
})

type WalletFormData = z.infer<typeof walletSchema>

function CreateWalletForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: WalletFormData) => {
    await api.post('/api/v1/wallets', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Wallet name" />
      {errors.name && <p>{errors.name.message}</p>}

      <select {...register('type')}>
        <option value="cash">Cash</option>
        <option value="bank">Bank</option>
        <option value="e_wallet">E-Wallet</option>
        <option value="other">Other</option>
      </select>
      {errors.type && <p>{errors.type.message}</p>}

      <input {...register('balance', { valueAsNumber: true })} type="number" />
      {errors.balance && <p>{errors.balance.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        Create Wallet
      </button>
    </form>
  )
}
```

**Validation modes:**

- Use `mode: 'onChange'` for real-time validation feedback (preferred for UX)
- Use `mode: 'onBlur'` for async validation (e.g., username availability checks)
- Use `mode: 'onSubmit'` (default) for validation only on submission

**Async validation:** For checks like wallet name uniqueness, use `onBlurAsync` validators or handle validation on the backend and surface field errors in the response.

### 2.4. Authentication Strategy

**Architecture:** Backend relay pattern. Supabase Auth powers authentication; backend controls auth flow and user profile management.

**Auth Flow:**

```
Frontend (React) → NestJS Backend (/api/v1/auth/signup, /api/v1/auth/login)
                       ↓
                  NestJS calls Supabase Auth SDK
                       ↓
                  Supabase returns JWT session token
                       ↓
                  NestJS creates/syncs user record in local users table
                  NestJS logs auth event
                       ↓
                  NestJS returns JWT to frontend
                       ↓
Frontend stores token in secure context (localStorage or in-memory)

Subsequent API requests:
Frontend → Authorization: Bearer <token> → NestJS JWT guard
                                                ↓
                                    Verify token with Supabase public key
                                    Extract user_id from claims
                                    Scope all queries by user_id
```

**Frontend responsibilities:**

- Call backend `/api/v1/auth/signup` with email & password
- Call backend `/api/v1/auth/login` with email & password
- Store returned JWT token securely (localStorage or context)
- Attach JWT to all subsequent API requests: `Authorization: Bearer <token>`
- Handle token refresh (backend can issue refresh tokens or frontend can re-login)
- Logout: call `/api/v1/auth/logout`, clear stored token

**Backend (`NestJS` + Supabase Auth SDK):**

- **Signup endpoint** (`POST /api/v1/auth/signup`):
  - Validate input (email format, password strength)
  - Call Supabase Auth: `supabase.auth.admin.createUser({ email, password })`
  - Create corresponding record in local `users` table with Supabase `user_id`
  - Log auth event: "user_signed_up"
  - Return JWT and user profile to frontend
- **Login endpoint** (`POST /api/v1/auth/login`):
  - Validate input
  - Call Supabase Auth: `supabase.auth.admin.signInWithPassword({ email, password })`
  - Verify user exists in local `users` table; create if missing (sync)
  - Log auth event: "user_logged_in"
  - Return JWT to frontend
- **Logout endpoint** (`POST /api/v1/auth/logout`):
  - Log auth event: "user_logged_out"
  - Return success (token invalidation handled on frontend)
- **JWT Verification** (all protected endpoints):
  - Verify JWT signature using Supabase public key
  - Extract `user_id` from claims
  - Attach to request context for downstream services
  - Scope all database queries by `user_id`

**Benefits of this approach:**

- Audit trail of all auth events (signup, login, logout)
- User profile sync: local `users` table stays in sync with Supabase
- Post-login hooks: send welcome emails, initialize user settings, etc.
- Single source of truth for user metadata (stored locally)
- Easier to migrate away from Supabase if needed
- Control over auth flow and rate limiting

### 2.5. Logging & Error Tracking

**Frontend Logging:** Sentry for error tracking, performance monitoring, and session replay.

**Setup:**

- Initialize Sentry in `src/main.tsx` with DSN from environment variables
- Capture unhandled errors, promise rejections, and console errors automatically (100% by default)
- Attach user context (user ID once authenticated) to all events via `Sentry.setUser()`
- Sample rates:
  - Errors: 100% (automatic capture)
  - Performance transactions (tracing): 10% for regular sessions (adjustable based on traffic)
  - Session replays: 10% of all sessions, 100% of sessions with errors (for debugging)

**Configuration:**

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% of performance transactions
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  integrations: [
    Sentry.replayIntegration(),
    Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] }),
  ],
});

// Attach user context after authentication
function setUserContext(userId: string, email: string) {
  Sentry.setUser({ id: userId, email });
}

// Clear user context on logout
function clearUserContext() {
  Sentry.setUser(null);
}
```

**Backend Logging:** Pino with structured JSON logging (see section 7 for format details).

### 2.5.1 AI Model Deprecation Note

⚠️ **Important:** `gpt-4o-mini` is being deprecated by OpenAI:

- ChatGPT support ended: February 13, 2026
- Azure support ends: March 31, 2026
- OpenAI API: Still available but may be sunset in the future

**Migration Strategy:**

- Current codebase uses `gpt-4o-mini` for cost efficiency
- When deprecation deadline approaches, migrate to latest available model (e.g., `gpt-4o` or successor)
- Update model name in `soegih-ai` service and LangChain configuration
- Test thoroughly to ensure functionality is preserved

### 2.6. E2E Testing Strategy

**Framework:** Playwright for cross-browser testing (Chromium, Firefox, WebKit).

**Test Coverage:** Critical user flows including:

- Authentication (login/logout)
- Wallet CRUD operations
- Category creation and management
- Transaction entry and search
- Dashboard metrics visibility
- AI chat interface (if integrated)

**Test Organization:**

- Tests organized by feature module (e.g., `wallet.spec.ts`, `transaction.spec.ts`)
- Shared test fixtures in `e2e/fixtures/` for auth, API mocking, and data setup
- Tests run against a local dev environment or dedicated test instance

**Running E2E Tests:**

```bash
# Run all tests
pnpm exec playwright test

# Run tests in headed mode (visible browser)
pnpm exec playwright test --headed

# Run specific test file
pnpm exec playwright test e2e/wallet.spec.ts

# Debug mode
pnpm exec playwright test --debug
```

---

### 3. Data Flow

**Standard request flow:**

```
Browser (Netlify) → Caddy (VPS) → NestJS (/api/v1/...) → Prisma → Supabase Postgres
                                                         ← JSON response ←
```

**Auth flow:**

```
Browser (Netlify) → Caddy (VPS) → NestJS (/api/v1/auth/signup or /api/v1/auth/login)
                                       → Supabase Auth (via SDK)
                                       ← JWT session token
                                   ← Create/sync user in local DB
Browser stores JWT token in secure context
Subsequent requests: Authorization: Bearer <token> header → NestJS verifies token → allows request
```

**AI chat flow:**

```
Browser (Netlify) → Caddy (VPS) → NestJS (/api/v1/ai/chat)
                                       → FastAPI AI service (internal, VPS)
                                             → LangChain → OpenAI API
                                             ← structured transaction object
                                       ← confirmation card shown to user
User confirms → NestJS creates transaction (standard flow)
```

**Error tracking flow:**

```
Browser (Netlify) → Sentry (errors, performance data, session replays)
Backend (NestJS)  → Pino (structured JSON logs)
```

### 4. Project Structure

The project is organized as a **polyrepo**: each service lives in its own independent repository.

| Repo             | Description               | Deployment            |
| ---------------- | ------------------------- | --------------------- |
| `soegih-web`     | React + Vite frontend     | Netlify               |
| `soegih-backend` | NestJS backend            | Docker Compose on VPS |
| `soegih-ai`      | Python FastAPI AI service | Docker Compose on VPS |

**`soegih-web` (this repo) — React + Vite:**

```
soegih-web/
├── src/
│   ├── modules/
│   │   ├── wallet/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── category/
│   │   ├── transaction/
│   │   ├── dashboard/
│   │   └── ai/
│   ├── shared/                # shared components, hooks, utils, types
│   └── assets/
├── e2e/                       # Playwright E2E tests
│   ├── fixtures/              # test fixtures and helpers
│   ├── wallet.spec.ts         # wallet feature tests
│   ├── category.spec.ts       # category feature tests
│   ├── transaction.spec.ts    # transaction feature tests
│   ├── dashboard.spec.ts      # dashboard feature tests
│   └── auth.spec.ts           # authentication flow tests
├── playwright.config.ts
├── netlify.toml
└── ...
```

**`soegih-backend` — NestJS:**

```
soegih-backend/
├── src/
│   ├── modules/               # feature modules: wallet, category, transaction, auth, ai
│   ├── prisma/                # Prisma schema + migrations
│   └── common/                # shared guards, filters, interceptors, pipes
└── ...
```

**`soegih-ai` — Python FastAPI:**

```
soegih-ai/
├── app/
│   ├── routers/
│   ├── chains/                # LangChain chains
│   └── schemas/               # Pydantic models
└── ...
```

**VPS deployment** (`soegih-backend` + `soegih-ai` share a Docker Compose setup):
Docker Compose containers: `caddy`, `backend` (NestJS), `ai` (FastAPI). Caddy handles HTTPS and routes traffic between backend and AI service.

### 5. Data Schema

```
users
- id:         uuid (PK, references Supabase Auth user ID)
- email:      string (denormalized from Supabase Auth, unique)
- created_at, updated_at, deleted_at

wallet
- id:         uuid (PK)
- user_id:    uuid (FK → users)
- name:       string
- balance:    decimal(15, 2)
- type:       "cash" | "bank" | "e_wallet" | "other"
- created_at, updated_at, deleted_at
- partial unique index: (user_id, name, type) WHERE deleted_at IS NULL

category
- id:          uuid (PK)
- user_id:     uuid (FK → users)
- name:        string
- description: string (nullable)
- type:        "expense" | "income"
- created_at, updated_at, deleted_at
- partial unique index: (user_id, name, type) WHERE deleted_at IS NULL

transaction_event
- id:          uuid (PK)
- type:        "expense" | "income" | "transfer"
- note:        string (nullable)
- category_id: uuid (FK → category, nullable) -- null for transfers
- occurred_at: timestamptz
- created_at, updated_at, deleted_at

posting
- id:        uuid (PK)
- event_id:  uuid (FK → transaction_event)
- wallet_id: uuid (FK → wallet)
- amount:    decimal(15, 2) -- signed: positive = money in, negative = money out
- created_at, updated_at, deleted_at
```

**Posting rules:**

- Expense: 1 posting, amount = negative (e.g., -50.00)
- Income: 1 posting, amount = positive (e.g., +1000.00)
- Transfer: 2 postings — source wallet = negative, destination wallet = positive

`wallet.balance` is a stored (denormalized) field, updated atomically within a DB transaction on every create/delete of a transaction.

All tables use soft deletion (`deleted_at`). Uniqueness is enforced via partial indexes scoped to non-deleted rows.

### 6. API Design

All endpoints are prefixed with `/api/v1/`. `PATCH` is used for partial updates. `DELETE` performs soft deletion.

```
Auth
POST   /api/v1/auth/signup              -- Supabase signup (email, password)
POST   /api/v1/auth/login               -- Supabase login (email, password)
POST   /api/v1/auth/logout              -- Clear session
GET    /api/v1/auth/me                  -- Get current user (requires valid token)

Wallets
GET    /api/v1/wallets
POST   /api/v1/wallets
GET    /api/v1/wallets/:id
PATCH  /api/v1/wallets/:id
DELETE /api/v1/wallets/:id

Categories
GET    /api/v1/categories
POST   /api/v1/categories
GET    /api/v1/categories/:id
PATCH  /api/v1/categories/:id
DELETE /api/v1/categories/:id

Transactions
GET    /api/v1/transactions          -- server-side: ?page=1&limit=20&sort_by=occurred_at&sort_order=desc&search=<text>&month=YYYY-MM
POST   /api/v1/transactions
GET    /api/v1/transactions/:id
PATCH  /api/v1/transactions/:id
DELETE /api/v1/transactions/:id

Dashboard
GET    /api/v1/dashboard

AI
POST   /api/v1/ai/chat
POST   /api/v1/ai/chat/confirm       -- triggers real transaction creation
```

**Paginated response format** (used by `GET /api/v1/transactions`):

```json
{
  "data": [
    /* array of transaction objects */
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

Sortable fields for transactions: `occurred_at`, `amount`, `type`. Default: `sort_by=occurred_at&sort_order=desc`.
`search` matches against the transaction `note` field (case-insensitive substring).

### 7. Logging Format

Using `nestjs-pino`. Every log line is a JSON object:

```json
{
  "level": "info",
  "time": "2026-03-12T10:00:00.000Z",
  "context": "WalletService",
  "msg": "wallet created",
  "request_id": "uuid-v4",
  "user_id": "uuid-v4"
}
```

- `level`: `trace` | `debug` | `info` | `warn` | `error` | `fatal`
- `context`: the NestJS class/module name
- `request_id`: auto-generated per request for tracing
- `user_id`: attached once JWT is verified, omitted on auth routes
- Error logs additionally include `err.message` and `err.stack`

### 8. Naming Convention

| Layer                     | Convention                               | Example                                                |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| DB columns                | `snake_case`                             | `created_at`, `wallet_id`                              |
| Prisma schema fields      | `snake_case` (mapped via `@map`/`@@map`) | `created_at`, `wallet_id`                              |
| API JSON fields           | `snake_case`                             | `{"created_at": "..."}`                                |
| NestJS files              | `kebab-case`                             | `wallet.service.ts`, `transaction-event.controller.ts` |
| NestJS classes            | `PascalCase`                             | `WalletService`, `TransactionEventController`          |
| React component files     | `PascalCase`                             | `WalletCard.tsx`, `TransactionList.tsx`                |
| React non-component files | `kebab-case`                             | `use-wallet.ts`, `wallet.service.ts`                   |
| Python files              | `snake_case`                             | `wallet_router.py`, `transaction_chain.py`             |
| Environment variables     | `SCREAMING_SNAKE_CASE`                   | `DATABASE_URL`, `JWT_SECRET`                           |
