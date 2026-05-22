"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, X } from "lucide-react";
import type {
  CellHighlight,
  CellValue,
  ColumnDef,
  RowData,
  SelectionKind,
  SortDirection,
  SpreadsheetState,
} from "@/engine/types";
import {
  columnLetter,
  isCellActive,
  isCellSelected,
  normalizeRange,
} from "@/engine/selection";
import { sortRows as sortFn, filterRows as filterFn } from "@/engine/sortFilter";
import type { SpreadsheetAction } from "@/engine/reducer";
import { cn, formatNumber } from "@/lib/utils";

interface SpreadsheetProps {
  state: SpreadsheetState;
  dispatch: (a: SpreadsheetAction) => void;
}

const HIGHLIGHT_COLORS: Record<NonNullable<CellHighlight>, string> = {
  yellow: "bg-yellow-100",
  green: "bg-emerald-100",
  red: "bg-rose-100",
  blue: "bg-sky-100",
};

export function Spreadsheet({ state, dispatch }: SpreadsheetProps) {
  const { columns, rows, selection, sort, filter, highlights, editing } = state;

  // Видимые строки = после фильтра, потом сортировки.
  const visibleRows = useMemo(() => {
    const filterCol = columns.find((c) => c.key === filter.colKey);
    const sortCol = columns.find((c) => c.key === sort.colKey);
    const filtered = filterFn(rows, filterCol, filter.predicate);
    const sorted = sortFn(filtered, sortCol, sort.direction);
    return sorted;
  }, [rows, columns, sort, filter]);

  const totalRows = visibleRows.length;
  const totalCols = columns.length;

  // -------- Drag selection (mouse) --------
  const draggingRef = useRef(false);

  const handleCellMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      if (e.shiftKey) {
        dispatch({ type: "selectCell", row, col, extend: true });
      } else {
        dispatch({ type: "selectCell", row, col });
      }
      // preventDefault блокирует автоматический перевод фокуса —
      // переводим его сами, чтобы стрелки на клавиатуре работали сразу.
      containerRef.current?.focus({ preventScroll: true });
    },
    [dispatch],
  );

  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!draggingRef.current) return;
      // Расширяем диапазон при перетаскивании.
      dispatch({ type: "selectCell", row, col, extend: true });
    },
    [dispatch],
  );

  useEffect(() => {
    const stop = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  // -------- Keyboard navigation --------
  const containerRef = useRef<HTMLDivElement | null>(null);

  const moveActive = useCallback(
    (dr: number, dc: number, extend: boolean) => {
      let row = 0;
      let col = 0;
      let anchorRow = 0;
      let anchorCol = 0;
      if (selection.type === "cell") {
        row = selection.row;
        col = selection.col;
        anchorRow = row;
        anchorCol = col;
      } else if (selection.type === "range") {
        row = selection.range.focusRow;
        col = selection.range.focusCol;
        anchorRow = selection.range.anchorRow;
        anchorCol = selection.range.anchorCol;
      } else {
        // Если ничего не выделено — встаём в (0,0).
        dispatch({ type: "selectCell", row: 0, col: 0 });
        return;
      }
      const newRow = Math.max(0, Math.min(totalRows - 1, row + dr));
      const newCol = Math.max(0, Math.min(totalCols - 1, col + dc));
      if (extend) {
        dispatch({
          type: "selectRange",
          range: { anchorRow, anchorCol, focusRow: newRow, focusCol: newCol },
        });
      } else {
        dispatch({ type: "selectCell", row: newRow, col: newCol });
      }
    },
    [selection, totalRows, totalCols, dispatch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (editing) return; // во время редактирования стрелки уходят в input
      const ext = e.shiftKey;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          moveActive(-1, 0, ext);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveActive(1, 0, ext);
          break;
        case "ArrowLeft":
          e.preventDefault();
          moveActive(0, -1, ext);
          break;
        case "ArrowRight":
        case "Tab":
          e.preventDefault();
          moveActive(0, 1, ext);
          break;
        case "Escape":
          dispatch({ type: "clearSelection" });
          break;
        case "Enter":
          if (selection.type === "cell") {
            const row = visibleRows[selection.row];
            const col = columns[selection.col];
            if (row && col) {
              dispatch({ type: "startEdit", rowId: row.id, colKey: col.key });
            }
          }
          break;
      }
    },
    [editing, moveActive, dispatch, selection, visibleRows, columns],
  );

  // Sort toggle via header chevron.
  const toggleSort = useCallback(
    (colKey: string) => {
      if (sort.colKey !== colKey) {
        dispatch({ type: "setSort", colKey, direction: "asc" });
        return;
      }
      const next: SortDirection =
        sort.direction === "asc" ? "desc" : sort.direction === "desc" ? null : "asc";
      dispatch({ type: "setSort", colKey: next ? colKey : null, direction: next });
    },
    [sort, dispatch],
  );

  // Открывать/закрывать панельку фильтра.
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="grid"
      aria-rowcount={totalRows}
      aria-colcount={totalCols}
      onKeyDown={handleKeyDown}
      className="focusable relative h-full w-full overflow-auto rounded-xl border border-soft-border bg-white shadow-soft scroll-area"
    >
      <div className="min-w-max">
        {/* ===== Шапка колонок ===== */}
        <div className="sticky top-0 z-20 flex bg-[var(--header-bg)]">
          <CornerCell />
          {columns.map((col, ci) => (
            <ColumnHeader
              key={col.key}
              col={col}
              colIndex={ci}
              isSelected={
                selection.type === "column" && selection.col === ci
              }
              isInRange={isColumnTouchedBySelection(selection, ci)}
              sortDirection={sort.colKey === col.key ? sort.direction : null}
              filterActive={filter.colKey === col.key && !!filter.predicate}
              onSelectColumn={() => dispatch({ type: "selectColumn", col: ci })}
              onToggleSort={() => toggleSort(col.key)}
              onResize={(w) =>
                dispatch({ type: "setColumnWidth", colKey: col.key, width: w })
              }
              onOpenFilter={() => setOpenFilterCol(col.key)}
              onCloseFilter={() => setOpenFilterCol(null)}
              isFilterOpen={openFilterCol === col.key}
              currentFilterValue={
                filter.colKey === col.key && filter.predicate?.kind === "equals"
                  ? String(filter.predicate.value)
                  : null
              }
              uniqueValues={uniqueColumnValues(rows, col)}
              onApplyFilter={(value) => {
                if (value === null) {
                  dispatch({ type: "setFilter", colKey: null, predicate: null });
                } else {
                  dispatch({
                    type: "setFilter",
                    colKey: col.key,
                    predicate: { kind: "equals", value },
                  });
                }
                setOpenFilterCol(null);
              }}
            />
          ))}
        </div>

        {/* ===== Тело ===== */}
        <div className="spreadsheet-grid">
          {visibleRows.map((row, ri) => {
            const rowSelected =
              selection.type === "row" && selection.row === ri;
            const rowInRange = isRowTouchedBySelection(selection, ri);
            return (
              <div key={row.id} className="flex" role="row" aria-rowindex={ri + 1}>
                <RowHeader
                  index={ri + 1}
                  selected={rowSelected}
                  inRange={rowInRange}
                  onSelect={() => dispatch({ type: "selectRow", row: ri })}
                />
                {columns.map((col, ci) => {
                  const value = row.values[col.key] ?? null;
                  const selected = isCellSelected(selection, ri, ci, totalRows, totalCols);
                  const active = isCellActive(selection, ri, ci);
                  const highlightKey = `${row.id}|${col.key}`;
                  const highlight = highlights[highlightKey] ?? null;
                  const isEditing =
                    !!editing && editing.rowId === row.id && editing.colKey === col.key;
                  return (
                    <Cell
                      key={col.key}
                      row={ri}
                      col={ci}
                      width={col.width}
                      type={col.type}
                      unit={col.unit}
                      value={value}
                      selected={selected}
                      active={active}
                      highlight={highlight}
                      editing={isEditing}
                      locked={state.lockedColumns.includes(col.key)}
                      onMouseDown={(e) => handleCellMouseDown(ri, ci, e)}
                      onMouseEnter={() => handleCellMouseEnter(ri, ci)}
                      onDoubleClick={() => {
                        if (!state.lockedColumns.includes(col.key)) {
                          dispatch({ type: "startEdit", rowId: row.id, colKey: col.key });
                        }
                      }}
                      onCommit={(v) =>
                        dispatch({ type: "commitEdit", rowId: row.id, colKey: col.key, value: v })
                      }
                      onCancel={() => dispatch({ type: "cancelEdit" })}
                    />
                  );
                })}
              </div>
            );
          })}
          {visibleRows.length === 0 && (
            <div className="flex items-center justify-center px-8 py-16 text-soft-muted">
              По текущему фильтру ничего не найдено. Попробуй сбросить фильтр.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function isColumnTouchedBySelection(sel: SelectionKind, col: number): boolean {
  if (sel.type === "column") return sel.col === col;
  if (sel.type === "range") {
    const { c1, c2 } = normalizeRange(sel.range);
    return col >= c1 && col <= c2;
  }
  if (sel.type === "cell") return sel.col === col;
  return false;
}

function isRowTouchedBySelection(sel: SelectionKind, row: number): boolean {
  if (sel.type === "row") return sel.row === row;
  if (sel.type === "range") {
    const { r1, r2 } = normalizeRange(sel.range);
    return row >= r1 && row <= r2;
  }
  if (sel.type === "cell") return sel.row === row;
  return false;
}

function uniqueColumnValues(rows: RowData[], col: ColumnDef): Array<string | number> {
  const set = new Set<string | number>();
  for (const r of rows) {
    const v = r.values[col.key];
    if (v === null || v === undefined) continue;
    set.add(v);
  }
  return Array.from(set);
}

// ============================================================================
// Корнер (пересечение шапок).
// ============================================================================
function CornerCell() {
  return (
    <div
      className="sticky left-0 z-30 flex h-9 w-12 shrink-0 items-center justify-center border-b border-r border-soft-border bg-[var(--header-bg)] text-[10px] uppercase tracking-wide text-soft-muted"
      aria-hidden
    />
  );
}

// ============================================================================
// Заголовок колонки: буква (A,B,C…) + название + сортировка + фильтр + resize.
// ============================================================================
interface ColumnHeaderProps {
  col: ColumnDef;
  colIndex: number;
  isSelected: boolean;
  isInRange: boolean;
  sortDirection: SortDirection;
  filterActive: boolean;
  onSelectColumn: () => void;
  onToggleSort: () => void;
  onResize: (width: number) => void;
  onOpenFilter: () => void;
  onCloseFilter: () => void;
  isFilterOpen: boolean;
  currentFilterValue: string | null;
  uniqueValues: Array<string | number>;
  onApplyFilter: (value: string | number | null) => void;
}

function ColumnHeader(props: ColumnHeaderProps) {
  const {
    col,
    colIndex,
    isSelected,
    isInRange,
    sortDirection,
    filterActive,
    onSelectColumn,
    onToggleSort,
    onResize,
    onOpenFilter,
    onCloseFilter,
    isFilterOpen,
    currentFilterValue,
    uniqueValues,
    onApplyFilter,
  } = props;

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = col.width;
    const onMove = (ev: MouseEvent) => {
      onResize(startW + (ev.clientX - startX));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      className="relative shrink-0 border-b border-r border-soft-border"
      style={{ width: col.width }}
      data-tutorial-id={`col-header-${col.key}`}
    >
      {/* Верхняя строка: буква колонки */}
      <div
        className={cn(
          "flex h-5 select-none items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-soft-muted",
          isSelected && "bg-brand-500 text-white",
          !isSelected && isInRange && "bg-brand-100 text-brand-700",
        )}
      >
        {columnLetter(colIndex)}
      </div>
      {/* Нижняя строка: название + сортировка + фильтр */}
      <div
        className={cn(
          "group flex h-9 cursor-pointer select-none items-center gap-1 px-2 text-sm font-medium",
          isSelected
            ? "bg-brand-500 text-white"
            : isInRange
              ? "bg-brand-50 text-brand-800"
              : "bg-[var(--header-bg)] text-slate-700 hover:bg-slate-100",
        )}
        onClick={onSelectColumn}
        title={col.title}
      >
        <span className="truncate">{col.title}</span>
        <button
          type="button"
          aria-label="Сортировать"
          className={cn(
            "ml-auto rounded p-1 transition",
            isSelected ? "hover:bg-white/20" : "hover:bg-slate-200",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSort();
          }}
        >
          {sortDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : sortDirection === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
          )}
        </button>
        <button
          type="button"
          aria-label="Фильтр"
          data-tutorial-id={`filter-${col.key}`}
          className={cn(
            "rounded p-1 transition",
            filterActive
              ? "bg-brand-100 text-brand-700"
              : isSelected
                ? "hover:bg-white/20"
                : "hover:bg-slate-200",
          )}
          onClick={(e) => {
            e.stopPropagation();
            isFilterOpen ? onCloseFilter() : onOpenFilter();
          }}
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Ручка ресайза */}
      <div
        onMouseDown={startResize}
        className="absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-brand-400/50"
        aria-hidden
      />

      {/* Поповер фильтра */}
      {isFilterOpen && (
        <div
          className="absolute left-0 top-full z-40 mt-1 w-56 animate-fadeIn rounded-lg border border-soft-border bg-white p-2 shadow-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-xs font-medium text-soft-muted">
              Фильтр по «{col.title}»
            </span>
            <button
              type="button"
              className="rounded p-1 hover:bg-slate-100"
              onClick={onCloseFilter}
              aria-label="Закрыть"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            className={cn(
              "block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100",
              currentFilterValue === null && "bg-slate-50 font-medium",
            )}
            onClick={() => onApplyFilter(null)}
          >
            Все значения
          </button>
          <div className="mt-1 max-h-56 overflow-auto scroll-area">
            {uniqueValues.map((v) => {
              const sv = String(v);
              const active = currentFilterValue === sv;
              return (
                <button
                  type="button"
                  key={sv}
                  className={cn(
                    "block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-brand-50",
                    active && "bg-brand-100 font-medium text-brand-800",
                  )}
                  onClick={() => onApplyFilter(v)}
                >
                  {sv}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RowHeader — номер строки.
// ============================================================================
function RowHeader({
  index,
  selected,
  inRange,
  onSelect,
}: {
  index: number;
  selected: boolean;
  inRange: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      data-tutorial-id={`row-header-${index - 1}`}
      className={cn(
        "sticky left-0 z-10 flex h-9 w-12 shrink-0 cursor-pointer select-none items-center justify-center border-b border-r border-soft-border text-xs font-semibold",
        selected
          ? "bg-brand-500 text-white"
          : inRange
            ? "bg-brand-50 text-brand-700"
            : "bg-[var(--header-bg)] text-soft-muted hover:bg-slate-100",
      )}
    >
      {index}
    </div>
  );
}

// ============================================================================
// Cell — одна ячейка с inline-редактированием.
// ============================================================================
interface CellProps {
  row: number;
  col: number;
  width: number;
  type: ColumnDef["type"];
  unit?: string;
  value: CellValue;
  selected: boolean;
  active: boolean;
  highlight: CellHighlight;
  editing: boolean;
  locked: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onDoubleClick: () => void;
  onCommit: (value: CellValue) => void;
  onCancel: () => void;
}

function Cell(props: CellProps) {
  const {
    width,
    type,
    unit,
    value,
    selected,
    active,
    highlight,
    editing,
    locked,
    onMouseDown,
    onMouseEnter,
    onDoubleClick,
    onCommit,
    onCancel,
  } = props;

  const display = useMemo(() => {
    if (value === null || value === undefined || value === "") return "";
    if (type === "number") return formatNumber(Number(value), unit);
    return String(value);
  }, [value, type, unit]);

  return (
    <div
      role="gridcell"
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onDoubleClick={onDoubleClick}
      style={{ width }}
      className={cn(
        "relative flex h-9 shrink-0 items-center border-b border-r border-soft-border px-2 text-sm",
        type === "number" ? "justify-end tabular-nums text-slate-800" : "justify-start text-slate-800",
        highlight && HIGHLIGHT_COLORS[highlight],
        selected && !active && "bg-[var(--selection-bg)]",
        active && "z-10 ring-2 ring-[var(--selection-border)] ring-offset-0",
        locked && "text-slate-500",
      )}
    >
      {editing ? (
        <CellEditor initialValue={value} type={type} onCommit={onCommit} onCancel={onCancel} />
      ) : (
        <span className="truncate">{display}</span>
      )}
    </div>
  );
}

function CellEditor({
  initialValue,
  type,
  onCommit,
  onCancel,
}: {
  initialValue: CellValue;
  type: ColumnDef["type"];
  onCommit: (v: CellValue) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<string>(initialValue === null ? "" : String(initialValue));
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const commit = () => {
    if (type === "number") {
      const n = Number(v.replace(",", "."));
      if (!Number.isFinite(n)) {
        onCancel();
        return;
      }
      onCommit(n);
    } else {
      onCommit(v);
    }
  };
  return (
    <input
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
      }}
      className="h-7 w-full rounded border border-brand-400 bg-white px-1 text-sm outline-none ring-2 ring-brand-200"
    />
  );
}
