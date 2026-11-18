import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type SaveStatus, TopBar } from "@/components/TopBar";

const renderBar = (saveStatus: SaveStatus) => render(<TopBar mode="session" context="PSYC 3024" saveStatus={saveStatus} />);

describe("TopBar save status", () => {
  it("keeps one empty status region mounted while hidden, so later text is announced", () => {
    renderBar("hidden");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("changes only the text of the same region, from hidden to saved to failed and back", () => {
    const { rerender } = renderBar("hidden");
    const region = screen.getByRole("status");
    rerender(<TopBar mode="session" context="PSYC 3024" saveStatus="saved" />);
    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveTextContent("Saved in this browser");
    rerender(<TopBar mode="session" context="PSYC 3024" saveStatus="failed" />);
    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveTextContent("Couldn’t save in this browser");
    rerender(<TopBar mode="session" context="PSYC 3024" saveStatus="saved" />);
    expect(region).toHaveTextContent("Saved in this browser");
  });

  it("gives the failed state its own icon and Ink text, so it differs by more than wording", () => {
    const { rerender } = renderBar("saved");
    const savedIcon = screen.getByRole("status").querySelector("svg")!.innerHTML;
    rerender(<TopBar mode="session" context="PSYC 3024" saveStatus="failed" />);
    const region = screen.getByRole("status");
    const failedIcon = region.querySelector("svg");
    expect(failedIcon).not.toBeNull();
    expect(failedIcon!.innerHTML).not.toBe(savedIcon);
    expect(failedIcon).toHaveAttribute("aria-hidden", "true");
    expect(region).toHaveClass("text-text-primary");
    expect(region).not.toHaveClass("text-text-tertiary");
  });

  it("keeps the status on one line", () => {
    renderBar("failed");
    expect(screen.getByRole("status")).toHaveClass("whitespace-nowrap");
  });
});
