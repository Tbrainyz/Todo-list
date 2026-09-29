export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const RECURRENCES = ["none", "daily", "weekly"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export interface Subtask { id: string; title: string; completed: boolean }

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null; // YYYY-MM-DD
  category: string;
  notes: string;
  subtasks: Subtask[];
  recurrence: Recurrence;
  order: number;
  createdAt: string;
}
export type NewTodo = Pick<Todo, "title" | "priority" | "dueDate" | "category" | "notes"> & { recurrence?: Recurrence };
export type TodoPatch = Partial<Pick<Todo, "title" | "completed" | "priority" | "dueDate" | "category" | "notes" | "subtasks" | "recurrence">>;

export const DEFAULT_CATEGORIES = ["Personal", "Work", "Home", "Study", "Health", "Shopping"];
