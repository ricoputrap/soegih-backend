# MVP Frontend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete MVP frontend for Soegih — a personal finance app with wallet, category, transaction, dashboard, and AI chat modules.

**Architecture:** React + Vite CSR deployed on Netlify. TanStack Router (file-based) for routing with protected route layouts. TanStack Query manages server state; TanStack Table handles client-side (wallets, categories) and server-side (transactions) data grids. JWT stored in memory, attached via axios interceptor.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, TanStack Table, React Hook Form + Zod, Recharts, Axios, Sentry, Vitest, Playwright

---

## Chunk 1: Project Setup & Infrastructure

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [x] **Step 1: Install runtime dependencies**

```bash
pnpm add @tanstack/react-router @tanstack/react-query @tanstack/react-table
pnpm add react-hook-form @hookform/resolvers zod
pnpm add axios recharts
pnpm add @sentry/react
```

- [x] **Step 2: Install dev dependencies**

```bash
pnpm add -D @tanstack/router-plugin vitest @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D @playwright/test
pnpm exec playwright install
```

- [x] **Step 3: Update `vite.config.ts` with router plugin and test config**

The project already uses `@rolldown/plugin-babel` + `reactCompilerPreset` (both installed in `package.json`). Add `tanstackRouter` before `react()` and append the `test` block:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }), // must be before react()
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

- [x] **Step 4: Create test setup file**

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom'
```

- [x] **Step 5: Add test script to `package.json` scripts**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [x] **Step 6: Verify Vite starts without errors**

```bash
pnpm dev
```

Expected: Dev server starts on localhost:5173

- [x] **Step 7: Commit**

```bash
git add vite.config.ts package.json src/test-setup.ts pnpm-lock.yaml
git commit -m "chore(setup): install all MVP dependencies and configure vite"
```

---

### Task 2: API Client & Environment Config

**Files:**
- Create: `src/shared/lib/api-client.ts`
- Create: `.env.example`

- [x] **Step 1: Create `.env.example`**

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_SENTRY_DSN=
```

- [x] **Step 2: Write test for api-client token attachment**

```typescript
// src/shared/lib/api-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('api-client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('attaches Authorization header when token is set', async () => {
    const { setAuthToken, apiClient } = await import('./api-client')
    setAuthToken('test-jwt-token')
    const config = apiClient.defaults.headers.common['Authorization']
    expect(config).toBe('Bearer test-jwt-token')
  })

  it('removes Authorization header when token is cleared', async () => {
    const { setAuthToken, clearAuthToken, apiClient } = await import('./api-client')
    setAuthToken('test-jwt-token')
    clearAuthToken()
    expect(apiClient.defaults.headers.common['Authorization']).toBeUndefined()
  })
})
```

- [x] **Step 3: Run test — expect FAIL**

```bash
pnpm test
```

Expected: FAIL — `api-client` module not found

- [x] **Step 4: Implement `api-client.ts`**

```typescript
// src/shared/lib/api-client.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

export function setAuthToken(token: string): void {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function clearAuthToken(): void {
  delete apiClient.defaults.headers.common['Authorization']
}
```

- [x] **Step 5: Run test — expect PASS**

```bash
pnpm test
```

- [x] **Step 6: Commit**

```bash
git add src/shared/lib/api-client.ts src/shared/lib/api-client.test.ts .env.example
git commit -m "feat(setup): add axios api client with JWT token management"
```

---

### Task 3: TanStack Router File-Based Routing Scaffold

**Files:**
- Create: `src/routes/__root.tsx`
- Create: `src/routes/index.tsx`
- Create: `src/routes/_auth.tsx`
- Create: `src/routes/_auth/dashboard.tsx`
- Create: `src/routes/login.tsx`
- Create: `src/routes/signup.tsx`
- Modify: `src/main.tsx`
- Delete: `src/App.tsx`, `src/App.css`

- [x] **Step 1: Create root route with QueryClientProvider**

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  ),
})
```

- [x] **Step 2: Create index route (redirect to dashboard)**

```typescript
// src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
```

- [x] **Step 3: Create login route (placeholder)**

```typescript
// src/routes/login.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: () => <div>Login Page (placeholder)</div>,
})
```

- [x] **Step 4: Create signup route (placeholder)**

```typescript
// src/routes/signup.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  component: () => <div>Signup Page (placeholder)</div>,
})
```

- [x] **Step 5: Create auth layout route (placeholder guard)**

```typescript
// src/routes/_auth.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: () => <Outlet />,
})
```

- [x] **Step 6: Create dashboard route (placeholder)**

```typescript
// src/routes/_auth/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/dashboard')({
  component: () => <div>Dashboard (placeholder)</div>,
})
```

- [x] **Step 7: Update `main.tsx`**

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

- [x] **Step 8: Delete `src/App.tsx` and `src/App.css`**

- [x] **Step 9: Run dev server, verify routing works**

```bash
pnpm dev
```

Navigate to `/` → should redirect to `/dashboard`. Navigate to `/login` → login placeholder.

- [x] **Step 10: Commit**

```bash
git add src/routes/ src/main.tsx src/routeTree.gen.ts src/index.css
git commit -m "feat(setup): scaffold TanStack Router file-based routing"
```

---

### Task 4: Sentry Initialization

**Files:**
- Modify: `src/main.tsx`

- [x] **Step 1: Initialize Sentry in `main.tsx`**

```typescript
// Add at the top of src/main.tsx, before other imports
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] }),
  ],
})
```

- [x] **Step 2: Verify dev server still starts**

```bash
pnpm dev
```

- [x] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat(setup): initialize Sentry for error tracking"
```

---

## Chunk 2: Auth Module

### Task 5: Auth Types & Service

**Files:**
- Create: `src/modules/auth/types/auth.types.ts`
- Create: `src/modules/auth/services/auth.service.ts`
- Create: `src/modules/auth/services/auth.service.test.ts`

- [ ] **Step 1: Define auth types**

```typescript
// src/modules/auth/types/auth.types.ts
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
  }
}
```

- [ ] **Step 2: Write tests for auth service**

