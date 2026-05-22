import type { ReactNode } from "react";
import type {
  CellHighlight,
  ColumnDef,
  RowData,
  SelectionKind,
  SortState,
  FilterState,
  SpreadsheetState,
} from "@/engine/types";

/**
 * Сценарный шаг внутри одного задания.
 * Каждый шаг — это (а) объяснение/демо и (б) проверяемое действие ребёнка.
 *
 * Архитектурно мы отделяем:
 *   - условие шага (что объясняем);
 *   - демо (что подсветить и показать как пример);
 *   - проверку (что должен сделать ребёнок);
 *   - feedback при ошибке.
 */
export interface LessonStep {
  id: string;
  /** Короткий заголовок шага в task panel. */
  title: string;
  /** Что нужно сделать — простыми словами для ребёнка. */
  brief: string;
  /** Подсказка по нажатию кнопки "Подсказка". */
  hint: string;
  /** Демонстрация — что подсветить и какой пример показать. */
  demo: LessonDemo;
  /** Способ проверки шага. */
  check: LessonCheck;
  /** Сообщение об успешном завершении шага. */
  successMessage: string;
}

export interface LessonDemo {
  /** Что подсветить в интерфейсе во время демо. Список зон интерфейса. */
  highlightTargets?: HighlightTarget[];
  /**
   * Демо-эффект на самой таблице (необязательный).
   * Это может быть подсветка ячеек/колонки/строки, чтобы показать,
   * как должно выглядеть правильное действие.
   */
  spreadsheetDemo?: SpreadsheetDemo;
  /** Подсказка-баннер во время демо (короткое объяснение). */
  callout?: string;
}

/** Куда указывает highlight overlay. Используется data-tutorial-id в DOM. */
export type HighlightTarget =
  | { kind: "selector"; selector: string; label?: string }
  | { kind: "columnHeader"; colKey: string; label?: string }
  | { kind: "rowHeader"; rowIndex: number; label?: string }
  | { kind: "cell"; rowIndex: number; colIndex: number; label?: string };

export interface SpreadsheetDemo {
  /** Набор ячеек/строк/колонок для подсветки во время демо. */
  cells?: Array<{ rowId: string; colKey: string }>;
  rowIds?: string[];
  colKeys?: string[];
  color?: CellHighlight;
}

/**
 * Способы проверки выполнения шага.
 * Каждый вариант — детерминированная функция от состояния таблицы.
 */
export type LessonCheck =
  /** Должна быть выделена конкретная колонка (по ключу). */
  | { kind: "selectColumn"; colKey: string }
  /** Должна быть выделена конкретная строка (по индексу). */
  | { kind: "selectRow"; rowIndex: number }
  /** Должна быть активна ячейка (rowId + colKey). */
  | { kind: "selectCell"; rowId: string; colKey: string }
  /** Выделение должно совпасть с конкретным набором rowId+colKey (как множество). */
  | { kind: "selectCells"; cells: Array<{ rowId: string; colKey: string }> }
  /** Должны быть подсвечены конкретные ячейки нужным цветом. */
  | { kind: "highlightCells"; cells: Array<{ rowId: string; colKey: string }>; color: Exclude<CellHighlight, null> }
  /** Должна быть применена сортировка по колонке/направлению. */
  | { kind: "sort"; colKey: string; direction: "asc" | "desc" }
  /** Должен быть применён фильтр. */
  | { kind: "filter"; colKey: string; predicate: import("@/engine/types").FilterPredicate }
  /** Должен быть выбран один из вариантов на multiple choice. */
  | { kind: "choice"; correctOptionId: string }
  /** Композиция: все условия должны выполняться одновременно. */
  | { kind: "all"; checks: LessonCheck[] };

/** Данные урока. */
export interface Lesson {
  id: string;
  /** Иконка/эмодзи или короткий тег для сайдбара. */
  badge: string;
  title: string;
  subtitle: string;
  /** Учебная цель — что ребёнок поймёт после прохождения. */
  goal: string;
  /** Жизненный сценарий (объяснение, зачем это в реальной жизни). */
  reallifeNote: string;
  columns: ColumnDef[];
  rows: RowData[];
  lockedColumns?: string[];
  steps: LessonStep[];
  /**
   * Опционально: вопрос-вывод после последнего шага
   * (например, "Какой день — аномалия?").
   */
  finalChoice?: ChoiceQuestion;
}

export interface ChoiceQuestion {
  prompt: string;
  options: ChoiceOption[];
  correctOptionId: string;
  /** Объяснение, почему этот ответ правильный (показывается в success). */
  explanation: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

/**
 * Параметры, которые передаются в renderer-компонент TaskPanel
 * для нестандартного контента (например, варианты ответа).
 */
export interface LessonContext {
  state: SpreadsheetState;
  selection: SelectionKind;
  sort: SortState;
  filter: FilterState;
}

/** Удобный wrapper для richtext (не злоупотребляем — только если нужно подчеркнуть слово). */
export type RichText = ReactNode;
