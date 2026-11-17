import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Guards the hard constraints in CLAUDE.md: no hard-coded colors, no arbitrary Tailwind values,
// and only the spacing steps from the handoff. Looks at the app and component code, not at tokens.css.

const SPACING_STEPS = new Set(["0", "px", "1", "2", "3", "4", "6", "8", "12", "16"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    const isCode = /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) && name !== "tokens.css";
    return isCode ? [full] : [];
  });
}

const root = path.resolve(import.meta.dirname);
const files = [...sourceFiles(path.join(root, "app")), ...sourceFiles(path.join(root, "components"))];

describe("design rules", () => {
  it("finds files to check", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("has no hard-coded hex colors", () => {
    const offenders = files.filter((file) => /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("has no arbitrary Tailwind values like p-[13px] or text-[#111]", () => {
    // A utility name, a dash, then a bracket. Variants like data-[state=open]: are caught too, on purpose.
    const pattern = /[a-z]-\[[^\]]+\]/;
    const offenders = files.filter((file) => pattern.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("uses only the spacing steps 0, 1, 2, 3, 4, 6, 8, 12, 16 (and px)", () => {
    const pattern = /\b(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|size|w|h|min-w|min-h|max-w|max-h)-(\d+(?:\.\d+)?|px)\b/g;
    const offenders: string[] = [];
    for (const file of files) {
      for (const match of readFileSync(file, "utf8").matchAll(pattern)) {
        if (!SPACING_STEPS.has(match[1])) offenders.push(`${path.relative(root, file)}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
