import type { RangeSelection, SelectionKind } from "./types";

export function normalizeRange(r: RangeSelection) {
  const r1 = Math.min(r.anchorRow, r.focusRow);
  const r2 = Math.max(r.anchorRow, r.focusRow);
  const c1 = Math.min(r.anchorCol, r.focusCol);
  const c2 = Math.max(r.anchorCol, r.focusCol);
  return { r1, r2, c1, c2 };
}

export function isCellSelected(
  selection: SelectionKind,
  row: number,
  col: number,
  totalRows: number,
  totalCols: number,
): boolean {
  switch (selection.type) {
    case "none":
      return false;
    case "cell":
      return selection.row === row && selection.col === col;
    case "row":
      return selection.row === row;
    case "column":
      return selection.col === col;
    case "range": {
      const { r1, r2, c1, c2 } = normalizeRange(selection.range);
      return row >= r1 && row <= r2 && col >= c1 && col <= c2;
    }
    default:
      
      void totalRows;
      void totalCols;
      return false;
  }
}

export function isCellActive(selection: SelectionKind, row: number, col: number): boolean {
  if (selection.type === "cell") {
    return selection.row === row && selection.col === col;
  }
  if (selection.type === "range") {
    return selection.range.focusRow === row && selection.range.focusCol === col;
  }
  return false;
}

export function selectionToCells(
  sel: SelectionKind,
  totalRows: number,
  totalCols: number,
): Array<{ row: number; col: number }> {
  if (sel.type === "none") return [];
  if (sel.type === "cell") return [{ row: sel.row, col: sel.col }];
  if (sel.type === "row") {
    const list: Array<{ row: number; col: number }> = [];
    for (let c = 0; c < totalCols; c++) list.push({ row: sel.row, col: c });
    return list;
  }
  if (sel.type === "column") {
    const list: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < totalRows; r++) list.push({ row: r, col: sel.col });
    return list;
  }
  
  const { r1, r2, c1, c2 } = normalizeRange(sel.range);
  const list: Array<{ row: number; col: number }> = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      list.push({ row: r, col: c });
    }
  }
  return list;
}

export function columnLetter(index: number): string {
  
  let n = index;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}
