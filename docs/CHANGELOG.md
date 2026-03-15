# Changelog

## [Unreleased]

### Backend — Chunk 2: Auth Module (2026-03-15)

**COMPLETE:** Tasks 5, 6, 7

#### Added

**Task 5: JWT Auth Guard + Decorators**
- JwtAuthGuard for Supabase JWT verification via admin SDK
- `@Public()` decorator to skip auth on public endpoints
- `@CurrentUser()` decorator to extract user from request context
- Guard registered globally via APP_GUARD provider
- 4 unit tests with full coverage (public routes, missing token, Supabase errors, valid token)

**Task 6: Auth DTOs & SupabaseService**
- SignupDto and LoginDto with email and password validation
- SupabaseService with admin client and signInWithPassword method
- 2 unit tests verifying service initialization and admin client exposure

**Task 7: AuthService + AuthController + AuthModule**
- AuthService with signup, login, and logout methods
- Full Supabase Auth integration with local DB user sync
- SignupDto/LoginDto validation and error handling
- AuthController with endpoints: POST /signup, POST /login, POST /logout, GET /me
- AuthModule bundling all auth components
- 7 unit tests (4 service + 3 controller) with full mock coverage
- Optional PinoLogger injection to support testing without logging infrastructure

#### Technical Details

- Task 5 Branch: `feat/task-5-jwt-guard` | Commit: `118874b`
- Task 6 Branch: `feat/task-6-auth-dtos-supabase` | Commit: `8b0c7e4`
- Task 7 Branch: `feat/task-7-auth-service-controller` | Current session
- Tests: All 18 tests passing (4 + 2 + 7 + 5 from infrastructure)
- TDD approach: Red → Green → Refactor cycle followed for all tasks
- Fixed Prisma schema moduleFormat for compatibility with ts-jest

---

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
