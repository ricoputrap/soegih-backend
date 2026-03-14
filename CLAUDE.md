# Implementation Guide

## Task Autonomy

- **Simple tasks** (single file, clear requirements): Work autonomously
- **Medium-to-advanced tasks** (multiple files, architectural decisions, complex business logic): Pair with user before implementation
- When in doubt, ask the user

## Branching & Code Review Strategy

**Never push directly to master.** Use feature branches with task-based naming and pull requests for all changes.

### Branch Naming Convention

Branch names follow the pattern: `feat/task-{N}-{description}` or `fix/task-{N}-{description}`

Where `{N}` is the task number from `docs/implementation_plan_mvp.md` and `{description}` is a short kebab-case description.

**Examples:**

- `feat/task-17-wallet`
- `fix/task-11-transaction-validation`

### Workflow

1. **Create feature branch** from `master`:

   ```bash
   git checkout -b feat/task-{N}-{description}
   ```

2. **Implement the task** (write tests before implementation code where applicable)

3. **Run tests** before committing:

   ```bash
   pnpm test
   ```

4. **Commit with conventional commit message**:

   ```
   feat(scope): description

   - Task {N}: bullet list of changes
   ```

5. **Push to origin and open PR**:

   ```bash
   git push -u origin feat/task-{N}-{description}
   gh pr create --title "Task {N}: {description}" --body "..."
   ```

6. **Code review & tests pass** → merge to master via PR (no force-push)

### Multi-File Changes & Planning

For medium-to-advanced tasks involving multiple files or architectural decisions:

- Create a plan using `superpowers:writing-plans` before opening the PR
- Request review with `superpowers:requesting-code-review` after implementation
- Merge only after code review approval

## Naming Conventions

Follow these exactly (from project_spec.md section 8):

| Layer                | Convention   | Example                 |
| -------------------- | ------------ | ----------------------- |
| API JSON             | `snake_case` | `{"created_at": "..."}` |
| React components     | `PascalCase` | `WalletCard.tsx`        |
| React non-components | `kebab-case` | `use-wallet.ts`         |

## Code Organization

- Follow the feature module structure in project_spec.md
- Each feature is isolated and self-contained

## Frontend Design Approach

**Use the `/frontend-design` skill for all user-facing frontend modules** to create distinctive, production-grade UI components. This ensures professional, accessible, and responsive interfaces from the start.

**When implementing frontend tasks:**

- Invoke `/frontend-design` skill to design and build UI components

The skill handles:

- Component design and composition
- Styling and visual polish
- Accessibility and responsiveness
- Interaction patterns

## Test-Driven Development

- Write tests **before** implementation code
- Red → Green → Refactor cycle
- Unit tests for services/business logic
- Test coverage should reflect criticality (auth, transactions are high-priority)
- Run tests before committing

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): description` — new feature
- `fix(scope): description` — bug fix
- `chore(scope): description` — maintenance, deps, config
- `docs(scope): description` — documentation
- `refactor(scope): description` — code restructure (no behavior change)
- `test(scope): description` — tests
- `style(scope): description` — formatting, linting
- `perf(scope): description` — performance improvement

Examples:

- `feat(wallet): add wallet balance sync`
- `fix(auth): correct JWT expiration validation`
- `chore(deps): upgrade prisma to latest`

## When to Ask

- Medium-to-advanced complexity → plan & ask before coding
- Architectural decisions → get alignment first
- Multi-file changes → confirm approach with user

### Living Documentation

All documentation is kept in sync with implementation:

- **[docs/README.md](docs/README.md)** — Documentation index
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — High-level system overview with ASCII diagrams; links to actual code
- **[docs/CHANGELOG.md](docs/CHANGELOG.md)** — Updated per chunk with completed tasks
- **[docs/implementation_plan_mvp.md](docs/implementation_plan_mvp.md)** — MVP task list; source of task numbers for branch naming

### Documentation Guidelines

All documents in the "docs/" directory should always be updated (if necessary) whenever we made any adjustments in this project.

- Keep **ARCHITECTURE.md** high-level and visual; link to actual files in `/src` rather than duplicating code
- Use text-based ASCII diagrams for flows, architecture, and entity relationships
- Focus documentation on "what exists now", not "what will be implemented"
