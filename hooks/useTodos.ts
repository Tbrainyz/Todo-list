"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { NewTodo, Todo, TodoPatch } from "@/lib/types";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<void>) => {
    try { setError(null); await fn(); } catch (e) { setError((e as Error).message); }
  }, []);

  useEffect(() => { run(async () => setTodos(await api.list())).finally(() => setLoading(false)); }, [run]);

  const replace = (t: Todo) => setTodos((p) => p.map((x) => (x.id === t.id ? t : x)));

  return {
    todos, loading, error,
    add: (input: Partial<NewTodo> & { title: string }) => run(async () => { const t = await api.create(input); setTodos((p) => [...p, t]); }),
    update: (id: string, patch: TodoPatch) => run(async () => replace(await api.update(id, patch))),
    remove: (id: string) => run(async () => { await api.remove(id); setTodos((p) => p.filter((x) => x.id !== id)); }),
    clearCompleted: () => run(async () => { await api.clearCompleted(); setTodos((p) => p.filter((x) => !x.completed)); }),
  };
}
