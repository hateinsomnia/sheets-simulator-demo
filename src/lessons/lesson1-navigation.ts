import type { Lesson } from "./types";
import { bufetColumns, bufetRows } from "./data/bufetSales";

export const lesson1: Lesson = {
  id: "lesson-1-navigation",
  badge: "1",
  title: "Знакомство с таблицей",
  subtitle: "Что такое строки, колонки и ячейки",
  goal: "Научиться видеть структуру таблицы и выделять нужные части.",
  reallifeNote:
    "Так в школьном буфете считают, сколько чего продали за неделю. Чтобы быстро найти нужное число, важно понимать, где колонка, а где строка.",
  columns: bufetColumns,
  rows: bufetRows,
  lockedColumns: ["day"],
  steps: [
    {
      id: "s1-col",
      title: "Выдели колонку «Пирожки»",
      brief:
        "Колонка — это столбик данных сверху вниз. У каждой колонки есть заголовок (Пирожки, Чай, Выручка). Нажми на заголовок «Пирожки», чтобы выделить всю колонку.",
      hint: "Заголовок колонки — это серая ячейка в самом верху со словом «Пирожки». Нажми прямо на это слово.",
      demo: {
        callout: "Смотри: я нажимаю на заголовок «Пирожки» — выделяется вся колонка сверху вниз.",
        highlightTargets: [
          { kind: "columnHeader", colKey: "buns", label: "Нажми сюда" },
        ],
        spreadsheetDemo: {
          colKeys: ["buns"],
          color: "blue",
        },
      },
      check: { kind: "selectColumn", colKey: "buns" },
      successMessage: "Отлично! Это была вся колонка «Пирожки» — сверху вниз.",
    },
    {
      id: "s2-row",
      title: "Выдели строку «Среда»",
      brief:
        "Строка — это полоска данных слева направо. У каждой строки слева есть номер. Нажми на номер строки со «Средой», чтобы выделить её целиком.",
      hint: "Слева от таблицы есть столбик с номерами 1, 2, 3… Среда — третья строка с данными. Нажми на её номер.",
      demo: {
        callout: "Чтобы выделить строку, нужно нажать на её номер слева.",
        highlightTargets: [
          { kind: "rowHeader", rowIndex: 2, label: "Нажми на номер" },
        ],
        spreadsheetDemo: {
          rowIds: ["wed"],
          color: "blue",
        },
      },
      check: { kind: "selectRow", rowIndex: 2 },
      successMessage: "Здорово! Ты выделил(а) всю строку «Среда» — все данные за этот день.",
    },
    {
      id: "s3-cell",
      title: "Выбери ячейку: Пятница / Выручка",
      brief:
        "Ячейка — это одна клеточка, где встречаются строка и колонка. Найди строку «Пятница» и колонку «Выручка» — и нажми на эту ячейку.",
      hint: "Веди пальцем (или взглядом) по строке «Пятница» вправо до колонки «Выручка». Это и есть нужная ячейка.",
      demo: {
        callout: "Ячейка стоит на пересечении строки и колонки.",
        highlightTargets: [
          { kind: "cell", rowIndex: 4, colIndex: 3, label: "Эта ячейка" },
        ],
        spreadsheetDemo: {
          cells: [{ rowId: "fri", colKey: "revenue" }],
          color: "blue",
        },
      },
      check: { kind: "selectCell", rowId: "fri", colKey: "revenue" },
      successMessage: "Точно! Эта ячейка показывает выручку буфета в пятницу.",
    },
  ],
};
