import type { NewTodo, Todo, TodoPatch } from "./types";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong");
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  list: () => call<Todo[]>("/todos"),
  create: (input: Partial<NewTodo> & { title: string }) => call<Todo>("/todos", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, patch: TodoPatch) => call<Todo>(`/todos/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string) => call<void>(`/todos/${id}`, { method: "DELETE" }),
  clearCompleted: () => call<{ deleted: number }>("/todos/completed", { method: "DELETE" }),
  reorder: (order: string[]) => call<Todo[]>("/todos/reorder", { method: "PATCH", body: JSON.stringify({ order }) }),
};
