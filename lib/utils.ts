// ─── Utility helpers ───────────────────────────────────────────────────────

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse spintax: "Hello {friend|buddy}, your {startup|company} is great!"
 * Replaces each {a|b|c} with one random choice.
 */
export function parseSpintax(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (_match, group: string) => {
    const options = group.split("|");
    return options[Math.floor(Math.random() * options.length)];
  });
}

/**
 * Generate a simple random ID.
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Format a number as a percentage string.
 */
export function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format large numbers with K/M suffix.
 */
export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
