"use client";
import { useRef, useState } from "react";
import { DEFAULT_CATEGORIES, PRIORITIES, RECURRENCES, type NewTodo, type Priority, type Recurrence } from "@/lib/types";

const NEW = "__new__";
const RECUR_LABEL: Record<Recurrence, string> = { none: "Doesn't repeat", daily: "Repeats daily", weekly: "Repeats weekly" };

export function TodoForm({ onAdd, categories }: { onAdd: (t: Partial<NewTodo> & { title: string }) => void; categories: string[] }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [custom, setCustom] = useState("");
  const [hint, setHint] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const options = [...new Set([...DEFAULT_CATEGORIES, ...categories])];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = category === NEW ? custom.trim() : category;
    if (!title.trim()) { setHint("Type a task title first."); titleRef.current?.focus(); return; }
    if (category === NEW && !cat) { setHint("Name your new category, or pick an existing one."); return; }
    if (recurrence !== "none" && !dueDate) { setHint("Repeating tasks need a due date, so the next one knows when to land."); return; }
    setHint("");
    onAdd({ title, notes, priority, dueDate: dueDate || null, category: cat, recurrence });
    setTitle(""); setNotes(""); setDueDate(""); setRecurrence("none");
    if (category === NEW) { setCategory(cat); setCustom(""); }
  };

  return (
    <form className="card composer" onSubmit={submit}>
      <input className="title-input" ref={titleRef} value={title} onChange={(e) => { setTitle(e.target.value); setHint(""); }}
        maxLength={200} placeholder="What needs doing?" aria-label="Task title" />
      <textarea className="notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2}
        placeholder="Add a note or details (optional)" aria-label="Task notes" />
      <div className="composer-row">
        <label className="lbl">Priority
          <div className="seg" role="group" aria-label="Priority">
            {PRIORITIES.map((p) => (
              <button type="button" key={p} className={`seg-btn ${p} ${priority === p ? "on" : ""}`} onClick={() => setPriority(p)}>{p}</button>
            ))}
          </div>
        </label>
        <label className="lbl">Category
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            {options.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={NEW}>+ New category…</option>
          </select>
        </label>
        {category === NEW && (
          <label className="lbl">Name
            <input className="field" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={30} placeholder="e.g. Side project" autoFocus aria-label="New category name" />
          </label>
        )}
        <label className="lbl">Due date
          <input className="field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
        </label>
        <label className="lbl">Repeat
          <select className="field" value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)} aria-label="Repeat">
            {RECURRENCES.map((r) => <option key={r} value={r}>{RECUR_LABEL[r]}</option>)}
          </select>
        </label>
        <button className="btn-primary" type="submit">Add task</button>
      </div>
      {hint && <p className="hint" role="status">{hint}</p>}
    </form>
  );
}
