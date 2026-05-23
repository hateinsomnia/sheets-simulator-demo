"use client";

import { motion } from "framer-motion";
import { ArrowRight, Columns3, Grid3x3, MousePointer2, Rows3, Sparkles } from "lucide-react";

interface IntroScreenProps {
  onStart: () => void;
  onStartFreeMode: () => void;
}

/**
 * Onboarding-экран. Цель — за 30 секунд дать ребёнку:
 *   1) понимание, что таблица состоит из строк/колонок/ячеек;
 *   2) понимание, зачем это в реальной жизни;
 *   3) ясный CTA "Начать урок".
 */
export function IntroScreen({ onStart, onStartFreeMode }: IntroScreenProps) {
  return (
    <div className="mx-auto flex min-h-[100vh] w-full max-w-5xl flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            Тренажёр таблиц для 4–8 классов
          </span>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Учимся работать с таблицами{" "}
            <span className="text-brand-600">как настоящие аналитики</span>
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base text-slate-600 sm:text-lg">
            За 5 коротких заданий ты научишься выделять данные, сортировать, искать аномалии,
            замечать закономерности и делать выводы — на примерах из жизни.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <ConceptCard
            icon={<Columns3 className="h-5 w-5" />}
            title="Колонка"
            description="Это столбик данных, у которого есть заголовок: «Товар», «Цена», «День»."
            preview={
              <div className="grid grid-cols-3 gap-1">
                {["A", "B", "C"].map((l, i) => (
                  <div
                    key={l}
                    className={
                      "rounded-md py-1.5 text-center text-[11px] font-semibold " +
                      (i === 1
                        ? "bg-brand-500 text-white"
                        : "bg-slate-100 text-slate-600")
                    }
                  >
                    {l}
                  </div>
                ))}
              </div>
            }
          />
          <ConceptCard
            icon={<Rows3 className="h-5 w-5" />}
            title="Строка"
            description="Это полоска данных слева направо. У каждой строки есть номер: 1, 2, 3…"
            preview={
              <div className="space-y-1">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className={
                      "flex items-center gap-1 rounded-md p-1 " +
                      (n === 2 ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600")
                    }
                  >
                    <span className="w-4 text-center text-[11px] font-semibold">{n}</span>
                    <div className="h-1.5 flex-1 rounded bg-white/60" />
                  </div>
                ))}
              </div>
            }
          />
          <ConceptCard
            icon={<Grid3x3 className="h-5 w-5" />}
            title="Ячейка"
            description="Одна клеточка на пересечении строки и колонки — например, B2."
            preview={
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      "h-6 rounded-md " +
                      (i === 4
                        ? "bg-brand-500 ring-2 ring-brand-300"
                        : "bg-slate-100")
                    }
                  />
                ))}
              </div>
            }
          />
        </div>

        <div className="mt-10 rounded-2xl border border-soft-border bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-slate-900">Где используется работа с таблицами</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <Step n={1} text="1 пример" />
            <Step n={2} text="2 пример" />
            <Step n={3} text="3 пример" />
            <Step n={4} text="4 пример" />
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStart}
            className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-brand-700 focusable"
          >
            Начать урок
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={onStartFreeMode}
            className="group inline-flex items-center gap-2 rounded-xl border border-soft-border bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 focusable"
          >
            <MousePointer2 className="h-4 w-4 transition group-hover:rotate-[-8deg]" />
            Свободный режим
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-soft-muted">
          Можно открывать на ноутбуке или большом планшете. Используй мышь и клавиатуру.
        </p>
      </motion.div>
    </div>
  );
}

function ConceptCard({
  icon,
  title,
  description,
  preview,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  preview: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-soft-border bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2 text-brand-700">
        {icon}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mt-1.5 text-sm text-slate-600">{description}</p>
      <div className="mt-3">{preview}</div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
        {n}
      </span>
      <span className="text-sm text-slate-700">{text}</span>
    </li>
  );
}
