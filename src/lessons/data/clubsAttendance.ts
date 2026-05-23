import type { ColumnDef, RowData } from "@/engine/types";

export const clubsColumns: ColumnDef[] = [
  { key: "club", title: "Кружок", type: "text", width: 170 },
  { key: "mon", title: "Пн", type: "number", width: 90, unit: "чел" },
  { key: "tue", title: "Вт", type: "number", width: 90, unit: "чел" },
  { key: "wed", title: "Ср", type: "number", width: 90, unit: "чел" },
  { key: "thu", title: "Чт", type: "number", width: 90, unit: "чел" },
  { key: "fri", title: "Пт", type: "number", width: 90, unit: "чел" },
];

export const clubsRows: RowData[] = [
  { id: "robotics", values: { club: "Робототехника", mon: 22, tue: 8, wed: 24, thu: 9, fri: 21 } },
  { id: "chess", values: { club: "Шахматы", mon: 7, tue: 18, wed: 6, thu: 20, fri: 8 } },
  { id: "art", values: { club: "Рисование", mon: 12, tue: 14, wed: 11, thu: 13, fri: 12 } },
  { id: "music", values: { club: "Музыка", mon: 9, tue: 10, wed: 8, thu: 11, fri: 9 } },
];
