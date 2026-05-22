// Spreadsheet engine — типы данных.
// Сделано отдельно от UI, чтобы движок можно было тестировать и расширять
// (новые задания, новые виды проверок, новые трансформации) без правок UI.

export type CellValue = string | number | null;

export type ColumnType = "text" | "number";

export interface ColumnDef {
  /** Стабильный ключ колонки. Не зависит от текущего порядка/индекса. */
  key: string;
  /** Заголовок, который видит ребёнок (например, "Товар"). */
  title: string;
  /** Тип данных — влияет на сортировку, форматирование и фильтр. */
  type: ColumnType;
  /** Ширина колонки в пикселях. Может изменяться через drag. */
  width: number;
  /** Подсказка/единица измерения, например "сом" или "шт". */
  unit?: string;
}

export interface RowData {
  /** Стабильный id строки (не зависит от сортировки/фильтра). */
  id: string;
  /** Значения по ключу колонки. */
  values: Record<string, CellValue>;
}

/** Адрес ячейки в "логической" модели — по id строки и key колонки. */
export interface CellAddress {
  rowId: string;
  colKey: string;
}

/** Прямоугольное выделение в видимом порядке (по индексам) — для UX. */
export interface RangeSelection {
  anchorRow: number;
  anchorCol: number;
  focusRow: number;
  focusCol: number;
}

export type SelectionKind =
  | { type: "none" }
  | { type: "cell"; row: number; col: number }
  | { type: "range"; range: RangeSelection }
  | { type: "row"; row: number }
  | { type: "column"; col: number };

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  colKey: string | null;
  direction: SortDirection;
}

export type FilterPredicate =
  | { kind: "equals"; value: string | number }
  | { kind: "gte"; value: number }
  | { kind: "lte"; value: number }
  | { kind: "contains"; value: string };

export interface FilterState {
  colKey: string | null;
  predicate: FilterPredicate | null;
}

/** Цветовая пометка ячейки (используется в заданиях с подсветкой). */
export type CellHighlight = "yellow" | "green" | "red" | "blue" | null;

export interface SpreadsheetState {
  columns: ColumnDef[];
  rows: RowData[];
  /** Изначальные строки, чтобы корректно сбрасывать сортировку/фильтры/правки. */
  initialRows: RowData[];
  selection: SelectionKind;
  sort: SortState;
  filter: FilterState;
  /** Подсветки ячеек (rowId|colKey -> цвет). */
  highlights: Record<string, CellHighlight>;
  /** Адрес ячейки, которая сейчас редактируется. null — никто не редактирует. */
  editing: CellAddress | null;
  /** "Замороженные" колонки — недоступны для правок (например, "День"). */
  lockedColumns: string[];
}
