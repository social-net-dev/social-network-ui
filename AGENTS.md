# AGENTS.md

Coding agents working on **ETECHS Social Network UI** should use this document as a reference guide. For project overview and team guidelines, see [README.md](README.md). For documentation structure, see [DOCUMENTATION.md](DOCUMENTATION.md).

## Agent Skills

This project uses the **Agent Skills** open standard, compatible with OpenCode, GitHub Copilot, Cursor, Claude Code, Gemini CLI, and 15+ other agent tools.

**Available Skills** (in `.agent/skills/`):
- `frontend-design` - UI component implementation with shadcn/ui and Tailwind CSS

To use skills, agents can directly reference them: "Use the frontend-design skill to create a component."

## Project Overview

**ETECHS Social Network UI** is a modern, feature-rich social network frontend built with cutting-edge technologies:

- **Architecture**: Single Page Application (SPA) with feature-based folder structure
- **Core Stack**: React 19, Vite 7, TypeScript 5, Tailwind CSS 4
- **State**: Zustand (global) + TanStack Query (server state)
- **UI**: shadcn/ui components + Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Routing**: React Router v7 with nested routes
- **HTTP**: Axios with interceptors and automatic token refresh
- **Data**: REST API via etechs-middleware, WebSocket for real-time features
- **Crypto**: RSA-2048 + AES-256-GCM for end-to-end encryption
- **Forms**: React Hook Form + Zod validation

**Key Features**: Auth (OTP), Feed, Profile, Messaging (E2EE), Friends, Groups, Marketplace, Notifications, Admin Panel.

---

## Setup Commands

### Prerequisites

- **Node.js** v18+ or higher
- **pnpm** v10.28.2 (see `packageManager` in package.json)

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env: VITE_API_BASE_URL, etc.
```

### Start Development

```bash
# Development server with hot reload
pnpm dev
# Opens http://localhost:5173

# Alternative: Development with mock API (no backend needed)
VITE_USE_MOCK=true pnpm dev
```

---

## Development Workflow

### Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (port 5173, hot reload enabled) |
| `pnpm build` | Type-check + build production (output: `dist/`) |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Check code with ESLint (Flat Config) |

### Development Server

- **Port**: 5173
- **Hot Module Replacement**: Enabled by default
- **URL Path Alias**: `@/` maps to `src/`
- **Typescript**: Strict mode enabled, inferred types from usage
- **Tailwind**: Bundled via Vite plugin, no config file needed

### Environment Variables

```bash
# .env file
VITE_API_BASE_URL=http://localhost:8000/api    # etechs-middleware REST API
VITE_API_URL_MESSAGE=http://localhost:8001     # Message microservice
VITE_USE_MOCK=false                             # Enable mock API if true
```

### Code Quality

**Always run before committing:**

```bash
pnpm lint
```

- Uses ESLint with Flat Config format
- Checks `.ts`, `.tsx` files
- Ignores: `dist/`

---

## Testing Instructions

### Test Framework

- **Framework**: Vitest (configured in `vite.config.ts`)
- **Component Testing**: React Testing Library (@testing-library/react)
- **Environment**: jsdom
- **Setup**: `src/test/setup.ts`

### Running Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-run on file changes)
pnpm test:watch

# Run specific test file
pnpm test src/features/auth/hooks/useLogin.test.ts

# Focus on specific test
pnpm test -t "login should succeed"

# UI Test Dashboard
pnpm test:watch -- --ui
```

### Test File Locations

- **Pattern**: `src/**/*.{test,spec}.{ts,tsx}`
- **Example**: `src/features/auth/hooks/useLogin.test.ts`

### Writing Tests

- Use `.test.ts` or `.spec.ts` suffix
- Place in same folder as code being tested or co-locate
- Test async functions with `async/await`
- Use React Testing Library for component tests
- Mock API calls with MSW (Mock Service Worker)

#### Example Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogin } from '@/features/auth/hooks/useLogin';

describe('useLogin', () => {
  it('should handle successful login', async () => {
    const { result } = renderHook(() => useLogin());
    
    await act(async () => {
      await result.current.mutate({ email: 'test@example.com', password: 'pass' });
    });
    
    expect(result.current.isSuccess).toBe(true);
  });
});
```

---

## Code Style & Conventions

### TypeScript

- **Strict Mode**: Enabled (`strict: true` in tsconfig.json)
- **No `any`**: Use `unknown` or specific types
- **Interfaces over Types**: Use `interface` for object shapes, `type` for unions/primitives
- **Generics**: Prefer inference; be explicit only when necessary
- **Comments**: JSDoc comments for public APIs

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  displayName: string;
}

type Status = 'pending' | 'success' | 'error';

// ❌ Avoid
const user: any = {};
type User = { id: string };
```

### Imports & Exports

**Order imports as:**

