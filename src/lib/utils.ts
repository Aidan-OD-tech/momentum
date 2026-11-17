import { clsx, type ClassValue } from "clsx";

// Joins class names, skipping falsy values.
// No tailwind-merge: it would mistake our custom text-* type styles for colors and drop one of them.
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
