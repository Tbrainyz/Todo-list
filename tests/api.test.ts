import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { setStore } from "@/lib/db";
import { MemoryTodoStore } from "@/lib/store";
import { GET as health } from "@/app/api/health/route";
import { GET as list, POST as create } from "@/app/api/todos/route";
import { PATCH as patch, DELETE as del } from "@/app/api/todos/[id]/route";
import { DELETE as clearDone } from "@/app/api/todos/completed/route";

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
    const res = await list();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
  it("returns created todos in order", async () => {
    await add({ title: "A" }); await add({ title: "B" });
    expect((await (await list()).json()).map((t: any) => t.title)).toEqual(["A", "B"]);
  });
});

describe("POST /api/todos", () => {
  it("creates with defaults and trims the title", async () => {
    const res = await create(req("POST", { title: "  Buy milk  " }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ title: "Buy milk", completed: false, priority: "medium", category: "Personal", notes: "", dueDate: null });
  });
  it("creates with priority, category and due date", async () => {
    const t = await add({ title: "Ship", priority: "high", category: "Work", dueDate: "2026-12-31" });
    expect(t).toMatchObject({ priority: "high", category: "Work", dueDate: "2026-12-31" });
  });
  it.each([[""], ["   "], [123], [null], [undefined], ["x".repeat(201)]])("rejects invalid title %s", async (title) => {
    const res = await create(req("POST", { title }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });
  it("accepts a 200 character title", async () => {
    expect((await create(req("POST", { title: "x".repeat(200) }))).status).toBe(201);
  });
  it.each([
    [{ priority: "urgent" }], [{ category: "" }], [{ category: "c".repeat(31) }],
    [{ dueDate: "tomorrow" }], [{ dueDate: "2026-02-31" }], [{ dueDate: 5 }],
  ])("rejects invalid optional field %o", async (extra) => {
    expect((await create(req("POST", { title: "x", ...extra }))).status).toBe(400);
  });
  it("rejects a missing or malformed body", async () => {
    expect((await create(req("POST"))).status).toBe(400);
    expect((await create(req("POST", undefined, "{not json"))).status).toBe(400);
  });
});

describe("PATCH /api/todos/:id", () => {
  it("toggles completed and persists it", async () => {
    const { id } = await add();
    const res = await patch(req("PATCH", { completed: true }), ctx(id));
    expect(res.status).toBe(200);
    expect((await res.json()).completed).toBe(true);
    expect((await (await list()).json())[0].completed).toBe(true);
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
    for (const b of [{ completed: "yes" }, { title: "  " }, { priority: "x" }, { dueDate: "nope" }, {}]) {
      expect((await patch(req("PATCH", b), ctx(id))).status).toBe(400);
    }
    expect((await patch(req("PATCH", undefined, "{bad"), ctx(id))).status).toBe(400);
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
    const res = await clearDone();
    expect(await res.json()).toEqual({ deleted: 2 });
    expect((await (await list()).json()).map((t: any) => t.title)).toEqual(["B"]);
  });
  it("returns 0 when nothing is completed", async () => {
    expect(await (await clearDone()).json()).toEqual({ deleted: 0 });
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

describe("notes", () => {
  it("creates a todo with trimmed notes", async () => {
    expect(await add({ title: "A", notes: "  call before 5pm  " })).toMatchObject({ notes: "call before 5pm" });
  });
  it("accepts 500 characters and rejects 501 or non-strings", async () => {
    expect((await create(req("POST", { title: "A", notes: "n".repeat(500) }))).status).toBe(201);
    expect((await create(req("POST", { title: "A", notes: "n".repeat(501) }))).status).toBe(400);
    expect((await create(req("POST", { title: "A", notes: 5 }))).status).toBe(400);
  });
  it("edits and clears notes via PATCH, and rejects invalid notes", async () => {
    const { id } = await add({ title: "A", notes: "old" });
    expect((await (await patch(req("PATCH", { notes: "new" }), ctx(id))).json()).notes).toBe("new");
    expect((await (await patch(req("PATCH", { notes: "" }), ctx(id))).json()).notes).toBe("");
    expect((await patch(req("PATCH", { notes: "n".repeat(501) }), ctx(id))).status).toBe(400);
    expect((await patch(req("PATCH", { notes: null }), ctx(id))).status).toBe(400);
  });
});
