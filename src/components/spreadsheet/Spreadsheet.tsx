"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clipboard, Filter, X } from "lucide-react";
import type {
  CellHighlight,
  CellValue,
  ColumnDef,
  RowData,
  SelectionKind,
  SpreadsheetState,
} from "@/engine/types";
import {
  columnLetter,
  isCellActive,
  isCellSelected,
  normalizeRange,
  selectionToCells,
} from "@/engine/selection";
import { sortRows as sortFn, filterRows as filterFn } from "@/engine/sortFilter";
import type { SpreadsheetAction } from "@/engine/reducer";
import { cn, formatNumber } from "@/lib/utils";

interface SpreadsheetProps {
  state: SpreadsheetState;
  dispatch: (a: SpreadsheetAction) => void;
  allowColumnRename?: boolean;
}

const HIGHLIGHT_COLORS: Record<NonNullable<CellHighlight>, string> = {
  yellow: "bg-yellow-100",
  green: "bg-emerald-100",
  red: "bg-rose-100",
  blue: "bg-sky-100",
};

const MAX_NUMBER_CELL_VALUE = 1_000_000;

export function Spreadsheet({ state, dispatch, allowColumnRename = false }: SpreadsheetProps) {
  const { columns, rows, selection, sort, filter, highlights, editing } = state;

  const visibleRows = useMemo(() => {
    const filterCol = columns.find((c) => c.key === filter.colKey);
    const sortCol = columns.find((c) => c.key === sort.colKey);
    const filtered = filterFn(rows, filterCol, filter.predicate);
    const sorted = sortFn(filtered, sortCol, sort.direction);
    return sorted;
  }, [rows, columns, sort, filter]);

  const totalRows = visibleRows.length;
  const totalCols = columns.length;
  const [clipboardStatus, setClipboardStatus] = useState<string | null>(null);
  const [fillPreview, setFillPreview] = useState<{ r1: number; r2: number; c1: number; c2: number } | null>(null);
  const [editSeed, setEditSeed] = useState<string | null>(null);

  useEffect(() => {
    if (!clipboardStatus) return;
    const id = window.setTimeout(() => setClipboardStatus(null), 1400);
    return () => window.clearTimeout(id);
  }, [clipboardStatus]);

  const draggingRef = useRef(false);
  const fillDragRef = useRef<{ r1: number; r2: number; c1: number; c2: number } | null>(null);
  const fillTargetRef = useRef<{ row: number; col: number } | null>(null);

  const handleCellMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      if (e.shiftKey) {
        dispatch({ type: "selectCell", row, col, extend: true });
      } else {
        dispatch({ type: "selectCell", row, col });
      }

      containerRef.current?.focus({ preventScroll: true });
    },
    [dispatch],
  );

  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (fillDragRef.current) {
        fillTargetRef.current = { row, col };
        setFillPreview(fillPreviewBounds(fillDragRef.current, row, col));
        return;
      }
      if (!draggingRef.current) return;

      dispatch({ type: "selectCell", row, col, extend: true });
    },
    [dispatch],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectionText = useCallback(() => {
    const bounds = selectionToBounds(selection, totalRows, totalCols);
    if (!bounds) return null;
    const lines: string[] = [];
    for (let r = bounds.r1; r <= bounds.r2; r++) {
      const row = visibleRows[r];
      if (!row) continue;
      const values: string[] = [];
      for (let c = bounds.c1; c <= bounds.c2; c++) {
        const col = columns[c];
        values.push(col ? String(row.values[col.key] ?? "") : "");
      }
      lines.push(values.join("\t"));
    }
    return lines.join("\n");
  }, [selection, totalRows, totalCols, visibleRows, columns]);

  const clearSelectionValues = useCallback(() => {
    const updates: Array<{ rowId: string; colKey: string; value: CellValue }> = [];
    for (const { row, col } of selectionToCells(selection, totalRows, totalCols)) {
      const rowData = visibleRows[row];
      const column = columns[col];
      if (!rowData || !column || state.lockedColumns.includes(column.key)) continue;
      updates.push({ rowId: rowData.id, colKey: column.key, value: null });
    }
    if (updates.length > 0) {
      dispatch({ type: "setCells", updates });
      setClipboardStatus("Очищено");
    }
  }, [selection, totalRows, totalCols, visibleRows, columns, state.lockedColumns, dispatch]);

  const pasteText = useCallback((text: string) => {
    const anchor = selectionAnchor(selection);
    if (!anchor) return;
    // Буфер из Excel/Sheets приходит как TSV; CRLF нормализуем, чтобы Windows-вставка не давала лишние строки.
    const rawRows = text.replace(/\r/g, "").split("\n");
    if (rawRows[rawRows.length - 1] === "") rawRows.pop();
    const matrix = rawRows.map((line) => line.split("\t"));
    const updates: Array<{ rowId: string; colKey: string; value: CellValue }> = [];
    for (let r = 0; r < matrix.length; r++) {
      const rowData = visibleRows[anchor.row + r];
      if (!rowData) continue;
      for (let c = 0; c < matrix[r].length; c++) {
        const column = columns[anchor.col + c];
        if (!column || state.lockedColumns.includes(column.key)) continue;
        updates.push({
          rowId: rowData.id,
          colKey: column.key,
          value: parseClipboardValue(matrix[r][c], column),
        });
      }
    }
    if (updates.length > 0) {
      dispatch({ type: "setCells", updates });
      setClipboardStatus(`Вставлено: ${updates.length}`);
    }
  }, [selection, visibleRows, columns, state.lockedColumns, dispatch]);

  const startFill = useCallback(
    (e: React.MouseEvent) => {
      const bounds = selectionToBounds(selection, totalRows, totalCols);
      if (!bounds) return;
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = false;
      fillDragRef.current = bounds;
      fillTargetRef.current = { row: bounds.r2, col: bounds.c2 };
      setFillPreview(null);
    },
    [selection, totalRows, totalCols],
  );

  const applyFill = useCallback(() => {
    const source = fillDragRef.current;
    const target = fillTargetRef.current;
    fillDragRef.current = null;
    fillTargetRef.current = null;
    setFillPreview(null);
    if (!source || !target) return;
    const updates: Array<{ rowId: string; colKey: string; value: CellValue }> = [];
    // Автозаполнение расширяем только вниз или вправо — так проще сохранить предсказуемую серию значений.
    if (target.row > source.r2) {
      for (let c = source.c1; c <= source.c2; c++) {
        const column = columns[c];
        if (!column || state.lockedColumns.includes(column.key)) continue;
        const sourceValues: CellValue[] = [];
        for (let r = source.r1; r <= source.r2; r++) {
          sourceValues.push(visibleRows[r]?.values[column.key] ?? null);
        }
        for (let r = source.r2 + 1; r <= target.row; r++) {
          const rowData = visibleRows[r];
          if (!rowData) continue;
          updates.push({ rowId: rowData.id, colKey: column.key, value: nextSeriesValue(sourceValues, r - source.r1) });
        }
      }
      dispatch({
        type: "selectRange",
        range: { anchorRow: source.r1, anchorCol: source.c1, focusRow: target.row, focusCol: source.c2 },
      });
    } else if (target.col > source.c2) {
      for (let r = source.r1; r <= source.r2; r++) {
        const rowData = visibleRows[r];
        if (!rowData) continue;
        const sourceValues: CellValue[] = [];
        for (let c = source.c1; c <= source.c2; c++) {
          const column = columns[c];
          sourceValues.push(column ? rowData.values[column.key] ?? null : null);
        }
        for (let c = source.c2 + 1; c <= target.col; c++) {
          const column = columns[c];
          if (!column || state.lockedColumns.includes(column.key)) continue;
          updates.push({ rowId: rowData.id, colKey: column.key, value: nextSeriesValue(sourceValues, c - source.c1) });
        }
      }
      dispatch({
        type: "selectRange",
        range: { anchorRow: source.r1, anchorCol: source.c1, focusRow: source.r2, focusCol: target.col },
      });
    }
    if (updates.length > 0) {
      dispatch({ type: "setCells", updates });
      setClipboardStatus(`Заполнено: ${updates.length}`);
    }
  }, [columns, visibleRows, state.lockedColumns, dispatch]);

  useEffect(() => {
    const stop = () => {
      draggingRef.current = false;
      applyFill();
    };
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, [applyFill]);

  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (editing) return;
      const text = selectionText();
      if (text === null) return;
      e.preventDefault();
      e.clipboardData.setData("text/plain", text);
      setClipboardStatus("Скопировано");
    },
    [editing, selectionText],
  );

  const handleCut = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (editing) return;
      const text = selectionText();
      if (text === null) return;
      e.preventDefault();
      e.clipboardData.setData("text/plain", text);
      clearSelectionValues();
    },
    [editing, selectionText, clearSelectionValues],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (editing) return;
      const text = e.clipboardData.getData("text/plain");
      if (!text) return;
      e.preventDefault();
      pasteText(text);
    },
    [editing, pasteText],
  );

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
      if (editing) return;
      if (isTextEntryTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (isUndoShortcut(e)) {
          e.preventDefault();
          dispatch({ type: e.shiftKey ? "redo" : "undo" });
          return;
        }
        if (isRedoShortcut(e)) {
          e.preventDefault();
          dispatch({ type: "redo" });
          return;
        }
        if (key === "a") {
          e.preventDefault();
          if (totalRows > 0 && totalCols > 0) {
            dispatch({
              type: "selectRange",
              range: { anchorRow: 0, anchorCol: 0, focusRow: totalRows - 1, focusCol: totalCols - 1 },
            });
          }
          return;
        }
      }
      if (!e.altKey && !e.ctrlKey && !e.metaKey && key.length === 1 && selection.type === "cell") {
        const row = visibleRows[selection.row];
        const col = columns[selection.col];
        if (row && col && !state.lockedColumns.includes(col.key)) {
          e.preventDefault();
          setEditSeed(e.key);
          dispatch({ type: "startEdit", rowId: row.id, colKey: col.key });
        }
        return;
      }
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
        case "Delete":
          e.preventDefault();
          clearSelectionValues();
          break;
        case "Backspace":
          if (selection.type === "cell") {
            const row = visibleRows[selection.row];
            const col = columns[selection.col];
            if (row && col && !state.lockedColumns.includes(col.key)) {
              e.preventDefault();
              setEditSeed("");
              dispatch({ type: "startEdit", rowId: row.id, colKey: col.key });
            }
          }
          break;
        case "Enter":
          if (selection.type === "cell") {
            const row = visibleRows[selection.row];
            const col = columns[selection.col];
            if (row && col && !state.lockedColumns.includes(col.key)) {
              e.preventDefault();
              setEditSeed(null);
              dispatch({ type: "startEdit", rowId: row.id, colKey: col.key });
            }
          }
          break;
      }
    },
    [
      editing,
      totalRows,
      totalCols,
      dispatch,
      clearSelectionValues,
      moveActive,
      selection,
      visibleRows,
      columns,
      state.lockedColumns,
    ],
  );

  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || (!e.ctrlKey && !e.metaKey)) return;
      if (isTextEntryTarget(e.target)) return;
      if (isUndoShortcut(e)) {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
      }
      if (isRedoShortcut(e)) {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [dispatch]);

  useEffect(() => {
    const onGlobalMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("[role='button']")
      ) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        dispatch({ type: "clearSelection" });
      }
    };
    window.addEventListener("mousedown", onGlobalMouseDown);
    return () => window.removeEventListener("mousedown", onGlobalMouseDown);
  }, [dispatch]);

  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="grid"
      aria-rowcount={totalRows}
      aria-colcount={totalCols}
      onKeyDown={handleKeyDown}
      onCopy={handleCopy}
      onCut={handleCut}
      onPaste={handlePaste}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        const isInteractive =
          target.closest('[role="gridcell"]') ||
          target.closest('[data-tutorial-id]') ||
          target.closest("button") ||
          target.closest("input");
        if (!isInteractive) {
          dispatch({ type: "clearSelection" });
          containerRef.current?.focus({ preventScroll: true });
        }
      }}
      className="focusable relative h-full w-full overflow-auto rounded-2xl border border-soft-border bg-white/95 shadow-soft scroll-area"
    >
      <div className="min-w-max">
        <div className="sticky top-0 z-20 flex bg-[var(--header-bg)] shadow-[0_1px_0_var(--grid-line)]">
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
              filterActive={filter.colKey === col.key && !!filter.predicate}
              onSelectColumn={() => dispatch({ type: "selectColumn", col: ci })}
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
              allowRename={allowColumnRename}
              onRename={(title) => dispatch({ type: "renameColumn", colKey: col.key, title })}
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

        <div className="spreadsheet-grid overflow-hidden rounded-b-2xl">
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
                  const selected = isCellSelected(selection, ri, ci);
                  const active = isCellActive(selection, ri, ci);
                  const selectionEdges = selected
                    ? getSelectionEdges(selection, ri, ci, totalRows, totalCols)
                    : null;
                  const previewEdges = fillPreview && isCellInBounds(fillPreview, ri, ci)
                    ? getBoundsEdges(fillPreview, ri, ci)
                    : null;
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
                      selectionEdges={selectionEdges}
                      previewEdges={previewEdges}
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
                      onFillStart={startFill}
                      editSeed={isEditing ? editSeed : null}
                      onCommit={(v: CellValue, moveNext: boolean) => {
                        dispatch({ type: "commitEdit", rowId: row.id, colKey: col.key, value: v });
                        setEditSeed(null);
                        if (moveNext) {
                          dispatch({ type: "selectCell", row: Math.min(totalRows - 1, ri + 1), col: ci });
                          window.requestAnimationFrame(() => {
                            containerRef.current?.focus({ preventScroll: true });
                          });
                        }
                      }}
                      onCancel={() => {
                        setEditSeed(null);
                        dispatch({ type: "cancelEdit" });
                      }}
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
      {clipboardStatus && (
        <div className="pointer-events-none absolute right-3 top-3 z-50 inline-flex items-center gap-1.5 rounded-full border border-soft-border bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-panel backdrop-blur animate-fadeIn">
          <Clipboard className="h-3.5 w-3.5 text-brand-600" />
          {clipboardStatus}
        </div>
      )}
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

