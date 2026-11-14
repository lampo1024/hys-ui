<script lang="ts">
import PopupMotion from '../../motion/PopupMotion';

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
  type ComponentPublicInstance,
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
import { useTableSticky } from "../../composables/useTableSticky";
import { useTabularRowNavigation } from "../../composables/useTabularRowNavigation";
import { useTabularCellNavigation } from "../../composables/useTabularCellNavigation";
import { tabularCellWrap, tabularEmptyValue } from "../../composables/tabularCellDisplay";
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
  type HysTableFilterConfirmOptions,
  type HysTableFilterResetOptions,
  type HysTableScrollRowOptions,
  type HysTableOverflowTooltipOptions,
  type HysTableSelectionAction,
} from "../../composables/table";
const props = withDefaults(defineProps<HysTableProps<T>>(), {
  rowKey: "id",
  emptyText: undefined,
  size: "md",
  showHeader: true,
  fit: true,
  selectable: undefined,
  stickyHeader: undefined,
  nativeScrollbar: undefined,
  selectionType: "checkbox",
  checkStrictly: true,
  selectOnIndeterminate: true,
  pagination: false,
  childrenKey: "children",
  hasChildrenKey: "hasChildren",
  indent: 18,
  sumText: "合计",
  summaryScope: "filtered",
  tableLayout: "fixed",
  loadingMode: "replace",
  scrollbarTabindex: 0,
  showExpandColumn: true,
  allowDragLastColumn: true,
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
  "update:search": [search: string];
  filterChange: [filters: HysTableFilters];
  "update:selectedRowKeys": [keys: HysTableKey[]];
  selectionChange: [rows: T[], keys: HysTableKey[]];
  select: [rows: T[], row: T, checked: boolean];
  selectAll: [rows: T[], checked: boolean, changedRows: T[]];
  selectInvert: [rows: T[], keys: HysTableKey[]];
  selectNone: [];
  selectRange: [rows: T[], rangeRows: T[], checked: boolean];
  "update:currentRowKey": [key: HysTableKey | null];
  currentChange: [row: T | undefined, previous: T | undefined];
  "update:expandedRowKeys": [keys: HysTableKey[]];
  expandChange: [row: T, expanded: boolean, keys: HysTableKey[]];
  load: [row: T, children: readonly T[]];
  loadError: [row: T, error: unknown];
  childrenChange: [row: T, children: readonly T[]];
  "update:filterColumnKey": [key: string | null];
  filterOpenChange: [key: string | null];
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
  tableRoot = ref<HTMLTableElement | ComponentPublicInstance>(),
  tableHeadRoot = ref<HTMLTableSectionElement | ComponentPublicInstance>(),
  id = useId();
function nativeElement<E extends HTMLElement>(value: E | ComponentPublicInstance | undefined): E | undefined {
  const root = value && "$el" in value ? value.$el : value;
  return root?.nodeType === 1 ? root as E : undefined;
}
const table = computed(() => nativeElement(tableRoot.value));
const tableHead = computed(() => nativeElement(tableHeadRoot.value));
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
  sortClear: "取消{label}排序",
  stickyScrollLabel: "表格横向滚动条",
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
      type: "selection",
      align: "center",
      width: 48,
      fixed: "left",
      resizable: false,
      ...props.selectionColumn,
      label: props.selectionColumn?.label ?? "选择",
    });
  if (
    (props.expandable || slots.expand) &&
    !props.treeMode &&
    props.showExpandColumn &&
    !hasType("expand")
  )
    result.push({
      key: utilityKey("expand"),
      label: props.expandColumnTitle ?? "展开",
      type: "expand",
      align: "center",
      width: 48,
      fixed: props.expandFixed ?? "left",
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
  return [...result, ...props.columns].filter(
    (c) => props.showExpandColumn || c.type !== "expand",
  );
});
const layout = computed(() =>
  tableColumns(
    definitions.value,
    tableBreakpoint(containerWidth.value),
    props.showExpandColumn,
  ),
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
  pageCount,
  paginationTotal,
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
    (model.pagination.value.hideOnSinglePage && pageCount.value <= 1)
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
  total: paginationTotal.value,
  pageCount: pageCount.value,
  showSizeChanger: model.pagination.value.showSizeChanger ?? true,
  showQuickJumper: model.pagination.value.showQuickJumper ?? false,
  showTotal: model.pagination.value.showTotal ?? true,
  compact: model.pagination.value.compact,
  layout: model.pagination.value.layout,
  size: model.pagination.value.size,
  responsive: model.pagination.value.responsive,
  siblingCount: model.pagination.value.siblingCount,
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
const stickyHeaderActive = computed(
  () =>
    props.stickyHeader ??
    (!!props.sticky || props.height !== undefined || props.maxHeight !== undefined),
);
const {
  headerTop, bar: stickyBar, scrollbar: stickyBarElement,
  syncScrollbar, scrollViewport, scrollbarHeight,
} = useTableSticky(viewport, tableHead, () => props.sticky);
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
const tableMinWidth = computed(() => {
  const width = length(props.scrollWidth);
  const minimum = minTableWidth.value + "px";
  return width && width !== "max-content" ? `max(${minimum}, ${width})` : minimum;
});
const tableWidth = computed(() => {
  if (pixelLayout.value || resizeBase.value || Object.keys(props.columnWidths ?? {}).length)
    return minTableWidth.value + "px";
  if (props.scrollWidth === "max-content") return "max-content";
  return props.fit ? "100%" : minTableWidth.value + "px";
});
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
  const empty = ctx.column.emptyText ?? props.emptyCellText;
  const content = empty !== undefined && tabularEmptyValue(ctx.value)
    ? empty
    : ctx.column.formatter
    ? ctx.column.formatter(ctx.row, ctx.column, ctx.value, ctx.rowIndex)
    : text(ctx.value);
  return props.transformCellText
    ? props.transformCellText({ ...ctx, text: content })
    : content;
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
const pageRows = computed(() => display.value.map((node) => node.row));
const summaryRows = computed(() =>
  props.summaryScope === "page"
    ? pageRows.value
    : model.filteredRows.value,
);
const summaries = computed(() => {
  const rows = summaryRows.value,
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
function summaryCellAttrs(column: HysTableColumn<T>) {
  return {
    "data-column-key": column.key,
    style: { ...fixedStyle(column), textAlign: column.align },
  };
}
const filterAnchor = ref<HTMLElement>(),
  filterPanel = ref<HTMLElement>(),
  filterColumn = shallowRef<HysTableColumn<T>>(),
  filterDraft = ref<HysTableFilterValue[]>([]);
const ownFilterKey = ref<string | null>(null),
  desiredFilterKey = computed(() => {
    if (props.filterColumnKey !== undefined) return props.filterColumnKey;
    const columns = layout.value.leaves;
    const open = columns.find((c) => hasFilter(c) && c.filterDropdownOpen === true);
    if (open) return open.key;
    return columns.some((c) => c.key === ownFilterKey.value && c.filterDropdownOpen === false)
      ? null
      : ownFilterKey.value;
  });
function hasFilter(column: HysTableColumn<T>) {
  return !!(column.filterable || column.filters || column.renderFilterDropdown || column.filterMethod || column.filteredValue);
}
function isFiltered(column: HysTableColumn<T>) {
  return column.filtered ?? !!filters.value[column.key]?.length;
}
let restoreFilterFocus = false;
async function requestFilter(key: string | null, restore = false) {
  const columns = layout.value.leaves;
  const nextColumn = columns.find((c) => c.key === key && hasFilter(c));
  if (
    key !== null &&
    (busy.value || !model.live.value || !nextColumn)
  )
    return false;
  const previous = desiredFilterKey.value;
  restoreFilterFocus = restore;
  ownFilterKey.value = key;
  if (key !== previous) {
    columns.find((c) => c.key === previous)?.onFilterDropdownOpenChange?.(false);
    nextColumn?.onFilterDropdownOpenChange?.(true);
  }
  emit("update:filterColumnKey", key);
  if (desiredFilterKey.value === key) syncFilter();
  await nextTick();
  if (desiredFilterKey.value === key) syncFilter();
  await nextTick();
  return (
    model.live.value &&
    desiredFilterKey.value === key &&
    (key === null
      ? !filterOpen.value
      : filterOpen.value && filterColumn.value?.key === key)
  );
}
const floatingFilter = useFloating(filterAnchor, filterPanel, {
  placement: () => filterColumn.value?.filterPlacement ?? props.filterPlacement ?? "bottom-end",
  width: () => 260,
  requestOpen(open, restore) {
    void requestFilter(
      open ? (filterColumn.value?.key ?? null) : null,
      restore,
    );
    return false;
  },
});
const filterOpen = floatingFilter.open,
  filterStyle = floatingFilter.style;
const filterTarget = computed(() =>
  props.appendFilterTo ??
  (filterAnchor.value && props.getPopupContainer?.(filterAnchor.value)) ??
  "body",
);
function syncFilter() {
  const key = desiredFilterKey.value,
    column = layout.value.leaves.find(
      (c) => c.key === key && hasFilter(c),
    );
  if (busy.value || !model.live.value || !column) {
    floatingFilter.close(restoreFilterFocus, true);
    restoreFilterFocus = false;
    return;
  }
  const anchor = Array.from(
    tableHead.value?.querySelectorAll<HTMLElement>("th[data-column-key]") ?? [],
  )
    .find((th) => th.dataset.columnKey === key)
    ?.querySelector<HTMLElement>(".hys-ui-table-filter");
  if (!anchor) {
    floatingFilter.close(false, true);
    return;
  }
  const changed = filterColumn.value?.key !== key || !filterOpen.value;
  filterAnchor.value = anchor;
  filterColumn.value = column;
  if (changed) filterDraft.value = [...(filters.value[column.key] ?? [])];
  floatingFilter.show(true);
  void nextTick(() => {
    if (changed && filterOpen.value && desiredFilterKey.value === key)
      filterPanel.value
        ?.querySelector<HTMLElement>('input,button,[tabindex="0"]')
        ?.focus();
  });
}
watch(
  [
    desiredFilterKey,
    busy,
    model.live,
    () => layout.value.leaves,
    () => props.showHeader,
    tableHead,
  ],
  syncFilter,
  { immediate: true, flush: "post" },
);
watch(
  () => (filterOpen.value ? (filterColumn.value?.key ?? null) : null),
  (key) => emit("filterOpenChange", key),
);
async function openFilter(column: HysTableColumn<T>, event: MouseEvent) {
  if (busy.value) return;
  if (filterOpen.value && filterColumn.value?.key === column.key) {
    floatingFilter.close();
    return;
  }
  filterAnchor.value = event.currentTarget as HTMLElement;
  await requestFilter(column.key);
}
function setFilterDraft(values: readonly HysTableFilterValue[]) {
  filterDraft.value = [...values];
}
function confirmFilter(options?: HysTableFilterConfirmOptions | Event) {
  if (filterColumn.value)
    model.setFilter(filterColumn.value.key, filterDraft.value);
  if (
    (options as HysTableFilterConfirmOptions | undefined)?.closeDropdown !==
    false
  )
    floatingFilter.close(true);
}
function clearActiveFilter(options?: HysTableFilterResetOptions | Event) {
  const column = filterColumn.value;
  filterDraft.value = column?.filterResetToDefault
    ? [
        ...(props.defaultFilters?.[column.key] ??
          column.defaultFilterValue ??
          []),
      ]
    : [];
  const config = options as HysTableFilterResetOptions | undefined;
  if (config?.confirm !== false) confirmFilter(options);
  else if (config?.closeDropdown === true) floatingFilter.close(true);
}
const filterContext = computed(() => filterColumn.value && ({
  column: filterColumn.value,
  open: filterOpen.value,
  values: filterDraft.value,
  setValues: setFilterDraft,
  confirm: confirmFilter,
  clear: clearActiveFilter,
  close: () => floatingFilter.close(true),
}));
const tipAnchor = ref<HTMLElement>(),
  tipPanel = ref<HTMLElement>(),
  tipContext = shallowRef<HysTableCellContext<T>>(),
  sortTipColumn = shallowRef<HysTableColumn<T>>();
function overflowTooltip(column: HysTableColumn<T>) {
  if (column.wrap === true) return false;
  return column.showOverflowTooltip ?? props.showOverflowTooltip;
}
function sorterTooltip(column: HysTableColumn<T>) {
  return column.showSorterTooltip ?? props.showSorterTooltip;
}
const tipOptions = computed<HysTableOverflowTooltipOptions>(() => {
  const tableOptions = sortTipColumn.value ? props.showSorterTooltip : props.showOverflowTooltip;
  const columnOptions = sortTipColumn.value
    ? sortTipColumn.value.showSorterTooltip
    : tipContext.value?.column.showOverflowTooltip;
  return {
    ...(typeof tableOptions === "object" ? tableOptions : undefined),
    ...(typeof columnOptions === "object" ? columnOptions : undefined),
  };
});
const tipTarget = computed(() =>
  (tipAnchor.value && props.getPopupContainer?.(tipAnchor.value)) ?? "body",
);
const floatingTip = useFloating(tipAnchor, tipPanel, {
    placement: () => tipOptions.value.placement ?? "top-start",
    get gap() {
      return tipOptions.value.offset;
    },
  }),
  tipOpen = floatingTip.open,
  tipStyle = floatingTip.style;
let tipTimer: ReturnType<typeof setTimeout> | undefined;
function keepTip() {
  clearTimeout(tipTimer);
}
function hideTip() {
  clearTimeout(tipTimer);
  if (!tipOpen.value) return;
  const delay = tipOptions.value.hideDelay ?? 80;
  tipTimer = setTimeout(() => floatingTip.close(), Number.isFinite(delay) ? Math.max(0, delay) : 80);
}
function showTip(ctx: HysTableCellContext<T>, event: Event) {
  const target = event.currentTarget as HTMLElement;
  if (
    busy.value ||
    floatingTip.restoringFocus.value ||
    !overflowTooltip(ctx.column) ||
    (target.scrollWidth <= target.clientWidth + 1 &&
      target.scrollHeight <= target.clientHeight + 1)
  )
    return;
  keepTip();
  tipAnchor.value = target;
  sortTipColumn.value = undefined;
  tipContext.value = ctx;
  floatingTip.show();
}
function showSortTip(column: HysTableColumn<T>, event: Event) {
  if (busy.value || !sorterTooltip(column) || floatingTip.restoringFocus.value) return;
  keepTip();
  tipAnchor.value = event.currentTarget as HTMLElement;
  tipContext.value = undefined;
  sortTipColumn.value = column;
  floatingTip.show();
}
const tipContent = computed(() => {
  const column = sortTipColumn.value;
  if (column) {
    const next = model.nextSortOrder(column);
    const message = next === "asc" ? words.value.sortAsc
      : next === "desc" ? words.value.sortDesc : words.value.sortClear;
    return labelText(message, column.label);
  }
  const ctx = tipContext.value;
  return ctx
    ? ((ctx.column.tooltipFormatter ?? props.tooltipFormatter)?.(ctx) ??
        (tipAnchor.value?.textContent?.trim() || text(ctx.value)))
    : "";
});
const customSelectionActions = computed(() =>
  Array.isArray(props.selectionActions) ? props.selectionActions : undefined,
);
const selectionActionRows = computed(() => model.selectionPage.value.map(({ row }) => row));
const selectionActionKeys = computed(() => model.selectionPage.value.map(({ key }) => key));
function runSelectionAction(action: HysTableSelectionAction<T>) {
  if (busy.value || !model.live.value || action.disabled) return;
  const nodes = model.selectionPage.value;
  return action.select({
    rows: nodes.map(({ row }) => row),
    keys: nodes.map(({ key }) => key),
    selectedKeys: [...selectedKeys.value],
    setSelected: (keys) => model.selectPage(keys, nodes),
  });
}
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
  syncScrollbar();
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
    floatingTip.close();
  },
  { deep: true },
);
watch(display, () => {
  if (tipContext.value) floatingTip.close();
});
watch([() => props.showOverflowTooltip, () => props.showSorterTooltip], () => floatingTip.close(), { deep: true });
onMounted(() => {
  observe();
  syncFilter();
});
onActivated(observe);
watch(table, () => {
  if (model.live.value) observe();
}, { flush: "post" });
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
function scrollPosition(options: ScrollToOptions) {
  const el = viewport.value;
  if (!model.live.value || !el) return;
  if (typeof el.scrollTo === "function") el.scrollTo(options);
  else {
    if (options.top !== undefined) el.scrollTop = options.top;
    if (options.left !== undefined) el.scrollLeft = options.left;
  }
}
async function scrollToRow(
  value: T | HysTableKey,
  options: HysTableScrollRowOptions = {},
) {
  await nextTick();
  const node = model.find(value),
    el = viewport.value;
  if (!model.live.value || !el || !node || props.loading) return false;
  const index = display.value.findIndex((n) => n.token === node.token);
  const row = Array.from(
    table.value?.querySelectorAll<HTMLElement>("tbody tr[data-row-key]") ?? [],
  )[index];
  if (index < 0 || !row) return false;
  const box = el.getBoundingClientRect(),
    rect = row.getBoundingClientRect(),
    header = stickyHeaderActive.value
      ? (tableHead.value?.getBoundingClientRect().height ?? 0) + headerTop.value
      : 0,
    top = rect.top - box.top - el.clientTop + el.scrollTop,
    available = Math.max(0, el.clientHeight - header);
  let target = top - header;
  if (options.block === "center") target -= (available - rect.height) / 2;
  else if (options.block === "end") target -= available - rect.height;
  else if (!options.block || options.block === "nearest") {
    if (
      rect.top >= box.top + el.clientTop + header &&
      rect.bottom <= box.top + el.clientTop + el.clientHeight
    )
      return true;
    if (rect.top >= box.top + el.clientTop + header)
      target -= available - rect.height;
  }
  scrollPosition({ top: Math.max(0, target), behavior: options.behavior });
  return true;
}
const visibleColumns = computed(() => layout.value.leaves);
const navigableTokens = computed(() => display.value.map(({ token }) => token));
const cellRowIndexes = computed(() => new Map(navigableTokens.value.map((token, index) => [token, index])));
const cellColumnIndexes = computed(() => visibleColumns.value.flatMap((column, index) =>
  !column.type || column.type === "default" ? [[column.key, index] as const] : [],
));
const cellColumnIndex = computed(() => new Map(cellColumnIndexes.value));
function firstCell(rowIndex: number) {
  return cellColumnIndexes.value.find(([, index]) => {
    const cell = span(rowIndex, index);
    return cell.colspan > 0 && cell.rowspan > 0;
  })?.[0];
}
const cellNavigationState = useTabularCellNavigation({
  enabled: () => !!props.cellNavigation && !busy.value && model.live.value,
  table: () => table.value,
  first() {
    for (const [rowIndex, rowToken] of navigableTokens.value.entries()) {
      const columnKey = firstCell(rowIndex);
      if (columnKey !== undefined) return { rowToken, columnKey };
    }
  },
  has(rowToken, columnKey) {
    const rowIndex = cellRowIndexes.value.get(rowToken);
    const columnIndex = cellColumnIndex.value.get(columnKey);
    if (rowIndex === undefined || columnIndex === undefined) return false;
    const cell = span(rowIndex, columnIndex);
    return cell.rowspan > 0 && cell.colspan > 0;
  },
});
const rowNavigation = useTabularRowNavigation({
  enabled: () => !!props.keyboardNavigation && !props.cellNavigation && !busy.value && model.live.value,
  table: () => table.value,
  tokens: () => navigableTokens.value,
  attribute: "data-hys-navigation-row",
  toggle(token) {
    const node = model.graph.value.map.get(token);
    if (!node || !layout.value.leaves.some(({ type }) => type === "selection") || !model.eligible(node))
      return false;
    void model.toggleRowSelection(node.key);
    return true;
  },
});
defineExpose({
  element,
  viewport,
  selectedKeys,
  currentRow: model.currentRow,
  expandedKeys,
  query,
  columns: visibleColumns,
  clearSelection: model.clearSelection,
  getSelectionRows: model.getSelectionRows,
  getHalfSelectionRows: model.getHalfSelectionRows,
  toggleRowSelection: model.toggleRowSelection,
  toggleAllSelection: model.toggleAllSelection,
  invertSelection: model.invertSelection,
  setCurrentRow: model.setCurrentRow,
  toggleRowExpansion: model.toggleRowExpansion,
  loadRow: model.loadRow,
  updateKeyChildren: model.updateKeyChildren,
  clearSort: () => model.setSort(null),
  setSort: model.setSort,
  clearFilter: model.clearFilter,
  setFilter: model.setFilter,
  setSearch: model.setSearch,
  clearSearch: () => model.setSearch(""),
  focusRow: (row: T | HysTableKey) => {
    const node = model.find(row);
    if (!node) return false;
    if (!props.cellNavigation) return rowNavigation.focusRow(node.token);
    const rowIndex = cellRowIndexes.value.get(node.token);
    const columnKey = rowIndex === undefined ? undefined : firstCell(rowIndex);
    return columnKey !== undefined && cellNavigationState.focusCell(node.token, columnKey);
  },
  focusCell: (row: T | HysTableKey, columnKey: string) => {
    const node = model.find(row);
    return !!node && cellNavigationState.focusCell(node.token, columnKey);
  },
  showFilter: (key: string) => requestFilter(key),
  hideFilter: () => requestFilter(null, true),
  setPage: model.requestPage,
  resizeColumn,
  resetColumnWidths,
  doLayout,
  scrollTo: scrollPosition,
  setScrollTop: (top: number) => {
    if (Number.isFinite(top)) scrollPosition({ top: Math.max(0, top) });
  },
  setScrollLeft: (left: number) => {
    if (Number.isFinite(left)) scrollPosition({ left: Math.max(0, left) });
  },
  scrollToRow,
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
        'hys-ui-table-sticky': stickyHeaderActive,
      },
    ]"
    :aria-busy="loading || undefined"
  >
    <div v-if="$slots.title" class="hys-ui-table-title">
      <slot name="title" :rows="model.filteredRows.value" :page-rows="pageRows" :query="query" :search="model.search.value" :set-search="model.setSearch" />
    </div>
    <div
      v-if="selectionActions === true || customSelectionActions?.length || $slots.selection"
      class="hys-ui-table-selection-actions"
    >
      <slot
        name="selection"
        :rows="model.getSelectionRows()"
        :keys="selectedKeys"
        :select-all="() => model.toggleAllSelection(true)"
        :invert="model.invertSelection"
        :clear="model.clearSelection"
        :page-rows="selectionActionRows"
        :page-keys="selectionActionKeys"
        :set-selected="(keys: readonly HysTableKey[]) => model.selectPage(keys)"
      >
        <span aria-live="polite">{{
          words.selected.replace("{count}", String(selectedKeys.length))
        }}</span>
        <template v-if="customSelectionActions">
          <HysButton
            v-for="action in customSelectionActions"
            :key="action.key"
            size="sm"
            variant="secondary"
            :disabled="busy || action.disabled || selectionType === 'radio'"
            @click="runSelectionAction(action)"
          >{{ action.label }}</HysButton>
        </template>
        <template v-else>
          <HysButton
            v-if="selectionType !== 'radio'"
            size="sm"
            variant="secondary"
            :disabled="busy || !model.selectionPage.value.length"
            @click="model.toggleAllSelection(true)"
          >{{ words.selectAll }}</HysButton>
          <HysButton
            v-if="selectionType !== 'radio'"
            size="sm"
            variant="secondary"
            :disabled="busy || !model.selectionPage.value.length"
            @click="model.invertSelection"
          >{{ words.invertSelection }}</HysButton>
          <HysButton
            size="sm"
            variant="ghost"
            :disabled="busy || !selectedKeys.length"
            @click="model.clearSelection"
          >{{ words.clearSelection }}</HysButton>
        </template>
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
      <slot
        name="pagination"
        :position="position"
        :props="paginationProps"
        :set-page="model.requestPage"
        :set-page-size="model.changeSize"
      >
        <HysPagination
          v-bind="paginationProps"
          @change="model.requestPage($event)"
          @page-size-change="model.changeSize"
        />
      </slot>
    </div>
    <div class="hys-ui-table-viewport"><div
      ref="viewport"
      class="hys-ui-table-scroll"
      :class="nativeScrollbar ? 'hys-ui-table-native-scrollbar' : 'hys-ui-scrollbar'"
      :style="{
        height: length(height),
        maxHeight: length(maxHeight),
        overflowY: scrollbarAlwaysOn ? 'scroll' : undefined,
      }"
      :tabindex="scrollbarTabindex"
      :aria-label="caption || words.scrollLabel"
      @scroll="scrolled"
    >
      <component
        :is="components?.table ?? 'table'"
        ref="tableRoot"
        class="hys-ui-data-table"
        :style="{
          minWidth: tableMinWidth,
          tableLayout: pixelLayout || resizeBase ? 'fixed' : tableLayout,
          width: tableWidth,
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
        <component
          :is="components?.header?.wrapper ?? 'thead'"
          v-if="showHeader"
          ref="tableHeadRoot"
          :style="{ top: headerTop + 'px' }"
        >
          <component
            :is="components?.header?.row ?? 'tr'"
            v-for="(headers, level) in layout.headers"
            :key="level"
            :class="
              typeof headerRowClassName === 'function'
                ? headerRowClassName(
                    headers.map((h) => h.column),
                    level,
                  )
                : headerRowClassName
            "
            :style="
              typeof headerRowStyle === 'function'
                ? headerRowStyle(
                    headers.map((h) => h.column),
                    level,
                  )
                : headerRowStyle
            "
            v-bind="
              customAttrs(
                customHeaderRow?.(
                  headers.map((h) => h.column),
                  level,
                ),
              )
            "
          >
            <component
              :is="components?.header?.cell ?? 'th'"
              v-for="header in headers"
              :key="header.key"
              v-bind="customHeader(header)"
              :data-column-key="header.column.key"
              :data-leaf="!header.column.children && header.colspan === 1 ? '' : undefined"
              :colspan="header.colspan"
              :rowspan="header.rowspan"
              :scope="header.column.children || header.colspan > 1 ? 'colgroup' : 'col'"
              :aria-hidden="header.blank || undefined"
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
                !header.blank && header.column.sortable
                  ? sorts.find((s) => s.key === header.column.key)
                      ?.direction === 'asc'
                    ? 'ascending'
                    : sorts.find((s) => s.key === header.column.key)
                          ?.direction === 'desc'
                      ? 'descending'
                      : 'none'
                  : undefined
              "
              @click="!header.blank && emit('headerClick', header.column, $event)"
              @contextmenu="!header.blank && emit('headerContextmenu', header.column, $event)"
            >
              <template v-if="header.blank" />
              <slot
                v-else-if="header.column.type === 'selection'"
                name="selection-header"
                :column="header.column"
                :checked="allSelected"
                :indeterminate="someSelected"
                :disabled="busy || !model.selectionPage.value.length"
                :toggle="model.toggleAllSelection"
              >
                <HysCheckbox
                  v-if="
                    header.column.type === 'selection' &&
                    selectionType !== 'radio' &&
                    !hideSelectAll
                  "
                  :model-value="allSelected"
                  :indeterminate="someSelected"
                  :disabled="
                    busy || !model.selectionPage.value.length
                  "
                  :aria-label="words.selectAll"
                  @click.stop
                  @update:model-value="
                    model.toggleAllSelection(
                      someSelected && !selectOnIndeterminate
                        ? false
                        : $event === true,
                    )
                  "
                  ><template v-if="selectionColumn?.label">{{
                    selectionColumn.label
                  }}</template></HysCheckbox
                >
                <span
                  v-else-if="header.column.type === 'selection'"
                  class="hys-ui-table-sr-only"
                  >选择</span
                >
              </slot>
              <div v-else class="hys-ui-table-heading">
                <div class="hys-ui-table-label">
                  <button
                    v-if="header.column.sortable"
                    type="button"
                    class="hys-ui-table-sort"
                    :disabled="busy"
                    :aria-describedby="tipOpen && sortTipColumn === header.column ? id + '-tooltip' : undefined"
                    @pointerenter="showSortTip(header.column, $event)"
                    @pointerleave="hideTip"
                    @focus="showSortTip(header.column, $event)"
                    @blur="hideTip"
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
                        ><RenderContent
                          v-if="header.column.renderHeader"
                          :value="header.column.renderHeader(header.column, sorts)"
                        /><template v-else>{{ header.column.label }}</template></slot
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
                        ><RenderContent
                          v-if="header.column.renderHeader"
                          :value="header.column.renderHeader(header.column, sorts)"
                        /><template v-else>{{ header.column.label }}</template></slot
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
                  v-if="!header.column.children && hasFilter(header.column)"
                  type="button"
                  class="hys-ui-table-filter"
                  :disabled="busy"
                  :class="{
                    'hys-ui-table-filter-active':
                      isFiltered(header.column),
                  }"
                  :aria-label="words.filter + header.column.label"
                  :aria-expanded="
                    filterOpen && filterColumn?.key === header.column.key
                  "
                  :aria-controls="id + '-filter'"
                  @click.stop="openFilter(header.column, $event)"
                >
                  <RenderContent
                    v-if="header.column.renderFilterIcon"
                    :value="header.column.renderFilterIcon({
                      column: header.column,
                      filtered: isFiltered(header.column),
                      open: filterOpen && filterColumn?.key === header.column.key,
                    })"
                  />
                  <slot
                    v-else
                    name="filter-icon"
                    :column="header.column"
                    :filtered="isFiltered(header.column)"
                    :open="
                      filterOpen && filterColumn?.key === header.column.key
                    "
                    ><ListFilter :size="14" aria-hidden="true"
                  /></slot>
                </button>
                <span
                  v-if="
                    !header.column.children &&
                    header.colspan === 1 &&
                    (header.column.resizable ?? resizable) &&
                    (allowDragLastColumn ||
                      header.column.key !== layout.leaves.at(-1)?.key) &&
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
            </component>
          </component>
        </component>
        <component :is="components?.body?.wrapper ?? 'tbody'">
          <tr v-if="loading && loadingMode === 'replace'" class="hys-ui-table-message">
            <td :colspan="Math.max(1, layout.leaves.length)">
              <div class="hys-ui-table-state hys-ui-table-loading-state" role="status">
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
              <component
                :is="components?.body?.row ?? 'tr'"
                v-bind="mergeProps(customAttrs(customRow?.(node.row, index)), rowNavigation.rowNavigationAttrs(node.token))"
                :data-row-key="String(node.key)"
                :data-hys-cell-row="cellNavigation ? node.token : undefined"
                :data-hys-navigation-row="keyboardNavigation ? node.token : undefined"
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
                    :is="column.rowScope
                      ? (components?.body?.rowHeaderCell ?? 'th')
                      : (components?.body?.cell ?? 'td')"
                    v-if="
                      span(index, columnIndex).rowspan &&
                      span(index, columnIndex).colspan
                    "
                    v-bind="
                      mergeProps(customCellAttrs(
                        context(node.row, column, index, columnIndex),
                      ), cellNavigation && (!column.type || column.type === 'default') ? cellNavigationState.attrs(node.token, column.key, columnIndex) : {})
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
                    <template v-if="column.type === 'selection'">
                      <slot
                        name="selection-cell"
                        :row="node.row"
                        :index="index"
                        :column="column"
                        :checked="selectedSet.has(node.token)"
                        :indeterminate="halfSet.has(node.token)"
                        :disabled="busy || !model.eligible(node)"
                        :toggle="
                          (selected?: boolean) =>
                            model.toggleRowSelection(node.key, selected)
                        "
                      >
                        <HysRadio
                          v-if="selectionType === 'radio'"
                          :name="id + '-selection'"
                          :model-value="selectedKeys[0] ?? null"
                          :value="node.key"
                          :disabled="busy || !model.eligible(node)"
                          :aria-label="
                            getSelectionProps?.(node.row, node.index).label ??
                            labelText(words.selectRow, index + 1)
                          "
                          :title="
                            getSelectionProps?.(node.row, node.index).title
                          "
                          @click.stop
                          @update:model-value="
                            model.toggleRowSelection(node.key, true)
                          " /><HysCheckbox
                          v-else
                          :model-value="selectedSet.has(node.token)"
                          :indeterminate="halfSet.has(node.token)"
                          :disabled="busy || !model.eligible(node)"
                          :aria-label="
                            getSelectionProps?.(node.row, node.index).label ??
                            labelText(words.selectRow, index + 1)
                          "
                          :title="
                            getSelectionProps?.(node.row, node.index).title
                          "
                          @click.stop="selectionShift = $event.shiftKey"
                          @update:model-value="
                            selectRow(node, $event === true)
                          " /></slot
                    ></template>
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
                      <slot
                        name="expand-icon"
                        :row="node.row"
                        :index="index"
                        :expanded="expandedSet.has(node.token)"
                        :loading="pending.has(node.token)"
                        :depth="node.depth"
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
                      /></slot>
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
                            !explicitExpand &&
                            showExpandColumn
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
                            <slot
                              name="expand-icon"
                              :row="node.row"
                              :index="index"
                              :expanded="expandedSet.has(node.token)"
                              :loading="pending.has(node.token)"
                              :depth="node.depth"
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
                                  'hys-ui-table-spinner': pending.has(
                                    node.token,
                                  ),
                                }"
                                :size="16"
                                aria-hidden="true"
                            /></slot></button
                          ><span v-else class="hys-ui-table-tree-spacer"
                        /></template>
                        <span
                          class="hys-ui-table-cell-text"
                          :style="tabularCellWrap(column.wrap).style"
                          :class="[tabularCellWrap(column.wrap).class, {
                            'hys-ui-table-ellipsis':
                              !tabularCellWrap(column.wrap).class && (column.ellipsis || overflowTooltip(column)),
                          }]"
                          :tabindex="overflowTooltip(column) ? 0 : undefined"
                          :title="
                            typeof column.ellipsis === 'object' &&
                            column.ellipsis.showTitle !== false &&
                            !overflowTooltip(column)
                              ? text(tableValue(node.row, column.dataIndex ?? column.key))
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
              </component>
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
                <div class="hys-ui-table-state">
                  <slot name="empty">{{ emptyText ?? words.emptyText }}</slot>
                </div>
              </td>
            </tr></template
          >
          <tr v-if="$slots.append" class="hys-ui-table-append">
            <td :colspan="Math.max(1, layout.leaves.length)">
              <slot name="append" :rows="model.filteredRows.value" />
            </td>
          </tr>
        </component>
        <tfoot
          v-if="(showSummary || $slots.summary) && (!loading || loadingMode === 'overlay')"
          class="hys-ui-table-summary"
          :class="{ 'hys-ui-table-summary-sticky': stickySummary }"
        >
          <slot
            name="summary"
            :columns="layout.leaves"
            :rows="summaryRows"
            :values="summaries"
            :cell-attrs="summaryCellAttrs"
          >
            <tr>
              <td
                v-for="(column, index) in layout.leaves"
                :key="column.key"
                v-bind="summaryCellAttrs(column)"
              >
                <slot
                  name="summary-cell"
                  :column="column"
                  :index="index"
                  :value="summaries[index]"
                  :rows="summaryRows"
                  ><RenderContent :value="summaries[index]"
                /></slot>
              </td>
            </tr>
          </slot>
        </tfoot>
      </component>
    </div>
      <div v-if="loading && loadingMode === 'overlay'" class="hys-ui-table-loading-overlay" role="status">
        <slot name="loading">
          <LoaderCircle class="hys-ui-table-spinner" :size="18" />
          {{ words.loadingText }}
        </slot>
      </div>
    </div>
    <Teleport to="body">
      <div
        v-if="stickyBar"
        ref="stickyBarElement"
        v-bind="attrs"
        class="hys-ui-table-sticky-scrollbar"
        :class="nativeScrollbar ? 'hys-ui-table-native-scrollbar' : 'hys-ui-scrollbar'"
        :style="{
          top: stickyBar.top + 'px',
          left: stickyBar.left + 'px',
          width: stickyBar.width + 'px',
          height: scrollbarHeight + 'px',
          direction: stickyBar.direction,
        }"
        role="region"
        :aria-label="words.stickyScrollLabel"
        tabindex="0"
        @scroll="scrollViewport"
      >
        <div aria-hidden="true" :style="{ width: stickyBar.contentWidth + 'px', height: '1px' }" />
      </div>
    </Teleport>
    <div v-if="$slots.footer" class="hys-ui-table-footer">
      <slot name="footer" :rows="model.filteredRows.value" :page-rows="pageRows" :query="query" />
    </div>
    <div
      v-for="position in paginationPositions.filter((p) =>
        p.startsWith('bottom-'),
      )"
      :key="position"
      class="hys-ui-table-pagination"
      :data-position="position"
    >
      <slot
        name="pagination"
        :position="position"
        :props="paginationProps"
        :set-page="model.requestPage"
        :set-page-size="model.changeSize"
      >
        <HysPagination
          v-bind="paginationProps"
          @change="model.requestPage($event)"
          @page-size-change="model.changeSize"
        />
      </slot>
    </div>
    <Teleport
      :to="filterTarget || 'body'"
      :disabled="filterTarget === false"
      ><PopupMotion :popup-transition="props.popupTransition" :popup-transition-duration="props.popupTransitionDuration" :placement="floatingFilter.placement.value"><div
        v-if="filterOpen && filterColumn"
        :id="id + '-filter'"
        ref="filterPanel"
        v-bind="attrs"
        class="hys-ui-table-filter-panel hys-ui-floating-surface"
        :style="filterStyle"
        role="dialog"
        :aria-label="words.filter + filterColumn.label"
      >
        <RenderContent
          v-if="filterColumn.renderFilterDropdown && filterContext"
          :value="filterColumn.renderFilterDropdown(filterContext)"
        />
        <slot
          v-else
          name="filter-dropdown"
          :column="filterColumn"
          :open="filterOpen"
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
              @click="clearActiveFilter()"
              >{{ words.reset }}</HysButton
            ><HysButton size="sm" @click="confirmFilter()">{{
              words.apply
            }}</HysButton>
          </div></slot
        >
      </div></PopupMotion></Teleport
    >
    <Teleport :to="tipTarget || 'body'" :disabled="tipTarget === false"
      ><PopupMotion :popup-transition="props.popupTransition" :popup-transition-duration="props.popupTransitionDuration" :placement="floatingTip.placement.value"><div
        v-if="tipOpen && (tipContext || sortTipColumn)"
        :id="id + '-tooltip'"
        ref="tipPanel"
        v-bind="attrs"
        class="hys-ui-table-tooltip hys-ui-floating-tooltip"
        :data-effect="tipOptions.effect"
        role="tooltip"
        :style="[
          tipStyle,
          tipOptions.enterable === false ? { pointerEvents: 'none' } : undefined,
          tipOptions.maxWidth !== undefined && length(tipOptions.maxWidth)
            ? { maxWidth: `min(${length(tipOptions.maxWidth)}, calc(100vw - 20px))` }
            : undefined,
        ]"
        @pointerenter="keepTip"
        @pointerleave="hideTip"
      >
        <slot v-if="tipContext" name="tooltip" v-bind="tipContext"
          ><RenderContent :value="tipContent"
        /></slot><RenderContent v-else :value="tipContent" /></div
    ></PopupMotion></Teleport>
  </div>
