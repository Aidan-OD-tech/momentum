import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Contrast checks on the token values themselves (WCAG 2.2 relative luminance).

const css = readFileSync(path.join(import.meta.dirname, "app", "tokens.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`No hex value for --${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("token contrast", () => {
  it("text field borders reach 3:1 on white and on the page surface (WCAG 1.4.11)", () => {
    expect(contrast(token("border-input"), "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(contrast(token("border-input"), token("surface-page"))).toBeGreaterThanOrEqual(3);
  });

  it("a focused field's border stands out from its resting border", () => {
    expect(contrast(token("border-strong"), token("border-input"))).toBeGreaterThanOrEqual(3);
  });
});
