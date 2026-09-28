import mongoose, { Schema } from "mongoose";
import type { TodoStore } from "./store";
import { PRIORITIES, type NewTodo, type Todo, type TodoPatch } from "./types";

const schema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: PRIORITIES, default: "medium" },
    dueDate: { type: String, default: null },
    category: { type: String, default: "Personal", maxlength: 30 },
    notes: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
const Model = mongoose.models.Todo ?? mongoose.model("Todo", schema);

const toTodo = (d: any): Todo => ({
  id: String(d._id), title: d.title, completed: d.completed, priority: d.priority,
  dueDate: d.dueDate ?? null, category: d.category, notes: d.notes ?? "", createdAt: d.createdAt.toISOString(),
});

export async function connectDb(uri: string) {
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
}

export class MongoTodoStore implements TodoStore {
  async list() { return (await Model.find().sort({ createdAt: 1 })).map(toTodo); }
  async create(input: NewTodo) { return toTodo(await Model.create(input)); }
  async update(id: string, patch: TodoPatch) {
    if (!mongoose.isValidObjectId(id)) return undefined;
    const d = await Model.findByIdAndUpdate(id, patch, { new: true });
    return d ? toTodo(d) : undefined;
  }
  async remove(id: string) {
    if (!mongoose.isValidObjectId(id)) return false;
    return !!(await Model.findByIdAndDelete(id));
  }
  async clearCompleted() { return (await Model.deleteMany({ completed: true })).deletedCount ?? 0; }
}
