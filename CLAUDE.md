# The Study Guild — Copilot Reference

## Project overview

**The Study Guild** is a gamified, interactive learning portal. Users browse free curated courses, learn through interactive lessons (with flow diagrams, callouts, quizzes), and earn XP/ranks in a Steam-style progression system. Teachers can publish courses through a UI (API support planned).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite, Tailwind CSS, ReactFlow |
| State | TanStack Query v5 |
| Auth (client) | @azure/msal-react (Azure AD / Entra ID popup flow) |
| Backend | Node.js + Express, TypeScript, tsx (dev) |
| Database | Azure CosmosDB (NoSQL) |
| Auth (server) | JWT validation via jwks-rsa against Azure AD JWKS endpoint |
| Schema validation | Zod (server-side) |
| Monorepo | npm workspaces (client / server / shared) |

## Monorepo structure

```
/
├── client/          # React SPA
│   └── src/
│       ├── components/
│       │   ├── layout/AppShell.tsx    # Sidebar nav + user footer
│       │   └── lesson/                # LessonRenderer, FlowDiagramSection, QuizSection
│       ├── pages/                     # One file per route
│       ├── lib/
│       │   ├── msalConfig.ts          # MSAL config + loginRequest
│       │   ├── apiClient.ts           # Axios + silent token injection
│       │   └── utils.ts               # cn() helper
│       └── main.tsx                   # MSAL + QueryClient providers
├── server/          # Express API
│   └── src/
│       ├── config/
│       │   ├── env.ts                 # Typed env vars
│       │   └── cosmos.ts              # CosmosDB client + container helper
│       ├── middleware/
│       │   ├── auth.ts                # JWT middleware + requireRole()
│       │   └── errorHandler.ts        # Zod + generic error handler
│       └── routes/
│           ├── users.ts               # GET/PATCH /api/users/me, GET /api/users/:id/profile
│           ├── courses.ts             # CRUD + publish + rate
│           ├── lessons.ts             # CRUD per course
│           └── progress.ts            # lesson-complete, daily-login, get progress
└── shared/          # Shared TypeScript types (no runtime dependencies)
    └── src/
        ├── types/user.ts              # UserProfile, GuildRank, RANK_XP_THRESHOLDS, XPEvent
        ├── types/course.ts            # Course, Lesson, LessonContent schema, Progress, Rating
        └── types/api.ts               # ApiResponse, PaginatedResponse, CourseListParams
```

## Environment variables

Copy `.env.example` to `.env` at the repo root.

| Variable | Description |
|---|---|
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Server-side app registration client ID |
| `AZURE_CLIENT_SECRET` | Server-side app registration secret |
| `COSMOS_ENDPOINT` | CosmosDB account endpoint URL |
| `COSMOS_KEY` | CosmosDB primary key |
| `COSMOS_DATABASE` | Database name (default: `study-guild`) |
| `PORT` | Express port (default: 3001) |

Client-side (put in `client/.env.local`):

| Variable | Description |
|---|---|
| `VITE_AZURE_CLIENT_ID` | SPA app registration client ID |
| `VITE_AZURE_TENANT_ID` | Azure AD tenant ID |
| `VITE_API_BASE_URL` | API base URL (default: `/api` via Vite proxy) |

## Azure AD setup (two app registrations required)

1. **SPA registration** (client)
   - Platform: Single-page application
   - Redirect URI: `http://localhost:5173` (dev) + production URL
   - Expose no API scopes here

2. **API registration** (server)
   - Expose API scope: `access_as_user`
   - Grant the SPA registration permission to this scope

## CosmosDB containers

| Container | Partition key | Description |
|---|---|---|
| `users` | `/id` | User profiles, XP, rank, streak |
| `courses` | `/id` | Course metadata + publish state |
| `lessons` | `/id` | Lesson content (versioned JSON schema) |
| `progress` | `/id` | `userId#courseId` composite key |
| `ratings` | `/id` | `userId#courseId` composite key |
| `xp-events` | `/id` | Append-only XP award log |
| `achievements` | `/id` | Achievement definitions |

## Lesson content schema (v1)

Lessons have a `content: LessonContent` field with `schemaVersion: "1"` and an array of typed `sections`. Section types:

- `text` — Markdown content
- `callout` — Highlighted box (info / warning / tip / danger)
- `codeBlock` — Syntax-highlighted code with optional caption
- `flowDiagram` — ReactFlow nodes + edges (rendered interactively)
- `quiz` — Multiple-choice questions with correct index + explanations
- `interactive` — Named component with arbitrary props (extensible)

All types are defined in `shared/src/types/course.ts` and validated server-side with Zod in `server/src/routes/lessons.ts`.

## Gamification

XP is awarded per `XPReason`:

| Reason | XP |
|---|---|
| `lesson_completed` | 10 |
| `course_completed` | 50 |
| `quiz_passed` | 20 |
| `quiz_perfect` | 40 |
| `daily_login` | 5 |
| `course_rated` | 2 |
| `achievement_unlocked` | 25 |

Ranks (thresholds defined in `shared/src/types/user.ts`):

| Rank | XP required |
|---|---|
| Initiate | 0 |
| Apprentice | 100 |
| Scholar | 300 |
| Adept | 600 |
| Expert | 1000 |
| Master | 2000 |
| Grandmaster | 4000 |

## User roles

- `learner` — default role, can browse/learn/rate
- `teacher` — can create/edit/publish courses (user self-upgrades in UI)
- `admin` — reserved (enforced via Azure AD app roles)

## API routes summary

```
GET    /health
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/:id/profile

GET    /api/courses                          (public, filterable)
GET    /api/courses/taxonomies               (public)
GET    /api/courses/:id                      (public)
POST   /api/courses                          (auth required)
PATCH  /api/courses/:id                      (auth, author only)
POST   /api/courses/:id/publish              (auth, author only)
POST   /api/courses/:id/rate                 (auth)

GET    /api/courses/:courseId/lessons        (public)
GET    /api/courses/:courseId/lessons/:id    (public)
POST   /api/courses/:courseId/lessons        (auth, author only)
PUT    /api/courses/:courseId/lessons/:id    (auth, author only)

POST   /api/progress/lesson-complete         (auth)
POST   /api/progress/daily-login             (auth)
GET    /api/progress/:courseId               (auth)
```

## Running locally

```bash
npm install            # install all workspaces
npm run dev            # starts both server (port 3001) and client (port 5173)
```

## Pilot course: OAuth2

The first curated course is **OAuth2** under taxonomy `Security / Authentication`. It uses `flowDiagram` sections to visualize the authorization code flow and `quiz` sections for knowledge checks. Seed data will be added in a future session.

## P1 features (planned, not yet built)

- Teacher content API (POST /api/courses/:id/lessons with API key auth)
- Achievement evaluation engine
- Lesson content visual editor (drag-and-drop sections)
- Admin role enforcement via Azure AD app roles
