import { randomUUID } from "node:crypto";
import type { NewTodo, Todo, TodoPatch } from "./types";

export interface TodoStore {
  list(): Promise<Todo[]>;
  create(input: NewTodo): Promise<Todo>;
  update(id: string, patch: TodoPatch): Promise<Todo | undefined>;
  remove(id: string): Promise<boolean>;
  clearCompleted(): Promise<number>;
  reorder(ids: string[]): Promise<Todo[]>;
}

/** In-memory store: used by tests and as a dev fallback. */
export class MemoryTodoStore implements TodoStore {
  private todos = new Map<string, Todo>();
  private nextOrder = 0;

  async list() { return [...this.todos.values()].sort((a, b) => a.order - b.order); }
  async create(input: NewTodo) {
    const todo: Todo = {
      id: randomUUID(), completed: false, subtasks: [], recurrence: "none",
      order: this.nextOrder++, createdAt: new Date().toISOString(), ...input,
    };
    this.todos.set(todo.id, todo);
    return todo;
  }
  async update(id: string, patch: TodoPatch) {
    const t = this.todos.get(id);
    if (!t) return undefined;
    Object.assign(t, patch);
    return t;
  }
  async remove(id: string) { return this.todos.delete(id); }
  async clearCompleted() {
    let n = 0;
    for (const [id, t] of this.todos) if (t.completed) { this.todos.delete(id); n++; }
    return n;
  }
  async reorder(ids: string[]) {
    ids.forEach((id, i) => { const t = this.todos.get(id); if (t) t.order = i; });
    return this.list();
  }
}
