# Architecture — soegih-web

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
