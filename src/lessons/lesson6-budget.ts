import type { Lesson } from "./types";
import type { ColumnDef, RowData } from "@/engine/types";

const budgetColumns: ColumnDef[] = [
  { key: "day", title: "День", type: "text", width: 150 },
  { key: "income", title: "Доход", type: "number", width: 150, unit: "сом" },
  { key: "expense", title: "Расход", type: "number", width: 150, unit: "сом" },
];

const DAYS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

const budgetRows: RowData[] = DAYS.map((name, i) => ({
  id: `budget-day-${i + 1}`,
  values: { day: name, income: null, expense: null },
}));

export const lesson6: Lesson = {
  id: "lesson-6-budget",
  badge: "6",
  title: "Свой бюджет на неделю",
  subtitle: "Запиши свои доходы и расходы — и узнай, сколько у тебя остаётся",
  goal: "Применить всё, что ты выучил(а): составить свою таблицу и одним кликом получить итог.",
  reallifeNote:
    "Так взрослые планируют деньги: записывают, сколько пришло (доходы) и сколько ушло (расходы). Это помогает не остаться без денег к концу месяца и копить на то, что хочется.",
  columns: budgetColumns,
  rows: budgetRows,

  lockedColumns: [],
  allowColumnRename: true,
  budgetCalculator: {
    incomeColKey: "income",
    expenseColKey: "expense",
    currencyLabel: "сом",
    hint: "Один клик — и таблица сама посчитает сумму доходов, расходов и остаток.",
  },
  steps: [
    {
      id: "s1-income",
      title: "Запиши свои доходы за неделю",
      brief:
        "В колонке «Доход» напиши, сколько денег ты получаешь в каждый день: карманные от родителей, подарки, заработок. Если в какой-то день ничего не было — пропусти его.",
      hint: "Дважды кликни по ячейке в колонке «Доход» (или нажми Enter) и введи число. Чтобы перейти на следующую строку — стрелка вниз или Enter после ввода.",
      demo: {
        callout: "Колонка «Доход» — для денег, которые приходят к тебе.",
        highlightTargets: [
          { kind: "columnHeader", colKey: "income", label: "Заполни эту колонку" },
        ],
      },
      check: { kind: "filledCells", colKey: "income", minCount: 1 },
      successMessage:
        "Отлично! Доходы за неделю зафиксированы. Теперь самое интересное — траты.",
    },
    {
      id: "s2-expense",
      title: "Запиши свои расходы за неделю",
      brief:
        "Теперь подумай, на что ты обычно тратишь: булочка в столовой, проезд, мороженое, игрушка, подарок другу. В колонке «Расход» запиши свои траты. Если ничего не тратил(а) — поставь 0 или пропусти.",
      hint: "Перейди в колонку «Расход» и введи свои траты. Можно вводить даже маленькие суммы — 5 или 10 сом.",
      demo: {
        callout: "Колонка «Расход» — для денег, которые ты потратил(а).",
        highlightTargets: [
          { kind: "columnHeader", colKey: "expense", label: "Заполни эту колонку" },
        ],
      },
      check: { kind: "filledCells", colKey: "expense", minCount: 1 },
      successMessage:
        "Готово! Теперь у нас есть и доходы, и расходы. Осталось всё посчитать одним кликом.",
    },
    {
      id: "s3-calculate",
      title: "Нажми «Рассчитать»",
      brief:
        "Один клик — и таблица сама сложит все доходы, все расходы и покажет, сколько у тебя остаётся. Найди зелёную кнопку «Рассчитать» над таблицей и нажми её.",
      hint: "Кнопка «Рассчитать» — большая зелёная, сразу над таблицей. Нажми её один раз — и увидишь итог.",
      demo: {
        callout: "Один клик заменяет десятки вычислений на калькуляторе.",
        highlightTargets: [
          { kind: "selector", selector: "[data-tutorial-id='btn-calculate']", label: "Нажми сюда" },
        ],
      },
      check: { kind: "calculated" },
      successMessage:
        "Поздравляю! Ты составил(а) свою первую таблицу-бюджет и впервые применил(а) автоматический расчёт. Теперь ты знаешь, сколько у тебя остаётся к концу недели — и можешь планировать траты заранее.",
    },
  ],
};
