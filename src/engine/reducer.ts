import type {
  CellHighlight,
  CellValue,
  ColumnDef,
  FilterPredicate,
  RangeSelection,
  RowData,
  SelectionKind,
  SortDirection,
  SpreadsheetSnapshot,
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
  | { type: "setCells"; updates: Array<{ rowId: string; colKey: string; value: CellValue }> }
  | { type: "cancelEdit" }
  | { type: "setSort"; colKey: string | null; direction: SortDirection }
  | { type: "setFilter"; colKey: string | null; predicate: FilterPredicate | null }
  | { type: "setColumnWidth"; colKey: string; width: number }
  | { type: "renameColumn"; colKey: string; title: string }
  | { type: "addRow" }
  | { type: "addColumn"; title?: string; columnType?: ColumnDef["type"] }
  | { type: "clearValues" }
  | { type: "highlightCells"; addresses: Array<{ rowId: string; colKey: string }>; color: CellHighlight }
  | { type: "clearHighlights" }
  | { type: "loadDataset"; columns: ColumnDef[]; rows: RowData[]; lockedColumns?: string[] }
  | { type: "undo" }
  | { type: "redo" }
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
    past: [],
    future: [],
  };
}

function highlightKey(rowId: string, colKey: string) {
  return `${rowId}|${colKey}`;
}

function uniqueColumnKey(columns: ColumnDef[]) {
  let i = columns.length + 1;
  let key = `free_col_${i}`;
  const existing = new Set(columns.map((c) => c.key));
  while (existing.has(key)) {
    i += 1;
    key = `free_col_${i}`;
  }
  return key;
}

function snapshot(state: SpreadsheetState): SpreadsheetSnapshot {
  return {
    columns: state.columns,
    rows: state.rows,
    initialRows: state.initialRows,
    selection: state.selection,
    sort: state.sort,
    filter: state.filter,
    highlights: state.highlights,
    // Не сохраняем активный инпут в undo/redo: история должна восстанавливать данные, а не UI-фокус.
    editing: null,
    lockedColumns: state.lockedColumns,
  };
}

function withHistory(prev: SpreadsheetState, next: SpreadsheetState): SpreadsheetState {
  if (next === prev) return prev;
  return {
    ...next,
    editing: null,
    // Держим последние 50 снимков, чтобы история не росла бесконечно при частых правках ячеек.
    past: [...prev.past.slice(-49), snapshot(prev)],
    future: [],
  };
}

