import type {
  CellHighlight,
  CellValue,
  ColumnDef,
  FilterPredicate,
  RangeSelection,
  RowData,
  SelectionKind,
  SortDirection,
  SpreadsheetState,
} from "./types";

export type SpreadsheetAction =
  | { type: "selectCell"; row: number; col: number; extend?: boolean }
  | { type: "selectRange"; range: RangeSelection }
  | { type: "selectRow"; row: number }
  | { type: "selectColumn"; col: number }
  | { type: "clearSelection" }
  | { type: "startEdit"; rowId: string; colKey: string }
  | { type: "commitEdit"; rowId: string; colKey: string; value: CellValue }
  | { type: "cancelEdit" }
  | { type: "setSort"; colKey: string | null; direction: SortDirection }
  | { type: "setFilter"; colKey: string | null; predicate: FilterPredicate | null }
  | { type: "setColumnWidth"; colKey: string; width: number }
  | { type: "highlightCells"; addresses: Array<{ rowId: string; colKey: string }>; color: CellHighlight }
  | { type: "clearHighlights" }
  | { type: "loadDataset"; columns: ColumnDef[]; rows: RowData[]; lockedColumns?: string[] }
  | { type: "resetState" };

export function createInitialState(
  columns: ColumnDef[],
  rows: RowData[],
  lockedColumns: string[] = [],
): SpreadsheetState {
  return {
    columns,
    rows,
    initialRows: rows,
    selection: { type: "none" },
    sort: { colKey: null, direction: null },
    filter: { colKey: null, predicate: null },
    highlights: {},
    editing: null,
    lockedColumns,
  };
}

function highlightKey(rowId: string, colKey: string) {
  return `${rowId}|${colKey}`;
}

export function spreadsheetReducer(
  state: SpreadsheetState,
  action: SpreadsheetAction,
): SpreadsheetState {
  switch (action.type) {
    case "selectCell": {
      // Shift-click — расширяем диапазон от текущего якоря, если он есть.
      if (action.extend && state.selection.type !== "none") {
        const sel = state.selection;
        let anchorRow = action.row;
        let anchorCol = action.col;
        if (sel.type === "cell") {
          anchorRow = sel.row;
          anchorCol = sel.col;
        } else if (sel.type === "range") {
          anchorRow = sel.range.anchorRow;
          anchorCol = sel.range.anchorCol;
        } else if (sel.type === "row") {
          anchorRow = sel.row;
          anchorCol = 0;
        } else if (sel.type === "column") {
          anchorRow = 0;
          anchorCol = sel.col;
        }
        return {
          ...state,
          selection: {
            type: "range",
            range: {
              anchorRow,
              anchorCol,
              focusRow: action.row,
              focusCol: action.col,
            },
          },
        };
      }
      return {
        ...state,
        selection: { type: "cell", row: action.row, col: action.col },
      };
    }
    case "selectRange":
      return { ...state, selection: { type: "range", range: action.range } };
    case "selectRow":
      return { ...state, selection: { type: "row", row: action.row } };
    case "selectColumn":
      return { ...state, selection: { type: "column", col: action.col } };
    case "clearSelection":
      return { ...state, selection: { type: "none" } };

    case "startEdit": {
      if (state.lockedColumns.includes(action.colKey)) return state;
      return { ...state, editing: { rowId: action.rowId, colKey: action.colKey } };
    }
    case "commitEdit": {
      if (state.lockedColumns.includes(action.colKey)) {
        return { ...state, editing: null };
      }
      const newRows = state.rows.map((row) =>
        row.id === action.rowId
          ? { ...row, values: { ...row.values, [action.colKey]: action.value } }
          : row,
      );
      return { ...state, rows: newRows, editing: null };
    }
    case "cancelEdit":
      return { ...state, editing: null };

    case "setSort":
      return {
        ...state,
        sort: { colKey: action.colKey, direction: action.direction },
      };
    case "setFilter":
      return {
        ...state,
        filter: { colKey: action.colKey, predicate: action.predicate },
      };
    case "setColumnWidth": {
      const newCols = state.columns.map((c) =>
        c.key === action.colKey ? { ...c, width: Math.max(60, action.width) } : c,
      );
      return { ...state, columns: newCols };
    }

    case "highlightCells": {
      const next = { ...state.highlights };
      for (const a of action.addresses) {
        const k = highlightKey(a.rowId, a.colKey);
        if (action.color === null) delete next[k];
        else next[k] = action.color;
      }
      return { ...state, highlights: next };
    }
    case "clearHighlights":
      return { ...state, highlights: {} };

    case "loadDataset":
      return {
        ...state,
        columns: action.columns,
        rows: action.rows,
        initialRows: action.rows,
        selection: { type: "none" },
        sort: { colKey: null, direction: null },
        filter: { colKey: null, predicate: null },
        highlights: {},
        editing: null,
        lockedColumns: action.lockedColumns ?? [],
      };
    case "resetState":
      return {
        ...state,
        rows: state.initialRows,
        selection: { type: "none" },
        sort: { colKey: null, direction: null },
        filter: { colKey: null, predicate: null },
        highlights: {},
        editing: null,
      };

    default:
      return state;
  }
}
