"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Calculator, Wallet } from "lucide-react";
import type { BudgetCalculatorConfig } from "@/lessons/types";
import type { SpreadsheetState } from "@/engine/types";
import { cn, formatNumber } from "@/lib/utils";

interface BudgetCalculatorProps {
  config: BudgetCalculatorConfig;
  state: SpreadsheetState;
  hasCalculated: boolean;
  onCalculate: () => void;
}

export function BudgetCalculator({
  config,
  state,
  hasCalculated,
  onCalculate,
}: BudgetCalculatorProps) {
  const { incomeColKey, expenseColKey, currencyLabel, hint } = config;

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let incomeFilled = 0;
    let expenseFilled = 0;
    for (const row of state.rows) {
      const inc = toNumber(row.values[incomeColKey]);
      const exp = toNumber(row.values[expenseColKey]);
      if (inc !== null) {
        income += inc;
        incomeFilled += 1;
      }
      if (exp !== null) {
        expense += exp;
        expenseFilled += 1;
      }
    }
    return {
      income,
      expense,
      balance: income - expense,
      incomeFilled,
      expenseFilled,
    };
  }, [state.rows, incomeColKey, expenseColKey]);

  const balancePositive = totals.balance > 0;
  const balanceZero = totals.balance === 0;

  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-soft backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-brand-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 shadow-sm">
            <Calculator className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Итоги недели</div>
            <div className="text-xs text-soft-muted">
              {hint ?? "Один клик — и таблица сама посчитает доход, расход и остаток."}
            </div>
          </div>
        </div>

        <div className="ml-auto">
          <button
            type="button"
            data-tutorial-id="btn-calculate"
            onClick={onCalculate}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold shadow-md transition hover:-translate-y-0.5 focusable",
              hasCalculated
                ? "bg-success-500 text-white hover:bg-success-600 shadow-success-500/20"
                : "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20",
            )}
          >
            <Calculator className="h-4 w-4" />
            {hasCalculated ? "Пересчитать" : "Рассчитать"}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {hasCalculated && (
          <motion.div
            key="result"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <ResultCard
                tone="income"
                icon={<ArrowDownCircle className="h-4 w-4" />}
                label="Доходы"
                value={totals.income}
                currency={currencyLabel}
                hint={`${totals.incomeFilled} ${plural(totals.incomeFilled, "запись", "записи", "записей")}`}
              />
              <ResultCard
                tone="expense"
                icon={<ArrowUpCircle className="h-4 w-4" />}
                label="Расходы"
                value={totals.expense}
                currency={currencyLabel}
                hint={`${totals.expenseFilled} ${plural(totals.expenseFilled, "запись", "записи", "записей")}`}
              />
              <ResultCard
                tone={balancePositive || balanceZero ? "good" : "bad"}
                icon={<Wallet className="h-4 w-4" />}
                label="Остаток"
                value={totals.balance}
                currency={currencyLabel}
                hint={
                  balanceZero
                    ? "Ты потратил(а) ровно столько, сколько получил(а). Баланс в ноль — это аккуратно, но копить пока нечего."
                    : balancePositive
                      ? "Доходов хватило — можно копить!"
                      : "Расходы больше доходов. Подумай, где можно сэкономить."
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultCard({
  tone,
  icon,
  label,
  value,
  currency,
  hint,
}: {
  tone: "income" | "expense" | "good" | "bad";
  icon: React.ReactNode;
  label: string;
  value: number;
  currency?: string;
  hint?: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    income: "border-brand-200 bg-brand-50/60 text-brand-900",
    expense: "border-amber-200 bg-amber-50/70 text-amber-900",
    good: "border-success-100 bg-success-50 text-success-700",
    bad: "border-rose-200 bg-rose-50 text-rose-800",
  };
  const iconClasses: Record<typeof tone, string> = {
    income: "bg-brand-100 text-brand-700",
    expense: "bg-amber-100 text-amber-700",
    good: "bg-success-100 text-success-700",
    bad: "bg-rose-100 text-rose-700",
  };
  return (
    <div className={cn("flex items-start gap-2 rounded-2xl border p-3 shadow-sm", toneClasses[tone])}>
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", iconClasses[tone])}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide opacity-80">{label}</div>
        <div className="text-lg font-semibold tabular-nums">
          {formatNumber(value, currency)}
        </div>
        {hint && <div className="text-[11px] opacity-80">{hint}</div>}
      </div>
    </div>
  );
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return null;
    // Поддерживаем пользовательский ввод с пробелами-разделителями и десятичной запятой.
    const n = Number(trimmed.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
