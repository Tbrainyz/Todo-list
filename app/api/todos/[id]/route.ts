import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { badRequest, handle, notFound } from "@/lib/http";
import { addDays, parsePatch } from "@/lib/validate";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = parsePatch(body);
  if (parsed.error !== undefined) return badRequest(parsed.error);
  const store = await getStore();
  const todo = await store.update(id, parsed.value);
  if (!todo) return notFound();

  // A completed recurring task with a due date spawns its next occurrence.
  if (parsed.value.completed === true && todo.recurrence !== "none" && todo.dueDate) {
    const days = todo.recurrence === "daily" ? 1 : 7;
    await store.create({
      title: todo.title, priority: todo.priority, category: todo.category, notes: todo.notes,
      recurrence: todo.recurrence, dueDate: addDays(todo.dueDate, days),
    });
  }
  return NextResponse.json(todo);
});

export const DELETE = handle(async (_req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  return (await (await getStore()).remove(id)) ? new NextResponse(null, { status: 204 }) : notFound();
});
