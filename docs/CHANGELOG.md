# Changelog

## [Unreleased]

### Backend — Chunk 1: Setup & Infrastructure (2026-03-15)

**COMPLETE:** Tasks 1, 3, 4 | **BLOCKED:** Task 2 (database required)

#### Added

**Task 1: Dependencies & Prisma Schema**
- All runtime dependencies installed (Prisma, Supabase, NestJS modules, Pino logging, validation libraries)
- Prisma schema with 5 models: User, Wallet, Category, TransactionEvent, Posting
- Double-entry accounting structure with Posting model linking transactions to wallets
- Soft-delete strategy with timestamp-based name suffixing on deletion
- `.env.example` template for Supabase and server configuration
- Foreign key cascade directives for data integrity (onDelete/onUpdate behavior)

**Task 3: PrismaService**
- Global PrismaService extending PrismaClient with NestJS lifecycle hooks
- Automatic database connection on module initialization
- Graceful disconnection on application shutdown

**Task 4: Global Infrastructure**
- HttpExceptionFilter for standardized error response format (`status_code`, `message`, `path`, `timestamp`)
- RequestIdInterceptor for request tracing and structured logging
- Global ValidationPipe with whitelist and type transformation
- Pino structured logging (pretty-print in dev, JSON in prod)
- CORS enabled globally
- API prefix set to `/api/v1`

#### Technical Details

- Branch: `feat/task-1-setup` (feature branch workflow per CLAUDE.md)
- Commits:
  - `78496b1` - Initial setup with dependencies and schema
  - (Additional commits for PrismaService and bootstrap configuration)
- Tests: All unit tests passing (PrismaService 2 tests, HttpExceptionFilter 2 tests)
- Database schema validation: ✅ Passes `pnpm prisma validate`

#### Blocked

**Task 2: Run Migration**
- Status: BLOCKED - Requires database connectivity
- Action: Will be completed once Supabase database is accessible from this environment

### Frontend Scaffold

- Project scaffolding: React 19 + Vite + TypeScript
- ESLint configuration with React Compiler enabled
- Project documentation: `project_spec.md`, `brainstorm.md`, `ARCHITECTURE.md`, `CLAUDE.md`
- TanStack Router file-based routing scaffold with auth layout guard
- Axios API client with JWT token management via Authorization header
- Sentry error tracking and replay capture initialization
