import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Anchor id for a task row, shared by the index links and the rows. */
export function taskAnchorId(taskIndex: number): string {
  return `task-${String(taskIndex + 1).padStart(2, "0")}`;
}

/** Trailing tier/effort qualifiers that can be split off a model display name. */
const TIER_RE = /^(max|xhigh|high|medium|low|mini|ultra|thinking)$/i;

/**
 * Split a model display name into base name + tier qualifier, e.g.
 * "Gemini-3.5-Flash High" → { base: "Gemini-3.5-Flash", tier: "High" }.
 * Names without a recognized trailing qualifier keep tier undefined.
 */
export function splitModelName(name: string): { base: string; tier?: string } {
  const idx = name.lastIndexOf(" ");
  if (idx > 0) {
    const last = name.slice(idx + 1);
    if (TIER_RE.test(last)) return { base: name.slice(0, idx), tier: last };
  }
  return { base: name };
}
