import mongoose, { Schema } from "mongoose";
import type { TodoStore } from "./store";
import { PRIORITIES, RECURRENCES, type NewTodo, type Todo, type TodoPatch } from "./types";

const subtaskSchema = new Schema(
  { title: { type: String, required: true, maxlength: 200 }, completed: { type: Boolean, default: false } },
  { _id: false },
);

const schema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: PRIORITIES, default: "medium" },
    dueDate: { type: String, default: null },
    category: { type: String, default: "Personal", maxlength: 30 },
    notes: { type: String, default: "", maxlength: 500 },
    subtasks: {
      type: [new Schema({ id: { type: String, required: true }, ...subtaskSchema.obj }, { _id: false })],
      default: [],
    },
    recurrence: { type: String, enum: RECURRENCES, default: "none" },
    order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
const Model = mongoose.models.Todo ?? mongoose.model("Todo", schema);

const toTodo = (d: any): Todo => ({
  id: String(d._id), title: d.title, completed: d.completed, priority: d.priority,
  dueDate: d.dueDate ?? null, category: d.category, notes: d.notes ?? "",
  subtasks: (d.subtasks ?? []).map((s: any) => ({ id: s.id, title: s.title, completed: s.completed })),
  recurrence: d.recurrence ?? "none", order: d.order ?? 0, createdAt: d.createdAt.toISOString(),
});

export async function connectDb(uri: string) {
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
}

export class MongoTodoStore implements TodoStore {
  async list() { return (await Model.find().sort({ order: 1, createdAt: 1 })).map(toTodo); }
  async create(input: NewTodo) {
    const count = await Model.countDocuments();
    return toTodo(await Model.create({ ...input, order: count }));
  }
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
  async reorder(ids: string[]) {
    const valid = ids.filter((id) => mongoose.isValidObjectId(id));
    await Promise.all(valid.map((id, i) => Model.updateOne({ _id: id }, { order: i })));
    return this.list();
  }
}
