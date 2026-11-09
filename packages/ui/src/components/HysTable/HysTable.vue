<script lang="ts">
export type { HysTableColumn } from "../../composables/table";
</script>
<script setup lang="ts" generic="T extends object = Record<string, unknown>">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  mergeProps,
  useId,
  useSlots,
  watch,
  type CSSProperties,
  type VNodeChild,
  type FunctionalComponent,
} from "vue";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ListFilter,
  LoaderCircle,
  RotateCw,
} from "lucide-vue-next";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysRadio from "../HysRadio/HysRadio.vue";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysPagination from "../HysPagination/HysPagination.vue";
import HysTableFilterOptions from "./HysTableFilterOptions.vue";
import { useHysRootAttrs } from "../../config";
import { useFloating } from "../../composables/useFloating";
import { useTable } from "../../composables/useTable";
import {
  tableColumns,
  tableBreakpoint,
  tableValue,
  tableSummary,
  tableToken,
  type HysTableProps,
  type HysTableColumn,
  type HysTableKey,
  type HysTableSort,
  type HysTableFilters,
  type HysTableFilterValue,
  type HysTableQuery,
  type HysTableElementAttrs,
  type HysTableCellContext,
  type TableNode,
  type TableHeader,
} from "../../composables/table";
const props = withDefaults(defineProps<HysTableProps<T>>(), {
  rowKey: "id",
  emptyText: undefined,
  size: "md",
  showHeader: true,
  fit: true,
  selectable: undefined,
  stickyHeader: undefined,
  selectionType: "checkbox",
  checkStrictly: true,
  selectOnIndeterminate: true,
  pagination: false,
  childrenKey: "children",
  hasChildrenKey: "hasChildren",
  indent: 18,
  sumText: "合计",
});
const emit = defineEmits<{
  rowClick: [row: T, index: number, event: MouseEvent];
  rowDblclick: [row: T, index: number, event: MouseEvent];
  rowContextmenu: [row: T, index: number, event: MouseEvent];
  cellClick: [context: HysTableCellContext<T>, event: MouseEvent];
  cellDblclick: [context: HysTableCellContext<T>, event: MouseEvent];
  cellContextmenu: [context: HysTableCellContext<T>, event: MouseEvent];
  cellMouseEnter: [context: HysTableCellContext<T>, event: MouseEvent];
  cellMouseLeave: [context: HysTableCellContext<T>, event: MouseEvent];
  headerClick: [column: HysTableColumn<T>, event: MouseEvent];
  headerContextmenu: [column: HysTableColumn<T>, event: MouseEvent];
  "update:sort": [sort: HysTableSort | null];
  "update:sorts": [sorts: HysTableSort[]];
  sortChange: [sort: HysTableSort | null, sorts: HysTableSort[]];
  "update:filters": [filters: HysTableFilters];
  filterChange: [filters: HysTableFilters];
  "update:selectedRowKeys": [keys: HysTableKey[]];
  selectionChange: [rows: T[], keys: HysTableKey[]];
  select: [rows: T[], row: T, checked: boolean];
  selectAll: [rows: T[], checked: boolean];
  selectInvert: [rows: T[], keys: HysTableKey[]];
  selectRange: [rows: T[], rangeRows: T[], checked: boolean];
  "update:currentRowKey": [key: HysTableKey | null];
  currentChange: [row: T | undefined, previous: T | undefined];
  "update:expandedRowKeys": [keys: HysTableKey[]];
  expandChange: [row: T, expanded: boolean, keys: HysTableKey[]];
  load: [row: T, children: readonly T[]];
  loadError: [row: T, error: unknown];
  "update:page": [page: number];
  pageChange: [page: number];
  "update:pageSize": [size: number];
  pageSizeChange: [size: number];
  queryChange: [query: HysTableQuery<T>];
  change: [query: HysTableQuery<T>];
  "update:columnWidths": [widths: Record<string, number>];
  columnResize: [column: HysTableColumn<T>, width: number, previous: number];
  scroll: [position: { scrollLeft: number; scrollTop: number }, event: Event];
}>();
const attrs = useHysRootAttrs(),
  slots = useSlots(),
  element = ref<HTMLElement>(),
  viewport = ref<HTMLElement>(),
  table = ref<HTMLTableElement>(),
  id = useId();
const containerWidth = ref(1024),
  measured = shallowRef<Record<string, number>>({}),
  localWidths = ref<Record<string, number>>({}),
  resizeDraft = ref<{ key: string; width: number }>();
const words = computed(() => ({
  emptyText: "暂无数据",
  loadingText: "加载中…",
  selectAll: "选择当前页全部行",
  selectRow: "选择第{index}行",
  expandRow: "展开第{index}行",
  collapseRow: "收起第{index}行",
  expand: "展开",
  collapse: "收起",
  filter: "筛选",
  filterPlaceholder: "输入筛选内容",
  reset: "重置",
  apply: "应用",
  retry: "重试",
  retryLabel: "重新加载子行",
  scrollLabel: "表格滚动区域",
  resizeColumn: "调整{label}列宽",
  sortAsc: "{label}升序",
  sortDesc: "{label}降序",
  filterSearch: "搜索筛选项",
  noFilterMatch: "暂无匹配的筛选项",
  invertSelection: "反选当前页",
  clearSelection: "清空选择",
  selected: "已选 {count} 项",
  ...props.locale,
}));
const labelText = (template: string, value: number | string) =>
  template.replace("{index}", String(value)).replace("{label}", String(value));
const RenderContent: FunctionalComponent<{ value: VNodeChild }> = ({ value }) =>
  value;
