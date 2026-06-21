import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("en-US", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function scoreLabel(score: number) {
  if (score >= 85) return { label: "Excellent", color: "text-primary-600" };
  if (score >= 70) return { label: "Good", color: "text-primary-600" };
  if (score >= 50) return { label: "Fair", color: "text-warning" };
  return { label: "Needs Attention", color: "text-danger" };
}