```typescript
// src/modules/auth/services/auth.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../../shared/lib/api-client'
import { login, signup, logout } from './auth.service'

vi.mock('../../../shared/lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}))

const mockPost = vi.mocked(apiClient.post)

beforeEach(() => vi.clearAllMocks())

describe('login', () => {
  it('calls POST /api/v1/auth/login with credentials', async () => {
    mockPost.mockResolvedValueOnce({ data: { token: 'jwt', user: { id: '1', email: 'a@b.com' } } })
    const result = await login({ email: 'a@b.com', password: 'pass' })
    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/login', { email: 'a@b.com', password: 'pass' })
    expect(result.token).toBe('jwt')
  })
})

describe('signup', () => {
  it('calls POST /api/v1/auth/signup with credentials', async () => {
    mockPost.mockResolvedValueOnce({ data: { token: 'jwt', user: { id: '1', email: 'a@b.com' } } })
    await signup({ email: 'a@b.com', password: 'pass' })
    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/signup', { email: 'a@b.com', password: 'pass' })
  })
})

describe('logout', () => {
  it('calls POST /api/v1/auth/logout', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await logout()
    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/logout')
  })
})
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
pnpm test
```

- [ ] **Step 4: Implement auth service**

```typescript
// src/modules/auth/services/auth.service.ts
import { apiClient } from '../../../shared/lib/api-client'
import type { AuthResponse, LoginRequest, SignupRequest } from '../types/auth.types'

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', data)
  return res.data
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/signup', data)
  return res.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/v1/auth/logout')
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/auth/
git commit -m "feat(auth): add auth types and service"
```

---

### Task 6: Token Store (JWT in Memory)

**Files:**
- Create: `src/shared/lib/token-store.ts`
- Create: `src/shared/lib/token-store.test.ts`

- [ ] **Step 1: Write tests for token store**

```typescript
// src/shared/lib/token-store.test.ts
import { describe, it, expect } from 'vitest'
import { getToken, setToken, clearToken } from './token-store'

describe('token-store', () => {
  it('stores and retrieves token', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })

  it('clears token', () => {
    setToken('abc123')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement token store**

```typescript
// src/shared/lib/token-store.ts
let _token: string | null = null

export function getToken(): string | null {
  return _token
}

export function setToken(token: string): void {
  _token = token
}

export function clearToken(): void {
  _token = null
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shared/lib/token-store.ts src/shared/lib/token-store.test.ts
git commit -m "feat(auth): add in-memory token store"
```

---

### Task 7: Auth Context & Route Guards

**Files:**
- Create: `src/shared/context/auth-context.tsx`
- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/_auth.tsx`

- [ ] **Step 1: Create auth context**

```typescript
// src/shared/context/auth-context.tsx
import { createContext, useContext, useState, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { setToken, clearToken, getToken } from '../lib/token-store'
import { setAuthToken, clearAuthToken } from '../lib/api-client'

export interface AuthUser {
  id: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  persistAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  function persistAuth(token: string, authUser: AuthUser) {
    setToken(token)
    setAuthToken(token)
    setUser(authUser)
    Sentry.setUser({ id: authUser.id, email: authUser.email })
  }

  function clearAuth() {
    clearToken()       // uses the dedicated clearToken, not a cast
    clearAuthToken()   // static import — no async race condition
    setUser(null)
    Sentry.setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token: getToken(), persistAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Update root route to wrap with AuthProvider**

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../shared/context/auth-context'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  ),
})
```

- [ ] **Step 3: Implement auth layout guard (redirect unauthenticated users)**

```typescript
// src/routes/_auth.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getToken } from '../shared/lib/token-store'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (!getToken()) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => <Outlet />,  // Outlet is imported above
})
```

> Note: `Outlet` must remain in this file's component even after Task 9 updates this file to wrap with `AppLayout`. The final version will be:
> ```typescript
> component: () => <AppLayout><Outlet /></AppLayout>
> ```

- [ ] **Step 4: Commit**

```bash
git add src/shared/context/auth-context.tsx src/routes/__root.tsx src/routes/_auth.tsx
git commit -m "feat(auth): add auth context and route guard"
```

---

### Task 8: Login & Signup Forms

**Files:**
- Create: `src/modules/auth/components/LoginForm.tsx`
- Create: `src/modules/auth/components/SignupForm.tsx`
- Modify: `src/routes/login.tsx`
- Modify: `src/routes/signup.tsx`

- [ ] **Step 1: Implement `LoginForm.tsx`**

```typescript
// src/modules/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { useAuthContext } from '../../../shared/context/auth-context'
import { login } from '../services/auth.service'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { persistAuth } = useAuthContext()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data)
      persistAuth(response.token, response.user)
      navigate({ to: '/dashboard' })
    } catch {
      setError('root', { message: 'Invalid email or password' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1>Sign In</h1>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...register('password')} />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>

      {errors.root && <p role="alert">{errors.root.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>

      <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
    </form>
  )
}
```

- [ ] **Step 2: Implement `SignupForm.tsx`**

```typescript
// src/modules/auth/components/SignupForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { useAuthContext } from '../../../shared/context/auth-context'
import { signup } from '../services/auth.service'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm() {
  const { persistAuth } = useAuthContext()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      const response = await signup({ email: data.email, password: data.password })
      persistAuth(response.token, response.user)
      navigate({ to: '/dashboard' })
    } catch {
      setError('root', { message: 'Failed to create account. Try a different email.' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1>Create Account</h1>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...register('password')} />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p role="alert">{errors.confirmPassword.message}</p>}
      </div>

      {errors.root && <p role="alert">{errors.root.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </button>

      <p>Already have an account? <Link to="/login">Sign in</Link></p>
    </form>
  )
}
```

- [ ] **Step 3: Wire forms into routes**

```typescript
// src/routes/login.tsx
import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '../modules/auth/components/LoginForm'
export const Route = createFileRoute('/login')({
  component: LoginForm,
})
```

```typescript
// src/routes/signup.tsx
import { createFileRoute } from '@tanstack/react-router'
import { SignupForm } from '../modules/auth/components/SignupForm'
export const Route = createFileRoute('/signup')({
  component: SignupForm,
})
```

- [ ] **Step 4: Verify login/signup pages render in browser**

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/components/ src/routes/login.tsx src/routes/signup.tsx
git commit -m "feat(auth): implement login and signup forms"
```

---

## Chunk 3: Shared App Shell

### Task 9: Session Restore on Page Refresh

**Files:**
- Create: `src/modules/auth/services/me.service.ts`
- Create: `src/modules/auth/services/me.service.test.ts`
- Modify: `src/shared/context/auth-context.tsx`
- Modify: `src/routes/__root.tsx`

The JWT is in-memory. On page refresh it is lost — the user gets bounced to `/login`. Fix: persist the token in `localStorage`, restore it on app load, and verify it via `GET /api/v1/auth/me`.

- [ ] **Step 1: Write test for me service**

```typescript
// src/modules/auth/services/me.service.test.ts
import { describe, it, expect, vi } from 'vitest'
import { apiClient } from '../../../shared/lib/api-client'
import { getMe } from './me.service'

vi.mock('../../../shared/lib/api-client', () => ({ apiClient: { get: vi.fn() } }))

describe('getMe', () => {
  it('calls GET /api/v1/auth/me', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: '1', email: 'a@b.com' } })
    const result = await getMe()
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/me')
    expect(result.id).toBe('1')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement me service**

```typescript
// src/modules/auth/services/me.service.ts
import { apiClient } from '../../../shared/lib/api-client'
import type { AuthUser } from '../../../shared/context/auth-context'

export async function getMe(): Promise<AuthUser> {
  const res = await apiClient.get<AuthUser>('/api/v1/auth/me')
  return res.data
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Update token-store to also persist to localStorage**

```typescript
// src/shared/lib/token-store.ts
const TOKEN_KEY = 'soegih_token'
let _token: string | null = localStorage.getItem(TOKEN_KEY)

export function getToken(): string | null {
  return _token
}

export function setToken(token: string): void {
  _token = token
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  _token = null
  localStorage.removeItem(TOKEN_KEY)
}
```

> Note: `localStorage` is a valid choice per spec section 2.4 ("localStorage or in-memory"). Using it here survives page refresh.

- [ ] **Step 6: Update `AuthProvider` to restore session on mount**

In `auth-context.tsx`, add a `useEffect` that runs once on mount: if a token exists in the store, call `getMe()` and populate user state. If the call fails (token expired), call `clearAuth()`.

```typescript
// Add inside AuthProvider, after useState declarations:
import { useEffect } from 'react'
import { getMe } from '../../modules/auth/services/me.service'

useEffect(() => {
  const token = getToken()
  if (!token) return
  setAuthToken(token)
  getMe()
    .then((authUser) => setUser(authUser))
    .catch(() => clearAuth())
}, []) // runs once on mount
```

- [ ] **Step 7: Verify session persists across page refresh in browser**

1. Log in via `/login`
2. Hard-refresh the page (`Ctrl+R` / `Cmd+R`)
3. Expect: user stays on `/dashboard`, not redirected to `/login`

- [ ] **Step 8: Commit**

```bash
git add src/modules/auth/services/me.service.ts src/modules/auth/services/me.service.test.ts
git add src/shared/lib/token-store.ts src/shared/context/auth-context.tsx
git commit -m "feat(auth): persist JWT in localStorage and restore session on page refresh"
```

---

### Task 10: App Layout & Navigation

**Files:**
- Create: `src/shared/components/AppLayout.tsx`
- Create: `src/shared/components/Sidebar.tsx`
- Create: `src/routes/_auth/wallets.tsx` (placeholder)
- Create: `src/routes/_auth/categories.tsx` (placeholder)
- Create: `src/routes/_auth/transactions.tsx` (placeholder)
- Create: `src/routes/_auth/ai.tsx` (placeholder)
- Modify: `src/routes/_auth.tsx`

- [ ] **Step 1: Use `/frontend-design` skill to design and implement `AppLayout` and `Sidebar`**

  Invoke `/frontend-design` with this context:
  - Desktop-first sidebar layout, collapsible on mobile
  - Nav items: Dashboard, Wallets, Categories, Transactions, AI Chat
  - User info at bottom + logout button
  - Clean, modern finance app aesthetic

- [ ] **Step 2: Create placeholder routes for all auth-protected pages**

```typescript
// src/routes/_auth/wallets.tsx
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_auth/wallets')({
  component: () => <div>Wallets (placeholder)</div>,
})
```

Repeat for `categories.tsx`, `transactions.tsx`, `ai.tsx`.

- [ ] **Step 3: Update `_auth.tsx` layout to render AppLayout around Outlet**

```typescript
// src/routes/_auth.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getToken } from '../shared/lib/token-store'
import { AppLayout } from '../shared/components/AppLayout'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
})
```

- [ ] **Step 4: Verify full shell renders with all nav links**

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/ src/routes/_auth/ src/routes/_auth.tsx
git commit -m "feat(layout): add app shell with sidebar navigation"
```

