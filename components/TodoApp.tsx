"use client";
import { useMemo, useState } from "react";
import { useTodos } from "@/hooks/useTodos";
import { TodoForm } from "./TodoForm";
import { TodoItem } from "./TodoItem";

const RANK = { high: 0, medium: 1, low: 2 } as const;
type Filter = "all" | "active" | "done";

export default function TodoApp() {
  const { todos, loading, error, add, update, remove, clearCompleted } = useTodos();
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => [...new Set(todos.map((t) => t.category))].sort(), [todos]);
  const done = todos.filter((t) => t.completed).length;
  const pct = todos.length ? Math.round((done / todos.length) * 100) : 0;

  const visible = useMemo(() => todos
    .filter((t) => (filter === "all" ? true : filter === "done" ? t.completed : !t.completed))
    .filter((t) => category === "all" || t.category === category)
    .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || RANK[a.priority] - RANK[b.priority]),
    [todos, filter, category, query]);

  return (
    <main className="wrap">
      <header className="hero">
        <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1>Today</h1>
        <div className="progress" aria-label={`${pct}% complete`}><span style={{ width: `${pct}%` }} /></div>
        <p className="sub">{todos.length ? `${done} of ${todos.length} done` : "A clean slate"}</p>
      </header>

      <TodoForm onAdd={add} categories={categories} />
      {error && <p role="alert" className="alert">{error}</p>}

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {(["all", "active", "done"] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="field search" type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search tasks" />
      </div>

      {loading ? <p className="empty">Loading your tasks…</p> : visible.length === 0 ? (
        <div className="empty card"><p className="empty-title">{todos.length ? "Nothing matches" : "Nothing here yet"}</p>
          <p>{todos.length ? "Try a different filter or search." : "Add your first task above to get started."}</p></div>
      ) : (
        <ul className="list card">
          {visible.map((t) => <TodoItem key={t.id} todo={t} onUpdate={(p) => update(t.id, p)} onDelete={() => remove(t.id)} />)}
        </ul>
      )}

      {done > 0 && <button className="link-btn" onClick={clearCompleted}>Clear {done} completed</button>}
    </main>
  );
}
