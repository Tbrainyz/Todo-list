"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, Moon, Sun } from "lucide-react";
import { useTodos } from "@/hooks/useTodos";
import { useReminders } from "@/hooks/useReminders";
import { TodoForm } from "./TodoForm";
import { TodoItem } from "./TodoItem";

type Filter = "all" | "active" | "done";

export default function TodoApp() {
  const { todos, loading, error, add, update, remove, clearCompleted, reorder } = useTodos();
  const reminders = useReminders(todos);
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const initial = saved === "light" || saved === "dark" ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(initial);
  }, []);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("theme", theme); }, [theme]);

  const categories = useMemo(() => [...new Set(todos.map((t) => t.category))].sort(), [todos]);
  const done = todos.filter((t) => t.completed).length;
  const pct = todos.length ? Math.round((done / todos.length) * 100) : 0;

  const visible = useMemo(() => todos
    .filter((t) => (filter === "all" ? true : filter === "done" ? t.completed : !t.completed))
    .filter((t) => category === "all" || t.category === category)
    .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.order - b.order),
    [todos, filter, category, query]);

  const draggable = filter === "all" && category === "all" && !query.trim();

  const onDrop = (targetId: string) => {
    if (!dragId.current || dragId.current === targetId) return;
    const ids = visible.map((t) => t.id);
    const from = ids.indexOf(dragId.current), to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorder(ids);
    dragId.current = null;
  };

  return (
    <main className="wrap">
      <header className="hero">
        <div className="hero-actions">
          {reminders.supported && (
            <button className="theme-toggle" onClick={reminders.toggle}
              aria-label={reminders.enabled ? "Turn off due-date reminders" : "Turn on due-date reminders"}
              aria-pressed={reminders.enabled} title={reminders.enabled ? "Reminders on" : "Reminders off"}>
              {reminders.enabled ? <Bell size={17} /> : <BellOff size={17} />}
            </button>
          )}
          <button className="theme-toggle" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
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
          {visible.map((t) => (
            <div key={t.id} onDragOver={(e) => draggable && e.preventDefault()} onDrop={() => draggable && onDrop(t.id)}>
              <TodoItem todo={t} onUpdate={(p) => update(t.id, p)} onDelete={() => remove(t.id)}
                dragHandleProps={draggable ? { draggable: true, onDragStart: () => { dragId.current = t.id; } } : undefined} />
            </div>
          ))}
        </ul>
      )}

      {done > 0 && <button className="link-btn" onClick={clearCompleted}>Clear {done} completed</button>}
    </main>
  );
}
