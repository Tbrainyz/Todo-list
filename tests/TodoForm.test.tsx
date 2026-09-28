// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoForm } from "@/components/TodoForm";

afterEach(cleanup);
const setup = () => { const onAdd = vi.fn(); render(<TodoForm onAdd={onAdd} categories={[]} />); return onAdd; };
const addBtn = () => screen.getByRole("button", { name: "Add task" }) as HTMLButtonElement;

describe("TodoForm", () => {
  it("Add task is clickable and submits title, note, priority and category", async () => {
    const onAdd = setup();
    expect(addBtn().disabled).toBe(false);
    await userEvent.type(screen.getByLabelText("Task title"), "Buy milk");
    await userEvent.type(screen.getByLabelText("Task notes"), "2 litres");
    await userEvent.click(screen.getByRole("button", { name: "high" }));
    await userEvent.click(addBtn());
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ title: "Buy milk", notes: "2 litres", priority: "high", category: "Personal" }));
    expect((screen.getByLabelText("Task title") as HTMLInputElement).value).toBe("");
  });
  it("shows a hint instead of doing nothing when the title is empty", async () => {
    const onAdd = setup();
    await userEvent.click(addBtn());
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toMatch(/title/i);
  });
  it("supports a new custom category", async () => {
    const onAdd = setup();
    await userEvent.selectOptions(screen.getByRole("combobox"), "__new__");
    await userEvent.type(screen.getByLabelText("New category name"), "Side project");
    await userEvent.type(screen.getByLabelText("Task title"), "Ship it");
    await userEvent.click(addBtn());
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ title: "Ship it", category: "Side project" }));
  });
});
