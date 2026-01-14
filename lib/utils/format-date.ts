import { format, parseISO, isValid } from "date-fns";

/**
 * Date formatting utilities for consistent human-readable dates.
 * Use these functions throughout the frontend for date display.
 */

/**
 * Check if a string looks like an ISO date string.
 * Matches patterns like: "2026-01-11T00:00:00.000000Z" or "2026-01-11"
 */
export function isIsoDateString(value: unknown): boolean {
  if (typeof value !== "string") return false;
  
  // Match ISO 8601 date patterns
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  return isoPattern.test(value);
}

/**
 * Format a date to human-readable format (date only).
 * Example: "Jan 11, 2026"
 *
 * @param date - Date object, ISO string, or null
 * @returns Formatted date string or null
 */
export function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return null;
    return format(dateObj, "MMM d, yyyy");
  } catch {
    return null;
  }
}

/**
 * Format a date to human-readable format (date and time).
 * Example: "Jan 11, 2026, 3:23 PM"
 *
 * @param date - Date object, ISO string, or null
 * @returns Formatted datetime string or null
 */
export function formatDateTime(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return null;
    return format(dateObj, "MMM d, yyyy, h:mm a");
  } catch {
    return null;
  }
}

/**
 * Format a value that might be a date to human-readable format.
 * Automatically detects ISO date strings and formats them.
 * Non-date values are returned as-is.
 *
 * @param value - Any value that might be a date
 * @returns Formatted date string or original value as string
 */
export function formatDateValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  
  // Check if it's an ISO date string
  if (isIsoDateString(value)) {
    const formatted = formatDateTime(value as string);
    if (formatted) return formatted;
  }
  
  // Check if it's a Date object
  if (value instanceof Date) {
    return formatDateTime(value) || "-";
  }
  
  // For booleans
  if (typeof value === "boolean") return value ? "true" : "false";
  
  // For objects/arrays
  if (typeof value === "object") return JSON.stringify(value);
  
  // For everything else
  return String(value);
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Already available via date-fns formatDistanceToNow
 */
export { formatDistanceToNow } from "date-fns";