function hasType(type: string) {
  const stack = [...props.columns],
    seen = new Set<object>();
  while (stack.length) {
    const c = stack.pop()!;
    if (seen.has(c)) continue;
    seen.add(c);
    if (c.type === type) return true;
    if (c.children) stack.push(...c.children);
  }
  return false;
}
function utilityKey(type: string) {
  let key = "@hys-" + type;
  const all = new Set<string>(),
    stack = [...props.columns],
    seen = new Set<object>();
  while (stack.length) {
    const c = stack.pop()!;
    if (seen.has(c)) continue;
    seen.add(c);
    all.add(c.key);
    if (c.children) stack.push(...c.children);
  }
  while (all.has(key)) key += "_";
  return key;
}
const definitions = computed<HysTableColumn<T>[]>(() => {
  const result: HysTableColumn<T>[] = [];
  if (props.selectable && !hasType("selection"))
    result.push({
      key: utilityKey("selection"),
      label: "选择",
      type: "selection",
      align: "center",
      width: 48,
      fixed: "left",
      resizable: false,
    });
  if (
    (props.expandable || slots.expand) &&
    !props.treeMode &&
    !hasType("expand")
  )
    result.push({
      key: utilityKey("expand"),
      label: "展开",
      type: "expand",
      align: "center",
      width: 48,
      fixed: "left",
      resizable: false,
    });
  if (props.showIndex && !hasType("index"))
    result.push({
      key: utilityKey("index"),
      label: "序号",
      type: "index",
      align: "center",
      width: 64,
      resizable: false,
    });
  return [...result, ...props.columns];
});
const layout = computed(() =>
  tableColumns(definitions.value, tableBreakpoint(containerWidth.value)),
);
const model = useTable(
  props,
  () => layout.value.leaves,
  () => !!slots.expand,
  (name, ...args) => (emit as any)(name, ...args),
);
const {
  busy,
  display,
  selectedKeys,
  selectedSet,
  expandedKeys,
  expandedSet,
  halfSet,
  allSelected,
  someSelected,
  sorts,
  filters,
  page,
  pageSize,
  total,
  currentKey,
  pending,
  loadErrors,
  query,
} = model;
const firstData = computed(
  () => layout.value.leaves.find((c) => !c.type || c.type === "default")?.key,
);
const explicitExpand = computed(() =>
  layout.value.leaves.some((c) => c.type === "expand"),
);
const paginationPositions = computed(() => {
  if (
    !props.pagination ||
    (model.pagination.value.hideOnSinglePage && total.value <= pageSize.value)
  )
    return [];
  const valid = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ];
  return [
    ...new Set(model.pagination.value.position ?? ["bottom-right"]),
  ].filter((p) => valid.includes(p));
});
const paginationProps = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: model.pagination.value.showSizeChanger ?? true,
  showQuickJumper: model.pagination.value.showQuickJumper ?? false,
  showTotal: model.pagination.value.showTotal ?? true,
  compact: model.pagination.value.compact,
  labels: words.value.paginationLabels,
  pageSizeOptions: model.pagination.value.pageSizeOptions,
  disabled: busy.value,
}));
const emptyElementAttrs = Object.freeze({});
function customAttrs(value: HysTableElementAttrs | undefined) {
  if (!value) return emptyElementAttrs;
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key]) =>
        ![
          "key",
          "ref",
          "innerHTML",
          "textContent",
          "is",
          "colspan",
          "rowspan",
          "scope",
          "data-column-key",
          "data-row-key",
          "aria-selected",
          "aria-sort",
        ].includes(key),
    ),
  );
}
function customHeader(header: TableHeader<T>) {
  if (!props.customHeaderCell && !header.column.customHeaderCell)
    return emptyElementAttrs;
  const index = layout.value.leaves.indexOf(header.leaves[0]);
  return mergeProps(
    customAttrs(props.customHeaderCell?.(header.column, index)),
    customAttrs(header.column.customHeaderCell?.(header.column, index)),
  );
}
function customCellAttrs(ctx: HysTableCellContext<T>) {
  if (!props.customCell && !ctx.column.customCell) return emptyElementAttrs;
  return mergeProps(
    customAttrs(props.customCell?.(ctx)),
    customAttrs(ctx.column.customCell?.(ctx)),
  );
}
let selectionShift = false;
function selectRow(node: TableNode<T>, checked: boolean) {
  const range = selectionShift;
  selectionShift = false;
  void model.toggleRowSelection(node.key, checked, range);
}
const sticky = computed(
  () =>
    props.stickyHeader ??
    (props.height !== undefined || props.maxHeight !== undefined),
);
const widths = computed(() => props.columnWidths ?? localWidths.value);
function widthOf(column: HysTableColumn<T>) {
  const value =
    resizeDraft.value?.key === column.key
      ? resizeDraft.value.width
      : (resizeBase.value?.[column.key] ??
        widths.value[column.key] ??
        (typeof column.width === "number" ? column.width : 160));
  return Math.max(
    column.minWidth ?? (column.type && column.type !== "default" ? 36 : 60),
    Math.min(column.maxWidth ?? 2000, Number.isFinite(value) ? value : 160),
  );
}
function colWidth(column: HysTableColumn<T>) {
  return resizeBase.value !== undefined ||
    resizeDraft.value?.key === column.key ||
    widths.value[column.key] !== undefined ||
    typeof column.width !== "string"
    ? widthOf(column) + "px"
    : column.width;
}
const resizeBase = ref<Record<string, number>>(),
  pixelLayout = ref(false);
const minTableWidth = computed(() =>
  layout.value.leaves.reduce((sum, c) => sum + widthOf(c), 0),
);
const offsets = computed(() => {
  const result: Record<string, { left?: string; right?: string }> = {};
  let left = 0,
    right = 0;
  for (const c of layout.value.leaves)
    if (c.fixed === "left") {
      result[c.key] = { left: left + "px" };
      left += measured.value[c.key] ?? widthOf(c);
    }
  for (const c of [...layout.value.leaves].reverse())
    if (c.fixed === "right") {
      result[c.key] = { right: right + "px" };
      right += measured.value[c.key] ?? widthOf(c);
    }
  return result;
});
function fixedStyle(column: HysTableColumn<T>, header = false): CSSProperties {
  return column.fixed === "left" || column.fixed === "right"
    ? {
        position: "sticky",
        ...offsets.value[column.key],
        zIndex: header ? 6 : 2,
      }
    : {};
}
function headerStyle(header: TableHeader<T>): CSSProperties {
  const c = header.column,
    leaf = header.fixed === "right" ? header.leaves.at(-1)! : header.leaves[0];
  return {
    ...(typeof props.headerCellStyle === "function"
      ? props.headerCellStyle(c, layout.value.leaves.indexOf(leaf))
      : props.headerCellStyle),
    ...fixedStyle(leaf, true),
    textAlign: c.headerAlign ?? c.align,
    "--hys-ui-table-justify":
      (c.headerAlign ?? c.align) === "right"
        ? "flex-end"
        : (c.headerAlign ?? c.align) === "center"
          ? "center"
          : "flex-start",
  };
}
const length = (value: string | number | undefined) =>
  typeof value === "number"
    ? Number.isFinite(value) && value >= 0
      ? value + "px"
      : undefined
    : value;
