"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Spreadsheet } from "@/components/spreadsheet/Spreadsheet";
import { Toolbar } from "@/components/spreadsheet/Toolbar";
import { FormulaBar } from "@/components/spreadsheet/FormulaBar";
import { TaskPanel } from "@/components/lesson/TaskPanel";
import { ProgressBar } from "@/components/lesson/ProgressBar";
import { CelebrationModal } from "@/components/lesson/CelebrationModal";
import { BudgetCalculator } from "@/components/lesson/BudgetCalculator";
import { HighlightOverlay } from "@/components/highlight/HighlightOverlay";
import {
  createInitialState,
  spreadsheetReducer,
} from "@/engine/reducer";
import type { Lesson } from "@/lessons/types";
import { lessons } from "@/lessons";
import { runCheck } from "@/lessons/checker";

interface LessonViewProps {
  onBackToIntro: () => void;
}

export function LessonView({ onBackToIntro }: LessonViewProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const lesson: Lesson = lessons[currentLessonIndex];

  const [state, dispatch] = useReducer(
    spreadsheetReducer,
    lesson,
    (l) => createInitialState(l.columns, l.rows, l.lockedColumns ?? []),
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepCompletedMap, setStepCompletedMap] = useState<Record<string, boolean>>({});
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [lessonStepMap, setLessonStepMap] = useState<Record<number, number>>({});

  const [demoActive, setDemoActive] = useState(false);
  const [demoTargetsKey, setDemoTargetsKey] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<null | { kind: "lesson" | "course" }>(null);

  const [hasCalculated, setHasCalculated] = useState(false);

  const step = lesson.steps[currentStepIndex];
  const stepCompleteKey = `${currentLessonIndex}:${currentStepIndex}`;
  const isStepComplete = !!stepCompletedMap[stepCompleteKey];
  const isLessonComplete = lesson.steps.every(
    (_s, i) => !!stepCompletedMap[`${currentLessonIndex}:${i}`],
  );
  const isLastLesson = currentLessonIndex === lessons.length - 1;

  const demoTimerRef = useRef<number | null>(null);
  const demoSnapshotRef = useRef<{
    highlights: typeof state.highlights;
    selection: typeof state.selection;
  } | null>(null);

  useEffect(() => {
    dispatch({
      type: "loadDataset",
      columns: lesson.columns,
      rows: lesson.rows,
      lockedColumns: lesson.lockedColumns ?? [],
    });
    if (demoTimerRef.current) {
      window.clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    demoSnapshotRef.current = null;
    setFeedback(null);
    setHintText(null);
    setDemoActive(false);
    setSelectedOptionId(null);
    setHasCalculated(false);
  }, [lesson]);

  useEffect(() => {
    if (demoTimerRef.current) {
      window.clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    demoSnapshotRef.current = null;
    setDemoActive(false);
  }, [currentStepIndex]);

  const startDemo = useCallback(() => {
    if (demoActive) return;
    setDemoActive(true);
    setDemoTargetsKey((k) => k + 1);
    setHintText(null);
    setFeedback(null);

    const sd = step.demo.spreadsheetDemo;
    if (sd) {
      // Демо временно меняет подсветку/выделение, поэтому сохраняем состояние для восстановления после таймера.
      demoSnapshotRef.current = {
        highlights: { ...state.highlights },
        selection: state.selection,
      };

      if (sd.cells && sd.color) {
        dispatch({ type: "highlightCells", addresses: sd.cells, color: sd.color });
      }

      if (sd.rowIds && sd.color) {
        const idxs = sd.rowIds
          .map((id) => lesson.rows.findIndex((r) => r.id === id))
          .filter((i) => i >= 0);
        idxs.forEach((rowIdx) => {
          dispatch({ type: "selectRow", row: rowIdx });
        });
      }

      if (sd.colKeys && sd.color) {
        const cidxs = sd.colKeys
          .map((k) => lesson.columns.findIndex((c) => c.key === k))
          .filter((i) => i >= 0);
        cidxs.forEach((cIdx) => {
          dispatch({ type: "selectColumn", col: cIdx });
        });
      }
    }

    if (demoTimerRef.current) window.clearTimeout(demoTimerRef.current);
    demoTimerRef.current = window.setTimeout(() => {
      const snap = demoSnapshotRef.current;
      if (snap) {
        dispatch({ type: "clearHighlights" });
        const entries = Object.entries(snap.highlights);
        if (entries.length > 0) {
          for (const [k, color] of entries) {
            const [rowId, colKey] = k.split("|");
            if (color) {
              dispatch({
                type: "highlightCells",
                addresses: [{ rowId, colKey }],
                color,
              });
            }
          }
        }
        if (snap.selection.type === "none") {
          dispatch({ type: "clearSelection" });
        }
      }
      setDemoActive(false);
    }, 2200);
  }, [demoActive, step, state.highlights, state.selection, lesson]);

  useEffect(() => {
    return () => {
      if (demoTimerRef.current) window.clearTimeout(demoTimerRef.current);
    };
  }, []);

  const handleShowHint = useCallback(() => {
    setHintText(step.hint);
  }, [step]);

  const handleResetTask = useCallback(() => {
    dispatch({ type: "resetState" });
    setFeedback(null);
    setHintText(null);
    setSelectedOptionId(null);
    setHasCalculated(false);
    setCurrentStepIndex(0);
    setLessonStepMap((prev) => ({ ...prev, [currentLessonIndex]: 0 }));

    setStepCompletedMap((prev) => {
      const next = { ...prev };
      lesson.steps.forEach((_, i) => {
        delete next[`${currentLessonIndex}:${i}`];
      });
      return next;
    });
  }, [currentLessonIndex, lesson.steps]);

  const handleCheck = useCallback(() => {
    const result = runCheck(step.check, { state, selectedOptionId, hasCalculated });
    if (result.ok) {
      setFeedback({ kind: "ok", text: step.successMessage });
      setStepCompletedMap((prev) => ({ ...prev, [stepCompleteKey]: true }));
    } else {
      setFeedback({
        kind: "warn",
        text: result.reason ?? "Чуть-чуть не то. Попробуй ещё раз — или нажми «Подсказка».",
      });
    }
  }, [step, state, selectedOptionId, hasCalculated, stepCompleteKey]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < lesson.steps.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      setLessonStepMap((prev) => ({ ...prev, [currentLessonIndex]: next }));
      setFeedback(null);
      setHintText(null);
      setSelectedOptionId(null);
    }
  }, [currentStepIndex, lesson.steps.length, currentLessonIndex]);

  const handlePrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      setLessonStepMap((prevMap) => ({ ...prevMap, [currentLessonIndex]: prev }));
      setFeedback(null);
      setHintText(null);
      setSelectedOptionId(null);
    }
  }, [currentStepIndex, currentLessonIndex]);

  const handlePrevLesson = useCallback(() => {
    if (currentLessonIndex === 0) return;
    const prevIdx = currentLessonIndex - 1;
    setCurrentLessonIndex(prevIdx);
    setCurrentStepIndex(lessonStepMap[prevIdx] ?? 0);
  }, [currentLessonIndex, lessonStepMap]);

  const handleJumpToLesson = useCallback(
    (idx: number) => {
      if (idx === currentLessonIndex) return;
      const isUnlocked = idx === 0 || completedLessons.includes(idx - 1);
      if (!isUnlocked) return;
      setCurrentLessonIndex(idx);
      setCurrentStepIndex(lessonStepMap[idx] ?? 0);
    },
    [currentLessonIndex, completedLessons, lessonStepMap],
  );

  const handleNextLesson = useCallback(() => {
    if (!isLessonComplete) return;
    setCompletedLessons((prev) => (prev.includes(currentLessonIndex) ? prev : [...prev, currentLessonIndex]));
    setCelebration({ kind: "lesson" });
  }, [isLessonComplete, currentLessonIndex]);

  const handleFinishCourse = useCallback(() => {
    if (!isLessonComplete) return;
    setCompletedLessons((prev) => (prev.includes(currentLessonIndex) ? prev : [...prev, currentLessonIndex]));
    setCelebration({ kind: "course" });
  }, [isLessonComplete, currentLessonIndex]);

  const handleCelebrationContinue = useCallback(() => {
    if (!celebration) return;
    if (celebration.kind === "lesson") {
      const next = currentLessonIndex + 1;
      if (next < lessons.length) {
        setCurrentLessonIndex(next);
        setCurrentStepIndex(lessonStepMap[next] ?? 0);
      }
    }
    setCelebration(null);
  }, [celebration, currentLessonIndex, lessonStepMap]);

  const handleCelebrationRestart = useCallback(() => {
    setCelebration(null);
    setCurrentLessonIndex(0);
    setCurrentStepIndex(0);
    setStepCompletedMap({});
    setCompletedLessons([]);
    setLessonStepMap({});
  }, []);

  const overlayTargets = useMemo(() => {
    void demoTargetsKey;
    if (!demoActive) return [];
    return step.demo.highlightTargets ?? [];
  }, [demoActive, step, demoTargetsKey]);

  return (
    <div className="flex h-screen w-full flex-col bg-soft-bg">
      <header className="flex flex-col gap-3 border-b border-white/50 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl md:flex-row md:items-center md:gap-4">
        <button
          type="button"
          onClick={onBackToIntro}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-soft-border bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 shadow-soft hover:-translate-y-0.5 hover:bg-white focusable"
        >
          <ChevronLeft className="h-4 w-4" />
          К началу
        </button>
        <div className="hidden h-6 w-px bg-soft-border md:block" />
        <div className="flex-1">
          <ProgressBar
            lessons={lessons}
            currentLessonIndex={currentLessonIndex}
            currentStepIndex={isLessonComplete ? lesson.steps.length : currentStepIndex}
            currentStepsCount={lesson.steps.length}
            completedLessons={completedLessons}
            onJumpToLesson={handleJumpToLesson}
          />
        </div>
      </header>

      <main className="flex flex-1 gap-4 overflow-hidden p-3 sm:p-4">
        <section className="flex min-w-0 flex-1 flex-col gap-3">
          <Toolbar state={state} dispatch={dispatch} onResetTask={handleResetTask} />
          <FormulaBar state={state} />
          {lesson.budgetCalculator && (
            <BudgetCalculator
              config={lesson.budgetCalculator}
              state={state}
              hasCalculated={hasCalculated}
              onCalculate={() => setHasCalculated(true)}
            />
          )}
          <div className="min-h-0 flex-1">
            <Spreadsheet
              state={state}
              dispatch={dispatch}
              allowColumnRename={!!lesson.allowColumnRename}
            />
          </div>
        </section>

        <TaskPanel
          lesson={lesson}
          currentStepIndex={currentStepIndex}
          step={step}
          isStepComplete={isStepComplete}
          isLessonComplete={isLessonComplete}
          isLastLesson={isLastLesson}
          demoActive={demoActive}
          feedback={feedback}
          selectedOptionId={selectedOptionId}
          onSelectOption={setSelectedOptionId}
          onShowDemo={startDemo}
          onShowHint={handleShowHint}
          onCheck={handleCheck}
          onResetTask={handleResetTask}
          onPrevStep={handlePrevStep}
          onNextStep={handleNextStep}
          onPrevLesson={handlePrevLesson}
          onNextLesson={handleNextLesson}
          onFinish={handleFinishCourse}
          hintText={hintText}
        />
      </main>

      <HighlightOverlay targets={overlayTargets} />

      <CelebrationModal
        open={!!celebration}
        kind={celebration?.kind ?? "lesson"}
        lessonTitle={lesson.title}
        totalLessons={lessons.length}
        onContinue={handleCelebrationContinue}
        onRestart={celebration?.kind === "course" ? handleCelebrationRestart : undefined}
      />
    </div>
  );
}
