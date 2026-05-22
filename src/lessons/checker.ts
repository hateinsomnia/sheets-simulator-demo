import type { LessonCheck } from "./types";
import type { SpreadsheetState } from "@/engine/types";
import { selectionToCells } from "@/engine/selection";

export interface CheckContext {
  state: SpreadsheetState;
  /**
   * Текущий выбранный пользователем option (если шаг — choice).
   * null значит "ничего не выбрано".
   */
  selectedOptionId: string | null;
}

export interface CheckResult {
  ok: boolean;
  reason?: string;
}

/**
 * Чистая, детерминированная проверка состояния задания.
 * Никаких побочных эффектов — это позволяет нам тестировать checker отдельно.
 */
export function runCheck(check: LessonCheck, ctx: CheckContext): CheckResult {
  const { state, selectedOptionId } = ctx;
  switch (check.kind) {
    case "selectColumn": {
      if (state.selection.type !== "column") {
        return { ok: false, reason: "Нужно выделить целую колонку (нажми на её заголовок A, B, C…)." };
      }
      const col = state.columns[state.selection.col];
      if (!col || col.key !== check.colKey) {
        return { ok: false, reason: "Это не та колонка. Посмотри на заголовки и попробуй ещё раз." };
      }
      return { ok: true };
    }
    case "selectRow": {
      if (state.selection.type !== "row") {
        return { ok: false, reason: "Нужно выделить целую строку (нажми на её номер слева)." };
      }
      if (state.selection.row !== check.rowIndex) {
        return { ok: false, reason: "Это не та строка. Сравни номер строки с заданием." };
      }
      return { ok: true };
    }
    case "selectCell": {
      const cells = selectionToCells(state.selection, state.rows.length, state.columns.length);
      if (cells.length !== 1) {
        return { ok: false, reason: "Нужно выделить только одну ячейку." };
      }
      const c = cells[0];
      const row = state.rows[c.row];
      const col = state.columns[c.col];
      if (!row || !col) return { ok: false, reason: "Ячейка вне таблицы." };
      if (row.id !== check.rowId || col.key !== check.colKey) {
        return { ok: false, reason: "Это другая ячейка. Сравни заголовок колонки и номер строки." };
      }
      return { ok: true };
    }
    case "selectCells": {
      const cells = selectionToCells(state.selection, state.rows.length, state.columns.length);
      const got = new Set(
        cells
          .map((c) => {
            const r = state.rows[c.row];
            const col = state.columns[c.col];
            if (!r || !col) return "";
            return `${r.id}|${col.key}`;
          })
          .filter(Boolean),
      );
      const need = new Set(check.cells.map((c) => `${c.rowId}|${c.colKey}`));
      if (got.size !== need.size) {
        return { ok: false, reason: "Выделено не столько ячеек, сколько нужно. Попробуй ещё раз." };
      }
      for (const k of need) {
        if (!got.has(k)) return { ok: false, reason: "Часть нужных ячеек не выделена." };
      }
      return { ok: true };
    }
    case "highlightCells": {
      const need = check.cells.map((c) => `${c.rowId}|${c.colKey}`);
      for (const k of need) {
        if (state.highlights[k] !== check.color) {
          return {
            ok: false,
            reason: "Не все нужные ячейки покрашены нужным цветом. Выдели их и нажми кнопку с цветом.",
          };
        }
      }
      // Проверим, что лишних ячеек тем же цветом не покрашено.
      for (const [k, color] of Object.entries(state.highlights)) {
        if (color === check.color && !need.includes(k)) {
          return { ok: false, reason: "Покрашено лишнее. Сбрось лишние ячейки и оставь только нужные." };
        }
      }
      return { ok: true };
    }
    case "sort": {
      if (state.sort.colKey !== check.colKey || state.sort.direction !== check.direction) {
        return {
          ok: false,
          reason: "Сортировка ещё не подходит. Нажми на стрелочку в нужной колонке.",
        };
      }
      return { ok: true };
    }
    case "filter": {
      if (state.filter.colKey !== check.colKey || !state.filter.predicate) {
        return { ok: false, reason: "Фильтр ещё не применён. Открой фильтр в нужной колонке." };
      }
      const a = state.filter.predicate;
      const b = check.predicate;
      if (a.kind !== b.kind) return { ok: false, reason: "Тип фильтра не подходит." };
      if (a.kind === "equals" && b.kind === "equals" && String(a.value) !== String(b.value))
        return { ok: false, reason: "Значение фильтра не подходит." };
      if (a.kind === "gte" && b.kind === "gte" && a.value !== b.value)
        return { ok: false, reason: "Граница фильтра не подходит." };
      if (a.kind === "lte" && b.kind === "lte" && a.value !== b.value)
        return { ok: false, reason: "Граница фильтра не подходит." };
      if (a.kind === "contains" && b.kind === "contains" && a.value !== b.value)
        return { ok: false, reason: "Текст фильтра не подходит." };
      return { ok: true };
    }
    case "choice": {
      if (!selectedOptionId) {
        return { ok: false, reason: "Выбери один из вариантов ответа." };
      }
      if (selectedOptionId !== check.correctOptionId) {
        return { ok: false, reason: "Это не самый точный ответ. Посмотри на данные ещё раз." };
      }
      return { ok: true };
    }
    case "all": {
      for (const c of check.checks) {
        const r = runCheck(c, ctx);
        if (!r.ok) return r;
      }
      return { ok: true };
    }
    default:
      return { ok: false, reason: "Неизвестный тип проверки." };
  }
}
