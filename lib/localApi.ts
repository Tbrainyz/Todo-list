"use client";
import { addDays, parseNewTodo, parsePatch, parseReorder } from "./validate";
import type { NewTodo, Todo, TodoPatch } from "./types";

/**
 * Browser-only storage: every todo lives in this device's localStorage, so
 * two people (or two browsers) never see each other's list. Nothing is sent
 * to a server. Reuses the same validation rules as the API routes in
 * app/api/todos/ so behaviour matches if you switch back to lib/remoteApi.ts.
 */
const KEY = "todos:v1";
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function readAll(): Todo[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function writeAll(todos: Todo[]) { localStorage.setItem(KEY, JSON.stringify(todos)); }
const fail = (message: string): never => { throw new Error(message); };

export const api = {
  async list(): Promise<Todo[]> {
    return readAll().sort((a, b) => a.order - b.order);
  },

  async create(input: Partial<NewTodo> & { title: string }): Promise<Todo> {
    const parsed = parseNewTodo(input);
    if (parsed.error !== undefined) fail(parsed.error);
    const value = parsed.value!;
    const todos = readAll();
    const todo: Todo = {
      id: uid(), completed: false, subtasks: [], order: todos.length,
      createdAt: new Date().toISOString(), ...value, recurrence: value.recurrence ?? "none",
    };
    writeAll([...todos, todo]);
    return todo;
  },

  async update(id: string, patch: TodoPatch): Promise<Todo> {
    const parsed = parsePatch(patch);
    if (parsed.error !== undefined) fail(parsed.error);
    const value = parsed.value!;
    const todos = readAll();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) fail("todo not found");
    const updated: Todo = { ...todos[idx], ...value };
    todos[idx] = updated;

    // A completed recurring task with a due date spawns its next occurrence.
    if (value.completed === true && updated.recurrence !== "none" && updated.dueDate) {
      const days = updated.recurrence === "daily" ? 1 : 7;
      todos.push({
        ...updated, id: uid(), completed: false, subtasks: [], order: todos.length,
        dueDate: addDays(updated.dueDate, days), createdAt: new Date().toISOString(),
      });
    }
    writeAll(todos);
    return updated;
  },

  async remove(id: string): Promise<void> {
    const todos = readAll();
    const next = todos.filter((t) => t.id !== id);
    if (next.length === todos.length) fail("todo not found");
    writeAll(next);
  },

  async clearCompleted(): Promise<{ deleted: number }> {
    const todos = readAll();
    const kept = todos.filter((t) => !t.completed);
    writeAll(kept);
    return { deleted: todos.length - kept.length };
  },

  async reorder(ids: string[]): Promise<Todo[]> {
    const parsed = parseReorder({ order: ids });
    if (parsed.error !== undefined) fail(parsed.error);
    const todos = readAll();
    const byId = new Map(todos.map((t) => [t.id, t]));
    ids.forEach((id, i) => { const t = byId.get(id); if (t) t.order = i; });
    const result = [...byId.values()];
    writeAll(result);
    return result.sort((a, b) => a.order - b.order);
  },
};
