/**
 * Style utilities - CSS/Tailwind helper functions
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with smart resolution of conflicting utilities
 * @param inputs - Array of class names or conditional values
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
