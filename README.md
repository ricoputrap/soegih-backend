# Soegih Backend

A personal finance management API built with **NestJS** and **TypeScript**. Soegih helps users track wallets, transactions, and expenses with support for natural language transaction entry via AI.

## Features

- **Wallet Management** — Create and manage multiple wallets (cash, bank, e-wallet, etc.)
- **Categories** — Organize transactions by expense/income categories
- **Transactions** — Record expenses, income, and transfers with detailed tracking
- **Dashboard** — View net worth, monthly totals, and expense distribution
- **AI Chat Interface** — Parse natural language into structured transactions for confirmation
- **Authentication** — Supabase Auth with JWT-based session management
- **Soft Deletion** — All data is soft-deleted for audit trails
- **Server-Side Pagination** — Efficient transaction listing with search and sorting

## Tech Stack

- **Framework:** NestJS with TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **Logging:** Pino (structured JSON logging)
- **Deployment:** Docker Compose on VPS with Caddy reverse proxy

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL via Supabase (account and project)
- Environment variables configured (see `.env.example`)

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
```

See [docs/README.md](docs/README.md) for the complete environment variables list.

### Running the Application

```bash
# Development mode (watch)
pnpm run start:dev

# Production mode
pnpm run start:prod

# Run once
pnpm run start
```

The API runs on `http://localhost:3000`.

### Database Migrations

```bash
# Create a migration
pnpm exec prisma migrate dev --name <migration_name>

# Apply migrations
pnpm exec prisma migrate deploy

# View database in studio
pnpm exec prisma studio
```

## Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:cov

# E2E tests (requires running backend)
pnpm run test:e2e
```

## API Documentation

See [docs/project_spec.md](docs/project_spec.md) for:

- **API Endpoints** — Full list of routes and request/response schemas
- **Data Schema** — Entity relationships and database structure
- **Auth Flow** — JWT verification and Supabase integration
- **Naming Conventions** — CamelCase, snake_case, PascalCase usage

### Key Endpoints

```
POST   /api/v1/auth/signup              -- Register new user
POST   /api/v1/auth/login               -- Login
POST   /api/v1/auth/logout              -- Logout
GET    /api/v1/auth/me                  -- Current user profile

GET    /api/v1/wallets                  -- List wallets
POST   /api/v1/wallets                  -- Create wallet
PATCH  /api/v1/wallets/:id              -- Update wallet

GET    /api/v1/categories               -- List categories
POST   /api/v1/categories               -- Create category

GET    /api/v1/transactions             -- List transactions (paginated, server-side sort/search)
POST   /api/v1/transactions             -- Create transaction

GET    /api/v1/dashboard                -- Dashboard metrics (net worth, monthly totals)

POST   /api/v1/ai/chat                  -- AI natural language transaction parsing
POST   /api/v1/ai/chat/confirm          -- Confirm and save parsed transaction
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for:

- System context and deployment topology
- Module structure
- Data flow diagrams
- Integration patterns

## Project Structure

```
src/
├── modules/
│   ├── auth/              # Authentication (Supabase, JWT)
│   ├── wallet/            # Wallet CRUD
│   ├── category/          # Category CRUD
│   ├── transaction/       # Transaction CRUD with pagination
│   ├── dashboard/         # Dashboard metrics
│   └── ai/                # AI chat integration
├── common/                # Shared guards, filters, interceptors
├── prisma/                # Database schema and migrations
└── main.ts                # App bootstrap
```

## Development Guide

### Naming Conventions

| Layer            | Convention         | Example                    |
| ---------------- | ------------------ | -------------------------- |
| Database columns | `snake_case`       | `created_at`, `wallet_id`  |
| API JSON fields  | `snake_case`       | `{"created_at": "..."}`    |
| NestJS files     | `kebab-case`       | `wallet.service.ts`        |
| Classes          | `PascalCase`       | `WalletService`            |
| Constants        | `UPPER_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS`       |

### Code Generation

Use NestJS CLI for boilerplate:

```bash
# Generate a module with controller and service
nest g module features/wallet
nest g service features/wallet/services/wallet
nest g controller features/wallet/controllers/wallet

# Generate data models and DTOs
nest g class features/wallet/models/wallet.model
nest g class features/wallet/dtos/create-wallet.dto
```

## Deployment

The backend runs in Docker Compose on a VPS with Caddy for HTTPS and routing:

```bash
# Build and run (VPS)
docker-compose up -d
```

The `soegih-ai` FastAPI service runs in the same Docker Compose stack.

## Documentation

- [docs/README.md](docs/README.md) — Documentation index
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design and module structure
- [docs/project_spec.md](docs/project_spec.md) — Complete project specification
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — Implementation progress and changes
- [CLAUDE.md](CLAUDE.md) — Development conventions and workflow

## License

MIT