---

## Chunk 4: Wallet Module

### Task 11: Wallet Types & Service

**Files:**
- Create: `src/modules/wallet/types/wallet.types.ts`
- Create: `src/modules/wallet/services/wallet.service.ts`
- Create: `src/modules/wallet/services/wallet.service.test.ts`

- [ ] **Step 1: Define wallet types**

```typescript
// src/modules/wallet/types/wallet.types.ts
export type WalletType = 'cash' | 'bank' | 'e_wallet' | 'other'

export interface Wallet {
  id: string
  user_id: string
  name: string
  balance: number
  type: WalletType
  created_at: string
  updated_at: string
}

export interface CreateWalletRequest {
  name: string
  type: WalletType
  balance: number
}

export interface UpdateWalletRequest {
  name?: string
  type?: WalletType
  balance?: number
}
```

- [ ] **Step 2: Write wallet service tests**

```typescript
// src/modules/wallet/services/wallet.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../../shared/lib/api-client'
import { getWallets, createWallet, updateWallet, deleteWallet } from './wallet.service'

vi.mock('../../../shared/lib/api-client', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))

const mockWallet = { id: '1', user_id: 'u1', name: 'Cash', balance: 100, type: 'cash', created_at: '', updated_at: '' }

beforeEach(() => vi.clearAllMocks())

describe('getWallets', () => {
  it('calls GET /api/v1/wallets', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [mockWallet] })
    const result = await getWallets()
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/wallets')
    expect(result).toEqual([mockWallet])
  })
})

describe('createWallet', () => {
  it('calls POST /api/v1/wallets', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockWallet })
    await createWallet({ name: 'Cash', type: 'cash', balance: 0 })
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/wallets', { name: 'Cash', type: 'cash', balance: 0 })
  })
})

describe('updateWallet', () => {
  it('calls PATCH /api/v1/wallets/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockWallet })
    await updateWallet('1', { name: 'Bank' })
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/wallets/1', { name: 'Bank' })
  })
})

describe('deleteWallet', () => {
  it('calls DELETE /api/v1/wallets/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} })
    await deleteWallet('1')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/wallets/1')
  })
})
```

- [ ] **Step 3: Run tests — expect FAIL**

- [ ] **Step 4: Implement wallet service**

