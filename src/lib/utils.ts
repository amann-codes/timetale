import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getEndTime = ({ dateTime, duration }: { dateTime: string; duration: number }) => {
  return new Date(dateTime + duration * 60000)
}

/** End time when duration is in minutes. */
export function getEndTimeMinutes(date: Date, durationMinutes: number): Date {
  return new Date(date.getTime() + durationMinutes * 60000)
}

/** Start of day (00:00:00) in local time. */
export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** End of day (23:59:59.999) in local time. */
export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/** Minutes from midnight (00:00) in local time. */
export function minutesFromMidnight(date: Date): number {
  const d = new Date(date)
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 + d.getMilliseconds() / 60000
}

/** Format duration in minutes as "X hr Y min" or "X min". */
export function formatDuration(minutes: number): string {
  const m = Math.round(minutes)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (rem === 0) return `${h} hr`
  return `${h} hr ${rem} min`
}

export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0).toUpperCase();
  const second = parts[1]?.charAt(0).toUpperCase() ?? "";
  return first + second;
}

export function formatDateTime(dateTimeString: Date) {
  const date = new Date(dateTimeString);
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format like "EEE, MMM d · HH:mm" (e.g. "Mon, Mar 1 · 14:30") */
export function formatScheduleDateTime(dateTimeString: Date): string {
  const d = new Date(dateTimeString);
  const weekday = WEEKDAY[d.getUTCDay()];
  const month = MONTH[d.getUTCMonth()];
  const day = d.getUTCDate();
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${weekday}, ${month} ${day} · ${h}:${m}`;
}

export const getContrastTextColor = (bgColor: string) => {
  const color = bgColor.startsWith('#') ? bgColor.slice(1) : bgColor;

  const colorMap: Record<string, String> = {
    red: 'FF0000',
    blue: '0000FF',
    green: '00FF00',
  };
  const hex = colorMap[color.toLowerCase()] || color;

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 0.5 ? 'black' : 'white';
};