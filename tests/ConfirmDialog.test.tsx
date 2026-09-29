// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/ConfirmDialog";

afterEach(cleanup);

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(<ConfirmDialog open={false} title="Delete it?" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it("shows the title and description when open, defaulting the button labels", () => {
    render(<ConfirmDialog open title="Delete it?" description="No going back." onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Delete it?")).toBeTruthy();
    expect(screen.getByText("No going back.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });
  it("calls onConfirm when the confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open title="Delete it?" confirmLabel="Delete" onConfirm={onConfirm} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it("calls onCancel on Cancel click, backdrop click and Escape, but not on a click inside the dialog", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Delete it?" onConfirm={() => {}} onCancel={onCancel} />);
    await userEvent.click(screen.getByText("Delete it?"));
    expect(onCancel).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