```typescript
// src/modules/wallet/services/wallet.service.ts
import { apiClient } from '../../../shared/lib/api-client'
import type { Wallet, CreateWalletRequest, UpdateWalletRequest } from '../types/wallet.types'

export async function getWallets(): Promise<Wallet[]> {
  const res = await apiClient.get<Wallet[]>('/api/v1/wallets')
  return res.data
}

export async function getWallet(id: string): Promise<Wallet> {
  const res = await apiClient.get<Wallet>(`/api/v1/wallets/${id}`)
  return res.data
}

export async function createWallet(data: CreateWalletRequest): Promise<Wallet> {
  const res = await apiClient.post<Wallet>('/api/v1/wallets', data)
  return res.data
}

export async function updateWallet(id: string, data: UpdateWalletRequest): Promise<Wallet> {
  const res = await apiClient.patch<Wallet>(`/api/v1/wallets/${id}`, data)
  return res.data
}

export async function deleteWallet(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/wallets/${id}`)
}
```

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add src/modules/wallet/
git commit -m "feat(wallet): add wallet types and service"
```

---

### Task 12: Wallet Hooks

**Files:**
- Create: `src/modules/wallet/hooks/use-wallets.ts`
- Create: `src/modules/wallet/hooks/use-wallets.test.ts`

- [ ] **Step 1: Write tests for wallet hooks**

```typescript
// src/modules/wallet/hooks/use-wallets.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useWallets } from './use-wallets'
import * as walletService from '../services/wallet.service'

vi.mock('../services/wallet.service')

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useWallets', () => {
  it('returns wallet list from service', async () => {
    const mockWallets = [{ id: '1', name: 'Cash', type: 'cash', balance: 100, user_id: 'u1', created_at: '', updated_at: '' }]
    vi.mocked(walletService.getWallets).mockResolvedValueOnce(mockWallets)
    const { result } = renderHook(() => useWallets(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockWallets)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test
```

- [ ] **Step 3: Implement wallet hooks**

```typescript
// src/modules/wallet/hooks/use-wallets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWallets, createWallet, updateWallet, deleteWallet } from '../services/wallet.service'
import type { CreateWalletRequest, UpdateWalletRequest } from '../types/wallet.types'

export const walletKeys = {
  all: ['wallets'] as const,
}

export function useWallets() {
  return useQuery({
    queryKey: walletKeys.all,
    queryFn: getWallets,
  })
}

export function useCreateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateWalletRequest) => createWallet(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all }),
  })
}

export function useUpdateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWalletRequest }) => updateWallet(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all }),
  })
}

export function useDeleteWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWallet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all }),
  })
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/wallet/hooks/
git commit -m "feat(wallet): add wallet TanStack Query hooks"
```

---

### Task 13: Wallet UI (Form, Table, Page)

**Files:**
- Create: `src/modules/wallet/components/WalletForm.tsx`
- Create: `src/modules/wallet/components/WalletTable.tsx`
- Create: `src/modules/wallet/components/WalletCard.tsx`
- Modify: `src/routes/_auth/wallets.tsx`

- [ ] **Step 1: Use `/frontend-design` skill to design and implement wallet UI**

  Invoke `/frontend-design` with this context:
  - WalletForm: modal form (create/edit), Zod schema validating name (required), type (enum), balance (non-negative number). Uses React Hook Form + zodResolver, `mode: 'onChange'`.
  - WalletTable (desktop): TanStack Table, client-side sort (name, balance, type, created_at), search input (filters by name), pagination (10 per page). Action buttons: Edit, Delete per row.
  - WalletCard (mobile): card layout showing wallet name, type badge, balance. Tap actions for Edit/Delete.
  - Responsive: show WalletTable on md+ screens, WalletCard list on smaller screens.
  - Page has a "New Wallet" button that opens WalletForm modal.

  The Zod schema for WalletForm:
  ```typescript
  const walletSchema = z.object({
    name: z.string().min(1, 'Wallet name is required'),
    type: z.enum(['cash', 'bank', 'e_wallet', 'other']),
    balance: z.number({ invalid_type_error: 'Balance must be a number' }).min(0, 'Balance cannot be negative'),
  })
  ```

  TanStack Table setup for client-side:
  ```typescript
  useReactTable({
    data: wallets ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
  })
  ```

- [ ] **Step 2: Update wallet route to use the WalletPage component**

- [ ] **Step 3: Verify full wallet CRUD flow works in browser (with backend running)**

- [ ] **Step 4: Commit**

```bash
git add src/modules/wallet/components/ src/routes/_auth/wallets.tsx
git commit -m "feat(wallet): implement wallet table, form, and page"
```

---

## Chunk 5: Category Module

### Task 14: Category Types, Service & Hooks

**Files:**
- Create: `src/modules/category/types/category.types.ts`
- Create: `src/modules/category/services/category.service.ts`
- Create: `src/modules/category/services/category.service.test.ts`
- Create: `src/modules/category/hooks/use-categories.ts`

- [ ] **Step 1: Define category types**

```typescript
// src/modules/category/types/category.types.ts
export type CategoryType = 'expense' | 'income'

export interface Category {
  id: string
  user_id: string
  name: string
  description: string | null
  type: CategoryType
  created_at: string
  updated_at: string
}

export interface CreateCategoryRequest {
  name: string
  type: CategoryType
  description?: string
}

export interface UpdateCategoryRequest {
  name?: string
  type?: CategoryType
  description?: string
}
```

- [ ] **Step 2: Write category service tests (same pattern as wallet)**

  Test: `getCategories` calls `GET /api/v1/categories`, `createCategory` calls `POST`, `updateCategory` calls `PATCH /:id`, `deleteCategory` calls `DELETE /:id`.

- [ ] **Step 3: Run tests — expect FAIL**

- [ ] **Step 4: Implement category service**

```typescript
// src/modules/category/services/category.service.ts
import { apiClient } from '../../../shared/lib/api-client'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types'

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get<Category[]>('/api/v1/categories')
  return res.data
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const res = await apiClient.post<Category>('/api/v1/categories', data)
  return res.data
}

export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
  const res = await apiClient.patch<Category>(`/api/v1/categories/${id}`, data)
  return res.data
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/categories/${id}`)
}
```

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Write test for category hooks**

```typescript
// src/modules/category/hooks/use-categories.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useCategories } from './use-categories'
import * as categoryService from '../services/category.service'

vi.mock('../services/category.service')

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCategories', () => {
  it('returns category list from service', async () => {
    const mockCategories = [{ id: '1', name: 'Food', type: 'expense', description: null, user_id: 'u1', created_at: '', updated_at: '' }]
    vi.mocked(categoryService.getCategories).mockResolvedValueOnce(mockCategories)
    const { result } = renderHook(() => useCategories(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCategories)
  })
})
```

- [ ] **Step 6a: Run test — expect FAIL**

- [ ] **Step 7: Implement category hooks**

```typescript
// src/modules/category/hooks/use-categories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/category.service'
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types'

export const categoryKeys = { all: ['categories'] as const }

