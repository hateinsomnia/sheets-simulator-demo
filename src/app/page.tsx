"use client";

import { useState } from "react";
import { IntroScreen } from "@/components/intro/IntroScreen";
import { LessonView } from "@/components/lesson/LessonView";

/**
 * Корневая страница тренажёра.
 * Управляет переключением между:
 *   - intro-экраном (онбординг);
 *   - основным экраном тренажёра (LessonView).
 */
export default function HomePage() {
  const [screen, setScreen] = useState<"intro" | "lesson">("intro");

  if (screen === "intro") {
    return <IntroScreen onStart={() => setScreen("lesson")} />;
  }
  return <LessonView onBackToIntro={() => setScreen("intro")} />;
}
