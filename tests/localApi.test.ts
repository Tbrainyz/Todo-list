// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "@/lib/api";

beforeEach(() => localStorage.clear());

describe("browser-storage api (lib/api.ts -> lib/localApi.ts)", () => {
  it("starts empty and lists nothing", async () => {
    expect(await api.list()).toEqual([]);
  });

  it("creates a todo with defaults, trims the title, and persists to localStorage", async () => {
    const t = await api.create({ title: "  Buy milk  " });
    expect(t).toMatchObject({ title: "Buy milk", completed: false, priority: "medium", category: "Personal", recurrence: "none", subtasks: [] });
    expect(t.id).toBeTruthy();
    const raw = JSON.parse(localStorage.getItem("todos:v1")!);
    expect(raw).toHaveLength(1);
    expect(raw[0].id).toBe(t.id);
  });

  it("rejects an invalid title and does not write anything", async () => {
    await expect(api.create({ title: "" })).rejects.toThrow(/title/i);
    expect(await api.list()).toEqual([]);
  });

  it("two independent calls never share data beyond what's in localStorage (simulating two browsers)", async () => {
    await api.create({ title: "A" });
    const savedRaw = localStorage.getItem("todos:v1");
    localStorage.clear(); // simulate a second, unrelated browser/device
    expect(await api.list()).toEqual([]);
    localStorage.setItem("todos:v1", savedRaw!); // back to the "first browser"
    expect((await api.list())[0].title).toBe("A");
  });

  it("updates a todo without changing completion, and rejects invalid patches", async () => {
    const t = await api.create({ title: "A" });
    const updated = await api.update(t.id, { title: "B" });
    expect(updated).toMatchObject({ title: "B", completed: false });
    await expect(api.update(t.id, { title: "" })).rejects.toThrow(/title/i);
    await expect(api.update("nope", { completed: true })).rejects.toThrow(/not found/i);
  });

  it("completing a daily recurring task creates the next occurrence one day later", async () => {
    const t = await api.create({ title: "Water plants", recurrence: "daily", dueDate: "2026-01-01" });
    await api.update(t.id, { completed: true });
    const all = await api.list();
    expect(all).toHaveLength(2);
    const next = all.find((x) => x.id !== t.id)!;
    expect(next).toMatchObject({ title: "Water plants", recurrence: "daily", dueDate: "2026-01-02", completed: false });
  });

  it("removes a todo and rejects removing an unknown id", async () => {
    const t = await api.create({ title: "A" });
    await api.remove(t.id);
    expect(await api.list()).toEqual([]);
    await expect(api.remove(t.id)).rejects.toThrow(/not found/i);
  });

  it("clearCompleted removes only completed todos and reports the count", async () => {
    const a = await api.create({ title: "A" }); await api.create({ title: "B" });
    await api.update(a.id, { completed: true });
    expect(await api.clearCompleted()).toEqual({ deleted: 1 });
    expect((await api.list()).map((x) => x.title)).toEqual(["B"]);
  });

  it("reorder changes list order and rejects a non-array", async () => {
    const a = await api.create({ title: "A" }); const b = await api.create({ title: "B" });
    const reordered = await api.reorder([b.id, a.id]);
    expect(reordered.map((x) => x.title)).toEqual(["B", "A"]);
    expect((await api.list()).map((x) => x.title)).toEqual(["B", "A"]);
    await expect(api.reorder("x" as any)).rejects.toThrow();
  });
});