export function useCategories() {
  return useQuery({ queryKey: categoryKeys.all, queryFn: getCategories })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) => updateCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}
```

- [ ] **Step 7a: Run test — expect PASS**

- [ ] **Step 8: Commit**

```bash
git add src/modules/category/
git commit -m "feat(category): add category types, service, and hooks"
```

---

### Task 15: Category UI

**Files:**
- Create: `src/modules/category/components/CategoryForm.tsx`
- Create: `src/modules/category/components/CategoryTable.tsx`
- Create: `src/modules/category/components/CategoryCard.tsx`
- Modify: `src/routes/_auth/categories.tsx`

- [ ] **Step 1: Use `/frontend-design` skill to design category UI**

  Same pattern as wallets. Key differences:
  - CategoryForm fields: name (required), type (expense|income radio or select), description (optional textarea)
  - Table columns: name, type (badge: expense=red, income=green), description, created_at. Client-side sort/filter/paginate.
  - Zod schema:
    ```typescript
    const categorySchema = z.object({
      name: z.string().min(1, 'Category name is required'),
      type: z.enum(['expense', 'income']),
      description: z.string().optional(),
    })
    ```

- [ ] **Step 2: Wire up categories route**

- [ ] **Step 3: Commit**

```bash
git add src/modules/category/components/ src/routes/_auth/categories.tsx
git commit -m "feat(category): implement category table, form, and page"
```

---

## Chunk 6: Transaction Module

### Task 16: Transaction Types & Service

**Files:**
- Create: `src/modules/transaction/types/transaction.types.ts`
- Create: `src/modules/transaction/services/transaction.service.ts`
- Create: `src/modules/transaction/services/transaction.service.test.ts`

- [ ] **Step 1: Define transaction types**

```typescript
// src/modules/transaction/types/transaction.types.ts
export type TransactionType = 'expense' | 'income' | 'transfer'

export interface Posting {
  id: string
  wallet_id: string
  amount: number
}

export interface Transaction {
  id: string
  type: TransactionType
  note: string | null
  category_id: string | null
  occurred_at: string
  postings: Posting[]
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface TransactionListParams {
  page?: number
  limit?: number
  sort_by?: 'occurred_at' | 'amount' | 'type'
  sort_order?: 'asc' | 'desc'
  search?: string
  month?: string // YYYY-MM
}

export interface CreateTransactionRequest {
  type: TransactionType
  note?: string
  category_id?: string
  occurred_at: string
  postings: Array<{ wallet_id: string; amount: number }>
}

export interface UpdateTransactionRequest {
  note?: string
  category_id?: string
  occurred_at?: string
}
```

- [ ] **Step 2: Write transaction service tests**

```typescript
// src/modules/transaction/services/transaction.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../../shared/lib/api-client'
import { getTransactions, createTransaction, deleteTransaction } from './transaction.service'

vi.mock('../../../shared/lib/api-client', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))

beforeEach(() => vi.clearAllMocks())

describe('getTransactions', () => {
  it('calls GET /api/v1/transactions with query params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: [], meta: { total: 0, page: 1, limit: 20, total_pages: 0 } } })
    await getTransactions({ page: 1, limit: 20, sort_by: 'occurred_at', sort_order: 'desc' })
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/transactions', {
      params: { page: 1, limit: 20, sort_by: 'occurred_at', sort_order: 'desc' },
    })
  })
})

describe('createTransaction', () => {
  it('calls POST /api/v1/transactions', async () => {
    const payload = { type: 'expense' as const, occurred_at: '2026-01-01', postings: [{ wallet_id: 'w1', amount: -50 }] }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: '1', ...payload } })
    await createTransaction(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/transactions', payload)
  })
})
```

- [ ] **Step 3: Run tests — expect FAIL**

- [ ] **Step 4: Implement transaction service**

```typescript
// src/modules/transaction/services/transaction.service.ts
import { apiClient } from '../../../shared/lib/api-client'
import type { Transaction, CreateTransactionRequest, UpdateTransactionRequest, PaginatedResponse, TransactionListParams } from '../types/transaction.types'

export async function getTransactions(params: TransactionListParams): Promise<PaginatedResponse<Transaction>> {
  const res = await apiClient.get<PaginatedResponse<Transaction>>('/api/v1/transactions', { params })
  return res.data
}

export async function getTransaction(id: string): Promise<Transaction> {
  const res = await apiClient.get<Transaction>(`/api/v1/transactions/${id}`)
  return res.data
}

export async function createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
  const res = await apiClient.post<Transaction>('/api/v1/transactions', data)
  return res.data
}

export async function updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
  const res = await apiClient.patch<Transaction>(`/api/v1/transactions/${id}`, data)
  return res.data
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/transactions/${id}`)
}
```

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add src/modules/transaction/
git commit -m "feat(transaction): add transaction types and service"
```

---

### Task 17: Transaction Hooks (Server-Side Pagination)

**Files:**
- Create: `src/modules/transaction/hooks/use-transactions.ts`

- [ ] **Step 1: Implement transaction hooks**

```typescript
// src/modules/transaction/hooks/use-transactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/transaction.service'
import type { CreateTransactionRequest, UpdateTransactionRequest, TransactionListParams } from '../types/transaction.types'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params: TransactionListParams) => ['transactions', 'list', params] as const,
}

