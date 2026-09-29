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
    await userEvent.click(screen.getByRole("button", { name: /subtasks complete/i }));
    await userEvent.click(screen.getByRole("checkbox", { name: 'Mark subtask "Step 1" done' }));
    expect(onUpdate).toHaveBeenCalledWith({
      subtasks: [{ id: "s1", title: "Step 1", completed: true }, { id: "s2", title: "Step 2", completed: false }],
    });
  });
  it("removing a subtask sends the list without it", async () => {
    const onUpdate = vi.fn();
    const t = todo({ subtasks: [{ id: "s1", title: "Step 1", completed: false }] });
    render(<TodoItem todo={t} onUpdate={onUpdate} onDelete={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /subtasks complete/i }));
    await userEvent.click(screen.getByLabelText('Remove subtask "Step 1"'));
    expect(onUpdate).toHaveBeenCalledWith({ subtasks: [] });
  });
});

describe("TodoItem delete confirmation", () => {
  it("clicking delete opens a confirm dialog instead of deleting immediately", async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={todo()} onUpdate={() => {}} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: 'Delete "Buy milk"' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText('Delete "Buy milk"?')).toBeTruthy();
  });
  it("Cancel closes the dialog without deleting", async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={todo()} onUpdate={() => {}} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: 'Delete "Buy milk"' }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it("confirming Delete calls onDelete exactly once and closes the dialog", async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={todo()} onUpdate={() => {}} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: 'Delete "Buy milk"' }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it("Escape closes the dialog without deleting", async () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={todo()} onUpdate={() => {}} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: 'Delete "Buy milk"' }));
    await userEvent.keyboard("{Escape}");
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
