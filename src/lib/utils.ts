import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getNextReviewDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  // set to 6am
  date.setHours(6, 0, 0, 0);
  return date;
}
/**
 * Marks a jump to LeetCode as a fresh attempt.
 *
 * The saved draft lives in LeetCode's own IndexedDB, which this origin cannot
 * touch. A userscript on the LeetCode side (served at /recode-fresh.user.js)
 * watches for this hash, deletes the problem's draft, and reloads clean, so a
 * review round starts from the official template instead of the old answer.
 */
export function withFreshStart(url: string): string {
  return /leetcode\.(com|cn)\/problems\//.test(url)
    ? url.replace(/#.*$/, "") + "#recode-fresh"
    : url;
}
