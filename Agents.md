# Agents.md

Rules for any AI agent working in this repo.

## Project
Todo app on Next.js (App Router) + TypeScript. UI in `app/`, `components/`, `hooks/`. API = route handlers in `app/api/`. Data in MongoDB (Mongoose), tests with Vitest.

## Endpoint rules (mandatory)
1. **Every endpoint you create or change MUST have tests** in `tests/`, in the same change.
2. Tests cover the happy path AND edge cases: invalid input (400), unknown id (404), empty/whitespace values, wrong types, malformed JSON, and store failure (500).
3. **Always validate the endpoint works before saying you are done**: run `npm test` (and `npm run typecheck`) and confirm both pass. Never claim an endpoint works without a passing run.
4. If a test fails, fix the code (or the test if the test is wrong) and re-run. Never skip, delete, or weaken tests to get green.
5. Update the endpoint table below when adding or changing routes.

## Endpoints
| Method | Path | Success | Errors |
|---|---|---|---|
| GET | /api/health | 200 `{status:"ok"}` | - |
| GET | /api/todos | 200 `Todo[]` | 500 |
| POST | /api/todos | 201 `Todo` | 400, 500 |
| PATCH | /api/todos/:id | 200 `Todo` | 400, 404, 500 |
| DELETE | /api/todos/:id | 204 | 404, 500 |
| DELETE | /api/todos/completed | 200 `{deleted:number}` | 500 |

Todo = `{ id, title, notes (max 500), completed, priority: low|medium|high, dueDate: YYYY-MM-DD|null, category (max 30), createdAt }`

## Conventions
- Validate input with `lib/validate.ts`; wrap every handler in `handle()` from `lib/http.ts`; errors are `{ error: string }`.
- Storage goes through the `TodoStore` interface (`lib/store.ts`). `MongoTodoStore` is used when `MONGODB_URI` is set; tests inject `MemoryTodoStore` via `setStore()`. Never put secrets in code; use `.env.local`.
- Client components need `"use client"`. API calls live in `lib/api.ts`; data logic in `hooks/`.
- Form/UI changes need a component test in `tests/*.test.tsx` (jsdom + Testing Library); buttons must never be silently disabled, show a hint instead.
- Keep `npm test` fast and independent of external services.
