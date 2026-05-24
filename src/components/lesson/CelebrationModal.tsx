"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";

interface CelebrationModalProps {
  open: boolean;
  kind: "lesson" | "course";
  lessonTitle?: string;
  totalLessons?: number;
  onContinue: () => void;
  onRestart?: () => void;
}

export function CelebrationModal({
  open,
  kind,
  lessonTitle,
  totalLessons,
  onContinue,
  onRestart,
}: CelebrationModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="celebration-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", duration: 0.45 }}
            className="celebration-modal-card w-full max-w-md rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-panel"
          >
            <div className="flex items-center gap-3">
              <div className="celebration-modal-icon flex h-12 w-12 items-center justify-center rounded-2xl bg-success-100 text-success-700 shadow-sm">
                {kind === "course" ? (
                  <Trophy className="h-6 w-6" />
                ) : (
                  <Sparkles className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="celebration-modal-title text-lg font-semibold text-slate-900">
                  {kind === "course" ? "Курс пройден!" : "Задание выполнено"}
                </h3>
                <p className="celebration-modal-subtitle text-sm text-slate-600">
                  {kind === "course"
                    ? `Ты прошёл(ла) ${totalLessons ?? 5} заданий и научился(лась) реальным навыкам работы с таблицами.`
                    : lessonTitle
                      ? `Ты закончил(а) задание «${lessonTitle}». Готов(а) к следующему?`
                      : "Готов(а) к следующему шагу?"}
                </p>
              </div>
            </div>

            <ul className="celebration-modal-list mt-5 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="celebration-modal-bullet mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Ты учишь те же навыки, что используют аналитики и взрослые на работе.
              </li>
              <li className="flex gap-2">
                <span className="celebration-modal-bullet mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Каждый шаг — это часть большого умения «думать данными».
              </li>
              {kind === "course" && (
                <li className="flex gap-2">
                  <span className="celebration-modal-bullet mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  Ты можешь повторить любое задание в любой момент.
                </li>
              )}
            </ul>

            <div className="mt-6 flex justify-end gap-2">
              {kind === "course" && onRestart && (
                <button
                  type="button"
                  onClick={onRestart}
                  className="celebration-modal-secondary rounded-xl border border-soft-border px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 focusable"
                >
                  Пройти заново
                </button>
              )}
              <button
                type="button"
                onClick={onContinue}
                className="celebration-modal-primary inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-3 py-2 text-sm font-medium text-white shadow-soft hover:from-brand-700 hover:to-brand-600 focusable"
              >
                {kind === "course" ? "Хорошо" : "Продолжить"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
