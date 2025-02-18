import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace('.0', '')}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace('.0', '')}K`
  }
  if (count < 1000) {
    return '<1K'
  }
  return String(count)
}
