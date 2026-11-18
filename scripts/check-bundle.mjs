// Run after `npm run build`: fails if anything that belongs on the server reached the browser files.
// Usage: npm run check:bundle
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const STATIC_DIR = path.join(process.cwd(), ".next", "static");
// A plain "sk-" also matches React's own "mask-type" attribute name, so the key check looks for the shape
// of an OpenAI key: "sk-" followed by at least 20 key characters.
const FORBIDDEN = [
  { label: "OPENAI_API_KEY", pattern: /OPENAI_API_KEY/ },
  { label: "an sk- key", pattern: /sk-[A-Za-z0-9_-]{20,}/ },
  { label: "api.openai.com", pattern: /api\.openai\.com/ },
];

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? filesIn(full) : [full];
  });
}

let files;
try {
  files = filesIn(STATIC_DIR);
} catch {
  console.error(`No ${STATIC_DIR}. Run npm run build first.`);
  process.exit(1);
}

const hits = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const { label, pattern } of FORBIDDEN) {
    // Says which rule matched, never the matched text.
    if (pattern.test(text)) hits.push(`${path.relative(process.cwd(), file)}: contains ${label}`);
  }
}

if (hits.length > 0) {
  console.error(`Bundle check failed:\n${hits.join("\n")}`);
  process.exit(1);
}
console.log(`Bundle check passed: ${files.length} files in .next/static, none contain ${FORBIDDEN.map((f) => f.label).join(", ")}.`);