</template>

<style scoped>
.hys-ui-table-cell-text.hys-ui-cell-wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.hys-ui-table-cell-text.hys-ui-cell-clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hys-ui-data-table [data-hys-cell-index]:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-data-table [data-hys-navigation-row]:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
  position: relative;
}
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
  overscroll-behavior: contain auto;
}
.hys-ui-table-viewport {
  position: relative;
}
.hys-ui-table-scroll {
  container-type: inline-size;
}
.hys-ui-table-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: color-mix(in srgb, var(--hys-ui-surface, var(--hys-ui-theme-surface)) 78%, transparent);
}
.hys-ui-table-scroll:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-table-sticky-scrollbar {
  position: fixed;
  z-index: 6;
  overflow-x: scroll;
  overflow-y: hidden;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
}
.hys-ui-table-native-scrollbar {
  scrollbar-color: auto;
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
.hys-ui-data-table thead tr {
  background: var(--hys-ui-table-head-bg);
}
.hys-ui-data-table thead th {
  background: inherit;
}
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
.hys-ui-table-summary > :deep(tr > :is(td, th)) {
  background: var(--hys-ui-table-head-bg);
  box-sizing: border-box;
  padding: var(--hys-ui-table-summary-padding, 12px 14px);
  font-size: var(--hys-ui-table-summary-font-size, inherit);
  font-weight: 600;
  overflow-wrap: anywhere;
  vertical-align: middle;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-bottom: 0;
}
.hys-ui-table-sm {
  --hys-ui-table-summary-padding: 7px 10px;
  --hys-ui-table-summary-font-size: 12px;
}
.hys-ui-table-lg {
  --hys-ui-table-summary-padding: 17px 18px;
  --hys-ui-table-summary-font-size: 14px;
}
.hys-ui-table-summary-sticky {
  position: sticky;
  bottom: 0;
  z-index: 4;
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
  padding: 34px 0;
  overflow: visible;
  text-align: center;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-table-state {
  position: sticky;
  inset-inline-start: 0;
  box-sizing: border-box;
  inline-size: min(100%, 100cqi);
  padding-inline: 16px;
  white-space: normal;
  overflow-wrap: anywhere;
}
.hys-ui-table-loading-state {
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
.hys-ui-table-tooltip[data-effect="light"] {
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
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
