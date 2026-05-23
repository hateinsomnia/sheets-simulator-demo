import type { ColumnDef, RowData } from "@/engine/types";

export const bufetColumns: ColumnDef[] = [
  { key: "day", title: "День", type: "text", width: 140 },
  { key: "buns", title: "Пирожки", type: "number", width: 130, unit: "шт" },
  { key: "tea", title: "Чай", type: "number", width: 120, unit: "шт" },
  { key: "revenue", title: "Выручка", type: "number", width: 150, unit: "сом" },
];

export const bufetRows: RowData[] = [
  { id: "mon", values: { day: "Понедельник", buns: 92, tea: 60, revenue: 5240 } },
  { id: "tue", values: { day: "Вторник", buns: 110, tea: 72, revenue: 6180 } },
  { id: "wed", values: { day: "Среда", buns: 320, tea: 75, revenue: 6320 } },
  { id: "thu", values: { day: "Четверг", buns: 124, tea: 80, revenue: 6940 } },
  { id: "fri", values: { day: "Пятница", buns: 138, tea: 88, revenue: 7480 } },
  { id: "sat", values: { day: "Суббота", buns: 80, tea: 50, revenue: 4520 } },
];
