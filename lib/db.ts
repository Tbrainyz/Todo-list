import { MemoryTodoStore, type TodoStore } from "./store";
import { MongoTodoStore, connectDb } from "./mongoStore";

const g = globalThis as unknown as { __todoStore?: TodoStore };

/** Tests inject a store here. */
export function setStore(store: TodoStore | undefined) { g.__todoStore = store; }

export async function getStore(): Promise<TodoStore> {
  if (g.__todoStore) return g.__todoStore;
  const uri = process.env.MONGODB_URI;
  if (uri) {
    await connectDb(uri);
    g.__todoStore = new MongoTodoStore();
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production");
  } else {
    console.warn("MONGODB_URI not set: using in-memory store (data is lost on restart)");
    g.__todoStore = new MemoryTodoStore();
  }
  return g.__todoStore;
}
