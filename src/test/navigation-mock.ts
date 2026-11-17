import { vi } from "vitest";

// Stands in for next/navigation in screen tests, recording router calls. Use with:
//   vi.mock("next/navigation", () => import("@/test/navigation-mock"));
export const router = { push: vi.fn(), replace: vi.fn() };

export function useRouter() {
  return router;
}

export function notFound(): never {
  throw new Error("notFound");
}
