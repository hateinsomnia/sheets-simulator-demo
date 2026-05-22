"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Eraser,
  PaintBucket,
  RotateCcw,
} from "lucide-react";
import type {
  CellHighlight,
  SpreadsheetState,
} from "@/engine/types";
import type { SpreadsheetAction } from "@/engine/reducer";
import { cn } from "@/lib/utils";
import { selectionToCells } from "@/engine/selection";

interface ToolbarProps {
  state: SpreadsheetState;
  dispatch: (a: SpreadsheetAction) => void;
  /** Сбросить весь прогресс задания (вызывает родитель). */
  onResetTask: () => void;
}

const FILL_OPTIONS: Array<{ color: NonNullable<CellHighlight>; label: string; bg: string; ring: string }> = [
  { color: "yellow", label: "Жёлтый", bg: "bg-yellow-200", ring: "ring-yellow-300" },
  { color: "green", label: "Зелёный", bg: "bg-emerald-200", ring: "ring-emerald-300" },
  { color: "red", label: "Красный", bg: "bg-rose-200", ring: "ring-rose-300" },
  { color: "blue", label: "Синий", bg: "bg-sky-200", ring: "ring-sky-300" },
];

export function Toolbar({ state, dispatch, onResetTask }: ToolbarProps) {
  const { selection, columns, rows, sort } = state;

  const applyFill = (color: NonNullable<CellHighlight>) => {
    const cells = selectionToCells(selection, rows.length, columns.length);
    if (cells.length === 0) return;
    const addresses = cells
      .map((c) => {
        const row = rows[c.row];
        const col = columns[c.col];
        if (!row || !col) return null;
        return { rowId: row.id, colKey: col.key };
      })
      .filter((x): x is { rowId: string; colKey: string } => x !== null);
    dispatch({ type: "highlightCells", addresses, color });
  };

  const clearFillForSelection = () => {
    const cells = selectionToCells(selection, rows.length, columns.length);
    const addresses = cells
      .map((c) => {
        const row = rows[c.row];
        const col = columns[c.col];
        if (!row || !col) return null;
        return { rowId: row.id, colKey: col.key };
      })
      .filter((x): x is { rowId: string; colKey: string } => x !== null);
    dispatch({ type: "highlightCells", addresses, color: null });
  };

  // Если выделена колонка — кнопками сортировки сортируем именно её.
  const activeColKey = (() => {
    if (selection.type === "column") return columns[selection.col]?.key ?? null;
    if (selection.type === "cell") return columns[selection.col]?.key ?? null;
    if (selection.type === "range") return columns[selection.range.focusCol]?.key ?? null;
    return null;
  })();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-soft-border bg-white p-2 shadow-soft">
      <ToolGroup>
        <ToolButton
          label="Сортировать по возрастанию"
          onClick={() =>
            activeColKey &&
            dispatch({ type: "setSort", colKey: activeColKey, direction: "asc" })
          }
          disabled={!activeColKey}
          active={!!activeColKey && sort.colKey === activeColKey && sort.direction === "asc"}
          icon={<ArrowUpAZ className="h-4 w-4" />}
        />
        <ToolButton
          label="Сортировать по убыванию"
          onClick={() =>
            activeColKey &&
            dispatch({ type: "setSort", colKey: activeColKey, direction: "desc" })
          }
          disabled={!activeColKey}
          active={!!activeColKey && sort.colKey === activeColKey && sort.direction === "desc"}
          icon={<ArrowDownAZ className="h-4 w-4" />}
        />
      </ToolGroup>

      <Divider />

      <ToolGroup>
        <span className="px-2 text-xs font-medium text-soft-muted">Заливка</span>
        {FILL_OPTIONS.map((opt) => (
          <button
            key={opt.color}
            type="button"
            data-tutorial-id={`fill-${opt.color}`}
            onClick={() => applyFill(opt.color)}
            disabled={selection.type === "none"}
            title={`Покрасить ${opt.label.toLowerCase()}`}
            className={cn(
              "h-7 w-7 rounded-md border border-soft-border transition hover:scale-105 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50",
              opt.bg,
            )}
          />
        ))}
        <ToolButton
          label="Снять заливку"
          onClick={clearFillForSelection}
          disabled={selection.type === "none"}
          icon={<Eraser className="h-4 w-4" />}
        />
        <ToolButton
          label="Снять всю заливку"
          onClick={() => dispatch({ type: "clearHighlights" })}
          icon={<PaintBucket className="h-4 w-4 rotate-180" />}
          variant="ghost"
        />
      </ToolGroup>

      <Divider />

      <ToolGroup>
        <button
          type="button"
          onClick={onResetTask}
          className="inline-flex items-center gap-1.5 rounded-md border border-soft-border px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          title="Сбросить прогресс задания"
          data-tutorial-id="reset-task"
        >
          <RotateCcw className="h-4 w-4" />
          Сбросить
        </button>
      </ToolGroup>
    </div>
  );
}

function ToolGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

function Divider() {
  return <div className="h-6 w-px bg-soft-border" />;
}

function ToolButton({
  icon,
  label,
  onClick,
  disabled,
  active,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "default" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border text-slate-700 transition",
        variant === "default"
          ? "border-soft-border hover:bg-slate-50"
          : "border-transparent hover:bg-slate-50",
        active && "border-brand-300 bg-brand-50 text-brand-700",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {icon}
    </button>
  );
}
