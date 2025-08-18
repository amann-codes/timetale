import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getEndTime = ({ dateTime, duration }: { dateTime: string, duration: number }) => {
  return new Date(dateTime + duration * 60000)
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