export function spreadsheetReducer(
  state: SpreadsheetState,
  action: SpreadsheetAction,
): SpreadsheetState {
  switch (action.type) {
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        ...previous,
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future],
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...next,
        past: [...state.past.slice(-49), snapshot(state)],
        future: state.future.slice(1),
      };
    }
    case "selectCell": {
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
      let changed = false;
      const newRows = state.rows.map((row) =>
        row.id === action.rowId
          ? (() => {
              if (row.values[action.colKey] === action.value) return row;
              changed = true;
              return { ...row, values: { ...row.values, [action.colKey]: action.value } };
            })()
          : row,
      );
      if (!changed) return { ...state, editing: null };
      return withHistory(state, { ...state, rows: newRows, editing: null });
    }
    case "setCells": {
      const locked = new Set(state.lockedColumns);
      const updateMap = new Map<string, CellValue>();
      for (const update of action.updates) {
        if (!locked.has(update.colKey)) {
          // Ключ rowId|colKey позволяет быстро сопоставлять пачку clipboard/fill-обновлений с текущими строками.
          updateMap.set(highlightKey(update.rowId, update.colKey), update.value);
        }
      }
      if (updateMap.size === 0) return state;
      const newRows = state.rows.map((row) => {
        let changed = false;
        const values = { ...row.values };
        for (const col of state.columns) {
          const k = highlightKey(row.id, col.key);
          if (updateMap.has(k) && values[col.key] !== updateMap.get(k)) {
            values[col.key] = updateMap.get(k) ?? null;
            changed = true;
          }
        }
        return changed ? { ...row, values } : row;
      });
      if (state.rows.every((row, i) => row === newRows[i])) return { ...state, editing: null };
      return withHistory(state, { ...state, rows: newRows, editing: null });
    }
    case "cancelEdit":
      return { ...state, editing: null };

    case "setSort":
      if (state.sort.colKey === action.colKey && state.sort.direction === action.direction) return state;
      return withHistory(state, {
        ...state,
        sort: { colKey: action.colKey, direction: action.direction },
      });
    case "setFilter":
      if (
        state.filter.colKey === action.colKey &&
        JSON.stringify(state.filter.predicate) === JSON.stringify(action.predicate)
      ) {
        return state;
      }
      return withHistory(state, {
        ...state,
        filter: { colKey: action.colKey, predicate: action.predicate },
      });
    case "setColumnWidth": {
      const clamped = Math.max(60, Math.min(640, action.width));
      const newCols = state.columns.map((c) =>
        c.key === action.colKey ? { ...c, width: clamped } : c,
      );
      if (state.columns.every((c, i) => c === newCols[i])) return state;
      return withHistory(state, { ...state, columns: newCols });
    }
    case "renameColumn": {
      const title = action.title.trim();
      return withHistory(state, {
        ...state,
        columns: state.columns.map((c) =>
          c.key === action.colKey ? { ...c, title } : c,
        ),
      });
    }
    case "addRow": {
      const idBase = `free-row-${Date.now()}`;
      const values = Object.fromEntries(state.columns.map((c) => [c.key, null]));
      const row: RowData = { id: `${idBase}-${state.rows.length + 1}`, values };
      return withHistory(state, {
        ...state,
        rows: [...state.rows, row],
        initialRows: [...state.initialRows, row],
        selection: { type: "cell", row: state.rows.length, col: 0 },
      });
    }
    case "addColumn": {
      const key = uniqueColumnKey(state.columns);
      const column: ColumnDef = {
        key,
        title: action.title?.trim() ?? "",
        type: action.columnType ?? "text",
        width: 140,
      };
      const addValue = (row: RowData): RowData => ({
        ...row,
        values: { ...row.values, [key]: null },
      });
      return withHistory(state, {
        ...state,
        columns: [...state.columns, column],
        rows: state.rows.map(addValue),
        initialRows: state.initialRows.map(addValue),
        selection: { type: "column", col: state.columns.length },
      });
    }
    case "clearValues": {
      const blankRows = state.rows.map((row) => ({
        ...row,
        values: Object.fromEntries(state.columns.map((c) => [c.key, null])),
      }));
      return withHistory(state, {
        ...state,
        rows: blankRows,
        initialRows: blankRows,
        selection: { type: "none" },
        highlights: {},
        editing: null,
        sort: { colKey: null, direction: null },
        filter: { colKey: null, predicate: null },
      });
    }

    case "highlightCells": {
      const next = { ...state.highlights };
      let changed = false;
      for (const a of action.addresses) {
        const k = highlightKey(a.rowId, a.colKey);
        if (action.color === null) {
          if (k in next) {
            delete next[k];
            changed = true;
          }
        } else if (next[k] !== action.color) {
          next[k] = action.color;
          changed = true;
        }
      }
      if (!changed) return state;
      return withHistory(state, { ...state, highlights: next });
    }
    case "clearHighlights":
      if (Object.keys(state.highlights).length === 0) return state;
      return withHistory(state, { ...state, highlights: {} });

    case "loadDataset":
      // Смена урока загружает новый датасет и намеренно сбрасывает историю предыдущей таблицы.
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
        past: [],
        future: [],
      };
    case "resetState":
      return withHistory(state, {
        ...state,
        rows: state.initialRows,
        selection: { type: "none" },
        sort: { colKey: null, direction: null },
        filter: { colKey: null, predicate: null },
        highlights: {},
        editing: null,
      });

    default:
      return state;
  }
}