interface SelectionEdges {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

function getSelectionEdges(
  sel: SelectionKind,
  row: number,
  col: number,
  totalRows: number,
  totalCols: number,
): SelectionEdges {
  if (sel.type === "cell") {
    return { top: true, right: true, bottom: true, left: true };
  }
  if (sel.type === "row") {
    return {
      top: true,
      right: col === totalCols - 1,
      bottom: true,
      left: col === 0,
    };
  }
  if (sel.type === "column") {
    return {
      top: row === 0,
      right: true,
      bottom: row === totalRows - 1,
      left: true,
    };
  }
  if (sel.type === "range") {
    const { r1, r2, c1, c2 } = normalizeRange(sel.range);
    return {
      top: row === r1,
      right: col === c2,
      bottom: row === r2,
      left: col === c1,
    };
  }
  return { top: false, right: false, bottom: false, left: false };
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

function selectionToBounds(sel: SelectionKind, totalRows: number, totalCols: number) {
  if (totalRows <= 0 || totalCols <= 0 || sel.type === "none") return null;
  if (sel.type === "cell") return { r1: sel.row, r2: sel.row, c1: sel.col, c2: sel.col };
  if (sel.type === "row") return { r1: sel.row, r2: sel.row, c1: 0, c2: totalCols - 1 };
  if (sel.type === "column") return { r1: 0, r2: totalRows - 1, c1: sel.col, c2: sel.col };
  return normalizeRange(sel.range);
}

function fillPreviewBounds(
  source: { r1: number; r2: number; c1: number; c2: number },
  row: number,
  col: number,
) {
  if (row > source.r2) return { r1: source.r1, r2: row, c1: source.c1, c2: source.c2 };
  if (col > source.c2) return { r1: source.r1, r2: source.r2, c1: source.c1, c2: col };
  return null;
}

function isCellInBounds(
  bounds: { r1: number; r2: number; c1: number; c2: number },
  row: number,
  col: number,
) {
  return row >= bounds.r1 && row <= bounds.r2 && col >= bounds.c1 && col <= bounds.c2;
}

function getBoundsEdges(
  bounds: { r1: number; r2: number; c1: number; c2: number },
  row: number,
  col: number,
): SelectionEdges {
  return {
    top: row === bounds.r1,
    right: col === bounds.c2,
    bottom: row === bounds.r2,
    left: col === bounds.c1,
  };
}

function selectionAnchor(sel: SelectionKind) {
  if (sel.type === "cell") return { row: sel.row, col: sel.col };
  if (sel.type === "range") {
    const { r1, c1 } = normalizeRange(sel.range);
    return { row: r1, col: c1 };
  }
  if (sel.type === "row") return { row: sel.row, col: 0 };
  if (sel.type === "column") return { row: 0, col: sel.col };
  return null;
}

function parseClipboardValue(raw: string, col: ColumnDef): CellValue {
  if (raw === "") return null;
  if (col.type !== "number") return raw;
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  // Если число разобрать нельзя, оставляем исходный текст: пользователь увидит проблему в ячейке.
  return Number.isFinite(n) ? clampNumberCellValue(n) : raw;
}

function clampNumberCellValue(value: number): number {
  return Math.max(-MAX_NUMBER_CELL_VALUE, Math.min(MAX_NUMBER_CELL_VALUE, value));
}

function nextSeriesValue(values: CellValue[], index: number): CellValue {
  const filled = values.filter((v) => v !== null && v !== "");
  if (filled.length === 0) return null;
  // Сначала проверяем даты, затем числа; текстовые значения повторяем циклом как в простом fill handle.
  const dates = filled.map((v) => parseSeriesDate(String(v)));
  if (dates.every((d) => d !== null)) {
    const last = dates[dates.length - 1] as Date;
    const prev = dates.length > 1 ? (dates[dates.length - 2] as Date) : null;
    const step = prev ? last.getTime() - prev.getTime() : 24 * 60 * 60 * 1000;
    const next = new Date(last.getTime() + step * (index - values.length + 1));
    return formatSeriesDate(next);
  }
  const nums = filled.map((v) => Number(String(v).replace(",", ".")));
  if (nums.every(Number.isFinite)) {
    const last = nums[nums.length - 1];
    const prev = nums.length > 1 ? nums[nums.length - 2] : null;
    const step = prev === null ? 1 : last - prev;
    return last + step * (index - values.length + 1);
  }
  return filled[(index - values.length) % filled.length] ?? null;
}

function parseSeriesDate(raw: string): Date | null {
  const m = raw.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const yearRaw = Number(m[3]);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function formatSeriesDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
}

function isUndoShortcut(e: KeyboardEvent | React.KeyboardEvent): boolean {
  const key = e.key.toLowerCase();
  // e.code нужен для раскладок вроде русской, где Ctrl+Z приходит как Ctrl+я.
  return key === "z" || e.code === "KeyZ";
}

function isRedoShortcut(e: KeyboardEvent | React.KeyboardEvent): boolean {
  const key = e.key.toLowerCase();
  return key === "y" || e.code === "KeyY";
}

function CornerCell() {
  return (
    <div
      className="sticky left-0 z-30 flex h-9 w-12 shrink-0 items-center justify-center border-b border-r border-soft-border bg-[var(--header-bg)] text-[10px] uppercase tracking-wide text-soft-muted"
      aria-hidden
    />
  );
}

interface ColumnHeaderProps {
  col: ColumnDef;
  colIndex: number;
  isSelected: boolean;
  isInRange: boolean;
  filterActive: boolean;
  onSelectColumn: () => void;
  onResize: (width: number) => void;
  onOpenFilter: () => void;
  onCloseFilter: () => void;
  isFilterOpen: boolean;
  currentFilterValue: string | null;
  uniqueValues: Array<string | number>;
  allowRename: boolean;
  onRename: (title: string) => void;
  onApplyFilter: (value: string | number | null) => void;
}

function ColumnHeader(props: ColumnHeaderProps) {
  const {
    col,
    colIndex,
    isSelected,
    isInRange,
    filterActive,
    onSelectColumn,
    onResize,
    onOpenFilter,
    onCloseFilter,
    isFilterOpen,
    currentFilterValue,
    uniqueValues,
    allowRename,
    onRename,
    onApplyFilter,
  } = props;
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(col.title);

  useEffect(() => {
    setDraftTitle(col.title);
  }, [col.title]);

  const hasTitle = col.title.trim().length > 0;

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

  const commitRename = () => {
    const next = draftTitle.trim();
    if (next && next !== col.title) onRename(next);
    setRenaming(false);
  };

  return (
    <div
      className="relative shrink-0 cursor-pointer border-b border-r border-soft-border"
      style={{ width: col.width }}
      data-tutorial-id={`col-header-${col.key}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("button")) return;
        onSelectColumn();
      }}
    >
      <div
        className={cn(
          "flex h-5 select-none items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-soft-muted transition-colors duration-150 ease-out",
          isSelected && "bg-brand-500 text-white",
          !isSelected && isInRange && "bg-brand-100 text-brand-700",
        )}
      >
        {columnLetter(colIndex)}
      </div>
      <div
        className={cn(
          "group flex h-9 cursor-pointer select-none items-center gap-1 px-2 text-sm font-medium transition-colors duration-150 ease-out",
          isSelected
            ? "bg-brand-500 text-white"
            : isInRange
              ? "bg-brand-50 text-brand-800"
              : "bg-[var(--header-bg)] text-slate-700 hover:bg-slate-100",
        )}
        onDoubleClick={(e) => {
          if (!allowRename) return;
          e.stopPropagation();
          setRenaming(true);
        }}
        title={allowRename ? "Дважды кликни, чтобы назвать колонку" : col.title}
      >
        {renaming || (allowRename && !hasTitle) ? (
          <input
            value={draftTitle}
            placeholder="Назвать колонку"
            aria-label="Название колонки"
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setDraftTitle(col.title);
                setRenaming(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            autoFocus={renaming}
            className="min-w-0 flex-1 rounded-md border border-soft-border bg-white/80 px-1.5 py-0.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-300 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:bg-slate-900 dark:focus:ring-slate-600"
          />
        ) : (
          <span className="truncate">{col.title}</span>
        )}
        <button
          type="button"
          aria-label={`Открыть фильтр по «${col.title}»`}
          title={`Открыть фильтр по «${col.title}»`}
          data-tutorial-id={`filter-${col.key}`}
          className={cn(
            "ml-auto rounded p-1 transition",
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

      <div
        onMouseDown={startResize}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-brand-400/50"
        aria-hidden
      />

      {isFilterOpen && (
        <div
          className="absolute left-0 top-full z-40 mt-1 w-56 animate-fadeIn rounded-2xl border border-soft-border bg-white/95 p-2 shadow-panel backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-xs font-medium text-soft-muted">
              Фильтр по «{col.title}»
            </span>
            <button
              type="button"
              className="rounded-lg p-1 hover:bg-slate-100"
              onClick={onCloseFilter}
              aria-label="Закрыть"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            className={cn(
              "block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100",
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
                    "block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-brand-50",
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
        "sticky left-0 z-10 flex h-9 w-12 shrink-0 cursor-pointer select-none items-center justify-center border-b border-r border-soft-border text-xs font-semibold transition-colors duration-150 ease-out",
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

interface CellProps {
  row: number;
  col: number;
  width: number;
  type: ColumnDef["type"];
  unit?: string;
  value: CellValue;
  selected: boolean;
  active: boolean;
  selectionEdges: SelectionEdges | null;
  previewEdges: SelectionEdges | null;
  highlight: CellHighlight;
  editing: boolean;
  locked: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onDoubleClick: () => void;
  onFillStart: (e: React.MouseEvent) => void;
  editSeed: string | null;
  onCommit: (value: CellValue, moveNext: boolean) => void;
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
    selectionEdges,
    previewEdges,
    highlight,
    editing,
    locked,
    onMouseDown,
    onMouseEnter,
    onDoubleClick,
    onFillStart,
    editSeed,
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
        "relative flex h-9 shrink-0 cursor-cell items-center border-b border-r border-soft-border px-2 text-sm transition-[background-color,border-color,box-shadow,color] duration-150 ease-out",
        !highlight && !selected && "hover:bg-slate-50/70",
        type === "number" ? "justify-end tabular-nums text-slate-800" : "justify-start text-slate-800",
        highlight && HIGHLIGHT_COLORS[highlight],
        selected && "bg-[var(--selection-bg)]",
        active && "z-10",
        locked && "text-slate-500",
      )}
    >
      {selectionEdges && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 opacity-95 transition-[border-color,opacity,box-shadow] duration-150 ease-out",
            selectionEdges.top && "border-t-2 border-[var(--selection-border)]",
            selectionEdges.right && "border-r-2 border-[var(--selection-border)]",
            selectionEdges.bottom && "border-b-2 border-[var(--selection-border)]",
            selectionEdges.left && "border-l-2 border-[var(--selection-border)]",
          )}
        />
      )}
      {previewEdges && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[12] bg-slate-400/10 transition-[background-color,box-shadow,border-color] duration-200 ease-out",
            previewEdges.top && "border-t-2 border-dashed border-slate-500/70",
            previewEdges.right && "border-r-2 border-dashed border-slate-500/70",
            previewEdges.bottom && "border-b-2 border-dashed border-slate-500/70",
            previewEdges.left && "border-l-2 border-dashed border-slate-500/70",
          )}
        />
      )}
      <div
        className={cn(
          "pointer-events-none absolute -inset-px z-20 rounded-[2px] border-2 border-[var(--selection-border)] shadow-[0_0_0_1px_rgba(71,85,105,0.2),0_2px_8px_rgba(71,85,105,0.1)] transition-[opacity,transform,box-shadow] duration-150 ease-out",
          active ? "scale-100 opacity-100" : "scale-[0.985] opacity-0",
        )}
      />
      {active && !editing && (
        <button
          type="button"
          aria-label="Автозаполнение"
          onMouseDown={onFillStart}
          className="absolute -bottom-1.5 -right-1.5 z-30 h-2.5 w-2.5 cursor-crosshair rounded-sm border border-white bg-[var(--selection-border)] p-0 shadow-sm transition duration-150 ease-out hover:scale-125 hover:shadow-[0_0_0_4px_rgba(71,85,105,0.18)] active:scale-110"
        />
      )}
      {editing ? (
        <CellEditor initialValue={value} editSeed={editSeed} type={type} onCommit={onCommit} onCancel={onCancel} />
      ) : (
        <span className="truncate">{display}</span>
      )}
    </div>
  );
}

function CellEditor({
  initialValue,
  editSeed,
  type,
  onCommit,
  onCancel,
}: {
  initialValue: CellValue;
  editSeed: string | null;
  type: ColumnDef["type"];
  onCommit: (v: CellValue, moveNext: boolean) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<string>(editSeed ?? (initialValue === null ? "" : String(initialValue)));
  const ref = useRef<HTMLInputElement | null>(null);
  const committedRef = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    const len = ref.current?.value.length ?? 0;
    ref.current?.setSelectionRange(len, len);
  }, []);
  const commit = (moveNext: boolean) => {
    if (committedRef.current) return;
    committedRef.current = true;
    if (type === "number") {
      const n = Number(v.replace(",", "."));
      if (!Number.isFinite(n)) {
        onCommit(v, moveNext);
        return;
      }
      onCommit(clampNumberCellValue(n), moveNext);
    } else {
      onCommit(v, moveNext);
    }
  };
  return (
    <input
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => commit(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit(true);
        if (e.key === "Escape") onCancel();
      }}
      className="relative z-30 h-full w-full border-0 bg-transparent p-0 text-sm text-inherit outline-none ring-0"
    />
  );
}
