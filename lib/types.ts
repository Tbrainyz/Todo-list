export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null; // YYYY-MM-DD
  category: string;
  notes: string;
  createdAt: string;
}
export type NewTodo = Pick<Todo, "title" | "priority" | "dueDate" | "category" | "notes">;
export type TodoPatch = Partial<Pick<Todo, "title" | "completed" | "priority" | "dueDate" | "category" | "notes">>;

export const DEFAULT_CATEGORIES = ["Personal", "Work", "Home", "Study", "Health", "Shopping"];
