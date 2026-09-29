// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoItem } from "@/components/TodoItem";
import type { Todo } from "@/lib/types";

afterEach(cleanup);
const todo = (over: Partial<Todo> = {}): Todo => ({
  id: "1", title: "Buy milk", notes: "", completed: false, priority: "medium", dueDate: null,
  category: "Personal", subtasks: [], recurrence: "none", order: 0, createdAt: "", ...over,
});

describe("TodoItem editing", () => {
  it("saving an edit sends only title/notes and never marks the task done", async () => {
    const onUpdate = vi.fn();
    render(<TodoItem todo={todo()} onUpdate={onUpdate} onDelete={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: 'Edit "Buy milk"' }));
    const title = screen.getByLabelText("Edit title");
    await userEvent.clear(title);
    await userEvent.type(title, "Buy oat milk");
    await userEvent.type(screen.getByLabelText("Edit notes"), "2 litres");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith({ title: "Buy oat milk", notes: "2 litres" });
    expect((screen.getByRole("checkbox", { name: /Mark "Buy milk" as done/ }) as HTMLInputElement).checked).toBe(false);
  });
  it("only the checkbox toggles completion", async () => {
    const onUpdate = vi.fn();
    render(<TodoItem todo={todo()} onUpdate={onUpdate} onDelete={() => {}} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /Mark "Buy milk" as done/ }));
    expect(onUpdate).toHaveBeenCalledWith({ completed: true });
  });
});

describe("TodoItem subtasks", () => {
  it("adding a subtask sends the full list with the new one appended", async () => {
    const onUpdate = vi.fn();
    render(<TodoItem todo={todo()} onUpdate={onUpdate} onDelete={() => {}} />);
    await userEvent.type(screen.getByLabelText("New subtask"), "Get the cart");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [{ subtasks }] = onUpdate.mock.calls[0];
    expect(subtasks).toHaveLength(1);
    expect(subtasks[0]).toMatchObject({ title: "Get the cart", completed: false });
  });
  it("toggling a subtask flips only that one, and editing the task doesn't affect subtasks", async () => {
    const onUpdate = vi.fn();
    const t = todo({ subtasks: [{ id: "s1", title: "Step 1", completed: false }, { id: "s2", title: "Step 2", completed: false }] });
    render(<TodoItem todo={t} onUpdate={onUpdate} onDelete={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /☑/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: 'Mark subtask "Step 1" done' }));
    expect(onUpdate).toHaveBeenCalledWith({
      subtasks: [{ id: "s1", title: "Step 1", completed: true }, { id: "s2", title: "Step 2", completed: false }],
    });
  });
  it("removing a subtask sends the list without it", async () => {
    const onUpdate = vi.fn();
    const t = todo({ subtasks: [{ id: "s1", title: "Step 1", completed: false }] });
    render(<TodoItem todo={t} onUpdate={onUpdate} onDelete={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /☑/ }));
    await userEvent.click(screen.getByLabelText('Remove subtask "Step 1"'));
    expect(onUpdate).toHaveBeenCalledWith({ subtasks: [] });
  });
});
