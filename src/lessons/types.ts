import type { CellHighlight, ColumnDef, RowData } from "@/engine/types";

export interface LessonStep {
  id: string;
  title: string;
  brief: string;
  hint: string;
  demo: LessonDemo;
  check: LessonCheck;
  successMessage: string;
}

export interface LessonDemo {
  highlightTargets?: HighlightTarget[];
  spreadsheetDemo?: SpreadsheetDemo;
  callout?: string;
}

export type HighlightTarget =
  | { kind: "selector"; selector: string; label?: string }
  | { kind: "columnHeader"; colKey: string; label?: string }
  | { kind: "rowHeader"; rowIndex: number; label?: string }
  | { kind: "cell"; rowIndex: number; colIndex: number; label?: string };

export interface SpreadsheetDemo {
  cells?: Array<{ rowId: string; colKey: string }>;
  rowIds?: string[];
  colKeys?: string[];
  color?: CellHighlight;
}

export type LessonCheck =
  | { kind: "selectColumn"; colKey: string }
  | { kind: "selectRow"; rowIndex: number }
  | { kind: "selectCell"; rowId: string; colKey: string }
  | { kind: "selectCells"; cells: Array<{ rowId: string; colKey: string }> }
  | { kind: "highlightCells"; cells: Array<{ rowId: string; colKey: string }>; color: Exclude<CellHighlight, null> }
  | { kind: "sort"; colKey: string; direction: "asc" | "desc" }
  | { kind: "filter"; colKey: string; predicate: import("@/engine/types").FilterPredicate }
  | { kind: "choice"; correctOptionId: string }
  | { kind: "filledCells"; colKey: string; minCount: number }
  | { kind: "calculated" }
  | { kind: "all"; checks: LessonCheck[] };

export interface Lesson {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  goal: string;
  reallifeNote: string;
  columns: ColumnDef[];
  rows: RowData[];
  lockedColumns?: string[];
  steps: LessonStep[];
  finalChoice?: ChoiceQuestion;
  budgetCalculator?: BudgetCalculatorConfig;
  allowColumnRename?: boolean;
}

export interface BudgetCalculatorConfig {
  incomeColKey: string;
  expenseColKey: string;
  currencyLabel?: string;
  hint?: string;
}

export interface ChoiceQuestion {
  prompt: string;
  options: ChoiceOption[];
  correctOptionId: string;
  explanation: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
}
