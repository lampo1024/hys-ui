import { gridKeyToken } from "./gridCore";
import type {
  HysTableColumn,
  HysTableFilter,
  HysTableFilters,
  HysTableFilterValue,
  HysTableSort,
  TableHeader,
} from "./tableTypes";
export type * from "./tableTypes";

export const tableToken = gridKeyToken;
export function tableValue(
  row: object,
  path: string | readonly (string | number)[],
): unknown {
  const parts = typeof path === "string" ? path.split(".") : path;
  let value: unknown = row;
  for (const part of parts) {
    if (value == null || typeof value !== "object") return;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}
export const tableBreakpoint = (width: number) =>
  width < 576
    ? "xs"
    : width < 768
      ? "sm"
      : width < 992
        ? "md"
        : width < 1200
          ? "lg"
          : width < 1600
            ? "xl"
            : "xxl";
export function tableColumns<T extends object>(
  input: readonly HysTableColumn<T>[],
  breakpoint: ReturnType<typeof tableBreakpoint>,
  showExpandColumn = true,
) {
  const seen = new Set<string>();
  function normalize(
    list: readonly HysTableColumn<T>[],
    inherited?: "left" | "right",
    path = new Set<object>(),
    depth = 0,
  ): HysTableColumn<T>[] {
    if (depth > 32) return [];
    return list.flatMap((source) => {
      if (
        path.has(source) ||
        source.hidden ||
        (!showExpandColumn && source.type === "expand") ||
        (source.responsive && !source.responsive.includes(breakpoint)) ||
        seen.has(source.key)
      )
        return [];
      seen.add(source.key);
      const fixed =
        source.fixed === false
          ? undefined
          : source.fixed === true
            ? "left"
            : (source.fixed ?? inherited);
      const children = source.children
        ? normalize(
            source.children,
            fixed,
            new Set([...path, source]),
            depth + 1,
          )
        : undefined;
      return children && !children.length
        ? []
        : [{ ...source, fixed, children }];
    });
  }
  const roots = normalize(input);
  function partition(
    list: readonly HysTableColumn<T>[],
    side?: "left" | "right",
  ): HysTableColumn<T>[] {
    return list.flatMap((c) => {
      if (c.children) {
        const children = partition(c.children, side);
        return children.length ? [{ ...c, children, fixed: side }] : [];
      }
      return c.fixed === side ? [c] : [];
    });
  }
  const ordered = [
    ...partition(roots, "left"),
    ...partition(roots),
    ...partition(roots, "right"),
  ];
  function leaves(list: readonly HysTableColumn<T>[]): HysTableColumn<T>[] {
    return list.flatMap((c) => (c.children ? leaves(c.children) : [c]));
  }
  function depth(list: readonly HysTableColumn<T>[]): number {
    return Math.max(
      1,
      ...list.map((c) => (c.children ? 1 + depth(c.children) : 1)),
    );
  }
  const levels = depth(ordered),
    headers: TableHeader<T>[][] = Array.from({ length: levels }, () => []);
  function visit(list: readonly HysTableColumn<T>[], level: number) {
    for (const c of list) {
      const all = c.children ? leaves(c.children) : [c];
      headers[level].push({
        column: c,
        key: c.key + ":" + (c.fixed || "center"),
        leaves: all,
        colspan: all.length,
        rowspan: c.children ? 1 : levels - level,
        fixed: c.fixed === "left" || c.fixed === "right" ? c.fixed : undefined,
      });
      if (c.children) visit(c.children, level + 1);
    }
  }
  visit(ordered, 0);
  const leafColumns = leaves(ordered);
  const positions = new Map(leafColumns.map((column, index) => [column.key, index]));
  const mergedHeaders = headers.map((row) => {
    const result: TableHeader<T>[] = [];
    for (let index = 0; index < row.length; index++) {
      const header = row[index];
      const span = header.column.headerColSpan;
      if (span === 0) {
        result.push({ ...header, blank: true });
        continue;
      }
      if (span === undefined || !Number.isSafeInteger(span) || span <= 1 || header.column.children) {
        result.push(header);
        continue;
      }
      const merged = [...header.leaves];
      const start = positions.get(merged[0].key)!;
      while (merged.length < span) {
        const next = row[index + 1];
        if (!next || next.column.children || next.column.type && next.column.type !== "default" ||
            next.fixed !== header.fixed || next.rowspan !== header.rowspan ||
            positions.get(next.column.key) !== start + merged.length) break;
        merged.push(next.column);
        index++;
      }
      result.push({ ...header, leaves: merged, colspan: merged.length });
    }
    return result;
  });
  return { leaves: leafColumns, headers: mergedHeaders };
}
export function tableCompare<T extends object>(
  sorts: readonly HysTableSort[],
  columns: readonly HysTableColumn<T>[],
) {
  const collator = new Intl.Collator("zh-CN", {
    numeric: true,
    sensitivity: "base",
  });
  const rules = sorts.flatMap((sort) => {
    const column = columns.find((c) => c.key === sort.key);
    return column && column.sortable !== "custom" ? [{ ...sort, column }] : [];
  });
  return (a: T, b: T) => {
    for (const { direction, column } of rules) {
      if (column.sorter) {
        const result = column.sorter(a, b);
        if (Number.isFinite(result) && result !== 0)
          return (direction === "asc" ? 1 : -1) * result;
        continue;
      }
      const fields = Array.isArray(column.sortBy)
        ? column.sortBy
        : [column.sortBy ?? column.dataIndex ?? column.key];
      for (const field of fields) {
        const av =
            typeof field === "function"
              ? field(a)
              : tableValue(a, field as string | readonly (string | number)[]),
          bv =
            typeof field === "function"
              ? field(b)
              : tableValue(b, field as string | readonly (string | number)[]);
        if (av == null || bv == null) {
          if (av == null && bv == null) continue;
          return av == null ? 1 : -1;
        }
        const result =
          typeof av === "number" && typeof bv === "number"
            ? Number.isNaN(av)
              ? Number.isNaN(bv)
                ? 0
                : 1
              : Number.isNaN(bv)
                ? -1
                : av - bv
            : collator.compare(String(av), String(bv));
        if (Number.isFinite(result) && result !== 0)
          return (direction === "asc" ? 1 : -1) * result;
      }
    }
    return 0;
  };
}
export function tableMatches<T extends object>(
  row: T,
  filters: HysTableFilters,
  columns: readonly HysTableColumn<T>[],
) {
  return tableFilterPredicate(filters, columns)(row);
}
export function tableFilterPredicate<T extends object>(
  filters: HysTableFilters,
  columns: readonly HysTableColumn<T>[],
) {
  const allowed = new Map<string, Set<HysTableFilterValue>>();
  for (const column of columns) {
    const selected = filters[column.key];
    if (!selected?.length || !column.filters || column.filterMethod) continue;
    const values = new Set(selected),
      options = tableFilterOptions(column.filters),
      byValue = new Map(options.map((option) => [option.value, option]));
    for (const value of selected) {
      const children = byValue.get(value)?.children;
      if (children)
        for (const child of tableFilterOptions(children))
          values.add(child.value);
    }
    allowed.set(column.key, values);
  }
  return (row: T) => {
    return columns.every((column) => {
      const values = filters[column.key];
      if (!values?.length) return true;
      if (allowed.has(column.key))
        return allowed
          .get(column.key)!
          .has(
            tableValue(
              row,
              column.dataIndex ?? column.key,
            ) as HysTableFilterValue,
          );
      return values.some((value) =>
        column.filterMethod
          ? column.filterMethod(value, row, column)
          : String(tableValue(row, column.dataIndex ?? column.key) ?? "")
              .toLocaleLowerCase()
              .includes(String(value).toLocaleLowerCase()),
      );
    });
  };
}
/** Iterative traversal also tolerates accidentally cyclic filter definitions. */
export function tableFilterOptions(filters: readonly HysTableFilter[]) {
  const result: HysTableFilter[] = [],
    seen = new Set<HysTableFilter>(),
    stack = [...filters].reverse();
  while (stack.length) {
    const option = stack.pop()!;
    if (seen.has(option)) continue;
    seen.add(option);
    result.push(option);
    if (option.children) stack.push(...[...option.children].reverse());
  }
  return result;
}
export function tableSummary<T extends object>(
  rows: readonly T[],
  column: HysTableColumn<T>,
) {
  if (column.summary === "count") return rows.length;
  const values = rows
    .map((row) => tableValue(row, column.dataIndex ?? column.key))
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (!values.length) return "—";
  const sum = values.reduce((a, b) => a + b, 0);
  return column.summary === "sum"
    ? +sum.toFixed(12)
    : column.summary === "avg"
      ? +(sum / values.length).toFixed(12)
      : column.summary === "min"
        ? values.reduce((a, b) => Math.min(a, b))
        : column.summary === "max"
          ? values.reduce((a, b) => Math.max(a, b))
          : "";
}
