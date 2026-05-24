import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatNumber(value: number, unit?: string): string {
  if (!Number.isFinite(value)) return "";
  const formatted = new Intl.NumberFormat("ru-RU").format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}
