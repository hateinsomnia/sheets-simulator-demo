import clsx, { type ClassValue } from "clsx";

/**
 * Хелпер для условных классов Tailwind.
 * (Без tailwind-merge: проект небольшой, лишние зависимости не нужны.)
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatNumber(value: number, unit?: string): string {
  const formatted = new Intl.NumberFormat("ru-RU").format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}
