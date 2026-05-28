# Copilot Instructions

## Change workflow

- Track every code or documentation change in its own branch and pull request. Do not batch unrelated changes into a shared PR.

## Build, test, and lint

- Install all workspaces from the repo root with `npm install`.
- Start both apps in development with `npm run dev` (`server` on `http://localhost:3001`, `client` on `http://localhost:5173` via the Vite proxy).
- Build everything with `npm run build`.
- Build individual workspaces with `npm run build --workspace=shared`, `npm run build --workspace=server`, and `npm run build --workspace=client`.
- Lint the repo with `npm run lint`, or lint a workspace with `npm run lint --workspace=client` / `npm run lint --workspace=server`.
- Automated tests currently live in the client workspace. Run all tests with `npm run test --workspace=client`.
- Run a single test file with `npm run test --workspace=client -- src\lib\__tests__\xpUtils.test.ts`.
- Run a single named test with `npm run test --workspace=client -- -t "computeRank"`.

## High-level architecture

- This is an npm-workspaces monorepo with `client`, `server`, and `shared`. `shared` is the source of truth for cross-package types, and the client aliases `@study-guild/shared` to `..\shared\src\index.ts` in both Vite and Vitest instead of consuming built output.
- The client has two startup modes in `client\src\main.tsx`. If `VITE_AZURE_CLIENT_ID` is missing, it installs Axios mock interceptors and uses the dev auth provider backed by `sessionStorage`; if Azure env vars are present, it initializes MSAL and injects bearer tokens through the shared Axios client.
- Server runtime config is loaded from the repo-root `.env` in `server\src\config\env.ts`, while Vite client secrets belong in `client\.env.local`. Omitting `VITE_AZURE_CLIENT_ID` is an intentional way to keep the client in mock mode.
- SPA routing is in `client\src\App.tsx`: `/login` is the only public route, and the rest of the app is wrapped in `ProtectedRoute` + `AppShell`. `AppShell` owns the persistent navigation, taxonomy-driven sidebar, search modal, and user chrome around page routes.
- Frontend data fetching is page-owned. Pages call `apiClient` directly and define their own TanStack Query `queryKey` / `useMutation` invalidation logic instead of going through a dedicated frontend service layer.
- The server is a thin Express API in `server\src\index.ts` that mounts resource routers directly. Route files validate inputs at the edge, then read and write CosmosDB documents through `getContainer()`; there is no separate repository or service layer.
- Lessons are stored as versioned JSON documents. `shared\src\types\course.ts` defines the TypeScript union, `server\src\routes\lessons.ts` mirrors it with Zod validation, and `client\src\components\lesson\*` renders each section type (`text`, `callout`, `codeBlock`, `flowDiagram`, `quiz`, `interactive`).
- Progress, XP awards, rank changes, and achievement unlocking are computed in `server\src\routes\progress.ts`. The client mirrors rank/XP helpers in `client\src\lib\xpUtils.ts` so the UI and mock mode can show the same reward model.

## Key conventions

- User identifiers are not normalized across all documents. `users.id` is an internal UUID, `users.azureOid` is the Azure identity, `courses.authorId` and `progress.userId` use the Azure OID, while XP events and public profile URLs use the internal UUID.
- API handlers consistently return `{ data: ... }` on success and `{ error, message, statusCode }` on failure. Client queries usually unwrap responses as `response.data.data`.
- Mock mode is a first-class path, not a fallback. When changing auth or API behavior, keep `client\src\lib\mockInterceptors.ts` and `client\src\contexts\AuthContext.tsx` working so the SPA still runs without Azure or a live server.
- Lesson section changes are cross-cutting. If you add or change a section type, update the shared type union, server-side Zod schema, renderer components, lesson editor behavior, mock data/interceptors, and client tests together.
- `client\src\pages\LessonEditorPage.tsx` only edits `text`, `callout`, `codeBlock`, and `quiz` sections. It preserves non-editable section types from the existing lesson on save, so new section types must account for that merge behavior.
- React Query keys are local tuple literals rather than centralized constants. Reuse existing shapes such as `['me']`, `['progress', courseId]`, `['lessons', courseId]`, `['lesson', courseId, lessonId]`, and `['my-courses']` so invalidation stays consistent.
- The current teacher workflow is UI-driven: `TeacherDashboard` upgrades a learner to `teacher` via `PATCH /users/me`, `CourseEditorPage` manages course metadata and lesson ordering, and `LessonEditorPage` is the structured authoring surface with live preview.
