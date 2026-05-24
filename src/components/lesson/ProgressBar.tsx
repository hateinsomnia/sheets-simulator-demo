"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lessons/types";

interface ProgressBarProps {
  lessons: Lesson[];
  currentLessonIndex: number;
  currentStepIndex: number;
  currentStepsCount: number;
  completedLessons: number[];
  onJumpToLesson: (index: number) => void;
}

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
        const isUnlocked = i === 0 || completedLessons.includes(i - 1);
        const filled = current
          ? Math.min(currentStepIndex / Math.max(currentStepsCount, 1), 1)
          : completed
            ? 1
            : 0;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => isUnlocked ? onJumpToLesson(i) : undefined}
            disabled={!isUnlocked}
            className={cn(
              "lesson-progress-item group flex flex-1 flex-col gap-1 rounded-xl px-2 py-1.5 text-left transition focusable",
              current
                ? "lesson-progress-item-current bg-brand-50 shadow-sm"
                : isUnlocked
                  ? "hover:bg-slate-50"
                  : "cursor-not-allowed opacity-50",
            )}
            title={isUnlocked ? l.title : "Завершите предыдущий модуль для разблокировки"}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "lesson-progress-badge flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold shadow-sm",
                  completed
                    ? "lesson-progress-badge-completed bg-success-500 text-white"
                    : current
                      ? "lesson-progress-badge-current bg-brand-500 text-white"
                      : isUnlocked
                        ? "lesson-progress-badge-idle bg-slate-200 text-slate-600"
                        : "bg-slate-100 text-slate-400",
                )}
              >
                {completed ? <Check className="h-3 w-3" /> : !isUnlocked ? <Lock className="h-3 w-3" /> : l.badge}
              </div>
              <span
                className={cn(
                  "lesson-progress-title truncate text-xs font-medium",
                  current ? "lesson-progress-title-current text-brand-800" : "text-slate-600",
                )}
              >
                {l.title}
              </span>
            </div>
            <div className="lesson-progress-track h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn(
                  "lesson-progress-fill h-full transition-all duration-300",
                  completed ? "lesson-progress-fill-completed bg-success-500" : "lesson-progress-fill-current bg-brand-500",
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
