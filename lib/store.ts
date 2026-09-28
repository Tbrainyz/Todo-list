import { randomUUID } from "node:crypto";
import type { NewTodo, Todo, TodoPatch } from "./types";

export interface TodoStore {
  list(): Promise<Todo[]>;
  create(input: NewTodo): Promise<Todo>;
  update(id: string, patch: TodoPatch): Promise<Todo | undefined>;
  remove(id: string): Promise<boolean>;
  clearCompleted(): Promise<number>;
}

/** In-memory store: used by tests and as a dev fallback. */
export class MemoryTodoStore implements TodoStore {
  private todos = new Map<string, Todo>();
  async list() { return [...this.todos.values()]; }
  async create(input: NewTodo) {
    const todo: Todo = { id: randomUUID(), completed: false, createdAt: new Date().toISOString(), ...input };
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
}