1. React / React DOM / Core dependencies
2. Third-party libraries (Zustand, React Query, axios, etc.)
3. Internal components (`@/components/`)
4. Features (`@/features/`)
5. Utilities, hooks, types (`@/lib/`, `@/hooks/`, `@/stores/`)
6. Assets, styles

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FeedPage } from '@/features/home/pages/FeedPage';
import { cn } from '@/lib/utils';
import styles from './MyComponent.module.css';
```

### File Naming

- **React Components**: PascalCase (.tsx) → `UserProfile.tsx`
- **Hooks**: camelCase (.ts/.tsx) → `useLogin.ts`
- **Utils**: camelCase (.ts) → `formatDate.ts`
- **Types/Interfaces**: PascalCase (.ts) → `User.types.ts`
- **Tests**: same name + `.test.ts` → `useLogin.test.ts`

### React Patterns

**Component Guidelines:**

- Prefer functional components with hooks
- Extract custom hooks for reusable logic
- Use React.memo for performance-critical components

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export function UserCard({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: queryKeys.user.detail(userId),
    queryFn: () => fetchUser(userId),
  });
  
  return <div>{user?.displayName}</div>;
}
```

**State Management:**

- Global state (auth, theme): Zustand stores in `src/stores/`
- Server state (API data): React Query with queryKeys
- Local UI state: useState hook

**Data Fetching:**

- ALWAYS use React Query (`useQuery`, `useMutation`)
- Never use `useEffect` for data fetching
- Reference `src/lib/query-keys.ts` for consistent cache keys
- Use manual API hooks from `@/lib/api/hooks/`

### Styling

- **Framework**: Tailwind CSS v4 (via Vite plugin)
- **Colors**: Use CSS variables (--primary, --secondary, etc.)
- **Utility Function**: `cn()` from `@/lib/utils` for conditional classes

```typescript
// ✅ Good
<div className={cn('p-4 rounded-lg', isActive && 'bg-primary')}>
  Content
</div>

// ❌ Avoid
<div className={`p-4 rounded-lg ${isActive ? 'bg-blue-500' : ''}`}>
  Content
</div>
```

### Language

**All user-facing text must be in VIETNAMESE** (UI labels, messages, error text). Code comments can be in English.

---

## Architecture & Project Structure

### Folder Organization

```
src/
├── components/           # Shared components
│   ├── ui/              # shadcn/ui components (minimal edits)
│   ├── auth/            # Auth-specific components
│   └── ErrorBoundary.tsx
├── features/            # Feature modules (feature-based architecture)
│   ├── auth/            # Example feature folder
│   │   ├── components/  # Feature components
│   │   ├── pages/       # Route page components
│   │   ├── hooks/       # Custom hooks (useLogin, etc.)
│   │   ├── types/       # Feature types
│   │   ├── constants/   # Feature constants
│   │   └── routes.tsx   # Route definitions
│   ├── home/
│   ├── profile/
│   ├── message/         # E2EE messaging
│   ├── shared/          # Shared layouts, utilities
│   └── ...
├── lib/
│   ├── api.ts           # Axios client with interceptors
│   ├── auth.constants.ts # Auth storage keys
│   ├── config.ts        # Environment config
│   ├── query-keys.ts    # React Query cache keys (REQUIRED for useQuery)
│   ├── react-query.ts   # QueryClient setup
│   ├── api/
│   │   ├── services/    # Manual API services
│   │   ├── types/       # API types
│   │   ├── hooks/       # React Query hooks
│   │   ├── transforms/  # Data transformers
│   │   └── utils/       # API utilities
│   └── utils/           # Shared utilities (cn, groupBy, etc.)
├── stores/              # Zustand stores
│   ├── authStore.ts
│   ├── userStore.ts
│   └── ...
├── types/               # Global types
├── hooks/               # Global hooks
├── contexts/            # React contexts
├── mocks/               # MSW mock API handlers
├── App.tsx              # Routes & layout
├── main.tsx             # ReactDOM entry
└── index.css            # Global styles + Tailwind directives
```

### Feature Module Template

Each feature follows this pattern (`src/features/[feature]/`):

```
features/[feature]/
├── components/          # Feature-specific components
├── pages/               # Route page components (exported in routes.tsx)
├── hooks/               # Feature-specific custom hooks
├── types/               # Feature types (if needed)
├── constants/           # Feature constants (if needed)
├── FEATURE_STRUCTURE.md # See src/features/FEATURE_STRUCTURE.md
└── routes.tsx           # Route definitions for this feature
```

**See [src/features/FEATURE_STRUCTURE.md](src/features/FEATURE_STRUCTURE.md) for guidelines.**

---

## Build & Deployment

### Build Process

```bash
# Type check + compile React + optimize assets
pnpm build
```

- **Input**: `src/`
- **Output**: `dist/` (production-ready bundle)
- **Optimizations**:
  - CSS code-split disabled
  - Sourcemaps disabled
  - Vendor chunks: react, UI, router, state, icons
  - Single JS bundle: `app.js`

### Production Preview

```bash
# Build and preview locally
pnpm build
pnpm preview
# Opens http://localhost:4173
```

### Docker Deployment

Project includes multi-stage Dockerfile:

1. **Build stage**: Node.js, compiles React
2. **Runtime stage**: Caddy web server, serves static files + reverse proxy

Key points:
- API calls to `/api/*` are proxied to backend
- All routes fallback to `index.html` (SPA routing)
- Caddy handles SSL, compression, static caching

---

## Pull Request Guidelines

### Title Format

```
[feature|fix|docs|perf|refactor]: Brief description (max 70 chars)
```

**Examples:**

✅ `feat: Add E2EE encryption for messages`  
✅ `fix: Resolve token refresh race condition`  
✅ `docs: Update API client documentation`  
✅ `refactor: Consolidate axios configuration`  

### Before Submitting

1. **Type-check and lint** (required):
   ```bash
   pnpm build  # Ensures no TS errors
   pnpm lint   # Must pass
   ```

2. **Run tests** (if applicable):
   ```bash
   pnpm test
   ```

3. **Clean up**:
   - Remove `console.log()` statements
   - No commented-out code
   - Meaningful commit messages

### PR Description Template

```markdown
## Description
Brief explanation of what and why.

## Changes
- Change 1
- Change 2

## Testing
How to test these changes (manual steps or test commands).

## Related Issues
Fixes #123, Related to #456

## Checklist
- [ ] Code follows style guidelines
- [ ] ESLint passes (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm build`)
- [ ] Tests pass or added new tests
- [ ] No console.log or debug code
- [ ] Documentation updated if needed
```

---

## Debugging & Troubleshooting

### Dev Tools

**Browser DevTools:**
- Open DevTools: F12 or Cmd+Option+I
- React Devtools: Install browser extension to inspect component tree
- React Query DevTools: Access via import in development

**React Query DevTools (in dev):**

```typescript
// Development only
if (import.meta.env.DEV) {
  import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
}
```

### Common Issues

**Build fails with TypeScript errors:**
```bash
pnpm build  # See detailed error messages
# Fix errors, rebuild
```

**Axios request fails with 401:**
- Check `localStorage` for `auth_token`
- Verify token not expired (refresh token logic auto-triggers)
- Check `X-Tenant-Slug` header in network tab

**Styling not applied:**
- Ensure `cn()` used instead of string concatenation
- Check Tailwind class names are valid (watch console)
- Verify CSS variables in `src/index.css`

**Hot reload not working:**
- Restart dev server: Ctrl+C, `pnpm dev`
- Check if file is in `src/` (other dirs not watched)

### Logging & Debug Patterns

**Use console for debugging** (remove before committing):

```typescript
// Feature-specific logging with emoji prefix
console.log('[Feature Name]', 'Message:', data);
console.error('[API]', 'Request failed:', error);

// Toggle per-ENV
if (import.meta.env.DEV) {
  console.log('[DEV]', state);
}
```

### Performance Considerations

- **Code splitting**: Vite handles automatically
- **Component memoization**: Use `React.memo` for expensive renders
- **Query caching**: React Query caches by key; adjust `staleTime`
- **Bundle size**: Monitor with `pnpm build`, check `dist/` output

---

## API Integration

### Using Manual API Hooks

**Manual API hooks** in `@/lib/api/hooks/`:

```typescript
import { useUser } from '@/lib/api/hooks/useUser';

export function UserProfile({ userId }: { userId: string }) {
  const { user, isLoading } = useUser(userId);

  if (isLoading) return <Skeleton />;
  return <div>{user?.displayName}</div>;
}
```

### API Services

Located in `src/lib/api/services/`. These are low-level API functions used by hooks.

**Example API Service:**

```typescript
import apiClient from '@/lib/api';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
};
```

### API Client (`src/lib/api.ts`)

- Configured with Axios
- Auto-includes auth token (from localStorage)
- Auto-refreshes expired tokens
- Unwraps response format: `{ data: T }` → `T`
- Includes request/response interceptors

---

## Encryption & Security (E2EE)

For messaging with end-to-end encryption:

**Key Architecture:**
- Each user has RSA-2048 key pair (device-specific)
- Private key stored locally in localStorage
- Public key uploaded to backend

**Encryption Flow:**
1. Fetch recipient's public key from backend
2. Generate random AES-256 key
3. Encrypt message with AES-256
4. Encrypt AES key with recipient's RSA public key
5. Send encrypted payload

**Decryption:**
1. Decrypt AES key with local private key
2. Decrypt message with decrypted AES key

**E2EE Implementation:**
- RSA-2048 key pairs (device-specific, persisted in localStorage)
- AES-256-GCM for message encryption  
- See `src/features/message/lib/e2ee.ts` for implementation
- See `src/stores/e2eeStore.ts` for state management

---

## Additional Resources

- **Project README**: [README.md](README.md) - setup, features, tech stack
- **OpenAPI Spec**: [openapi.yml](openapi.yml) - complete API contract
- **Feature Structure**: [src/features/FEATURE_STRUCTURE.md](src/features/FEATURE_STRUCTURE.md)
- **Code Documentation**: TypeScript types and inline comments

---

**Last updated:** 13 tháng 2, 2026