const seenDetails = ref(new Set<string>());
watch(
  expandedKeys,
  () => {
    const next = new Set(seenDetails.value);
    for (const key of expandedKeys.value) next.add(tableToken(key));
    for (const token of next)
      if (!model.graph.value.map.has(token)) next.delete(token);
    seenDetails.value = next;
  },
  { immediate: true },
);
function detail(node: TableNode<T>) {
  return (
    !!slots.expand &&
    model.canExpand(node) &&
    (expandedSet.value.has(node.token) ||
      (props.preserveExpandedContent && seenDetails.value.has(node.token)))
  );
}
function context(
  row: T,
  column: HysTableColumn<T>,
  rowIndex: number,
  columnIndex: number,
): HysTableCellContext<T> {
  return {
    row,
    column,
    value: tableValue(row, column.dataIndex ?? column.key),
    rowIndex,
    columnIndex,
  };
}
function cellStyles(ctx: HysTableCellContext<T>) {
  return {
    ...(typeof props.cellStyle === "function"
      ? props.cellStyle(ctx)
      : props.cellStyle),
    ...(typeof ctx.column.cellStyle === "function"
      ? ctx.column.cellStyle(ctx)
      : ctx.column.cellStyle),
    ...fixedStyle(ctx.column),
    textAlign: ctx.column.align,
    "--hys-ui-table-justify":
      ctx.column.align === "right"
        ? "flex-end"
        : ctx.column.align === "center"
          ? "center"
          : "flex-start",
  };
}
function cellClass(ctx: HysTableCellContext<T>) {
  return [
    ctx.column.className,
    typeof props.cellClassName === "function"
      ? props.cellClassName(ctx)
      : props.cellClassName,
  ];
}
function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value !== "object") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
function formatted(ctx: HysTableCellContext<T>) {
  return ctx.column.formatter
    ? ctx.column.formatter(ctx.row, ctx.column, ctx.value, ctx.rowIndex)
    : text(ctx.value);
}
function rowClick(node: TableNode<T>, index: number, event: MouseEvent) {
  if (busy.value) return;
  emit("rowClick", node.row, index, event);
  if (props.highlightCurrentRow) void model.setCurrentRow(node.key);
  if (
    props.expandOnClickRow &&
    !(event.target as Element).closest(
      "button,input,a,textarea,select,[contenteditable]",
    )
  )
    void model.toggleRowExpansion(node.key);
}
const spans = computed(() => {
  const result = new Map<string, { rowspan: number; colspan: number }>(),
    occupied = new Set<string>(),
    leaves = layout.value.leaves;
  for (let i = 0; i < display.value.length; i++)
    for (let j = 0; j < leaves.length; j++) {
      const key = i + ":" + j,
        c = leaves[j];
      if (occupied.has(key)) {
        result.set(key, { rowspan: 0, colspan: 0 });
        continue;
      }
      const raw =
          c.type && c.type !== "default"
            ? undefined
            : props.spanMethod?.(context(display.value[i].row, c, i, j)),
        value = Array.isArray(raw)
          ? { rowspan: raw[0], colspan: raw[1] }
          : (raw as { rowspan?: number; colspan?: number } | undefined);
      let rowspan = Math.max(
          0,
          Math.min(display.value.length - i, Math.floor(value?.rowspan ?? 1)),
        ),
        colspan = Math.max(
          0,
          Math.min(leaves.length - j, Math.floor(value?.colspan ?? 1)),
        );
      if (!Number.isFinite(rowspan)) rowspan = 1;
      if (!Number.isFinite(colspan)) colspan = 1;
      for (let n = 0; n < rowspan - 1; n++)
        if (
          detail(display.value[i + n]) &&
          expandedSet.value.has(display.value[i + n].token)
        ) {
          rowspan = n + 1;
          break;
        }
      for (let n = 1; n < colspan; n++)
        if (
          leaves[j + n].fixed !== c.fixed ||
          (leaves[j + n].type && leaves[j + n].type !== "default")
        ) {
          colspan = n;
          break;
        }
      result.set(key, { rowspan, colspan });
      for (let a = 0; a < rowspan; a++)
        for (let b = 0; b < colspan; b++)
          if (a || b) occupied.add(i + a + ":" + (j + b));
    }
  return result;
});
const span = (i: number, j: number) =>
  spans.value.get(i + ":" + j) ?? { rowspan: 1, colspan: 1 };
const summaries = computed(() => {
  const rows = model.filteredRows.value,
    custom = props.summaryMethod?.({ columns: layout.value.leaves, rows });
  return layout.value.leaves.map((c, index) =>
    custom
      ? Array.isArray(custom)
        ? custom[index]
        : (custom as Record<string, VNodeChild>)[c.key]
      : c.summary
        ? tableSummary(rows, c)
        : c.key === firstData.value
          ? props.sumText
          : "",
  );
});
const filterAnchor = ref<HTMLElement>(),
  filterPanel = ref<HTMLElement>(),
  filterColumn = shallowRef<HysTableColumn<T>>(),
  filterDraft = ref<HysTableFilterValue[]>([]);
const floatingFilter = useFloating(filterAnchor, filterPanel, {
  placement: "bottom-end",
  width: () => 260,
});
const filterOpen = floatingFilter.open,
  filterStyle = floatingFilter.style;
async function openFilter(column: HysTableColumn<T>, event: MouseEvent) {
  if (busy.value) return;
  if (filterOpen.value && filterColumn.value?.key === column.key) {
    floatingFilter.close();
    return;
  }
  filterAnchor.value = event.currentTarget as HTMLElement;
  filterColumn.value = column;
  filterDraft.value = [...(filters.value[column.key] ?? [])];
  floatingFilter.show();
  await nextTick();
  filterPanel.value?.querySelector<HTMLElement>("input,button")?.focus();
}
function setFilterDraft(values: readonly HysTableFilterValue[]) {
  filterDraft.value = [...values];
}
function confirmFilter() {
  if (filterColumn.value)
    model.setFilter(filterColumn.value.key, filterDraft.value);
  floatingFilter.close(true);
}
function clearActiveFilter() {
  const column = filterColumn.value;
  filterDraft.value = column?.filterResetToDefault
    ? [
        ...(props.defaultFilters?.[column.key] ??
          column.defaultFilterValue ??
          []),
      ]
    : [];
  confirmFilter();
}
const tipAnchor = ref<HTMLElement>(),
  tipPanel = ref<HTMLElement>(),
  tipContext = shallowRef<HysTableCellContext<T>>();
const floatingTip = useFloating(tipAnchor, tipPanel, {
    placement: "top-start",
  }),
  tipOpen = floatingTip.open,
  tipStyle = floatingTip.style;
let tipTimer: ReturnType<typeof setTimeout> | undefined;
function keepTip() {
  clearTimeout(tipTimer);
}
function hideTip() {
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => floatingTip.close(), 80);
}
function showTip(ctx: HysTableCellContext<T>, event: Event) {
  clearTimeout(tipTimer);
  const target = event.currentTarget as HTMLElement;
  if (
    busy.value ||
    floatingTip.restoringFocus.value ||
    !(ctx.column.showOverflowTooltip ?? props.showOverflowTooltip) ||
    (target.scrollWidth <= target.clientWidth + 1 &&
      target.scrollHeight <= target.clientHeight + 1)
  )
    return;
  tipAnchor.value = target;
  tipContext.value = ctx;
  floatingTip.show();
}
const tipContent = computed(() => {
  const ctx = tipContext.value;
  return ctx
    ? ((ctx.column.tooltipFormatter ?? props.tooltipFormatter)?.(ctx) ??
        text(ctx.value))
    : "";
});
let observer: ResizeObserver | undefined,
  measureFrame = 0,
  resizing:
    | {
        column: HysTableColumn<T>;
        start: number;
        width: number;
        pointerId: number;
      }
    | undefined,
  resizeFrame = 0,
  pointerX = 0;
