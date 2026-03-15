# Architecture — soegih (Full Stack)

## System Context

```
                    ┌────────────────────────────────────────┐
                    │               VPS (Docker)             │
                    │                                        │
 ┌───────────┐      │  ┌────────┐      ┌──────────────────┐  │
 │  Browser  │─────►│  │ Caddy  │─────►│  soegih-backend  │  │
 │ (Netlify) │◄─────│  │        │      │  NestJS :3000    │  │
 └───────────┘      │  └────────┘      └─────────┬────────┘  │
                    │                            │           │
                    │                   ┌────────▼────────┐  │
                    │                   │  soegih-ai      │  │
                    │                   │  FastAPI :8000  │  │
                    │                   └─────────────────┘  │
                    └────────────────────────────────────────┘
                                              │
                                    ┌─────────▼──────────┐
                                    │  Supabase Postgres │
                                    └────────────────────┘
```

## Backend Stack

**Framework:** NestJS 11 + TypeScript 5.7
**Database:** PostgreSQL (Supabase) with Prisma 6 ORM
**Authentication:** Supabase Auth (JWT verified via admin SDK)
**Logging:** Pino (structured, JSON in prod / pretty-print in dev)
**API Prefix:** `/api/v1`

### Global Infrastructure (Chunk 1 ✅)

**Files:** `src/main.ts`, `src/app.module.ts`, `src/common/**`

- **HttpExceptionFilter** — Standardized error response format with status_code, message, path, timestamp
- **ValidationPipe** — Global request validation with whitelist and type transformation
- **RequestIdInterceptor** — Request tracing via x-request-id header (UUID fallback)
- **JwtAuthGuard** (Task 5 ✅) — Supabase JWT verification; skipped via @Public() decorator
- **PrismaModule** — Global database service (auto-connects on init, gracefully disconnects on shutdown)
- **ConfigModule** — Environment variable management
- **LoggerModule** (Pino) — Structured logging with request context

### Backend Module Structure

```
src/
├── main.ts                           # Bootstrap: pipes, filters, CORS, prefix
├── app.module.ts                     # Root module: config, logging, database
├── prisma/
│   ├── prisma.module.ts              # Global database module
│   ├── prisma.service.ts             # PrismaClient wrapper with lifecycle hooks
│   └── prisma.service.spec.ts        # Unit tests
├── common/
│   ├── filters/
│   │   ├── http-exception.filter.ts  # Error response standardization
│   │   └── http-exception.filter.spec.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts         # Supabase JWT verification (Task 5)
│   ├── decorators/
│   │   ├── public.decorator.ts       # Skip auth on endpoints
│   │   └── current-user.decorator.ts # Extract user from request
│   └── interceptors/
│       └── request-id.interceptor.ts # Request tracing
└── modules/
    ├── auth/                         # User signup/login/logout (Task 5-7)
    ├── wallet/                       # Wallet CRUD (Task 8-10)
    ├── category/                     # Category CRUD (Task 11)
    ├── transaction/                  # Transaction CRUD with postings (Task 12-14)
    ├── dashboard/                    # Aggregates (Task 15)
    └── ai/                           # FastAPI proxy (Task 16)
```

### Data Model (Chunk 1 ✅)

**File:** `prisma/schema.prisma`

**Core Entities:**
- **User** — Synced from Supabase Auth (UUID)
- **Wallet** — Cash, bank, e-wallet, other types; balance tracking
- **Category** — Expense or income; optional per transaction
- **TransactionEvent** — Represents a transaction (expense, income, transfer)
- **Posting** — Double-entry accounting: links TransactionEvent to Wallet with signed amount

**Key Design Decisions:**
- **Double-entry accounting:** Every transaction creates postings to maintain ledger balance
- **Soft-delete:** All entities have `deleted_at` field; names suffixed with timestamp on delete
- **Unique constraints:** `(user_id, name, type)` scoped to non-deleted records (partial indexes)
- **Cascade deletes:** Maintains data integrity (cascade on user/transaction delete, SetNull on category delete)

## Frontend Module Structure

```
src/
├── modules/
│   ├── auth/          # login, JWT storage
│   ├── dashboard/     # net worth, monthly totals, expense chart
│   ├── wallet/        # wallet CRUD
│   ├── category/      # category CRUD
│   ├── transaction/   # transaction CRUD (server-side pagination)
│   └── ai/            # AI chat, confirmation flow
└── shared/            # components, hooks, utils, types
```

## Key Patterns

- **Routing:** TanStack Router (file-based)
- **Data fetching:** TanStack Query — mutations + query invalidation
- **Tables:** TanStack Table
  - Wallets & categories: client-side sort/filter/paginate
  - Transactions: server-side (`?page`, `limit`, `sort_by`, `sort_order`, `search`, `month`)
- **Auth:** JWT stored in memory; attached via `Authorization: Bearer` header

## API Base URL

Configured via `VITE_API_BASE_URL` env variable → proxied through Caddy to `soegih-backend`.
