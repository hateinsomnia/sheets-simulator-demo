"use client";

import { useMemo, useReducer } from "react";
import { ChevronLeft, Plus, Rows3, Sparkles, Trash2 } from "lucide-react";
import { FormulaBar } from "@/components/spreadsheet/FormulaBar";
import { Spreadsheet } from "@/components/spreadsheet/Spreadsheet";
import { Toolbar } from "@/components/spreadsheet/Toolbar";
import { createInitialState, spreadsheetReducer } from "@/engine/reducer";
import type { ColumnDef, RowData } from "@/engine/types";

interface FreeModeViewProps {
  onBackToIntro: () => void;
}

export function FreeModeView({ onBackToIntro }: FreeModeViewProps) {
  const dataset = useMemo(createFreeModeDataset, []);
  const [state, dispatch] = useReducer(
    spreadsheetReducer,
    dataset,
    (d) => createInitialState(d.columns, d.rows),
  );

  return (
    <div className="flex h-screen w-full flex-col bg-soft-bg">
      <header className="flex flex-col gap-3 border-b border-soft-border bg-white/80 px-4 py-3 backdrop-blur md:flex-row md:items-center md:gap-4">
        <button
          type="button"
          onClick={onBackToIntro}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-soft-border bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focusable"
        >
          <ChevronLeft className="h-4 w-4" />
          К началу
        </button>
        <div className="hidden h-6 w-px bg-soft-border md:block" />
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            Свободный режим
          </div>
          <h1 className="mt-1 truncate text-lg font-semibold text-slate-900">Собери свою таблицу и проверь инструменты</h1>
          <p className="text-sm text-soft-muted">Дважды кликни по заголовку колонки, чтобы переименовать её. Дважды кликни по ячейке или нажми Enter, чтобы ввести значение.</p>
        </div>
      </header>

      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        <section className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-soft-border bg-white p-2 shadow-soft">
            <FreeActionButton icon={<Rows3 className="h-4 w-4" />} label="Строка" onClick={() => dispatch({ type: "addRow" })} />
            <FreeActionButton icon={<Plus className="h-4 w-4" />} label="Колонка" onClick={() => dispatch({ type: "addColumn" })} />
            <FreeActionButton icon={<Trash2 className="h-4 w-4" />} label="Очистить" onClick={() => dispatch({ type: "clearValues" })} />
          </div>
          <Toolbar state={state} dispatch={dispatch} onResetTask={() => dispatch({ type: "clearValues" })} />
          <FormulaBar state={state} />
          <div className="min-h-0 flex-1">
            <Spreadsheet state={state} dispatch={dispatch} allowColumnRename />
          </div>
        </section>
      </main>
    </div>
  );
}

function FreeActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-soft-border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-800 focusable"
    >
      {icon}
      {label}
    </button>
  );
}

function createFreeModeDataset(): { columns: ColumnDef[]; rows: RowData[] } {
  const columns: ColumnDef[] = [
    { key: "free_col_1", title: "", type: "text", width: 160 },
    { key: "free_col_2", title: "", type: "text", width: 160 },
    { key: "free_col_3", title: "", type: "text", width: 160 },
    { key: "free_col_4", title: "", type: "text", width: 160 },
  ];
  const rows: RowData[] = Array.from({ length: 24 }).map((_, i) => ({
    id: `free-row-${i + 1}`,
    values: Object.fromEntries(columns.map((c) => [c.key, null])),
  }));
  return { columns, rows };
}
