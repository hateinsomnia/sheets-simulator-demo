"use client";

import { useEffect, useState } from "react";
import type { HighlightTarget } from "@/lessons/types";

interface HighlightOverlayProps {
  targets: HighlightTarget[];
  /** Если true — overlay не пропускает клики (фокусирует ребёнка на цели). */
  blocking?: boolean;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  label?: string;
}

/**
 * Overlay, который рисует пульсирующее кольцо вокруг указанных DOM-элементов.
 * Принципы:
 *  - элементы находим по data-tutorial-id или произвольному CSS selector;
 *  - на resize/scroll пересчитываем координаты;
 *  - overlay не блокирует клики по самой цели (только подсвечивает).
 */
export function HighlightOverlay({ targets, blocking = false }: HighlightOverlayProps) {
  const [rects, setRects] = useState<Rect[]>([]);

  useEffect(() => {
    if (targets.length === 0) {
      setRects([]);
      return;
    }
    const compute = () => {
      const next: Rect[] = [];
      for (const t of targets) {
        const el = resolveTarget(t);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        next.push({
          top: r.top + window.scrollY - 6,
          left: r.left + window.scrollX - 6,
          width: r.width + 12,
          height: r.height + 12,
          label: "label" in t ? t.label : undefined,
        });
      }
      setRects(next);
    };
    compute();
    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const id = window.setInterval(compute, 400); // дешёвый rAF-подобный пересчёт
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearInterval(id);
    };
  }, [targets]);

  if (rects.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30"
      aria-hidden
      style={{ pointerEvents: blocking ? "auto" : "none" }}
    >
      {rects.map((r, i) => (
        <div
          key={i}
          className="tutorial-ring"
          style={{ top: r.top, left: r.left, width: r.width, height: r.height }}
        >
          {r.label && (
            <div
              className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white shadow-soft"
              style={{ pointerEvents: "none" }}
            >
              {r.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function resolveTarget(t: HighlightTarget): Element | null {
  if (t.kind === "selector") {
    return document.querySelector(t.selector);
  }
  if (t.kind === "columnHeader") {
    return document.querySelector(`[data-tutorial-id='col-header-${t.colKey}']`);
  }
  if (t.kind === "rowHeader") {
    return document.querySelector(`[data-tutorial-id='row-header-${t.rowIndex}']`);
  }
  if (t.kind === "cell") {
    // Для конкретной ячейки нужно знать DOM-зону. Простой путь — через aria-rowindex
    // и порядок gridcell. Но проще отдельно подсветить через spreadsheetDemo (highlights).
    // Здесь используем эвристику через шапку колонки (label стоит над колонкой).
    const grid = document.querySelector("[role='grid']");
    if (!grid) return null;
    const rowEl = grid.querySelector(`[role='row'][aria-rowindex='${t.rowIndex + 1}']`);
    if (!rowEl) return null;
    // Внутри row первый child — RowHeader, дальше идут gridcell в порядке колонок.
    const cells = rowEl.querySelectorAll("[role='gridcell']");
    return cells[t.colIndex] ?? null;
  }
  return null;
}
