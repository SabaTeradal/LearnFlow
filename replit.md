# LearnFlow LMS

A full-stack Learning Management System for developers — covering Frontend, Backend, and Databases with auto-generated quizzes, an AI coding tutor, achievements, and a progress dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/lms run dev` — run the frontend (dynamic port via $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session/token signing
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI via Replit integration

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS v4, shadcn/ui, framer-motion, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Auth: bearer token (in-memory Map), localStorage `lms_token`

## Where things live

- `artifacts/lms/` — React+Vite frontend
  - `src/pages/` — auth, dashboard, courses, video-player, achievements, settings
  - `src/components/layout/` — AppLayout (sidebar), ChatWidget (AI tutor)
  - `src/lib/auth.tsx` — AuthContext + AuthProvider
- `artifacts/api-server/src/routes/` — Express route handlers
- `lib/api-client-react/` — Generated Orval hooks + custom-fetch
- `lib/api-zod/` — Generated Zod request/response schemas
- `lib/db/` — Drizzle schema + DB client
- `lib/api-spec/` — OpenAPI YAML spec (source of truth)

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives all client hooks and Zod schemas via Orval codegen.
- **Bearer token auth**: No cookies — token stored in localStorage, injected via `setAuthTokenGetter`. Simple to reason about for a dev-learning platform.
- **Static quiz bank**: Quizzes are generated from a keyword-matched question bank (not OpenAI) to avoid latency. AI is reserved for the chat tutor.
- **In-memory token store**: `Map<token, userId>` in the API server. Tokens expire on server restart; suitable for a demo/learning app.
- **Dark-first theme**: CSS variables support both dark and light via `.dark` class. Users can toggle in Settings.

## Product

- **Auth**: Login / Register with animated welcome screen
- **Dashboard**: Overall progress bar, resume last video, recent achievements, areas to improve
- **Courses**: Full-Stack Dev course with 3 levels (Frontend, Backend, Databases), collapsible video lists with progress indicators
- **Video Player**: YouTube embed, mark-complete button, auto-generate quiz from static bank
- **Quiz**: 4 questions per video, immediate per-question feedback, score saved to DB, achievements granted automatically
- **Achievements**: 8 badges unlocked by completing quizzes; grid with locked/unlocked visual states
- **Settings**: Edit profile, toggle dark/light theme (persisted to DB)
- **AI Tutor**: Floating chat widget powered by OpenAI, available on every page

## User preferences

- Navy/slate background with electric cyan (`hsl(190 90% 50%)`) as primary color
- Dark mode first
- Animated page transitions via framer-motion

## Gotchas

- Always import `setAuthTokenGetter` from `@workspace/api-client-react` (the main index), not from the deep path `/src/custom-fetch`.
- The quiz question bank is seeded with keywords; video/level titles determine which questions appear.
- Achievements are checked and granted automatically after every quiz submission.
- Run `pnpm --filter @workspace/db run push` after any schema change before starting the API server.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
