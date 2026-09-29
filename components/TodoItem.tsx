"use client";
import { useState } from "react";
import type { Subtask, Todo, TodoPatch } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const label = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export function TodoItem({
  todo, onUpdate, onDelete, dragHandleProps,
}: {
  todo: Todo; onUpdate: (p: TodoPatch) => void; onDelete: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const overdue = !!todo.dueDate && !todo.completed && todo.dueDate < today();
  const doneCount = todo.subtasks.filter((s) => s.completed).length;

  const start = () => { setTitle(todo.title); setNotes(todo.notes); setEditing(true); };
  const save = () => {
    if (!title.trim()) return;
    const patch: TodoPatch = {};
    if (title.trim() !== todo.title) patch.title = title;
    if (notes.trim() !== todo.notes) patch.notes = notes;
    if (Object.keys(patch).length) onUpdate(patch);
    setEditing(false);
  };

  const setSubtasks = (subtasks: Subtask[]) => onUpdate({ subtasks });
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...todo.subtasks, { id: uid(), title: newSubtask.trim(), completed: false }]);
    setNewSubtask("");
  };
  const toggleSubtask = (id: string) => setSubtasks(todo.subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  const removeSubtask = (id: string) => setSubtasks(todo.subtasks.filter((s) => s.id !== id));

  return (
    <li className={`item ${todo.priority} ${todo.completed ? "done" : ""}`}>
      <div className="item-row">
        {dragHandleProps && <button type="button" className="drag-handle" aria-label={`Reorder "${todo.title}"`} {...dragHandleProps}>⠿</button>}
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
            {todo.recurrence !== "none" && <span className="chip">↻ {todo.recurrence}</span>}
            {todo.subtasks.length > 0 && (
              <button type="button" className="chip chip-btn" onClick={() => setShowSubtasks((s) => !s)}>
                ☑ {doneCount}/{todo.subtasks.length}
              </button>
            )}
          </div>
          {(showSubtasks || todo.subtasks.length === 0) && (
            <div className="subtasks">
              {todo.subtasks.length > 0 && (
                <ul className="subtask-list">
                  {todo.subtasks.map((s) => (
                    <li key={s.id} className="subtask">
                      <input type="checkbox" checked={s.completed} onChange={() => toggleSubtask(s.id)} aria-label={`Mark subtask "${s.title}" done`} />
                      <span className={s.completed ? "sub-done" : ""}>{s.title}</span>
                      <button type="button" className="icon-btn tiny" onClick={() => removeSubtask(s.id)} aria-label={`Remove subtask "${s.title}"`}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
              <form className="subtask-add" onSubmit={(e) => { e.preventDefault(); addSubtask(); }}>
                <input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} maxLength={200}
                  placeholder="Add a subtask" aria-label="New subtask" />
                <button type="submit" className="btn-small">Add</button>
              </form>
            </div>
          )}
        </div>
        {!editing && <button className="icon-btn" onClick={start} aria-label={`Edit "${todo.title}"`}>Edit</button>}
        <button className="icon-btn" onClick={onDelete} aria-label={`Delete "${todo.title}"`}>✕</button>
      </div>
    </li>
  );
}