function measure() {
  if (!model.live.value || !element.value) return;
  containerWidth.value = element.value.clientWidth;
  const next: Record<string, number> = {};
  const row = table.value?.querySelector(
    "tbody tr:not(.hys-ui-table-message):not(.hys-ui-table-detail)",
  );
  for (const c of layout.value.leaves) {
    const header = Array.from(
        table.value?.querySelectorAll<HTMLElement>("th[data-leaf]") ?? [],
      ).find((e) => e.dataset.columnKey === c.key),
      cell =
        header ??
        Array.from(
          row?.querySelectorAll<HTMLElement>(
            "td[data-column-key],th[data-column-key]",
          ) ?? [],
        ).find((e) => e.dataset.columnKey === c.key);
    if (cell) next[c.key] = cell.getBoundingClientRect().width;
  }
  if (JSON.stringify(next) !== JSON.stringify(measured.value))
    measured.value = next;
}
function scheduleMeasure() {
  cancelAnimationFrame(measureFrame);
  measureFrame = requestAnimationFrame(measure);
}
async function doLayout() {
  await nextTick();
  measure();
}
function stopResize() {
  cancelAnimationFrame(resizeFrame);
  if (resizing && viewport.value?.hasPointerCapture?.(resizing.pointerId))
    viewport.value.releasePointerCapture(resizing.pointerId);
  resizing = undefined;
  resizeDraft.value = undefined;
  resizeBase.value = undefined;
  document.removeEventListener("pointermove", moveResize, true);
  document.removeEventListener("pointerup", endResize, true);
  document.removeEventListener("pointercancel", cancelResize, true);
  document.removeEventListener("keydown", resizeKey, true);
  window.removeEventListener("blur", cancelResize);
}
function cancelResize() {
  stopResize();
}
function resizeKey(event: KeyboardEvent) {
  if (event.key === "Escape" && resizing) {
    event.preventDefault();
    event.stopImmediatePropagation();
    stopResize();
  }
}
function applyResize() {
  if (!resizing) return;
  const direction =
    getComputedStyle(element.value!).direction === "rtl" ? -1 : 1;
  resizeDraft.value = {
    key: resizing.column.key,
    width: Math.max(
      resizing.column.minWidth ?? 60,
      Math.min(
        resizing.column.maxWidth ?? 2000,
        resizing.width + (pointerX - resizing.start) * direction,
      ),
    ),
  };
}
function moveResize(event: PointerEvent) {
  if (!resizing || event.pointerId !== resizing.pointerId) return;
  pointerX = event.clientX;
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(applyResize);
}
function commitWidth(
  column: HysTableColumn<T>,
  width: number,
  previous: number,
  base?: Record<string, number>,
) {
  if (busy.value || !model.live.value) return;
  const value = Math.round(
    Math.max(column.minWidth ?? 60, Math.min(column.maxWidth ?? 2000, width)),
  );
  if (value === previous) return;
  const next = {
    ...widths.value,
    ...measured.value,
    ...base,
    [column.key]: value,
  };
  localWidths.value = next;
  emit("update:columnWidths", next);
  if (props.columnWidths === undefined) pixelLayout.value = true;
  emit("columnResize", column, value, previous);
  scheduleMeasure();
}
function endResize(event: PointerEvent) {
  if (!resizing || event.pointerId !== resizing.pointerId) return;
  pointerX = event.clientX;
  applyResize();
  const { column, width } = resizing,
    value = resizeDraft.value?.width ?? width,
    base = resizeBase.value;
  stopResize();
  commitWidth(column, value, width, base);
}
function startResize(column: HysTableColumn<T>, event: PointerEvent) {
  if (busy.value || event.button !== 0 || !model.live.value) return;
  floatingFilter.close();
  floatingTip.close();
  stopResize();
  const width = measured.value[column.key] ?? widthOf(column);
  resizeBase.value = { ...measured.value };
  resizing = {
    column,
    start: event.clientX,
    width,
    pointerId: event.pointerId,
  };
  viewport.value?.setPointerCapture?.(event.pointerId);
  document.addEventListener("pointermove", moveResize, true);
  document.addEventListener("pointerup", endResize, true);
  document.addEventListener("pointercancel", cancelResize, true);
  document.addEventListener("keydown", resizeKey, true);
  window.addEventListener("blur", cancelResize);
}
function resetColumnWidths() {
  if (busy.value) return;
  stopResize();
  localWidths.value = {};
  pixelLayout.value = false;
  emit("update:columnWidths", {});
  scheduleMeasure();
}
function resizeColumn(key: string, width: number) {
  const c = layout.value.leaves.find((c) => c.key === key);
  if (c && Number.isFinite(width))
    commitWidth(c, width, measured.value[key] ?? widthOf(c));
}
function scrolled(event: Event) {
  if (!viewport.value) return;
  floatingTip.close();
  emit(
    "scroll",
    {
      scrollLeft: viewport.value.scrollLeft,
      scrollTop: viewport.value.scrollTop,
    },
    event,
  );
}
function observe() {
  observer?.disconnect();
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(scheduleMeasure);
    if (element.value) observer.observe(element.value);
    if (table.value) observer.observe(table.value);
  }
  scheduleMeasure();
}
function cleanup() {
  observer?.disconnect();
  cancelAnimationFrame(measureFrame);
  stopResize();
  clearTimeout(tipTimer);
  floatingFilter.close();
  floatingTip.close();
}
watch(busy, (value) => {
  if (value) {
    stopResize();
    floatingFilter.close();
    floatingTip.close();
  }
});
watch(
  () => props.columnWidths,
  () => {
    if (resizing) stopResize();
    scheduleMeasure();
  },
  { deep: true },
);
watch(
  () => layout.value.leaves.map((c) => c.key).join("\u0000"),
  () => {
    if (
      filterColumn.value &&
      !layout.value.leaves.some((c) => c.key === filterColumn.value?.key)
    )
      floatingFilter.close();
    if (
      tipContext.value &&
      !layout.value.leaves.some((c) => c.key === tipContext.value?.column.key)
    )
      floatingTip.close();
    if (
      resizing &&
      !layout.value.leaves.some((c) => c.key === resizing?.column.key)
    )
      stopResize();
  },
);
watch(
  () => props.columns,
  () => {
    stopResize();
    floatingFilter.close();
    floatingTip.close();
  },
  { deep: true },
);
onMounted(observe);
onActivated(observe);
onUpdated(scheduleMeasure);
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
watch(
  [sorts, filters, page, pageSize],
  () => {
    if (props.scrollToFirstRowOnChange && viewport.value)
      viewport.value.scrollTop = 0;
  },
  { flush: "post" },
);
defineExpose({
  element,
  viewport,
  selectedKeys,
  currentRow: model.currentRow,
  expandedKeys,
  query,
  clearSelection: model.clearSelection,
  getSelectionRows: model.getSelectionRows,
  getHalfSelectionRows: model.getHalfSelectionRows,
  toggleRowSelection: model.toggleRowSelection,
  toggleAllSelection: model.toggleAllSelection,
  invertSelection: model.invertSelection,
  setCurrentRow: model.setCurrentRow,
  toggleRowExpansion: model.toggleRowExpansion,
  loadRow: model.loadRow,
  clearSort: () => model.setSort(null),
  setSort: model.setSort,
  clearFilter: model.clearFilter,
  setFilter: model.setFilter,
  setPage: model.requestPage,
  resizeColumn,
  resetColumnWidths,
  doLayout,
  scrollTo: (options: ScrollToOptions) => viewport.value?.scrollTo(options),
});
</script>

