

export type CellValue = string | number | null;

export type ColumnType = "text" | "number";

export interface ColumnDef {
  
  key: string;
  
  title: string;
  
  type: ColumnType;
  
  width: number;
  
  unit?: string;
}

export interface RowData {
  
  id: string;
  
  values: Record<string, CellValue>;
}

export interface CellAddress {
  rowId: string;
  colKey: string;
}

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

export type CellHighlight = "yellow" | "green" | "red" | "blue" | null;

export interface SpreadsheetSnapshot {
  columns: ColumnDef[];
  rows: RowData[];
  
  initialRows: RowData[];
  selection: SelectionKind;
  sort: SortState;
  filter: FilterState;
  
  highlights: Record<string, CellHighlight>;
  
  editing: CellAddress | null;
  
  lockedColumns: string[];
}

export interface SpreadsheetState extends SpreadsheetSnapshot {
  past: SpreadsheetSnapshot[];
  future: SpreadsheetSnapshot[];
}
