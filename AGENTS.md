# AGENTS.md

This file provides context and guidelines for AI coding agents working on the **social-network-ui** repository.

## 🤖 Interaction Guidelines

- **Response Language**: Think in English, but **respond in Vietnamese**.
- **Concurrency**: Execute multiple independent processes concurrently when possible.
- **Context**: Always use available tools to understand the codebase before acting.

## 🚀 Project Overview

- **Type**: Single Page Application (SPA)
- **Stack**: React 19 + Vite 7 + TypeScript + Tailwind CSS 4
- **State Management**: Zustand (Global) + React Query (Server State)
- **UI Framework**: shadcn/ui (Radix UI + Tailwind)
- **Styling**: Tailwind CSS v4 (configured via CSS, no config file)
- **Routing**: React Router v7
- **Language**: TypeScript (ES2022 target, Strict Mode)
- **Package Manager**: pnpm

## 🛠️ Setup Commands

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Environment Setup**:
    ```bash
    cp .env.example .env
    # Update .env variables if necessary (e.g., VITE_API_BASE_URL)
    ```

## 💻 Development Workflow

- **Start Development Server**:
  ```bash
  pnpm dev
  ```
  Runs on `http://localhost:5173`.

- **Lint Code**:
  ```bash
  pnpm lint
  ```
  Uses ESLint with Flat Config (`eslint.config.js`). Always run this before committing.

- **Build for Production**:
  ```bash
  pnpm build
  ```
  Outputs to `dist/`.

- **Preview Production Build**:
  ```bash
  pnpm preview
  ```

## 🧪 Testing Instructions

- **Status**: No testing framework is currently configured.
- **Do NOT**: Do not attempt to run `npm test` or `pnpm test`.
- **Future**: If asked to add tests, use **Vitest** + **React Testing Library**.

## 🎨 Design System & Styling

### Color Palette (Tailwind v4)
Use semantic Tailwind classes mapped to CSS variables (defined in `src/index.css`). **Never hardcode hex colors**.

- **Primary (Dark Teal)**: `bg-primary` / `text-primary` (`#0E4E5A`)
- **Secondary (Lime Green)**: `bg-secondary` / `text-secondary` (`#E2F046`)
- **Background (Dark)**: `bg-background` (`#02182B`)
- **Surface (Dark Card)**: `bg-card` (`#0A2737`)

### Styling Rules
- **Framework**: Tailwind CSS v4.
- **Tokens**: Use CSS variables for radii and colors (e.g., `--radius`, `--primary`).
- **Glass Effect**: Use the `.glass-effect` utility class for transparent panels.
- **Icons**: Use `lucide-react` (preferred).

### Component Implementation
- **UI Primitives**: Always use Shadcn UI components from `src/components/ui/` before creating custom ones.
- **Language**: **ALL user-facing text must be in VIETNAMESE**.

## 🖌️ Figma Implementation Flow

When implementing designs from Figma:
1.  **Context**: Analyze the node context.
2.  **Visual**: Use screenshots for reference.
3.  **Map**: Translate Figma styles to the project's semantic Tailwind classes.
4.  **Reuse**: Prioritize existing `src/components/ui/` components.
5.  **Assets**: Store static assets in `src/assets/`.
6.  **Verify**: Ensure text is in Vietnamese and matches the visual hierarchy.

## 📝 Code Style & Conventions

### Imports
- **Alias**: Use `@/` for `src/` (e.g., `import { cn } from "@/lib/utils"`).
- **Order**:
  1. React / Core Dependencies
  2. Third-party Libraries (Zustand, React Query, etc.)
  3. Internal Components (`@/components/...`)
  4. Features (`@/features/...`)
  5. Utils / Hooks / Types (`@/lib/...`, `@/hooks/...`)
  6. Assets / Styles

### TypeScript
- **Strict Mode**: `strict: true` is enabled.
- **No Any**: Avoid `any`. Use `unknown` or specific types/interfaces.
- **Interfaces**: Use `interface` for object definitions (Props, API responses).

### React Patterns
- **Hooks**: Place custom hooks in `src/hooks` or feature-specific `src/features/[feature]/hooks`.
- **Data Fetching**: ALWAYS use `useQuery` or `useMutation` from `@tanstack/react-query`.
- **State**: Use `useState` for local UI state. Use `Zustand` for global app state (auth, theme).

## 📂 File Organization

```text
src/
├── components/
│   ├── ui/              # shadcn/ui primitives (do not modify heavily)
│   └── ...              # Shared components
├── features/            # Feature-based architecture
│   └── [feature]/       # e.g., auth, posts, profile
│       ├── components/  # Feature-specific components
│       ├── pages/       # Feature pages (routes)
│       ├── hooks/       # Feature-specific hooks
│       ├── api/         # API calls / mutations
│       └── types/       # Feature-specific types
├── lib/                 # Shared utilities (axios, utils)
├── stores/              # Global Zustand stores
├── types/               # Global types
└── App.tsx              # Root component & Routing
```

## 🚀 Build & Deployment

- **Docker**: The project uses a multi-stage Dockerfile (Node.js Build -> Caddy Runtime).
- **Caddy**: Serves static files and reverse proxies `/api/*` to the backend.
- **Output**: Consolidates JS into a single `app.js` chunk.

## 📝 Pull Request Guidelines

- **Title**: Use a clear, descriptive title (e.g., "feat: Add user login").
- **Checks**: Ensure `pnpm lint` passes without errors.
- **Code Review**: Verify no `console.log` statements remain.

## 🤖 Automation Tools

- **Browser Automation**: Use `agent-browser` for verifying flows.
  ```bash
  agent-browser open http://localhost:5173
  agent-browser snapshot -i
  ```
