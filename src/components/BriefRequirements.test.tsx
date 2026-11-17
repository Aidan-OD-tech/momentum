import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BriefRequirements } from "@/components/BriefRequirements";
import { sampleAssignment } from "@/data/sample-assignment";
import type { Requirement } from "@/lib/types";

describe("BriefRequirements", () => {
  it("starts collapsed with the short labels joined by a middle dot", () => {
    render(<BriefRequirements requirements={sampleAssignment.requirements} />);
    const toggle = screen.getByRole("button", { name: /From your brief/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("1,500 words · 5+ peer-reviewed sources · APA 7th")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("toggles aria-expanded and shows every requirement as a chip", async () => {
    const user = userEvent.setup();
    render(<BriefRequirements requirements={sampleAssignment.requirements} />);
    const toggle = screen.getByRole("button", { name: /From your brief/ });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const chips = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(chips).toEqual(sampleAssignment.requirements.map((requirement) => requirement.label));

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("puts substantive requirements first even if the data is out of order", async () => {
    const user = userEvent.setup();
    const shuffled: Requirement[] = [
      { id: "r5", kind: "submission", label: "Submit it" },
      { id: "r2", kind: "format", label: "Format thing" },
      { id: "r1", kind: "substantive", label: "Substantive thing" },
    ];
    render(<BriefRequirements requirements={shuffled} />);
    await user.click(screen.getByRole("button", { name: /From your brief/ }));
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Substantive thing",
      "Format thing",
      "Submit it",
    ]);
  });
});
