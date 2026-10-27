import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A study day rolls over at 4am, so late-night practice still belongs to the previous day
export const DAY_START_HOUR = 4;

export function getNextReviewDate(days: number): Date {
  const date = new Date();
  // Shift back to find which study day "now" falls in, e.g. 1am counts as yesterday
  date.setHours(date.getHours() - DAY_START_HOUR);
  date.setDate(date.getDate() + days);
  date.setHours(DAY_START_HOUR, 0, 0, 0);
  return date;
}
// The stored link when there is one, otherwise a guess from the slug or title
export function getLeetCodeUrl(
  title: string,
  url: string | null,
  slug: string | null,
): string {
  if (url) return url;
  const finalSlug = slug || title.toLowerCase().replace(/\s+/g, '-');
  return `https://leetcode.com/problems/${finalSlug}/`;
}
