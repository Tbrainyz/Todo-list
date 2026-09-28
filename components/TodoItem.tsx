"use client";
import { useState } from "react";
import type { Todo, TodoPatch } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const label = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function TodoItem({ todo, onUpdate, onDelete }: { todo: Todo; onUpdate: (p: TodoPatch) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes);
  const overdue = !!todo.dueDate && !todo.completed && todo.dueDate < today();

  const start = () => { setTitle(todo.title); setNotes(todo.notes); setEditing(true); };
  const save = () => {
    if (!title.trim()) return;
    const patch: TodoPatch = {};
    if (title.trim() !== todo.title) patch.title = title;
    if (notes.trim() !== todo.notes) patch.notes = notes;
    if (Object.keys(patch).length) onUpdate(patch);
    setEditing(false);
  };

  return (
    <li className={`item ${todo.priority} ${todo.completed ? "done" : ""}`}>
      <input type="checkbox" className="check" checked={todo.completed} onChange={() => onUpdate({ completed: !todo.completed })}
        aria-label={`Mark "${todo.title}" as done`} />
      <div className="item-main">
        {editing ? (
          <div className="edit-box" onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}>
            <input className="edit" autoFocus value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }} aria-label="Edit title" />
            <textarea className="edit" rows={2} value={notes} maxLength={500} placeholder="Notes" onChange={(e) => setNotes(e.target.value)} aria-label="Edit notes" />
            <div className="edit-actions">
              <button className="btn-small primary" onClick={save}>Save</button>
              <button className="btn-small" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <span className="item-title" onDoubleClick={start}>{todo.title}</span>
            {todo.notes && <p className="item-notes">{todo.notes}</p>}
          </>
        )}
        <div className="chips">
          <span className={`chip prio ${todo.priority}`}>{todo.priority}</span>
          <span className="chip">{todo.category}</span>
          {todo.dueDate && <span className={`chip ${overdue ? "overdue" : ""}`}>{overdue ? "Overdue · " : "Due "}{label(todo.dueDate)}</span>}
        </div>
      </div>
      {!editing && <button className="icon-btn" onClick={start} aria-label={`Edit "${todo.title}"`}>Edit</button>}
      <button className="icon-btn" onClick={onDelete} aria-label={`Delete "${todo.title}"`}>✕</button>
    </li>
  );
}