<template>
  <div
    ref="element"
    v-bind="attrs"
    class="hys-ui-table"
    :class="[
      'hys-ui-table-' + size,
      {
        'hys-ui-table-striped': striped,
        'hys-ui-table-bordered': bordered,
        'hys-ui-table-sticky': sticky,
      },
    ]"
    :aria-busy="loading || undefined"
  >
    <div v-if="$slots.title" class="hys-ui-table-title">
      <slot name="title" :rows="model.filteredRows.value" :query="query" />
    </div>
    <div
      v-if="selectionActions || $slots.selection"
      class="hys-ui-table-selection-actions"
    >
      <slot
        name="selection"
        :rows="model.getSelectionRows()"
        :keys="selectedKeys"
        :select-all="() => model.toggleAllSelection(true)"
        :invert="model.invertSelection"
        :clear="model.clearSelection"
      >
        <span aria-live="polite">{{
          words.selected.replace("{count}", String(selectedKeys.length))
        }}</span>
        <HysButton
          v-if="selectionType !== 'radio'"
          size="sm"
          variant="secondary"
          :disabled="busy"
          @click="model.toggleAllSelection(true)"
          >{{ words.selectAll }}</HysButton
        >
        <HysButton
          v-if="selectionType !== 'radio'"
          size="sm"
          variant="secondary"
          :disabled="busy"
          @click="model.invertSelection"
          >{{ words.invertSelection }}</HysButton
        >
        <HysButton
          size="sm"
          variant="ghost"
          :disabled="busy || !selectedKeys.length"
          @click="model.clearSelection"
          >{{ words.clearSelection }}</HysButton
        >
      </slot>
    </div>
    <div
      v-for="position in paginationPositions.filter((p) =>
        p.startsWith('top-'),
      )"
      :key="position"
      class="hys-ui-table-pagination"
      :data-position="position"
    >
      <HysPagination
        v-bind="paginationProps"
        @change="model.requestPage($event)"
        @page-size-change="model.changeSize"
      />
    </div>
    <div
      ref="viewport"
      class="hys-ui-table-scroll"
      :style="{ height: length(height), maxHeight: length(maxHeight) }"
      tabindex="0"
      :aria-label="caption || words.scrollLabel"
      @scroll="scrolled"
    >
      <table
        ref="table"
        class="hys-ui-data-table"
        :style="{
          minWidth: minTableWidth + 'px',
          width:
            fit &&
            !pixelLayout &&
            !resizeBase &&
            !Object.keys(columnWidths ?? {}).length
              ? '100%'
              : minTableWidth + 'px',
        }"
      >
        <caption v-if="caption">
          {{
            caption
          }}
        </caption>
        <colgroup>
          <col
            v-for="column in layout.leaves"
            :key="column.key"
            :style="{ width: colWidth(column) }"
          />
        </colgroup>
        <thead v-if="showHeader">
          <tr
            v-for="(headers, level) in layout.headers"
            :key="level"
            v-bind="
              customAttrs(
                customHeaderRow?.(
                  headers.map((h) => h.column),
                  level,
                ),
              )
            "
          >
            <th
              v-for="header in headers"
              :key="header.key"
              v-bind="customHeader(header)"
              :data-column-key="header.column.key"
              :data-leaf="header.column.children ? undefined : ''"
              :colspan="header.colspan"
              :rowspan="header.rowspan"
              :scope="header.column.children ? 'colgroup' : 'col'"
              :class="[
                header.column.headerClassName,
                typeof headerCellClassName === 'function'
                  ? headerCellClassName(
                      header.column,
                      layout.leaves.indexOf(header.leaves[0]),
                    )
                  : headerCellClassName,
              ]"
              :style="headerStyle(header)"
              :aria-sort="
                header.column.sortable
                  ? sorts.find((s) => s.key === header.column.key)
                      ?.direction === 'asc'
                    ? 'ascending'
                    : sorts.find((s) => s.key === header.column.key)
                          ?.direction === 'desc'
                      ? 'descending'
                      : 'none'
                  : undefined
              "
              @click="emit('headerClick', header.column, $event)"
              @contextmenu="emit('headerContextmenu', header.column, $event)"
            >
              <HysCheckbox
                v-if="
                  header.column.type === 'selection' &&
                  selectionType !== 'radio' &&
                  !hideSelectAll
                "
                :model-value="allSelected"
                :indeterminate="someSelected"
                :disabled="busy || !model.graph.value.all.some(model.eligible)"
                :aria-label="words.selectAll"
                @click.stop
                @update:model-value="
                  model.toggleAllSelection(
                    someSelected && !selectOnIndeterminate
                      ? false
                      : $event === true,
                  )
                "
              />
              <span
                v-else-if="header.column.type === 'selection'"
                class="hys-ui-table-sr-only"
                >选择</span
              >
              <div v-else class="hys-ui-table-heading">
                <div class="hys-ui-table-label">
                  <button
                    v-if="header.column.sortable"
                    type="button"
                    class="hys-ui-table-sort"
                    :disabled="busy"
                    @click="model.toggleSort(header.column)"
                  >
                    <slot
                      :name="'header-' + header.column.key"
                      :column="header.column"
                      :sorts="sorts"
                      ><slot
                        name="header-cell"
                        :column="header.column"
                        :sorts="sorts"
                        >{{ header.column.label }}</slot
                      ></slot
                    ></button
                  ><span v-else
                    ><slot
                      :name="'header-' + header.column.key"
                      :column="header.column"
                      :sorts="sorts"
                      ><slot
                        name="header-cell"
                        :column="header.column"
                        :sorts="sorts"
                        >{{ header.column.label }}</slot
                      ></slot
                    ></span
                  ><span
                    v-if="header.column.sortable"
                    class="hys-ui-table-sort-controls"
                    ><button
                      v-for="direction in ['asc', 'desc'] as const"
                      :key="direction"
                      type="button"
                      :disabled="busy"
                      :aria-label="
                        labelText(
                          direction === 'asc' ? words.sortAsc : words.sortDesc,
                          header.column.label,
                        )
                      "
                      :aria-pressed="
                        sorts.some(
                          (s) =>
                            s.key === header.column.key &&
                            s.direction === direction,
                        )
                      "
                      @click="model.toggleSort(header.column, direction)"
                    >
                      <component
                        :is="direction === 'asc' ? ChevronUp : ChevronDown"
                        :size="12"
                        aria-hidden="true"
                      /></button
                  ></span>
                </div>
                <button
                  v-if="header.column.filterable || header.column.filters"
                  type="button"
                  class="hys-ui-table-filter"
                  :disabled="busy"
                  :class="{
                    'hys-ui-table-filter-active':
                      !!filters[header.column.key]?.length,
                  }"
                  :aria-label="words.filter + header.column.label"
                  :aria-expanded="
                    filterOpen && filterColumn?.key === header.column.key
                  "
                  :aria-controls="id + '-filter'"
                  @click.stop="openFilter(header.column, $event)"
                >
                  <ListFilter :size="14" aria-hidden="true" />
                </button>
                <span
                  v-if="
                    !header.column.children &&
                    (header.column.resizable ?? resizable) &&
                    (!header.column.type || header.column.type === 'default')
                  "
                  class="hys-ui-table-resize"
                  role="separator"
                  aria-orientation="vertical"
                  :aria-label="
                    labelText(words.resizeColumn, header.column.label)
                  "
                  tabindex="0"
                  :aria-valuenow="
                    Math.round(
                      measured[header.column.key] ?? widthOf(header.column),
                    )
                  "
                  :aria-valuemin="header.column.minWidth ?? 60"
                  :aria-valuemax="header.column.maxWidth ?? 2000"
                  @pointerdown.prevent.stop="startResize(header.column, $event)"
                  @keydown.left.prevent="
                    resizeColumn(
                      header.column.key,
                      (measured[header.column.key] ?? widthOf(header.column)) -
                        10,
                    )
                  "
                  @keydown.right.prevent="
                    resizeColumn(
                      header.column.key,
                      (measured[header.column.key] ?? widthOf(header.column)) +
                        10,
                    )
                  "
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="hys-ui-table-message">
            <td :colspan="Math.max(1, layout.leaves.length)">
              <div role="status">
                <slot name="loading"
                  ><LoaderCircle class="hys-ui-table-spinner" :size="18" />{{
                    words.loadingText
                  }}</slot
                >
              </div>
            </td>
          </tr>
          <template v-else
            ><template v-for="(node, index) in display" :key="node.token">
              <tr
                v-bind="customAttrs(customRow?.(node.row, index))"
                :data-row-key="String(node.key)"
                :aria-selected="
                  highlightCurrentRow ? currentKey === node.key : undefined
                "
                :class="[
                  typeof rowClassName === 'function'
                    ? rowClassName(node.row, index)
                    : rowClassName,
                  {
                    'hys-ui-table-row-current':
                      highlightCurrentRow && currentKey === node.key,
                    'hys-ui-table-row-selected': selectedSet.has(node.token),
                  },
                ]"
                :style="
                  typeof rowStyle === 'function'
                    ? rowStyle(node.row, index)
                    : rowStyle
                "
                @click="rowClick(node, index, $event)"
                @dblclick="
                  !busy && emit('rowDblclick', node.row, index, $event)
                "
                @contextmenu="emit('rowContextmenu', node.row, index, $event)"
              >
                <template
                  v-for="(column, columnIndex) in layout.leaves"
                  :key="column.key"
                  ><component
                    :is="column.rowScope ? 'th' : 'td'"
                    v-if="
                      span(index, columnIndex).rowspan &&
                      span(index, columnIndex).colspan
                    "
                    v-bind="
                      customCellAttrs(
                        context(node.row, column, index, columnIndex),
                      )
                    "
                    :scope="column.rowScope"
                    :data-column-key="column.key"
                    :rowspan="span(index, columnIndex).rowspan"
                    :colspan="span(index, columnIndex).colspan"
                    :style="
                      cellStyles(context(node.row, column, index, columnIndex))
                    "
                    :class="
                      cellClass(context(node.row, column, index, columnIndex))
                    "
                    @click="
                      !busy &&
                      emit(
                        'cellClick',
                        context(node.row, column, index, columnIndex),
                        $event,
                      )
                    "
                    @dblclick="
                      !busy &&
                      emit(
                        'cellDblclick',
                        context(node.row, column, index, columnIndex),
                        $event,
                      )
                    "
                    @contextmenu="
                      emit(
                        'cellContextmenu',
                        context(node.row, column, index, columnIndex),
                        $event,
                      )
                    "
                    @mouseenter="
                      emit(
                        'cellMouseEnter',
                        context(node.row, column, index, columnIndex),
                        $event,
                      )
                    "
                    @mouseleave="
                      emit(
                        'cellMouseLeave',
                        context(node.row, column, index, columnIndex),
                        $event,
                      )
                    "
                  >
                    <template v-if="column.type === 'selection'"
                      ><HysRadio
                        v-if="selectionType === 'radio'"
                        :name="id + '-selection'"
                        :model-value="selectedKeys[0] ?? null"
                        :value="node.key"
                        :disabled="busy || !model.eligible(node)"
                        :aria-label="labelText(words.selectRow, index + 1)"
                        @click.stop
                        @update:model-value="
                          model.toggleRowSelection(node.key, true)
                        " /><HysCheckbox
                        v-else
                        :model-value="selectedSet.has(node.token)"
                        :indeterminate="halfSet.has(node.token)"
                        :disabled="busy || !model.eligible(node)"
                        :aria-label="labelText(words.selectRow, index + 1)"
                        @click.stop="selectionShift = $event.shiftKey"
                        @update:model-value="selectRow(node, $event === true)"
                    /></template>
                    <RenderContent
                      v-else-if="column.type === 'index'"
                      :value="
                        typeof column.index === 'function'
                          ? column.index(index, node.row)
                          : indexMethod
                            ? indexMethod(index, node.row)
                            : (typeof column.index === 'number'
                                ? column.index
                                : 1) +
                              index +
                              (pagination && !serverMode
                                ? (page - 1) * pageSize
                                : 0)
                      "
                    />
                    <button
                      v-else-if="
                        column.type === 'expand' && model.canExpand(node)
                      "
                      type="button"
                      class="hys-ui-table-expand"
                      :disabled="busy"
                      :aria-expanded="expandedSet.has(node.token)"
                      :aria-label="
                        labelText(
                          expandedSet.has(node.token)
                            ? words.collapseRow
                            : words.expandRow,
                          index + 1,
                        )
                      "
                      @click.stop="model.toggleRowExpansion(node.key)"
                    >
                      <component
                        :is="
                          pending.has(node.token)
                            ? LoaderCircle
                            : expandedSet.has(node.token)
                              ? ChevronDown
                              : ChevronRight
                        "
                        :class="{
                          'hys-ui-table-spinner': pending.has(node.token),
                        }"
                        :size="16"
                        aria-hidden="true"
                      />
                    </button>
                    <template v-else-if="column.type !== 'expand'"
                      ><div class="hys-ui-table-cell-content">
                        <span
                          v-if="treeMode && column.key === firstData"
                          class="hys-ui-table-tree-indent"
                          :style="{
                            width:
                              Math.min(node.depth, 100) * Math.max(0, indent) +
                              'px',
                          }"
                        />
                        <template
                          v-if="
                            treeMode &&
                            column.key === firstData &&
                            !explicitExpand
                          "
                          ><button
                            v-if="model.canExpand(node)"
                            type="button"
                            class="hys-ui-table-expand"
                            :disabled="busy"
                            :aria-expanded="expandedSet.has(node.token)"
                            :aria-label="
                              (expandedSet.has(node.token)
                                ? words.collapse
                                : words.expand) +
                              text(
                                tableValue(
                                  node.row,
                                  column.dataIndex ?? column.key,
                                ),
                              )
                            "
                            @click.stop="model.toggleRowExpansion(node.key)"
                          >
                            <component
                              :is="
                                pending.has(node.token)
                                  ? LoaderCircle
                                  : expandedSet.has(node.token)
                                    ? ChevronDown
                                    : ChevronRight
                              "
                              :class="{
                                'hys-ui-table-spinner': pending.has(node.token),
                              }"
                              :size="16"
                              aria-hidden="true"
                            /></button
                          ><span v-else class="hys-ui-table-tree-spacer"
                        /></template>
                        <span
                          class="hys-ui-table-cell-text"
                          :class="{
                            'hys-ui-table-ellipsis':
                              column.ellipsis ||
                              column.showOverflowTooltip ||
                              showOverflowTooltip,
                          }"
                          :tabindex="
                            (column.showOverflowTooltip ?? showOverflowTooltip)
                              ? 0
                              : undefined
                          "
                          :aria-describedby="
                            tipOpen &&
                            tipContext?.row === node.row &&
                            tipContext.column.key === column.key
                              ? id + '-tooltip'
                              : undefined
                          "
                          @pointerenter="
                            showTip(
                              context(node.row, column, index, columnIndex),
                              $event,
                            )
                          "
                          @pointerleave="hideTip"
                          @focus="
                            showTip(
                              context(node.row, column, index, columnIndex),
                              $event,
                            )
                          "
                          @blur="hideTip"
                          ><slot
                            :name="column.key"
                            :row="node.row"
                            :value="
                              tableValue(
                                node.row,
                                column.dataIndex ?? column.key,
                              )
                            "
                            :index="index"
                            :column="column"
                            ><slot
                              name="body-cell"
                              :row="node.row"
                              :column="column"
                              :value="
                                tableValue(
                                  node.row,
                                  column.dataIndex ?? column.key,
                                )
                              "
                              :index="index"
                              ><RenderContent
                                :value="
                                  formatted(
                                    context(
                                      node.row,
                                      column,
                                      index,
                                      columnIndex,
                                    ),
                                  )
                                " /></slot></slot
                        ></span>
                        <HysButton
                          v-if="
                            column.key === firstData &&
                            loadErrors.has(node.token)
                          "
                          size="sm"
                          variant="ghost"
                          :aria-label="words.retryLabel"
                          @click.stop="model.loadRow(node.key, true)"
                          ><RotateCw :size="13" />{{ words.retry }}</HysButton
                        >
                      </div></template
                    >
                  </component></template
                >
              </tr>
              <tr
                v-if="detail(node)"
                v-show="expandedSet.has(node.token)"
                class="hys-ui-table-detail"
              >
                <td :colspan="Math.max(1, layout.leaves.length)">
                  <slot
                    name="expand"
                    :row="node.row"
                    :index="index"
                    :expanded="expandedSet.has(node.token)"
                  />
                </td>
              </tr>
            </template>
            <tr v-if="!display.length" class="hys-ui-table-message">
              <td :colspan="Math.max(1, layout.leaves.length)">
                <slot name="empty">{{ emptyText ?? words.emptyText }}</slot>
              </td>
            </tr></template
          >
          <tr v-if="$slots.append" class="hys-ui-table-append">
            <td :colspan="Math.max(1, layout.leaves.length)">
              <slot name="append" :rows="model.filteredRows.value" />
            </td>
          </tr>
        </tbody>
        <tfoot v-if="showSummary && !loading">
          <tr>
            <td
              v-for="(column, index) in layout.leaves"
              :key="column.key"
              :data-column-key="column.key"
              :style="{ ...fixedStyle(column), textAlign: column.align }"
            >
              <slot
                name="summary-cell"
                :column="column"
                :index="index"
                :value="summaries[index]"
                :rows="model.filteredRows.value"
                ><RenderContent :value="summaries[index]"
              /></slot>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div v-if="$slots.footer" class="hys-ui-table-footer">
      <slot name="footer" :rows="model.filteredRows.value" :query="query" />
    </div>
    <div
      v-for="position in paginationPositions.filter((p) =>
        p.startsWith('bottom-'),
      )"
      :key="position"
      class="hys-ui-table-pagination"
      :data-position="position"
    >
      <HysPagination
        v-bind="paginationProps"
        @change="model.requestPage($event)"
        @page-size-change="model.changeSize"
      />
    </div>
    <Teleport to="body"
      ><div
        v-if="filterOpen && filterColumn"
        :id="id + '-filter'"
        ref="filterPanel"
        v-bind="attrs"
        class="hys-ui-table-filter-panel hys-ui-floating-surface"
        :style="filterStyle"
        role="dialog"
        :aria-label="words.filter + filterColumn.label"
      >
        <slot
          name="filter-dropdown"
          :column="filterColumn"
          :values="filterDraft"
          :set-values="setFilterDraft"
          :confirm="confirmFilter"
          :clear="clearActiveFilter"
          :close="() => floatingFilter.close(true)"
          ><strong>{{ filterColumn.label }}</strong>
          <HysTableFilterOptions
            v-if="filterColumn.filters"
            :key="filterColumn.key"
            v-model:values="filterDraft"
            :options="filterColumn.filters"
            :mode="filterColumn.filterMode"
            :search="filterColumn.filterSearch"
            :multiple="filterColumn.filterMultiple !== false"
            :disabled="busy"
            :search-label="words.filterSearch"
            :empty-text="words.noFilterMatch"
          />
          <HysInput
            v-else
            :model-value="String(filterDraft[0] ?? '')"
            :aria-label="words.filter + filterColumn.label"
            :placeholder="words.filterPlaceholder"
            clearable
            size="sm"
            @update:model-value="setFilterDraft($event ? [$event] : [])"
            @keydown.enter.prevent="confirmFilter"
          />
          <div class="hys-ui-table-filter-actions">
            <HysButton
              size="sm"
              variant="secondary"
              @click="clearActiveFilter"
              >{{ words.reset }}</HysButton
            ><HysButton size="sm" @click="confirmFilter">{{
              words.apply
            }}</HysButton>
          </div></slot
        >
      </div></Teleport
    >
    <Teleport to="body"
      ><div
        v-if="tipOpen && tipContext"
        :id="id + '-tooltip'"
        ref="tipPanel"
        v-bind="attrs"
        class="hys-ui-table-tooltip hys-ui-floating-tooltip"
        role="tooltip"
        :style="tipStyle"
        @pointerenter="keepTip"
        @pointerleave="hideTip"
      >
        <slot name="tooltip" v-bind="tipContext"
          ><RenderContent :value="tipContent"
        /></slot></div
    ></Teleport>
  </div>