export function useTransactions(params: TransactionListParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => getTransactions(params),
    placeholderData: (prev) => prev, // keep previous data while loading new page
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => createTransaction(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionRequest }) => updateTransaction(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/transaction/hooks/
git commit -m "feat(transaction): add transaction hooks with server-side pagination"
```

---

### Task 18: Transaction UI

**Files:**
- Create: `src/modules/transaction/components/TransactionForm.tsx`
- Create: `src/modules/transaction/components/TransactionTable.tsx`
- Create: `src/modules/transaction/components/TransactionCard.tsx`
- Modify: `src/routes/_auth/transactions.tsx`

- [ ] **Step 1: Use `/frontend-design` skill to design transaction UI**

  Key design requirements:
  - **TransactionForm** has conditional fields based on type:
    - All types: type (expense|income|transfer), note (optional), occurred_at (date)
    - expense/income: category_id (select from categories), wallet_id, amount
    - transfer: from_wallet_id, to_wallet_id, amount
  - Zod schema:
    ```typescript
    const transactionSchema = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('expense'),
        note: z.string().optional(),
        occurred_at: z.string(),
        category_id: z.string().min(1, 'Category is required'),
        wallet_id: z.string().min(1, 'Wallet is required'),
        amount: z.number().positive('Amount must be positive'),
      }),
      z.object({
        type: z.literal('income'),
        note: z.string().optional(),
        occurred_at: z.string(),
        category_id: z.string().min(1, 'Category is required'),
        wallet_id: z.string().min(1, 'Wallet is required'),
        amount: z.number().positive('Amount must be positive'),
      }),
      z.object({
        type: z.literal('transfer'),
        note: z.string().optional(),
        occurred_at: z.string(),
        from_wallet_id: z.string().min(1, 'Source wallet is required'),
        to_wallet_id: z.string().min(1, 'Destination wallet is required'),
        amount: z.number().positive('Amount must be positive'),
      }),
    ])
    ```
  - On submit: transform form data into `CreateTransactionRequest` postings format before calling the hook.
  - **TransactionTable** (desktop): server-side, `manualSorting: true`, `manualPagination: true`, `manualFiltering: true`. Columns: date (occurred_at), type badge, note, category, wallet, amount. Search input with debounce (300ms). Month picker filter. Pagination shows total pages from meta.
  - **TransactionCard** (mobile): card per transaction showing type, note, amount, date.
  - Page state: `page`, `pageSize` (20), `sortBy`, `sortOrder`, `search`, `month` — passed to `useTransactions` hook.

- [ ] **Step 2: Wire up transactions route**

- [ ] **Step 3: Commit**

```bash
git add src/modules/transaction/components/ src/routes/_auth/transactions.tsx
git commit -m "feat(transaction): implement transaction table, form, and page"
```

---

## Chunk 7: Dashboard Module

### Task 19: Dashboard Types, Service & Hook

**Files:**
- Create: `src/modules/dashboard/types/dashboard.types.ts`
- Create: `src/modules/dashboard/services/dashboard.service.ts`
- Create: `src/modules/dashboard/services/dashboard.service.test.ts`
- Create: `src/modules/dashboard/hooks/use-dashboard.ts`

- [ ] **Step 1: Define dashboard types**

```typescript
// src/modules/dashboard/types/dashboard.types.ts
export interface CategoryExpense {
  category_id: string
  category_name: string
  total: number
}

export interface DashboardData {
  monthly_income: number
  monthly_expense: number
  net_worth: number
  expense_by_category: CategoryExpense[]
  month: string // YYYY-MM
}
```

- [ ] **Step 2: Write dashboard service test**

```typescript
// src/modules/dashboard/services/dashboard.service.test.ts
import { describe, it, expect, vi } from 'vitest'
import { apiClient } from '../../../shared/lib/api-client'
import { getDashboard } from './dashboard.service'

vi.mock('../../../shared/lib/api-client', () => ({ apiClient: { get: vi.fn() } }))

describe('getDashboard', () => {
  it('calls GET /api/v1/dashboard without params when no month given', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: {} })
    await getDashboard()
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/dashboard', expect.objectContaining({}))
    const callArgs = vi.mocked(apiClient.get).mock.calls[0]
    expect(callArgs[1]?.params).toBeUndefined()
  })

  it('passes month param when provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: {} })
    await getDashboard('2026-03')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/dashboard', { params: { month: '2026-03' } })
  })
})
```

- [ ] **Step 3: Run tests — expect FAIL**

- [ ] **Step 4: Implement dashboard service and hook**

```typescript
// src/modules/dashboard/services/dashboard.service.ts
import { apiClient } from '../../../shared/lib/api-client'
import type { DashboardData } from '../types/dashboard.types'

export async function getDashboard(month?: string): Promise<DashboardData> {
  const res = await apiClient.get<DashboardData>('/api/v1/dashboard', {
    params: month ? { month } : undefined,
  })
  return res.data
}
```

```typescript
// src/modules/dashboard/hooks/use-dashboard.ts
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../services/dashboard.service'

export function useDashboard(month?: string) {
  return useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => getDashboard(month),
  })
}
```

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add src/modules/dashboard/
git commit -m "feat(dashboard): add dashboard types, service, and hook"
```

---

### Task 20: Dashboard UI

**Files:**
- Create: `src/modules/dashboard/components/MetricsCards.tsx`
- Create: `src/modules/dashboard/components/ExpensePieChart.tsx`
- Create: `src/modules/dashboard/components/DashboardPage.tsx`
- Modify: `src/routes/_auth/dashboard.tsx`

- [ ] **Step 1: Use `/frontend-design` skill to design dashboard UI**

  Key requirements:
  - Month picker (defaults to current month) at top — changes which month's data is shown
  - **MetricsCards**: 3 stat cards — Total Income (green), Total Expense (red), Net Worth (blue). Format numbers as currency (IDR or configurable locale).
  - **ExpensePieChart**: Recharts `PieChart` with `Pie` + `Cell` components showing expense distribution by category. Show legend with category name + percentage. Use `ResponsiveContainer` for responsiveness.
  - Loading and empty states for all components.
  - Recharts PieChart example:
    ```typescript
    import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category_name" cx="50%" cy="50%">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
    ```

- [ ] **Step 2: Wire up dashboard route**

- [ ] **Step 3: Commit**

```bash
git add src/modules/dashboard/components/ src/routes/_auth/dashboard.tsx
git commit -m "feat(dashboard): implement dashboard metrics and expense pie chart"
```

---

## Chunk 8: AI Chat Module

### Task 21: AI Types & Service

**Files:**
- Create: `src/modules/ai/types/ai.types.ts`
- Create: `src/modules/ai/services/ai.service.ts`
- Create: `src/modules/ai/services/ai.service.test.ts`

- [ ] **Step 1: Define AI types**

```typescript
// src/modules/ai/types/ai.types.ts
import type { CreateTransactionRequest } from '../../transaction/types/transaction.types'

export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  parsed_transaction: CreateTransactionRequest
  display_summary: string // human-readable description of parsed transaction
}

export interface ConfirmRequest {
  parsed_transaction: CreateTransactionRequest
}
```

- [ ] **Step 2: Write AI service tests**

```typescript
// src/modules/ai/services/ai.service.test.ts
import { describe, it, expect, vi } from 'vitest'
import { apiClient } from '../../../shared/lib/api-client'
import { sendChat, confirmTransaction } from './ai.service'

vi.mock('../../../shared/lib/api-client', () => ({ apiClient: { post: vi.fn() } }))

describe('sendChat', () => {
  it('calls POST /api/v1/ai/chat', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { parsed_transaction: {}, display_summary: '' } })
    await sendChat({ message: 'spent 50k on food' })
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/ai/chat', { message: 'spent 50k on food' })
  })
})

describe('confirmTransaction', () => {
  it('calls POST /api/v1/ai/chat/confirm', async () => {
    const payload = { parsed_transaction: { type: 'expense' as const, occurred_at: '', postings: [] } }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: '1' } })
    await confirmTransaction(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/ai/chat/confirm', payload)
  })
})
```

