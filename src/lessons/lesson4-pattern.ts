import type { Lesson } from "./types";
import { clubsColumns, clubsRows } from "./data/clubsAttendance";

export const lesson4: Lesson = {
  id: "lesson-4-pattern",
  badge: "4",
  title: "Поиск закономерности",
  subtitle: "Видим, в какие дни активность стабильно выше",
  goal: "Научиться замечать повторяющиеся паттерны — это первый шаг к анализу данных.",
  reallifeNote:
    "Закономерности помогают планировать: например, понять, в какие дни приходит больше всего детей и подготовиться заранее.",
  columns: clubsColumns,
  rows: clubsRows,
  lockedColumns: ["club"],
  steps: [
    {
      id: "s1-look",
      title: "Выдели строку «Шахматы»",
      brief:
        "В этом задании нужно найти закономерность в посещаемости кружка «Шахматы». Сначала выдели эту строку, и посмотри, какие дни выделяются?",
      hint: "Нажми на номер строки с кружком «Шахматы». Самые большие числа в этой строке стоят во вторник и четверг.",
      demo: {
        callout: "Я выделяю строку «Шахматы» — по ней мы и будем искать закономерность.",
        highlightTargets: [{ kind: "rowHeader", rowIndex: 1, label: "Эта строка" }],
        spreadsheetDemo: {
          rowIds: ["chess"],
          color: "blue",
        },
      },
      check: { kind: "selectRow", rowIndex: 1 },
      successMessage: "Отлично! Теперь присмотрись, в какие дни посетителей больше всего?",
    },
    {
      id: "s2-paint",
      title: "Покрась зелёным дни, в которые детей было больше всего",
      brief:
        "Выдели обе ячейки и покрась их зелёным цветом, чтобы зафиксировать закономерность.",
      hint: "Выдели ячейку «Шахматы / Вт» и нажми зелёную заливку. Затем сделай то же самое для «Шахматы / Чт».",
      demo: {
        callout: "Подсветка зелёным — наш способ сказать «здесь что-то важное».",
        highlightTargets: [
          { kind: "selector", selector: "[data-tutorial-id='fill-green']", label: "Зелёная заливка" },
        ],
        spreadsheetDemo: {
          cells: [
            { rowId: "chess", colKey: "tue" },
            { rowId: "chess", colKey: "thu" },
          ],
          color: "green",
        },
      },
      check: {
        kind: "highlightCells",
        cells: [
          { rowId: "chess", colKey: "tue" },
          { rowId: "chess", colKey: "thu" },
        ],
        color: "green",
      },
      successMessage:
        "Класс! Видно, что шахматы стабильно популярны во вторник и четверг.",
    },
    {
      id: "s3-choice",
      title: "Какой вывод правильный?",
      brief: "Выбери самый точный вывод о закономерности.",
      hint: "Подумай, в какие именно дни идут самые большие числа в строке «Шахматы».",
      demo: {
        callout: "Закономерность — это что-то, что повторяется по понятному правилу.",
      },
      check: { kind: "choice", correctOptionId: "tue-thu" },
      successMessage:
        "Точно! На шахматы стабильно больше всего детей именно во вторник и четверг.",
    },
  ],
  finalChoice: {
    prompt: "Что говорят данные о шахматном кружке?",
    options: [
      { id: "tue-thu", label: "На шахматы во вторник и четверг детей стабильно больше." },
      { id: "weekend", label: "На шахматы дети в основном ходят в выходные." },
      { id: "drop", label: "Посещаемость шахмат каждый день падает." },
      { id: "same", label: "На шахматы во все дни ходит одинаковое количество детей." },
    ],
    correctOptionId: "tue-thu",
    explanation:
      "Числа во вторник (18) и четверг (20) явно выше, чем в другие дни — это и есть закономерность.",
  },
};
