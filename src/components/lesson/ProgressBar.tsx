"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lessons/types";

interface ProgressBarProps {
  lessons: Lesson[];
  currentLessonIndex: number;
  /** Сколько шагов в текущем уроке выполнено. */
  currentStepIndex: number;
  /** Общее число шагов в текущем уроке. */
  currentStepsCount: number;
  /** Список индексов уроков, которые уже полностью пройдены. */
  completedLessons: number[];
  onJumpToLesson: (index: number) => void;
}

/**
 * Сегментированный прогресс-бар по урокам.
 * Каждый сегмент = 1 урок; внутри урока маленький линейный прогресс по шагам.
 */
export function ProgressBar({
  lessons,
  currentLessonIndex,
  currentStepIndex,
  currentStepsCount,
  completedLessons,
  onJumpToLesson,
}: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      {lessons.map((l, i) => {
        const completed = completedLessons.includes(i);
        const current = i === currentLessonIndex;
        const filled = current
          ? Math.min(currentStepIndex / Math.max(currentStepsCount, 1), 1)
          : completed
            ? 1
            : 0;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onJumpToLesson(i)}
            className={cn(
              "group flex flex-1 flex-col gap-1 rounded-lg px-2 py-1.5 text-left transition focusable",
              current ? "bg-brand-50" : "hover:bg-slate-50",
            )}
            title={l.title}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  completed
                    ? "bg-success-500 text-white"
                    : current
                      ? "bg-brand-500 text-white"
                      : "bg-slate-200 text-slate-600",
                )}
              >
                {completed ? <Check className="h-3 w-3" /> : l.badge}
              </div>
              <span
                className={cn(
                  "truncate text-xs font-medium",
                  current ? "text-brand-800" : "text-slate-600",
                )}
              >
                {l.title}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  completed ? "bg-success-500" : "bg-brand-500",
                )}
                style={{ width: `${filled * 100}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