- [ ] **Step 3: Run tests — expect FAIL**

- [ ] **Step 4: Implement AI service**

```typescript
// src/modules/ai/services/ai.service.ts
import { apiClient } from '../../../shared/lib/api-client'
import type { ChatRequest, ChatResponse, ConfirmRequest } from '../types/ai.types'
import type { Transaction } from '../../transaction/types/transaction.types'

export async function sendChat(data: ChatRequest): Promise<ChatResponse> {
  const res = await apiClient.post<ChatResponse>('/api/v1/ai/chat', data)
  return res.data
}

export async function confirmTransaction(data: ConfirmRequest): Promise<Transaction> {
  const res = await apiClient.post<Transaction>('/api/v1/ai/chat/confirm', data)
  return res.data
}
```

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add src/modules/ai/
git commit -m "feat(ai): add AI chat types and service"
```

---

### Task 22: AI Chat UI

**Files:**
- Create: `src/modules/ai/hooks/use-ai-chat.ts`
- Create: `src/modules/ai/components/ChatInterface.tsx`
- Create: `src/modules/ai/components/TransactionConfirmCard.tsx`
- Modify: `src/routes/_auth/ai.tsx`

- [ ] **Step 1: Implement AI chat hook**

```typescript
// src/modules/ai/hooks/use-ai-chat.ts
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendChat, confirmTransaction } from '../services/ai.service'
import { transactionKeys } from '../../transaction/hooks/use-transactions'
import type { ChatResponse } from '../types/ai.types'

export function useAiChat() {
  const [pendingTransaction, setPendingTransaction] = useState<ChatResponse | null>(null)
  const qc = useQueryClient()

  const chatMutation = useMutation({
    mutationFn: sendChat,
    onSuccess: (data) => setPendingTransaction(data),
  })

  const confirmMutation = useMutation({
    mutationFn: confirmTransaction,
    onSuccess: () => {
      setPendingTransaction(null)
      qc.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })

  return {
    sendMessage: chatMutation.mutate,
    isSending: chatMutation.isPending,
    chatError: chatMutation.error,
    pendingTransaction,
    cancelPending: () => setPendingTransaction(null),
    confirmTransaction: () => {
      if (pendingTransaction) {
        confirmMutation.mutate({ parsed_transaction: pendingTransaction.parsed_transaction })
      }
    },
    isConfirming: confirmMutation.isPending,
    confirmError: confirmMutation.error,
  }
}
```

- [ ] **Step 2: Use `/frontend-design` skill to design AI chat UI**

  Key requirements:
  - **ChatInterface**: chat-style input at bottom of page. User types natural language (e.g., "spent 50k on coffee yesterday"). On send → shows loading → shows TransactionConfirmCard with parsed transaction details.
  - **TransactionConfirmCard**: displays the parsed transaction summary (type, amount, wallet, category, date). Two buttons: "Confirm & Save" (calls confirmTransaction) and "Cancel" (dismisses card, user can edit message).
  - Show error states for both chat and confirm mutations.
  - Clean, conversational UI. Not a full chat history for MVP — just input + last parsed result.

- [ ] **Step 3: Wire up AI route**

- [ ] **Step 4: Commit**

```bash
git add src/modules/ai/ src/routes/_auth/ai.tsx
git commit -m "feat(ai): implement AI chat interface and transaction confirmation"
```

---

## Chunk 9: E2E Tests

### Task 23: Playwright Setup & Auth Tests

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/fixtures/auth.ts`
- Create: `e2e/auth.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 2: Create auth fixture**

```typescript
// e2e/fixtures/auth.ts
import { test as base, type Page } from '@playwright/test'

export const TEST_USER = {
  email: 'test@soegih.dev',
  password: 'testpassword123',
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password)
    await use(page)
  },
})
```

- [ ] **Step 3: Write auth E2E tests**

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'
import { TEST_USER, loginAs } from './fixtures/auth'

test('redirects unauthenticated user to login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('user can log in with valid credentials', async ({ page }) => {
  await loginAs(page, TEST_USER.email, TEST_USER.password)
  await expect(page).toHaveURL(/\/dashboard/)
})

test('shows error with invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'wrong@email.com')
  await page.fill('input[type="password"]', 'wrongpass')
  await page.click('button[type="submit"]')
  await expect(page.getByRole('alert')).toBeVisible()
})

test('user can log out', async ({ page }) => {
  await loginAs(page, TEST_USER.email, TEST_USER.password)
  await page.click('[data-testid="logout-button"]')
  await expect(page).toHaveURL(/\/login/)
})
```

- [ ] **Step 4: Run E2E tests (requires backend running)**

```bash
pnpm exec playwright test e2e/auth.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e/
git commit -m "test(e2e): add Playwright config and auth E2E tests"
```

---

### Task 24: Wallet, Category & Transaction E2E Tests

**Files:**
- Create: `e2e/wallet.spec.ts`
- Create: `e2e/category.spec.ts`
- Create: `e2e/transaction.spec.ts`
- Create: `e2e/dashboard.spec.ts`

- [ ] **Step 1: Write wallet E2E tests**

```typescript
// e2e/wallet.spec.ts
import { expect } from '@playwright/test'
import { test } from './fixtures/auth'

test.describe('Wallets', () => {
  test('can create a wallet', async ({ authenticatedPage: page }) => {
    await page.goto('/wallets')
    await page.click('button:has-text("New Wallet")')
    await page.fill('input[name="name"]', 'Test Wallet')
    await page.selectOption('select[name="type"]', 'cash')
    await page.fill('input[name="balance"]', '10000')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Test Wallet')).toBeVisible()
  })

  test('can edit a wallet', async ({ authenticatedPage: page }) => {
    await page.goto('/wallets')
    await page.click('[data-testid="wallet-edit"]:first-of-type')
    await page.fill('input[name="name"]', 'Updated Wallet')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Updated Wallet')).toBeVisible()
  })

  test('can delete a wallet', async ({ authenticatedPage: page }) => {
    await page.goto('/wallets')
    const initialCount = await page.locator('[data-testid="wallet-row"]').count()
    await page.click('[data-testid="wallet-delete"]:first-of-type')
    await page.click('button:has-text("Confirm")')
    await expect(page.locator('[data-testid="wallet-row"]')).toHaveCount(initialCount - 1)
  })
})
```

- [ ] **Step 2: Write category E2E tests (same pattern as wallet)**

  Test: create a category (name, type=expense), edit it, delete it.

