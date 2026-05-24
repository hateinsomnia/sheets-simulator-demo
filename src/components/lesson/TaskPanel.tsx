"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { ChoiceOption, Lesson, LessonStep } from "@/lessons/types";
import { cn } from "@/lib/utils";

interface TaskPanelProps {
  lesson: Lesson;
  currentStepIndex: number;
  step: LessonStep;
  isStepComplete: boolean;
  isLessonComplete: boolean;
  isLastLesson: boolean;
  demoActive: boolean;
  feedback: { kind: "ok" | "warn"; text: string } | null;
  selectedOptionId: string | null;
  onSelectOption: (id: string) => void;
  onShowDemo: () => void;
  onShowHint: () => void;
  onCheck: () => void;
  onResetTask: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onPrevLesson: () => void;
  onNextLesson: () => void;
  onFinish: () => void;
  hintText: string | null;
}

export function TaskPanel(props: TaskPanelProps) {
  const {
    lesson,
    currentStepIndex,
    step,
    isStepComplete,
    isLessonComplete,
    isLastLesson,
    demoActive,
    feedback,
    selectedOptionId,
    onSelectOption,
    onShowDemo,
    onShowHint,
    onCheck,
    onResetTask,
    onPrevStep,
    onNextStep,
    onPrevLesson,
    onNextLesson,
    onFinish,
    hintText,
  } = props;

  const isChoice = step.check.kind === "choice";
  const choice = lesson.finalChoice;

  return (
    <aside className="flex h-full w-full max-w-md flex-col gap-3 overflow-hidden rounded-2xl border border-soft-border bg-white p-4 shadow-panel">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-semibold text-brand-700">
          {lesson.badge}
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-soft-muted">
            Задание {Number(lesson.badge)} · шаг {currentStepIndex + 1} из {lesson.steps.length}
          </div>
          <h2 className="truncate text-base font-semibold text-slate-900">{lesson.title}</h2>
          <p className="text-xs text-soft-muted">{lesson.subtitle}</p>
        </div>
      </div>

      <div className="rounded-xl bg-brand-50/60 p-3 text-xs text-brand-800">
        <strong className="font-semibold">Зачем это в жизни? </strong>
        {lesson.reallifeNote}
      </div>

      <div className="flex-1 overflow-auto scroll-area">
        <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{step.brief}</p>

        {isChoice && choice && (
          <div className="mt-3 space-y-1.5">
            {choice.options.map((opt) => (
              <ChoiceButton
                key={opt.id}
                option={opt}
                selected={selectedOptionId === opt.id}
                onClick={() => onSelectOption(opt.id)}
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {hintText && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
            >
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{hintText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {demoActive && step.demo.callout && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mt-3 flex gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-900"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-semibold">Сначала смотри, потом повтори</div>
                <div className="mt-0.5">{step.demo.callout}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className={cn(
                "mt-3 flex gap-2 rounded-xl p-3 text-xs",
                feedback.kind === "ok"
                  ? "border border-success-100 bg-success-50 text-success-700"
                  : "border border-rose-200 bg-rose-50 text-rose-800",
              )}
            >
              {feedback.kind === "ok" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
          <ActionButton
            kind="ghost"
            icon={<Play className="h-4 w-4" />}
            label={demoActive ? "Демо идёт" : "Показать демо"}
            onClick={onShowDemo}
            disabled={demoActive}
            tutorialId="btn-demo"
          />
          <ActionButton
            kind="ghost"
            icon={<Lightbulb className="h-4 w-4" />}
            label="Подсказка"
            onClick={onShowHint}
            tutorialId="btn-hint"
          />
          <ActionButton
            kind="ghost"
            icon={<RefreshCw className="h-4 w-4" />}
            label="Сбросить"
            onClick={onResetTask}
            tutorialId="btn-reset"
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <ActionButton
            kind="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            label="Назад"
            onClick={currentStepIndex > 0 ? onPrevStep : onPrevLesson}
            disabled={currentStepIndex === 0 && Number(lesson.badge) === 1}
          />
          <div className="flex-1" />
          {!isStepComplete ? (
            <ActionButton
              kind="primary"
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Проверить"
              onClick={onCheck}
              tutorialId="btn-check"
            />
          ) : !isLessonComplete ? (
            <ActionButton
              kind="primary"
              icon={<ArrowRight className="h-4 w-4" />}
              label="Дальше"
              onClick={onNextStep}
              tutorialId="btn-next"
            />
          ) : isLastLesson ? (
            <ActionButton
              kind="primary"
              icon={<Sparkles className="h-4 w-4" />}
              label="Завершить курс"
              onClick={onFinish}
            />
          ) : (
            <ActionButton
              kind="primary"
              icon={<ArrowRight className="h-4 w-4" />}
              label="Следующее задание"
              onClick={onNextLesson}
              tutorialId="btn-next-lesson"
            />
          )}
        </div>
      </div>
    </aside>
  );
}

function ChoiceButton({
  option,
  selected,
  onClick,
}: {
  option: ChoiceOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition focusable",
        selected
          ? "border-brand-400 bg-brand-50 text-brand-900 shadow-soft"
          : "border-soft-border bg-white text-slate-800 hover:border-brand-300 hover:bg-brand-50/40",
      )}
    >
      <div
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2",
          selected ? "border-brand-500 bg-brand-500" : "border-slate-300 bg-white",
        )}
      >
        {selected && <span className="block h-full w-full rounded-full bg-white scale-[0.4]" />}
      </div>
      <span>{option.label}</span>
    </button>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  kind,
  tutorialId,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  kind: "primary" | "secondary" | "ghost";
  tutorialId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-tutorial-id={tutorialId}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition focusable",
        kind === "primary" &&
          "bg-brand-600 text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 disabled:bg-slate-300 disabled:shadow-none",
        kind === "secondary" &&
          "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:shadow-none",
        kind === "ghost" &&
          "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-800 disabled:opacity-40 disabled:shadow-none",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
