import { PRIORITIES, RECURRENCES, type NewTodo, type Priority, type Recurrence, type Subtask, type TodoPatch } from "./types";

type Result<T> = { value: T; error?: undefined } | { error: string; value?: undefined };
const fail = (error: string) => ({ error }) as { error: string };

const title = (v: unknown) => (typeof v === "string" && v.trim() && v.trim().length <= 200 ? v.trim() : null);
const category = (v: unknown) => (typeof v === "string" && v.trim() && v.trim().length <= 30 ? v.trim() : null);
const notes = (v: unknown) => (typeof v === "string" && v.trim().length <= 500 ? v.trim() : null);
const priority = (v: unknown): Priority | null =>
  typeof v === "string" && (PRIORITIES as readonly string[]).includes(v) ? (v as Priority) : null;
const recurrence = (v: unknown): Recurrence | null =>
  typeof v === "string" && (RECURRENCES as readonly string[]).includes(v) ? (v as Recurrence) : null;
const date = (v: unknown) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v) ? v : null;
};
const subtasks = (v: unknown): Subtask[] | null => {
  if (!Array.isArray(v) || v.length > 50) return null;
  const out: Subtask[] = [];
  for (const raw of v) {
    if (typeof raw !== "object" || raw === null) return null;
    const t = title((raw as any).title);
    if (!t) return null;
    if ((raw as any).completed !== undefined && typeof (raw as any).completed !== "boolean") return null;
    const id = typeof (raw as any).id === "string" && (raw as any).id ? (raw as any).id : crypto.randomUUID();
    out.push({ id, title: t, completed: !!(raw as any).completed });
  }
  return out;
};

const T = "title must be a non-empty string up to 200 characters";
const C = "category must be a non-empty string up to 30 characters";
const P = "priority must be low, medium or high";
const D = "dueDate must be a valid YYYY-MM-DD date or null";
const N = "notes must be a string up to 500 characters";
const R = "recurrence must be none, daily or weekly";
const S = "subtasks must be an array of up to 50 items, each with a non-empty title up to 200 characters";

export function parseNewTodo(body: any): Result<NewTodo> {
  const t = title(body?.title);
  if (!t) return fail(T);
  let p: Priority = "medium", c = "Personal", d: string | null = null, n = "", r: Recurrence = "none";
  if (body.priority !== undefined) { const x = priority(body.priority); if (!x) return fail(P); p = x; }
  if (body.category !== undefined) { const x = category(body.category); if (!x) return fail(C); c = x; }
  if (body.notes !== undefined) { const x = notes(body.notes); if (x === null) return fail(N); n = x; }
  if (body.recurrence !== undefined) { const x = recurrence(body.recurrence); if (!x) return fail(R); r = x; }
  if (body.dueDate !== undefined && body.dueDate !== null) { const x = date(body.dueDate); if (!x) return fail(D); d = x; }
  return { value: { title: t, priority: p, category: c, dueDate: d, notes: n, recurrence: r } };
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
  if (body?.recurrence !== undefined) { const x = recurrence(body.recurrence); if (!x) return fail(R); out.recurrence = x; }
  if (body?.subtasks !== undefined) { const x = subtasks(body.subtasks); if (!x) return fail(S); out.subtasks = x; }
  if (body?.dueDate !== undefined) {
    if (body.dueDate === null) out.dueDate = null;
    else { const x = date(body.dueDate); if (!x) return fail(D); out.dueDate = x; }
  }
  if (!Object.keys(out).length) return fail("provide at least one field to update");
  return { value: out };
}

export function parseReorder(body: any): Result<string[]> {
  if (!Array.isArray(body?.order) || body.order.length > 500 || !body.order.every((x: unknown) => typeof x === "string" && x))
    return fail("order must be an array of task ids");
  return { value: body.order };
}

/** Adds `days` to a YYYY-MM-DD date string, in UTC. */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