- [ ] **Step 3: Write transaction E2E tests**

```typescript
// e2e/transaction.spec.ts
import { expect } from '@playwright/test'
import { test } from './fixtures/auth'

test.describe('Transactions', () => {
  test('can create an expense transaction', async ({ authenticatedPage: page }) => {
    await page.goto('/transactions')
    await page.click('button:has-text("New Transaction")')
    await page.selectOption('select[name="type"]', 'expense')
    await page.fill('input[name="amount"]', '50000')
    await page.fill('input[name="occurred_at"]', '2026-03-14')
    await page.click('button[type="submit"]')
    await expect(page.getByText('expense').first()).toBeVisible()
  })

  test('can search transactions by note', async ({ authenticatedPage: page }) => {
    await page.goto('/transactions')
    await page.fill('input[placeholder*="Search"]', 'coffee')
    await page.waitForTimeout(400) // debounce
    // Results should be filtered (no assertion on count since depends on data)
    await expect(page.locator('[data-testid="transaction-table"]')).toBeVisible()
  })
})
```

- [ ] **Step 4: Write dashboard E2E test**

```typescript
// e2e/dashboard.spec.ts
import { expect } from '@playwright/test'
import { test } from './fixtures/auth'

test('dashboard shows metrics cards', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText(/Income/i)).toBeVisible()
  await expect(page.getByText(/Expense/i)).toBeVisible()
  await expect(page.getByText(/Net Worth/i)).toBeVisible()
})
```

- [ ] **Step 5: Commit**

```bash
git add e2e/wallet.spec.ts e2e/category.spec.ts e2e/transaction.spec.ts e2e/dashboard.spec.ts
git commit -m "test(e2e): add wallet, category, transaction, dashboard E2E tests"
```

---

### Task 25: AI Chat E2E Test

**Files:**
- Create: `e2e/ai.spec.ts`

- [ ] **Step 1: Write AI chat E2E test**

```typescript
// e2e/ai.spec.ts
import { expect } from '@playwright/test'
import { test } from './fixtures/auth'

test.describe('AI Chat', () => {
  test('parses natural language into transaction confirmation card', async ({ authenticatedPage: page }) => {
    await page.goto('/ai')
    await page.fill('[data-testid="chat-input"]', 'spent 50000 on coffee')
    await page.click('[data-testid="chat-send"]')
    await expect(page.getByTestId('transaction-confirm-card')).toBeVisible({ timeout: 10000 })
  })

  test('can confirm parsed transaction', async ({ authenticatedPage: page }) => {
    await page.goto('/ai')
    await page.fill('[data-testid="chat-input"]', 'earned 1000000 salary')
    await page.click('[data-testid="chat-send"]')
    await page.waitForSelector('[data-testid="transaction-confirm-card"]')
    await page.click('button:has-text("Confirm")')
    await expect(page.getByTestId('transaction-confirm-card')).not.toBeVisible()
  })
})
```

- [ ] **Step 2: Run all E2E tests**

```bash
pnpm exec playwright test
```

- [ ] **Step 3: Commit**

```bash
git add e2e/ai.spec.ts
git commit -m "test(e2e): add AI chat E2E tests"
```

---

## Shared Utilities Reference

### Currency Formatting

```typescript
// src/shared/utils/format.ts
export function formatCurrency(amount: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(dateString))
}
```

### `data-testid` Attribute Conventions

All interactive and key structural elements must carry `data-testid` for Playwright selectors:

| Element | `data-testid` |
|---|---|
| Logout button | `logout-button` |
| Wallet table row | `wallet-row` |
| Wallet edit button | `wallet-edit` |
| Wallet delete button | `wallet-delete` |
| Transaction table | `transaction-table` |
| Chat input | `chat-input` |
| Chat send button | `chat-send` |
| Confirm card | `transaction-confirm-card` |

---

## File Map Summary

```
src/
├── main.tsx                              # Sentry init, Router setup
├── routeTree.gen.ts                      # Auto-generated by TanStack Router
├── test-setup.ts                         # Vitest + @testing-library/jest-dom
├── routes/
│   ├── __root.tsx                        # QueryClientProvider + AuthProvider
│   ├── index.tsx                         # Redirect to /dashboard
│   ├── login.tsx                         # Login page
│   ├── signup.tsx                        # Signup page
│   ├── _auth.tsx                         # Auth guard layout
│   └── _auth/
│       ├── dashboard.tsx
│       ├── wallets.tsx
│       ├── categories.tsx
│       ├── transactions.tsx
│       └── ai.tsx
├── modules/
│   ├── auth/
│   │   ├── types/auth.types.ts
│   │   ├── services/auth.service.ts
│   │   ├── services/me.service.ts
│   │   └── components/LoginForm.tsx, SignupForm.tsx
│   ├── wallet/
│   │   ├── types/wallet.types.ts
│   │   ├── services/wallet.service.ts
│   │   ├── hooks/use-wallets.ts
│   │   └── components/WalletForm.tsx, WalletTable.tsx, WalletCard.tsx
│   ├── category/
│   │   ├── types/category.types.ts
│   │   ├── services/category.service.ts
│   │   ├── hooks/use-categories.ts
│   │   └── components/CategoryForm.tsx, CategoryTable.tsx, CategoryCard.tsx
│   ├── transaction/
│   │   ├── types/transaction.types.ts
│   │   ├── services/transaction.service.ts
│   │   ├── hooks/use-transactions.ts
│   │   └── components/TransactionForm.tsx, TransactionTable.tsx, TransactionCard.tsx
│   ├── dashboard/
│   │   ├── types/dashboard.types.ts
│   │   ├── services/dashboard.service.ts
│   │   ├── hooks/use-dashboard.ts
│   │   └── components/MetricsCards.tsx, ExpensePieChart.tsx, DashboardPage.tsx
│   └── ai/
│       ├── types/ai.types.ts
│       ├── services/ai.service.ts
│       ├── hooks/use-ai-chat.ts
│       └── components/ChatInterface.tsx, TransactionConfirmCard.tsx
├── shared/
│   ├── lib/api-client.ts                 # Axios + JWT header
│   ├── lib/token-store.ts                # JWT persisted in localStorage
│   ├── context/auth-context.tsx          # Auth state + session restore
│   ├── components/AppLayout.tsx, Sidebar.tsx
│   └── utils/format.ts                   # Currency + date formatters (commit in Task 10)
e2e/
├── fixtures/auth.ts
├── auth.spec.ts
├── wallet.spec.ts
├── category.spec.ts
├── transaction.spec.ts
├── dashboard.spec.ts
└── ai.spec.ts
```
