import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PauseDialog } from "@/components/PauseDialog";

function setup(initialText = "") {
  const onDraftChange = vi.fn();
  const onFinish = vi.fn();
  render(<PauseDialog stepNumber={3} initialText={initialText} onDraftChange={onDraftChange} onFinish={onFinish} />);
  fireEvent.click(screen.getByRole("button", { name: "Pause for later" }));
  return { onDraftChange, onFinish };
}

describe("PauseDialog", () => {
  it("prefills the text it is given (draft or saved note)", () => {
    setup("Saved note");
    expect(screen.getByLabelText(/Note/)).toHaveValue("Saved note");
  });

  it.each(["Close", "Keep working"])("%s keeps the typed draft and doesn't finish", (button) => {
    const { onDraftChange, onFinish } = setup("Saved note");
    fireEvent.change(screen.getByLabelText(/Note/), { target: { value: "Typed but not saved" } });
    fireEvent.click(screen.getByRole("button", { name: button }));
    expect(onDraftChange).toHaveBeenLastCalledWith("Typed but not saved");
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("Escape keeps the draft too", () => {
    const { onDraftChange } = setup();
    fireEvent.change(screen.getByLabelText(/Note/), { target: { value: "draft" } });
    fireEvent.keyDown(screen.getByLabelText(/Note/), { key: "Escape" });
    expect(onDraftChange).toHaveBeenLastCalledWith("draft");
  });

  it("Finish for now passes the text and works with the field empty", () => {
    const { onFinish, onDraftChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Finish for now" }));
    expect(onFinish).toHaveBeenCalledWith("");
    expect(onDraftChange).not.toHaveBeenCalled();
  });
});
