"use client";

import { useMemo } from "react";
import { Hash } from "lucide-react";
import type { SpreadsheetState } from "@/engine/types";
import { columnLetter } from "@/engine/selection";
import { filterRows, sortRows } from "@/engine/sortFilter";
import { formatNumber } from "@/lib/utils";

interface FormulaBarProps {
  state: SpreadsheetState;
}

export function FormulaBar({ state }: FormulaBarProps) {
  const { selection, rows, columns, sort, filter } = state;

  const visibleRows = useMemo(() => {
    const filterCol = columns.find((c) => c.key === filter.colKey);
    const sortCol = columns.find((c) => c.key === sort.colKey);
    return sortRows(filterRows(rows, filterCol, filter.predicate), sortCol, sort.direction);
  }, [rows, columns, sort, filter]);

  const info = useMemo(() => {
    if (selection.type === "cell") {
      const row = visibleRows[selection.row];
      const col = columns[selection.col];
      if (!row || !col) return null;
      const v = row.values[col.key];
      return {
        addr: `${columnLetter(selection.col)}${selection.row + 1}`,
        title: col.title,
        value:
          v === null || v === undefined
            ? "—"
            : col.type === "number"
              ? formatNumber(Number(v), col.unit)
              : String(v),
      };
    }
    if (selection.type === "range") {
      const r = selection.range;
      return {
        addr: `${columnLetter(Math.min(r.anchorCol, r.focusCol))}${Math.min(r.anchorRow, r.focusRow) + 1}:${columnLetter(Math.max(r.anchorCol, r.focusCol))}${Math.max(r.anchorRow, r.focusRow) + 1}`,
        title: "Диапазон",
        value: `${(Math.abs(r.focusRow - r.anchorRow) + 1) * (Math.abs(r.focusCol - r.anchorCol) + 1)} ячеек`,
      };
    }
    if (selection.type === "row") {
      return {
        addr: `Строка ${selection.row + 1}`,
        title: "Целая строка",
        value: `${columns.length} ячеек`,
      };
    }
    if (selection.type === "column") {
      const col = columns[selection.col];
      return {
        addr: `${columnLetter(selection.col)}`,
        title: col?.title ?? "Колонка",
        value: `${visibleRows.length} строк`,
      };
    }
    return null;
  }, [selection, visibleRows, columns]);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-soft-border bg-white/90 px-3 py-2 text-sm shadow-soft backdrop-blur-xl">
      <div className="flex h-7 min-w-[64px] items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-semibold text-slate-700">
        {info?.addr ?? "—"}
      </div>
      <Hash className="h-4 w-4 text-soft-muted" />
      {info ? (
        <span className="truncate">
          <span className="text-soft-muted">{info.title}:</span>{" "}
          <span className="font-medium text-slate-800">{info.value}</span>
        </span>
      ) : (
        <span className="text-soft-muted">Выдели любую ячейку, строку или колонку</span>
      )}
    </div>
  );
}
