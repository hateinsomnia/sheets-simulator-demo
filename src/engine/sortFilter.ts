import type {
  ColumnDef,
  FilterPredicate,
  RowData,
  SortDirection,
} from "./types";

export function sortRows(
  rows: RowData[],
  column: ColumnDef | undefined,
  direction: SortDirection,
): RowData[] {
  if (!column || !direction) return rows;
  // Сортировка используется для visibleRows, поэтому не мутируем исходный state.rows.
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = a.values[column.key];
    const bv = b.values[column.key];

    // Пустые значения всегда уводим вниз, чтобы они не мешали учебным сравнениям.
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (column.type === "number") {
      const an = Number(av);
      const bn = Number(bv);
      return direction === "asc" ? an - bn : bn - an;
    }
    const as = String(av).toLocaleLowerCase("ru");
    const bs = String(bv).toLocaleLowerCase("ru");
    if (as < bs) return direction === "asc" ? -1 : 1;
    if (as > bs) return direction === "asc" ? 1 : -1;
    return 0;
  });
  return copy;
}

export function filterRows(
  rows: RowData[],
  column: ColumnDef | undefined,
  predicate: FilterPredicate | null,
): RowData[] {
  if (!column || !predicate) return rows;
  return rows.filter((row) => {
    const value = row.values[column.key];
    if (value === null || value === undefined) return false;
    switch (predicate.kind) {
      case "equals":
        if (column.type === "number") return Number(value) === Number(predicate.value);
        return String(value) === String(predicate.value);
      case "gte":
        return Number(value) >= predicate.value;
      case "lte":
        return Number(value) <= predicate.value;
      case "contains":
        return String(value).toLocaleLowerCase("ru").includes(predicate.value.toLocaleLowerCase("ru"));
      default:
        return true;
    }
  });
}
