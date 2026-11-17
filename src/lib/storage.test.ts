import { describe, expect, it } from "vitest";
import { load, save, STORAGE_KEY, UNREADABLE_KEY } from "@/lib/storage";
import { makeData, memoryStorage } from "@/test/fixtures";

describe("storage", () => {
  it("returns no data, ok, when nothing is stored", () => {
    expect(load(memoryStorage())).toEqual({ data: null, ok: true });
  });

  it("saves and loads the same data", () => {
    const storage = memoryStorage();
    const data = makeData();
    expect(save(data, storage)).toBe(true);
    expect(load(storage)).toEqual({ data, ok: true });
  });

  it("save returns false when setItem throws", () => {
    expect(save(makeData(), memoryStorage({}, { failSet: true }))).toBe(false);
  });

  it("is not ok when there is no storage or reading throws", () => {
    expect(load(null).ok).toBe(false);
    const throwing = { ...memoryStorage(), getItem: () => { throw new Error("blocked"); } } as Storage;
    expect(load(throwing).ok).toBe(false);
  });

  it.each([
    ["broken JSON", "{not json"],
    ["an unknown version", JSON.stringify({ version: 2, assignments: [] })],
  ])("backs up %s instead of overwriting it", (_, raw) => {
    const storage = memoryStorage({ [STORAGE_KEY]: raw });
    expect(load(storage)).toEqual({ data: null, ok: true });
    expect(storage.getItem(UNREADABLE_KEY)).toBe(raw);
  });

  it("refuses to write at all when the backup fails", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "{not json" }, { failSet: true });
    expect(load(storage).ok).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe("{not json");
  });
});
