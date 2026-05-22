import type { ColumnDef, RowData } from "@/engine/types";

// Школьная библиотека: книги, автор, жанр, сколько раз брали.
// Используется в задании 5 ("Фильтр + вывод"): отфильтровать только "Фантастика".

export const libraryColumns: ColumnDef[] = [
  { key: "title", title: "Название", type: "text", width: 220 },
  { key: "author", title: "Автор", type: "text", width: 180 },
  { key: "genre", title: "Жанр", type: "text", width: 150 },
  { key: "borrowed", title: "Раз брали", type: "number", width: 130, unit: "раз" },
];

export const libraryRows: RowData[] = [
  { id: "b1", values: { title: "Тайна старого дома", author: "А. Иванова", genre: "Фантастика", borrowed: 12 } },
  { id: "b2", values: { title: "Приключения у моря", author: "С. Петров", genre: "Приключения", borrowed: 9 } },
  { id: "b3", values: { title: "Звёздный путь", author: "Н. Айтматов", genre: "Фантастика", borrowed: 18 } },
  { id: "b4", values: { title: "Маленький астроном", author: "Е. Орлова", genre: "Наука", borrowed: 7 } },
  { id: "b5", values: { title: "Робот и мальчик", author: "К. Бектуров", genre: "Фантастика", borrowed: 21 } },
  { id: "b6", values: { title: "Тропа в горах", author: "Д. Касымов", genre: "Приключения", borrowed: 6 } },
  { id: "b7", values: { title: "Как устроен мир", author: "М. Ким", genre: "Наука", borrowed: 14 } },
  { id: "b8", values: { title: "Космический дневник", author: "Р. Сатарова", genre: "Фантастика", borrowed: 10 } },
];
