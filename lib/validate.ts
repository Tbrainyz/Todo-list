import { PRIORITIES, type NewTodo, type Priority, type TodoPatch } from "./types";

type Result<T> = { value: T; error?: undefined } | { error: string; value?: undefined };
const fail = (error: string) => ({ error }) as { error: string };

const title = (v: unknown) =>
  typeof v === "string" && v.trim() && v.trim().length <= 200 ? v.trim() : null;
const category = (v: unknown) =>
  typeof v === "string" && v.trim() && v.trim().length <= 30 ? v.trim() : null;
const notes = (v: unknown) => (typeof v === "string" && v.trim().length <= 500 ? v.trim() : null);
const priority = (v: unknown): Priority | null =>
  typeof v === "string" && (PRIORITIES as readonly string[]).includes(v) ? (v as Priority) : null;
const date = (v: unknown) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v) ? v : null;
};

const T = "title must be a non-empty string up to 200 characters";
const C = "category must be a non-empty string up to 30 characters";
const N = "notes must be a string up to 500 characters";
const P = "priority must be low, medium or high";
const D = "dueDate must be a valid YYYY-MM-DD date or null";

export function parseNewTodo(body: any): Result<NewTodo> {
  const t = title(body?.title);
  if (!t) return fail(T);
  let p: Priority = "medium", c = "Personal", d: string | null = null, n = "";
  if (body.priority !== undefined) { const x = priority(body.priority); if (!x) return fail(P); p = x; }
  if (body.category !== undefined) { const x = category(body.category); if (!x) return fail(C); c = x; }
  if (body.notes !== undefined) { const x = notes(body.notes); if (x === null) return fail(N); n = x; }
  if (body.dueDate !== undefined && body.dueDate !== null) { const x = date(body.dueDate); if (!x) return fail(D); d = x; }
  return { value: { title: t, priority: p, category: c, dueDate: d, notes: n } };
}

export function parsePatch(body: any): Result<TodoPatch> {
  const out: TodoPatch = {};
  if (body?.title !== undefined) { const x = title(body.title); if (!x) return fail(T); out.title = x; }
  if (body?.completed !== undefined) {
    if (typeof body.completed !== "boolean") return fail("completed must be a boolean");
    out.completed = body.completed;
  }
  if (body?.priority !== undefined) { const x = priority(body.priority); if (!x) return fail(P); out.priority = x; }
  if (body?.category !== undefined) { const x = category(body.category); if (!x) return fail(C); out.category = x; }
  if (body?.notes !== undefined) { const x = notes(body.notes); if (x === null) return fail(N); out.notes = x; }
  if (body?.dueDate !== undefined) {
    if (body.dueDate === null) out.dueDate = null;
    else { const x = date(body.dueDate); if (!x) return fail(D); out.dueDate = x; }
  }
  if (!Object.keys(out).length) return fail("provide at least one field to update");
  return { value: out };
}
