import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { setStore } from "@/lib/db";
import { MemoryTodoStore } from "@/lib/store";
import { GET as health } from "@/app/api/health/route";
import { GET as list, POST as create } from "@/app/api/todos/route";
import { PATCH as patch, DELETE as del } from "@/app/api/todos/[id]/route";
import { DELETE as clearDone } from "@/app/api/todos/completed/route";
import { PATCH as reorder } from "@/app/api/todos/reorder/route";

const req = (method: string, body?: unknown, raw?: string) =>
  new NextRequest("http://localhost/api/todos", { method, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const add = async (body: object = { title: "Buy milk" }) => (await create(req("POST", body))).json();

beforeEach(() => setStore(new MemoryTodoStore()));

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await health();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("GET /api/todos", () => {
  it("returns an empty list initially", async () => {
    expect(await (await list()).json()).toEqual([]);
  });
  it("returns created todos in creation order", async () => {
    await add({ title: "A" }); await add({ title: "B" });
    expect((await (await list()).json()).map((t: any) => t.title)).toEqual(["A", "B"]);
  });
});

describe("POST /api/todos", () => {
  it("creates with defaults and trims the title", async () => {
    const res = await create(req("POST", { title: "  Buy milk  " }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      title: "Buy milk", completed: false, priority: "medium", category: "Personal",
      dueDate: null, notes: "", subtasks: [], recurrence: "none",
    });
  });
  it("creates with priority, category, due date, notes and recurrence", async () => {
    const t = await add({ title: "Ship", priority: "high", category: "Work", dueDate: "2026-12-31", notes: "n", recurrence: "weekly" });
    expect(t).toMatchObject({ priority: "high", category: "Work", dueDate: "2026-12-31", notes: "n", recurrence: "weekly" });
  });
  it.each([[""], ["   "], [123], [null], [undefined], ["x".repeat(201)]])("rejects invalid title %s", async (title) => {
    const res = await create(req("POST", { title }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });
  it.each([
    [{ priority: "urgent" }], [{ category: "" }], [{ category: "c".repeat(31) }],
    [{ dueDate: "tomorrow" }], [{ dueDate: "2026-02-31" }], [{ dueDate: 5 }],
    [{ notes: "n".repeat(501) }], [{ notes: 5 }], [{ recurrence: "monthly" }],
  ])("rejects invalid optional field %o", async (extra) => {
    expect((await create(req("POST", { title: "x", ...extra }))).status).toBe(400);
  });
  it("rejects a missing or malformed body", async () => {
    expect((await create(req("POST"))).status).toBe(400);
    expect((await create(req("POST", undefined, "{not json"))).status).toBe(400);
  });
});

describe("PATCH /api/todos/:id", () => {
  it("toggles completed and persists it, without changing on a title/notes edit", async () => {
    const { id } = await add();
    const res = await patch(req("PATCH", { completed: true }), ctx(id));
    expect((await res.json()).completed).toBe(true);
    const edited = await (await patch(req("PATCH", { title: "Renamed", notes: "n" }), ctx(id))).json();
    expect(edited.completed).toBe(true);
  });
  it("edits title, priority, category and due date; clears due date with null", async () => {
    const { id } = await add({ title: "A", dueDate: "2026-10-01" });
    const res = await patch(req("PATCH", { title: " B ", priority: "low", category: "Home", dueDate: null }), ctx(id));
    expect(await res.json()).toMatchObject({ title: "B", priority: "low", category: "Home", dueDate: null });
  });
  it("404 for an unknown id", async () => {
    expect((await patch(req("PATCH", { completed: true }), ctx("nope"))).status).toBe(404);
  });
  it("400 for wrong types, empty patch and malformed body", async () => {
    const { id } = await add();
    for (const b of [{ completed: "yes" }, { title: "  " }, { priority: "x" }, { dueDate: "nope" }, { notes: 5 }, { recurrence: "x" }, { subtasks: "x" }, {}]) {
      expect((await patch(req("PATCH", b), ctx(id))).status).toBe(400);
    }
    expect((await patch(req("PATCH", undefined, "{bad"), ctx(id))).status).toBe(400);
  });
});

describe("subtasks", () => {
  it("sets subtasks via PATCH, assigning ids and defaulting completed to false", async () => {
    const { id } = await add();
    const res = await patch(req("PATCH", { subtasks: [{ title: "Step 1" }, { title: "Step 2", completed: true }] }), ctx(id));
    const t = await res.json();
    expect(t.subtasks).toHaveLength(2);
    expect(t.subtasks[0]).toMatchObject({ title: "Step 1", completed: false });
    expect(t.subtasks[0].id).toBeTruthy();
    expect(t.subtasks[1].completed).toBe(true);
  });
  it("rejects subtasks that are not an array, have an empty title, or exceed 50 items", async () => {
    const { id } = await add();
    expect((await patch(req("PATCH", { subtasks: "x" }), ctx(id))).status).toBe(400);
    expect((await patch(req("PATCH", { subtasks: [{ title: "" }] }), ctx(id))).status).toBe(400);
    expect((await patch(req("PATCH", { subtasks: Array.from({ length: 51 }, (_, i) => ({ title: `s${i}` })) }), ctx(id))).status).toBe(400);
  });
});

describe("recurrence", () => {
  it("requires no due date to create a recurring task, and toggling it needs no due date either", async () => {
    expect((await create(req("POST", { title: "x", recurrence: "daily" }))).status).toBe(201);
  });
  it("completing a daily recurring task creates the next one, 1 day later", async () => {
    const { id } = await add({ title: "Water plants", recurrence: "daily", dueDate: "2026-01-01" });
    await patch(req("PATCH", { completed: true }), ctx(id));
    const all = await (await list()).json();
    expect(all).toHaveLength(2);
    const next = all.find((t: any) => t.id !== id);
    expect(next).toMatchObject({ title: "Water plants", recurrence: "daily", dueDate: "2026-01-02", completed: false });
  });
  it("completing a weekly recurring task creates the next one, 7 days later", async () => {
    const { id } = await add({ title: "Team sync", recurrence: "weekly", dueDate: "2026-01-01" });
    await patch(req("PATCH", { completed: true }), ctx(id));
    const next = (await (await list()).json()).find((t: any) => t.id !== id);
    expect(next.dueDate).toBe("2026-01-08");
  });
  it("does not spawn a next occurrence for a non-recurring task, or one with no due date", async () => {
    const a = await add({ title: "One-off" });
    await patch(req("PATCH", { completed: true }), ctx(a.id));
    expect(await (await list()).json()).toHaveLength(1);

    const b = await add({ title: "Repeats but no date", recurrence: "daily" });
    await patch(req("PATCH", { completed: true }), ctx(b.id));
    expect(await (await list()).json()).toHaveLength(2);
  });
  it("does not spawn again when re-saving an already-completed recurring task", async () => {
    const { id } = await add({ title: "Daily", recurrence: "daily", dueDate: "2026-01-01" });
    await patch(req("PATCH", { completed: true }), ctx(id));
    await patch(req("PATCH", { title: "Daily (renamed)" }), ctx(id));
    expect(await (await list()).json()).toHaveLength(2);
  });
});

describe("DELETE /api/todos/:id", () => {
  it("deletes a todo", async () => {
    const { id } = await add();
    expect((await del(req("DELETE"), ctx(id))).status).toBe(204);
    expect(await (await list()).json()).toEqual([]);
  });
  it("404 for an unknown id and on a second delete", async () => {
    expect((await del(req("DELETE"), ctx("nope"))).status).toBe(404);
    const { id } = await add();
    await del(req("DELETE"), ctx(id));
    expect((await del(req("DELETE"), ctx(id))).status).toBe(404);
  });
});

describe("DELETE /api/todos/completed", () => {
  it("removes only completed todos and reports the count", async () => {
    const a = await add({ title: "A" }); await add({ title: "B" }); const c = await add({ title: "C" });
    await patch(req("PATCH", { completed: true }), ctx(a.id));
    await patch(req("PATCH", { completed: true }), ctx(c.id));
    expect(await (await clearDone()).json()).toEqual({ deleted: 2 });
    expect((await (await list()).json()).map((t: any) => t.title)).toEqual(["B"]);
  });
  it("returns 0 when nothing is completed", async () => {
    expect(await (await clearDone()).json()).toEqual({ deleted: 0 });
  });
});

describe("PATCH /api/todos/reorder", () => {
  const reorderReq = (order: unknown) => new NextRequest("http://localhost/api/todos/reorder", { method: "PATCH", body: JSON.stringify({ order }) });

  it("reorders todos to match the given id order", async () => {
    const a = await add({ title: "A" }); const b = await add({ title: "B" }); const c = await add({ title: "C" });
    const res = await reorder(reorderReq([c.id, a.id, b.id]));
    expect(res.status).toBe(200);
    expect((await res.json()).map((t: any) => t.title)).toEqual(["C", "A", "B"]);
    expect((await (await list()).json()).map((t: any) => t.title)).toEqual(["C", "A", "B"]);
  });
  it("rejects a non-array or non-string-id order", async () => {
    expect((await reorder(reorderReq("x"))).status).toBe(400);
    expect((await reorder(reorderReq([1, 2]))).status).toBe(400);
  });
  it("ignores unknown ids without failing", async () => {
    const { id } = await add();
    expect((await reorder(reorderReq(["nope", id]))).status).toBe(200);
  });
});

describe("error handling", () => {
  it("returns a JSON 500 when the store throws", async () => {
    setStore({ list: async () => { throw new Error("db down"); } } as any);
    const res = await list();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal server error" });
  });
});
