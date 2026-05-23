"use client";

import { useState } from "react";
import { FreeModeView } from "@/components/free/FreeModeView";
import { IntroScreen } from "@/components/intro/IntroScreen";
import { LessonView } from "@/components/lesson/LessonView";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function HomePage() {
  const [screen, setScreen] = useState<"intro" | "lesson" | "free">("intro");

  if (screen === "intro") {
    return (
      <>
        <IntroScreen
          onStart={() => setScreen("lesson")}
          onStartFreeMode={() => setScreen("free")}
        />
        <ThemeToggle />
      </>
    );
  }
  if (screen === "free") {
    return (
      <>
        <FreeModeView onBackToIntro={() => setScreen("intro")} />
      </>
    );
  }
  return (
    <>
      <LessonView onBackToIntro={() => setScreen("intro")} />
    </>
  );
}
