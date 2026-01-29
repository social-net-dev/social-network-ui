# AGENTS.md

This file provides guidelines for agentic coding assistants working on the **social-network-ui** repository.

## 🚀 Project Overview

- **Stack**: React 19 + Vite 7 + TypeScript + Tailwind CSS 4
- **State Management**: Zustand + React Query (@tanstack/react-query)
- **UI Framework**: shadcn/ui (Radix UI + Tailwind)
- **Language**: TypeScript (ES2022 target)
- **Build System**: Vite
- **Testing**: None configured yet (Vitest recommended if needed)

## 🛠️ Build, Lint, and Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Type-check and build for production
pnpm lint         # Run ESLint (Flat Config)
pnpm preview      # Preview production build locally
```

**Note**: There is no testing framework configured. Do not run `npm test`.

## 🎨 Code Style Guidelines

### Imports and Modules
- **Extensions**: Use `.tsx` for components, `.ts` for logic.
- **Path Alias**: Use `@/` for `src/` (e.g., `import { Button } from '@/components/ui/button'`).
- **Order**:
  1. React / Core imports
  2. External libraries (Zustand, React Router, etc.)
  3. Internal Components (`@/components/...`)
  4. Internal Hooks/Utils/Types (`@/lib/...`, `@/types/...`)
  5. Styles / Assets

### TypeScript Types
- **Strict Mode**: Enabled. No `any` or `unknown` unless absolutely necessary.
- **Interfaces**: Use `interface` for object definitions (Props, Data Models).
- **Inference**: Leverage TS inference for simple primitives.
- **Nullability**: Use `null` for absent API data; `undefined` for optional props.

### Component Structure
- **Functional Components**: Use `function ComponentName() {}` (PascalCase).
- **Exports**: Named exports preferred for utilities; Default or Named for pages/components (consistency within feature).
- **Props**: Destructure props. Type with `interface Props { ... }`.
- **Hooks**: Top-level only. Custom hooks in `src/hooks` or `src/features/*/hooks`.

### React Patterns
- **State**: `useState` for local, `Zustand` for global auth/session state.
- **Async Data**: Use `tanstack-query` (useQuery/useMutation) for API data.
- **Effects**: Minimize `useEffect`. Prefer derived state or event handlers.
- **JSX**: Use standard JSX. Self-close tags when possible.

### Naming Conventions
- **Files/Components**: PascalCase (`UserProfile.tsx`).
- **Functions/Vars**: camelCase (`handleLogin`, `isLoading`).
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`).
- **Custom Hooks**: `use` prefix (`useProfile`).

### Formatting & Syntax
- **Indentation**: 2 spaces.
- **Quotes**: Single quotes (`'`) for JS/TS; Double quotes (`"`) for JSX attributes.
- **Semicolons**: **Avoid** semicolons (Standard/Prettier style) unless required.
- **Environment**: Access variables via `import.meta.env` (e.g., `import.meta.env.VITE_API_BASE_URL`).

## 💅 UI/UX & Design System

- **Language**: **ALL user-facing text must be in VIETNAMESE**.
- **Branding (ETECHS)**:
  - Primary: Dark Teal (#0E4E5A)
  - Secondary: Lime Green (#E2F046)
  - Dark Mode: Deep Blue (#02182B)
- **Tailwind v4**: Use utility classes. No `tailwind.config.js` (configured in CSS).
- **shadcn/ui**:
  - Add components: `pnpm dlx shadcn@latest add <name>`
  - Location: `src/components/ui/`
  - Do not modify shadcn internals unless necessary for theming.

## 🌐 API & Data Fetching

- **Axios**: Use the configured instance in `@/lib/axios`.
- **Mocking**: Check `VITE_ENABLE_MOCK_API` in `.env` if developing without backend.
- **Error Handling**:
  - Catch errors in Services/Hooks.
  - Display user-friendly messages (Vietnamese) via Toast or UI alerts.

## 🤖 Browser Automation (agent-browser)

Use the `agent-browser` tool for verifying UI flows:
1. `agent-browser open <url>`
2. `agent-browser snapshot -i` (Find interactive elements)
3. `agent-browser click @id` or `agent-browser fill @id "text"`

## 📂 File Organization

```text
src/
├── components/ui/       # shadcn components
├── features/            # Feature-based modules (auth, profile, home)
│   └── [feature]/       # components, hooks, pages, services, types
├── lib/                 # Shared utilities (axios, utils, query-client)
├── stores/              # Zustand stores
├── types/               # Global types
└── App.tsx              # Root component & Routing
```

## 🧪 Adding Tests (Future)

To add tests, install Vitest:
`pnpm add -D vitest @testing-library/react @testing-library/dom jsdom`
Create `vitest.config.ts` and add `test` script to `package.json`.