</template>

<style scoped>
.hys-ui-table {
  min-width: 0;
  width: 100%;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 10px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  overflow: hidden;
  font-size: 13px;
  --hys-ui-table-row-bg: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  --hys-ui-table-head-bg: var(
    --hys-ui-surface-alt,
    var(--hys-ui-theme-surface-alt)
  );
  --hys-ui-table-hover-bg: var(
    --hys-ui-primary-soft,
    var(--hys-ui-theme-primary-soft)
  );
}
.hys-ui-table-scroll {
  width: 100%;
  overflow: auto;
  position: relative;
  overscroll-behavior: contain;
}
.hys-ui-table-scroll:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-data-table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font: inherit;
  text-align: start;
  white-space: normal;
}
.hys-ui-data-table th,
.hys-ui-data-table td {
  box-sizing: border-box;
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  text-align: inherit;
  vertical-align: middle;
  overflow-wrap: anywhere;
}
.hys-ui-data-table th {
  position: relative;
  z-index: 3;
  font-weight: 600;
  background: var(--hys-ui-table-head-bg);
  color: inherit;
}
.hys-ui-data-table td {
  background: inherit;
}
.hys-ui-data-table tbody th {
  position: static;
  z-index: auto;
  background: inherit;
  font-weight: inherit;
}
.hys-ui-data-table tbody tr {
  cursor: default;
  background: var(--hys-ui-table-row-bg);
}
.hys-ui-data-table tbody tr:hover {
  background: var(--hys-ui-table-row-bg);
  --hys-ui-table-row-bg: var(--hys-ui-table-hover-bg);
}
.hys-ui-table-striped tbody tr:nth-child(even) {
  --hys-ui-table-row-bg: var(
    --hys-ui-surface-alt,
    var(--hys-ui-theme-surface-alt)
  );
}
.hys-ui-data-table tbody tr.hys-ui-table-row-current,
.hys-ui-data-table tbody tr.hys-ui-table-row-selected {
  --hys-ui-table-row-bg: var(
    --hys-ui-primary-soft,
    var(--hys-ui-theme-primary-soft)
  );
}
.hys-ui-data-table tbody tr:last-child :is(td, th) {
  border-bottom: 0;
}
.hys-ui-data-table tfoot td {
  background: var(--hys-ui-table-head-bg);
  font-weight: 600;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-bottom: 0;
}
.hys-ui-table-sticky thead {
  position: sticky;
  top: 0;
  z-index: 5;
}
.hys-ui-table-bordered th + th,
.hys-ui-table-bordered td + td {
  border-inline-start: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-table-bordered tbody th + td,
.hys-ui-table-bordered tbody td + th {
  border-inline-start: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-table-sm th,
.hys-ui-table-sm td {
  padding: 7px 10px;
  font-size: 12px;
}
.hys-ui-table-lg th,
.hys-ui-table-lg td {
  padding: 17px 18px;
  font-size: 14px;
}
.hys-ui-data-table caption {
  padding: 14px;
  text-align: start;
  font-weight: 600;
}
.hys-ui-table-title,
.hys-ui-table-footer {
  padding: 14px 16px;
}
.hys-ui-table-title {
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-table-footer,
.hys-ui-table-pagination {
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-table-pagination {
  padding: 12px 16px;
  display: flex;
}
.hys-ui-table-pagination > :deep(nav) {
  max-width: 100%;
}
.hys-ui-table-pagination[data-position$="left"] {
  justify-content: flex-start;
}
.hys-ui-table-pagination[data-position$="center"] {
  justify-content: center;
}
.hys-ui-table-pagination[data-position$="right"] {
  justify-content: flex-end;
}
.hys-ui-table-selection-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-table-selection-actions > span {
  margin-inline-end: auto;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 12px;
}
.hys-ui-table-pagination > :deep(.hys-ui-pf-pagination) {
  width: 100%;
  min-width: 0;
}
.hys-ui-table-pagination[data-position$="left"] > :deep(nav) {
  justify-content: flex-start;
}
.hys-ui-table-pagination[data-position$="center"] > :deep(nav) {
  justify-content: center;
}
.hys-ui-table-pagination[data-position$="right"] > :deep(nav) {
  justify-content: flex-end;
}
.hys-ui-table-pagination :deep(.hys-ui-pf-pagination-actions) {
  margin-left: 0;
}
.hys-ui-table-heading,
.hys-ui-table-label {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.hys-ui-table-label {
  flex: 1;
  justify-content: var(--hys-ui-table-justify, flex-start);
}
.hys-ui-table-label > span:first-child,
.hys-ui-table-sort {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.hys-ui-table-sort,
.hys-ui-table-filter,
.hys-ui-table-expand,
.hys-ui-table-sort-controls > button {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 0;
}
.hys-ui-table-sort {
  text-align: inherit;
  font-weight: inherit;
}
.hys-ui-table-sort-controls {
  display: grid;
  grid-template-rows: 8px 8px;
  flex: 0 0 18px;
}
.hys-ui-table-sort-controls > button {
  display: grid;
  place-items: center;
  width: 18px;
  height: 8px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  opacity: 0.55;
}
.hys-ui-table-sort-controls > button[aria-pressed="true"] {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  opacity: 1;
}
.hys-ui-table-filter {
  display: grid;
  place-items: center;
  flex: 0 0 22px;
  height: 24px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  opacity: 0.55;
}
.hys-ui-table-filter:hover,
.hys-ui-table-filter-active {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  opacity: 1;
}
.hys-ui-table button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hys-ui-table-sort:focus-visible,
.hys-ui-table-filter:focus-visible,
.hys-ui-table-expand:focus-visible,
.hys-ui-table-sort-controls > button:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 2px;
  border-radius: 3px;
}
.hys-ui-table-cell-content {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
  justify-content: var(--hys-ui-table-justify, flex-start);
}
.hys-ui-table-cell-text {
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-ui-table-ellipsis {
  display: block;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-table-cell-text:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 2px;
}
.hys-ui-table-expand {
  display: inline-grid;
  place-items: center;
  flex: 0 0 22px;
  width: 22px;
  height: 24px;
}
.hys-ui-table-tree-indent {
  flex-shrink: 0;
}
.hys-ui-table-tree-spacer {
  width: 22px;
  flex-shrink: 0;
}
.hys-ui-table-resize {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  width: 8px;
  cursor: col-resize;
  touch-action: none;
  z-index: 7;
}
.hys-ui-table-resize:hover,
.hys-ui-table-resize:focus-visible {
  border-inline-end: 2px solid
    var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline: none;
}
.hys-ui-table-detail > td {
  padding: 18px 24px;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-table-message > td {
  padding: 34px;
  text-align: center;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-table-message > td > div {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.hys-ui-table-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.hys-ui-table-append > td {
  padding: 12px 16px;
}
.hys-ui-table-filter-panel {
  padding: 14px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 10px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  box-shadow: 0 12px 36px #16274626;
  max-width: calc(100vw - 20px);
}
.hys-ui-table-filter-panel > strong {
  display: block;
  margin-bottom: 12px;
  font-size: 13px;
}
.hys-ui-table-filter-options {
  display: grid;
  gap: 10px;
  max-height: 230px;
  overflow: auto;
  padding: 2px;
}
.hys-ui-table-filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  padding-top: 12px;
}
.hys-ui-table-tooltip {
  max-width: min(420px, calc(100vw - 20px));
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.7;
  background: var(--hys-ui-text, var(--hys-ui-theme-text));
  color: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  box-shadow: 0 6px 22px #0002;
  overflow-wrap: anywhere;
}
.hys-ui-table-spinner {
  animation: hys-ui-table-spin 1s linear infinite;
}
.hys-ui-table[data-hys-motion="off"] .hys-ui-table-spinner {
  animation: none;
}
@keyframes hys-ui-table-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-table-spinner {
    animation: none;
  }
}
.hys-ui-table-striped tbody tr:hover {
  --hys-ui-table-row-bg: var(--hys-ui-table-hover-bg);
}
</style>
