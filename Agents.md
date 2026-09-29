# Agents.md

Rules for any AI agent working in this repo.

## Project
Todo app on Next.js (App Router) + TypeScript. UI in `app/`, `components/`, `hooks/`. Tests with Vitest.

**Storage: browser-only right now.** The UI (`hooks/useTodos.ts`) talks to `lib/api.ts`, which currently re-exports `lib/localApi.ts` — every todo is read/written straight to `localStorage`, per device, with no login and no server involved. This is intentional: no auth, no shared list, each browser is private. `lib/localApi.ts` reuses the same validation (`lib/validate.ts`) and the same `Todo`/recurrence-rollover rules as the server API, so behaviour matches either way.

The MongoDB-backed API routes in `app/api/todos/` (`lib/mongoStore.ts`, `lib/remoteApi.ts`) still exist and are still tested — the UI just isn't calling them at the moment. **To switch the app back to the shared database-backed API**, replace the contents of `lib/api.ts` with `export * from "./remoteApi";` and set `MONGODB_URI`. No other file needs to change. Do not delete `remoteApi.ts`, `mongoStore.ts`, or the `app/api/` routes to "clean up" — they're the on-ramp back to shared storage.

## Endpoint rules (mandatory)
1. **Every endpoint (`app/api/`) or storage function (`lib/localApi.ts`) you create or change MUST have tests** in `tests/`, in the same change. `lib/localApi.ts` has its own suite (`tests/localApi.test.ts`, jsdom) separate from the API route tests (`tests/api.test.ts`, node) — keep both in sync when validation rules or the `Todo` shape change.
2. Tests cover the happy path AND edge cases: invalid input (400 / thrown error), unknown id (404 / thrown error), empty/whitespace values, wrong types, malformed JSON, and store failure (500).
3. **Always validate the change works before saying you are done**: run `npm test` (and `npm run typecheck`) and confirm both pass. Never claim something works without a passing run.
4. If a test fails, fix the code (or the test if the test is wrong) and re-run. Never skip, delete, or weaken tests to get green.
5. Update the endpoint table below when adding or changing API routes.

## Endpoints
| Method | Path | Success | Errors |
|---|---|---|---|
| GET | /api/health | 200 `{status:"ok"}` | - |
| GET | /api/todos | 200 `Todo[]` | 500 |
| POST | /api/todos | 201 `Todo` | 400, 500 |
| PATCH | /api/todos/:id | 200 `Todo` | 400, 404, 500 |
| DELETE | /api/todos/:id | 204 | 404, 500 |
| DELETE | /api/todos/completed | 200 `{deleted:number}` | 500 |
| PATCH | /api/todos/reorder | 200 `Todo[]` | 400, 500 |

Todo = `{ id, title, notes (max 500), completed, priority: low|medium|high, dueDate: YYYY-MM-DD|null, category (max 30), subtasks: {id,title,completed}[] (max 50), recurrence: none|daily|weekly, order, createdAt }`

Completing (`completed:true`) a task whose `recurrence` isn't `none` and has a `dueDate` auto-creates its next occurrence (dueDate +1 day for daily, +7 for weekly). This only fires on the transition to completed, not on other edits to an already-completed task — cover that in tests when touching this logic.

## Conventions
- Validate input with `lib/validate.ts`; wrap every handler in `handle()` from `lib/http.ts`; errors are `{ error: string }`.
- Storage goes through the `TodoStore` interface (`lib/store.ts`). `MongoTodoStore` is used when `MONGODB_URI` is set; tests inject `MemoryTodoStore` via `setStore()`. Never put secrets in code; use `.env.local`.
- Icons use `lucide-react` (already a dependency) — do not fall back to emoji or text glyphs for controls.
- Destructive actions (deleting a task) must go through `components/ConfirmDialog.tsx` — never delete directly on a single click.
- Client components need `"use client"`. API calls live in `lib/api.ts`; data logic in `hooks/`.
- Form/UI changes need a component test in `tests/*.test.tsx` (jsdom + Testing Library); buttons must never be silently disabled, show a hint instead.
- Keep `npm test` fast and independent of external services.
