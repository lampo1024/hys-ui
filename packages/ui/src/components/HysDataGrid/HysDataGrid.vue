<script lang="ts">
export type { GridColumn } from "../../composables/dataGrid";
</script>
<script setup lang="ts" generic="T extends object = Record<string, unknown>">
import {
  computed,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  useId,
  watch,
  type ComputedRef,
} from "vue";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Ellipsis,
  Search,
  Settings2,
} from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import PopupMotion from "../../motion/PopupMotion";
import {
  gridField,
  gridKey,
  gridRows,
  gridToken,
  gridTree,
  gridValue,
  positiveInteger,
  type GridColumn,
  type GridTreeRow,
  type HysDataGridKey,
  type HysDataGridProps,
  type HysDataGridQuery,
  type HysDataGridSort,
} from "../../composables/dataGrid";
import { useDataGridRemote } from "../../composables/useDataGridRemote";
import { gridPageCount } from "../../composables/gridCore";
import { useTabularRowNavigation } from "../../composables/useTabularRowNavigation";
import { tabularCellControls, useTabularCellNavigation } from "../../composables/useTabularCellNavigation";
import { tabularCellWrap, tabularDisplayText } from "../../composables/tabularCellDisplay";
import {
  gridMinColumnWidth as minWidth,
  gridMaxColumnWidth as maxWidth,
  gridBoundColumnWidth as boundWidth,
  normalizeGridColumnLayout,
  type HysDataGridColumnLayout,
  type HysDataGridColumnLayoutSnapshot,
} from "./gridColumnLayout";
import {
  gridHeaderGroups,
  type HysDataGridCellContext,
  type HysDataGridContext,
  type HysDataGridHeaderContext,
  type HysDataGridHeaderGroup,
  type HysDataGridPin,
  type HysDataGridRowContext,
} from "./gridPresentation";
import { useGridContextMenu } from "./useGridContextMenu";
import { useGridRowWindow } from "./useGridRowWindow";
import { useGridColumnMotion } from "./useGridColumnMotion";
import type { HysContextMenuItem, HysContextMenuSlots, HysMenuKey, HysMenuSelectInfo } from "../../composables/menu";
import HysContextMenu from "../HysContextMenu/HysContextMenu.vue";
import HysSortableList from "../HysSortableList/HysSortableList.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysRadio from "../HysRadio/HysRadio.vue";
import HysButton from "../HysButton/HysButton.vue";
import HysPagination from "../HysPagination/HysPagination.vue";

const props = withDefaults(defineProps<HysDataGridProps<T>>(), {
  rowKey: "id",
  selectable: true,
  showToolbar: true,
  pagination: true,
  emptyText: "暂无数据",
  density: "normal",
  parentKey: "parentId",
  selectionType: "checkbox",
  reserveSelection: undefined,
  summaryScope: "filtered",
  headerMenuButton: true,
});
const emit = defineEmits<{
  rowClick: [row: T];
  selectionChange: [keys: HysDataGridKey[]];
  "update:selectedRowKeys": [keys: HysDataGridKey[]];
  columnsChange: [keys: string[]];
  columnLayoutChange: [layout: HysDataGridColumnLayoutSnapshot];
  "update:currentRowKey": [key: HysDataGridKey | null];
  currentChange: [key: HysDataGridKey | null, previous: HysDataGridKey | null];
  headerClick: [context: HysDataGridHeaderContext<T>, event: MouseEvent];
  headerContextmenu: [context: HysDataGridHeaderContext<T>, event: MouseEvent];
  rowDblclick: [context: HysDataGridRowContext<T>, event: MouseEvent];
  rowContextmenu: [context: HysDataGridRowContext<T>, event: MouseEvent];
  cellClick: [context: HysDataGridCellContext<T>, event: MouseEvent];
  cellDblclick: [context: HysDataGridCellContext<T>, event: MouseEvent];
  cellKeydown: [context: HysDataGridCellContext<T>, event: KeyboardEvent];
  cellContextmenu: [context: HysDataGridCellContext<T>, event: MouseEvent];
  cellMouseEnter: [context: HysDataGridCellContext<T>, event: MouseEvent];
  cellMouseLeave: [context: HysDataGridCellContext<T>, event: MouseEvent];
  contextMenuSelect: [key: HysMenuKey, context: HysDataGridContext<T>, info: HysMenuSelectInfo];
  "update:groupBy": [key: string];
  groupChange: [key: string];
  sortChange: [sort: HysDataGridSort | null];
  pageChange: [page: number];
  pageSizeChange: [size: number];
  "update:query": [query: HysDataGridQuery];
  queryChange: [query: HysDataGridQuery];
  loadError: [error: unknown];
  cellEdit: [
    payload: { row: T; rowKey: HysDataGridKey; column: string; value: string },
  ];
  batchEdit: [
    payload: { keys: HysDataGridKey[]; column: string; value: string },
  ];
}>();
const slots = defineSlots<{
  empty?(scope: { query: HysDataGridQuery }): unknown;
  loading?(): unknown;
  error?(scope: { error: unknown; retry: () => void }): unknown;
  "toolbar-actions"?(scope: {
    query: HysDataGridQuery;
    selectedKeys: HysDataGridKey[];
  }): unknown;
  "header-cell"?(scope: HysDataGridHeaderContext<T>): unknown;
  "header-group"?(scope: { group: HysDataGridHeaderGroup; columns: readonly GridColumn<T>[]; pinned?: HysDataGridPin }): unknown;
  "body-cell"?(scope: HysDataGridCellContext<T>): unknown;
  "row-number"?(scope: HysDataGridRowContext<T>): unknown;
  "row-number-header"?(): unknown;
  /** Interactive control beside a context menu item. */
  "context-menu-item-control"?(scope: Parameters<NonNullable<HysContextMenuSlots["item-control"]>>[0]): unknown;
  [key: string]: ((scope: any) => unknown) | undefined;
}>();

const hysRootAttrs = useHysRootAttrs();
const tableRef = ref<HTMLElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const columnMotion = useGridColumnMotion(() => scrollRef.value);
const menuRef = ref<HTMLElement | null>(null);
const settingsOpen = ref(false);
const filtersVisible = ref(false);
const activeFilterColumn = ref<string>();
const filterRowId = useId();
const radioName = useId();
const columnMap = computed(
  () => new Map(props.columns.map((column) => [column.key, column])),
);

function normalizeQuery(value: Partial<HysDataGridQuery>): HysDataGridQuery {
  const sort: HysDataGridSort[] = [];
  const seen = new Set<string>();
  for (const item of value.sort ?? []) {
    const column = columnMap.value.get(item.key);
    if (!column || column.sortable === false || seen.has(item.key)) continue;
    if (item.direction !== "asc" && item.direction !== "desc") continue;
    seen.add(item.key);
    sort.push({ key: item.key, direction: item.direction });
    if (!props.multiSort) break;
  }
  const filters = Object.fromEntries(
    Object.entries(value.filters ?? {}).filter(([key, term]) => {
      const column = columnMap.value.get(key);
      return (
        column &&
        column.filterable !== false &&
        typeof term === "string" &&
        term !== ""
      );
    }),
  );
  return {
    page: positiveInteger(value.page, 1),
    pageSize: positiveInteger(value.pageSize, 10),
    sort,
    search: value.search ?? "",
    filters,
  };
}
const initialQuery = () =>
  normalizeQuery({
    ...props.defaultQuery,
    page: props.page ?? props.defaultQuery?.page,
    pageSize: props.pageSize ?? props.defaultQuery?.pageSize,
  });
const localQuery = shallowRef(initialQuery());
const requestedQuery = computed(() =>
  normalizeQuery(props.query ?? localQuery.value),
);
const effectiveSorts = computed(() => requestedQuery.value.sort);
const search = computed({
  get: () => requestedQuery.value.search,
  set: (search) => setQuery({ search, page: 1 }),
});
const filters = computed(() => requestedQuery.value.filters);
const filterTerm = (key: string) =>
  Object.hasOwn(filters.value, key) ? filters.value[key] : "";
const safePageSize = computed(() => props.pagination ? requestedQuery.value.pageSize : Math.max(1, props.rows.length));
const isRemote = computed(() => props.serverMode || !!props.loadRows);
const localGroupBy = ref<string>();
const groupBy = computed(() => {
  const key = props.groupBy ?? localGroupBy.value ?? props.defaultGroupBy ?? "";
  return columnMap.value.has(key) ? key : "";
});
function setGroupBy(key: string) {
  const next = columnMap.value.has(key) ? key : "";
  if (next === groupBy.value) return;
  if (props.groupBy === undefined) localGroupBy.value = next;
  emit("update:groupBy", next);
}
const expandedTree = shallowRef(new Set<HysDataGridKey>());
const collapsedGroups = shallowRef(new Set<string>());
const editing = ref<{ id: HysDataGridKey; key: string } | null>(null);
const editValue = ref("");
const batchColumn = ref("");
const batchValue = ref("");
const collator = new Intl.Collator("zh-CN", { numeric: true });

const query: ComputedRef<HysDataGridQuery> = computed(() => ({
  ...requestedQuery.value,
  page: Math.min(requestedQuery.value.page, totalPages.value),
}));
const {
  pending,
  failure,
  reload: reloadRows,
  sourceRows,
  remoteTotal,
} = useDataGridRemote(props, query, (error) => emit("loadError", error));
const busy = computed(() => props.loading || pending.value);
const indexedRows = computed(() =>
  gridRows(
    sourceRows.value,
    props.rowKey,
    isRemote.value ? (query.value.page - 1) * safePageSize.value : 0,
  ),
);
const cellText = (row: T, column: GridColumn<T>) =>
  String(gridValue(row, column) ?? "");

const processed = computed(() => {
  const rows = indexedRows.value;
  if (isRemote.value) return rows;
  const term = search.value.trim().toLocaleLowerCase();
  const columnFilters = Object.entries(filters.value).flatMap(
    ([key, value]) => {
      const column = columnMap.value.get(key);
      return column ? [{ column, value, term: value.toLocaleLowerCase() }] : [];
    },
  );
  const matched = rows.filter(
    ({ row }) =>
      (!term ||
        props.columns.some((column) =>
          cellText(row, column).toLocaleLowerCase().includes(term),
        )) &&
      columnFilters.every((filter) =>
        filter.column.filterMethod
          ? filter.column.filterMethod(filter.value, row)
          : cellText(row, filter.column)
              .toLocaleLowerCase()
              .includes(filter.term),
      ),
  );
  if (!effectiveSorts.value.length) return matched;
  return matched.sort((a, b) => {
    for (const { key, direction } of effectiveSorts.value) {
      const column = columnMap.value.get(key)!;
      const av = gridValue(a.row, column);
      const bv = gridValue(b.row, column);
      const result = column.sortMethod
        ? column.sortMethod(a.row, b.row)
        : typeof av === "number" && typeof bv === "number"
          ? av - bv
          : collator.compare(String(av ?? ""), String(bv ?? ""));
      if (result) return direction === "asc" ? result : -result;
    }
    return 0;
  });
});
const treeRows = computed<GridTreeRow<T>[]>(() =>
  props.treeMode
    ? gridTree(processed.value, props.parentKey, expandedTree.value)
    : processed.value.map((row) => ({ ...row, depth: 0, hasChildren: false })),
);
const totalCount = computed(() =>
  isRemote.value
    ? Math.max(
        0,
        Math.floor(
          Number.isFinite(remoteTotal.value)
            ? remoteTotal.value!
            : sourceRows.value.length,
        ),
      )
    : treeRows.value.length,
);
const totalPages = computed(() =>
  props.loadRows && remoteTotal.value === undefined
    ? Number.MAX_SAFE_INTEGER
    : props.pagination ? gridPageCount(totalCount.value, safePageSize.value) : 1,
);
const page = computed(() => query.value.page);
const pageRows = computed(() =>
  isRemote.value
    ? treeRows.value
    : treeRows.value.slice(
        (page.value - 1) * safePageSize.value,
        page.value * safePageSize.value,
      ),
);
const getQuery = () => normalizeQuery(query.value);
function setQuery(change: Partial<HysDataGridQuery>) {
  const next = normalizeQuery({ ...query.value, ...change });
  if (JSON.stringify(next) === JSON.stringify(query.value)) return;
  if (props.query === undefined) localQuery.value = next;
  emit("update:query", normalizeQuery(next));
}
function resetQuery() {
  setQuery(initialQuery());
}
function reload() {
  if (props.loadRows) void reloadRows();
  else emit("queryChange", getQuery());
}
function setFilter(key: string, value: string) {
  setQuery({ filters: { ...filters.value, [key]: value }, page: 1 });
}
watch(
  [() => props.page, () => props.pageSize],
  ([page, size], [oldPage, oldSize]) => {
    const current = localQuery.value;
    localQuery.value = normalizeQuery({
      ...current,
      page: page !== oldPage ? page : size !== oldSize ? 1 : current.page,
      pageSize: size !== oldSize ? size : current.pageSize,
    });
  },
);
watch([totalPages, () => localQuery.value.page], ([maximum]) => {
  if (props.query === undefined && localQuery.value.page > maximum)
    localQuery.value = { ...localQuery.value, page: maximum };
});
watch(
  () => JSON.stringify(query.value),
  () => {
    editing.value = null;
    if (props.scrollToTopOnQuery && scrollRef.value)
      scrollRef.value.scrollTop = 0;
    emit("queryChange", getQuery());
  },
  { flush: "post" },
);
onMounted(() => {
  if (props.immediateQuery) emit("queryChange", getQuery());
});
let changingPageSize = false;
async function setPage(value: number) {
  if (changingPageSize) return;
  const previous = page.value;
  setQuery({ page: Math.min(value, totalPages.value) });
  await nextTick();
  if (page.value !== previous) emit("pageChange", page.value);
}
async function onPageSizeChange(value: number) {
  const previous = safePageSize.value;
  changingPageSize = true;
  setQuery({ pageSize: value, page: 1 });
  await nextTick();
  changingPageSize = false;
  if (safePageSize.value !== previous)
    emit("pageSizeChange", safePageSize.value);
}
async function applySort(
  column: GridColumn<T>,
  direction: HysDataGridSort["direction"] | null,
) {
  if (column.sortable === false) return;
  const before = JSON.stringify(effectiveSorts.value);
  const sort = props.multiSort
    ? effectiveSorts.value.filter((item) => item.key !== column.key)
    : [];
  if (direction) sort.push({ key: column.key, direction });
  setQuery({ sort, page: 1 });
  await nextTick();
  if (JSON.stringify(effectiveSorts.value) !== before)
    emit("sortChange", effectiveSorts.value[0] ?? null);
}
function toggleSort(column: GridColumn<T>) {
  const current = effectiveSorts.value.find(
    (item) => item.key === column.key,
  )?.direction;
  void applySort(
    column,
    current === "asc" ? "desc" : current === "desc" ? null : "asc",
  );
}
function chooseSort(
  column: GridColumn<T>,
  direction: HysDataGridSort["direction"],
) {
  const current = effectiveSorts.value.find(
    (item) => item.key === column.key,
  )?.direction;
  void applySort(column, current === direction ? null : direction);
}

const groupOptions = computed(() =>
  props.columns.filter((column) => column.key !== props.rowKey),
);
type DisplayRow =
  | { kind: "row"; key: string; item: GridTreeRow<T>; pageIndex: number }
  | { kind: "group"; key: string; label: string; rows: T[] };
function groupKey(value: unknown, label: string) {
  try {
    return "group:" + JSON.stringify(value ?? null);
  } catch {
    return "group:" + typeof value + ":" + label;
  }
}
const displayRows = computed<DisplayRow[]>(() => {
  const items = pageRows.value.map((item, pageIndex) => ({
    kind: "row" as const,
    key: "row:" + gridToken(item.id),
    item,
    pageIndex,
  }));
  const column = columnMap.value.get(groupBy.value);
  if (!column) return items;
  const buckets = new Map<string, { label: string; rows: typeof items }>();
  for (const item of items) {
    const value = gridValue(item.item.row, column);
    const label = value == null || value === "" ? "（空）" : String(value);
    const key = groupKey(value, label);
    const bucket = buckets.get(key);
    if (bucket) bucket.rows.push(item);
    else buckets.set(key, { label, rows: [item] });
  }
  const result: DisplayRow[] = [];
  for (const [key, bucket] of buckets) {
    result.push({
      kind: "group",
      key,
      label: bucket.label,
      rows: bucket.rows.map(({ item }) => item.row),
    });
    if (!collapsedGroups.value.has(key)) result.push(...bucket.rows);
  }
  return result;
});
const navigableEntries = computed(() => new Map(displayRows.value.flatMap(
  (entry) => entry.kind === "row" ? [[gridToken(entry.item.id), entry] as const] : [],
)));
const navigableTokens = computed(() => [...navigableEntries.value.keys()]);
const rowWindow = useGridRowWindow(() => displayRows.value,
  (entry) => entry.kind === "row" ? props.virtualRows?.height(entry.item.row) : undefined,
  () => groupBy.value ? undefined : props.virtualRows,
  () => scrollRef.value);
const windowedRows = rowWindow.window;
const horizontal = shallowRef({ left: 0, width: 0 });
function scrollWindow() {
  gridMenu.close();
  rowWindow.update();
  if (props.virtualColumns && scrollRef.value) {
    const { scrollLeft, clientWidth } = scrollRef.value;
    horizontal.value = { left: Math.abs(scrollLeft), width: clientWidth };
  }
}
function focusGridCell(key: HysDataGridKey, columnKey: string, focus = true) {
  const token = gridToken(key);
  const reveal = () => cellNavigationState.focusCell(token, columnKey, focus);
  if (reveal()) return true;
  if (!navigableColumnKeys.value.has(columnKey)) return false;
  const row = navigableTokens.value.indexOf(token);
  if (row < 0) return false;
  const index = orderedColumns.value.findIndex(({ key }) => key === columnKey);
  const element = scrollRef.value;
  const needsColumn = !!(props.virtualColumns && element && !bodyColumns.value.some((item) => item.column?.key === columnKey));
  if (needsColumn && element) {
    element.scrollLeft = columnOffsets.value[index] * (getComputedStyle(element).direction === "rtl" ? -1 : 1);
    scrollWindow();
  }
  if (rowWindow.reveal(row, reveal)) return true;
  if (needsColumn) void nextTick(reveal);
  return needsColumn;
}
const rowNavigation = useTabularRowNavigation({
  enabled: () => !!props.keyboardNavigation && !props.cellNavigation && !busy.value && failure.value == null,
  table: () => scrollRef.value?.querySelector(":scope > table"),
  tokens: () => navigableTokens.value,
  attribute: "data-grid-row",
  toggle(token) {
    const item = navigableEntries.value.get(token)?.item;
    if (!item || !props.selectable || !canSelect(item)) return false;
    toggleRowSelection(item.id);
    return true;
  },
});
function toggleSet<K>(values: ReadonlySet<K>, key: K) {
  const next = new Set(values);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}
function toggleTree(key: HysDataGridKey) {
  expandedTree.value = toggleSet(expandedTree.value, key);
}
function toggleGroup(key: string) {
  collapsedGroups.value = toggleSet(collapsedGroups.value, key);
}
watch(groupBy, () => {
  collapsedGroups.value = new Set();
  emit("groupChange", groupBy.value);
});
function setGroupsExpanded(expanded: boolean) {
  const keys = displayRows.value.flatMap((entry) => entry.kind === "group" ? [entry.key] : []);
  const next = new Set(collapsedGroups.value);
  for (const key of keys) {
    if (expanded) next.delete(key);
    else next.add(key);
  }
  collapsedGroups.value = next;
}
function canEdit(context: HysDataGridCellContext<T>) {
  const editable = context.column.editable;
  return !!props.editable && !busy.value &&
    (typeof editable === "function" ? editable(context) : editable === true);
}
function beginEdit(entry: DataEntry, column: GridColumn<T>, columnIndex: number) {
  if (!canEdit(cellContext(entry, column, columnIndex))) return false;
  const target = { id: entry.item.id, key: column.key };
  editing.value = target;
  editValue.value = cellText(entry.item.row, column);
  void nextTick(() => {
    if (editing.value?.id !== target.id || editing.value?.key !== target.key) return;
    const row = Array.from(scrollRef.value?.querySelectorAll<HTMLTableRowElement>("[data-grid-row]") ?? [])
      .find((element) => element.dataset.gridRow === gridToken(target.id));
    const cell = Array.from(row?.cells ?? []).find((element) => element.dataset.columnKey === target.key);
    cell?.querySelector("input")?.focus();
  });
  return true;
}
function commitEdit(entry: DataEntry, column: GridColumn<T>, index: number, returnFocus = false) {
  if (!isEditing(entry.item, column)) return;
  editing.value = null;
  const { item } = entry;
  if (returnFocus) void nextTick(() => cellNavigationState.focusCell(gridToken(item.id), column.key));
  if (!canEdit(cellContext(entry, column, index))) return;
  emit("cellEdit", {
    row: item.row,
    rowKey: item.id,
    column: column.key,
    value: editValue.value,
  });
}
function isEditing(item: GridTreeRow<T>, column: GridColumn<T>) {
  return editing.value?.id === item.id && editing.value?.key === column.key;
}
function cancelEdit(event: KeyboardEvent, item: GridTreeRow<T>, column: GridColumn<T>) {
  if (event.isComposing || event.keyCode === 229) return;
  editing.value = null;
  void nextTick(() => cellNavigationState.focusCell(gridToken(item.id), column.key));
}
const batchKeys = computed(() => {
  const column = columnMap.value.get(batchColumn.value);
  if (!props.editable || busy.value || !column?.editable) return [];
  const editable = column.editable;
  if (editable === true) return selected.value;
  const columnIndex = orderedColumns.value.indexOf(column);
  const tree = props.treeMode
    ? new Map(gridTree(indexedRows.value, props.parentKey, new Set(rowMap.value.keys())).map((row) => [row.id, row]))
    : undefined;
  return selected.value.filter((key) => {
    const entry = navigableEntries.value.get(gridToken(key));
    if (entry) return editable(cellContext(entry, column, columnIndex));
    const item = rowMap.value.get(key);
    if (!item) return false;
    const row = tree?.get(key) ?? { ...item, depth: 0, hasChildren: false };
    return editable(cellContext({ kind: "row", key: gridToken(key), item: row, pageIndex: -1 }, column, columnIndex));
  });
});
function commitBatch() {
  if (!batchKeys.value.length) return;
  emit("batchEdit", {
    keys: [...batchKeys.value],
    column: batchColumn.value,
    value: batchValue.value,
  });
  batchValue.value = "";
}
const numberFormat = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2,
});
const summaryRows = computed(() => rowsInScope(props.summaryScope));
function summaryValue(column: GridColumn<T>, rows = summaryRows.value) {
  if (props.summaryMethod) return props.summaryMethod(column, rows);
  if (!column.summary) return "";
  const values = rows
    .map((row) => gridValue(row, column))
    .filter((value) => value != null && value !== "");
  if (column.summary === "count") return String(values.length);
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return "—";
  const sum = nums.reduce((a, b) => a + b, 0);
  const result =
    column.summary === "sum"
      ? sum
      : column.summary === "avg"
        ? sum / nums.length
        : nums.reduce((a, b) =>
            column.summary === "min" ? Math.min(a, b) : Math.max(a, b),
          );
  return numberFormat.format(result);
}

function normalizeKeys(keys: readonly HysDataGridKey[]) {
  const valid = [...new Set(keys.filter(gridKey))];
  return props.selectionType === "radio" ? valid.slice(0, 1) : valid;
}
const localSelection = shallowRef(
  normalizeKeys(props.defaultSelectedRowKeys ?? []),
);
const selected = computed(() =>
  normalizeKeys(props.selectedRowKeys ?? localSelection.value),
);
const localCurrent = ref<HysDataGridKey | null>();
const currentKey = computed(() => props.currentRowKey !== undefined
  ? props.currentRowKey
  : localCurrent.value === undefined ? props.defaultCurrentRowKey ?? null : localCurrent.value);
function setCurrentRow(key: HysDataGridKey | null) {
  if (key === currentKey.value || (key !== null && !rowMap.value.has(key))) return;
  if (props.currentRowKey === undefined) localCurrent.value = key;
  emit("update:currentRowKey", key);
}
watch(currentKey, (key, previous) => emit("currentChange", key, previous));
const selectionSet = computed(() => new Set(selected.value));
const rowMap = computed(
  () => new Map(indexedRows.value.map((item) => [item.id, item])),
);
const canSelect = (item: { row: T; index: number }) =>
  props.rowSelectable?.(item.row, item.index) !== false;
const pageKeys = computed(() =>
  pageRows.value.filter(canSelect).map((item) => item.id),
);
const allPageSelected = computed(
  () =>
    pageKeys.value.length > 0 &&
    pageKeys.value.every((key) => selectionSet.value.has(key)),
);
const somePageSelected = computed(() =>
  pageKeys.value.some((key) => selectionSet.value.has(key)),
);
const getSelection = () => [...selected.value];
function rowsInScope(scope?: "page" | "filtered" | "selected") {
  if (scope === "selected")
    return selected.value.flatMap((key) => {
      const item = rowMap.value.get(key);
      return item ? [item.row] : [];
    });
  return (scope === "page" ? pageRows.value : processed.value).map(({ row }) => row);
}
function setSelection(keys: HysDataGridKey[]) {
  const next = normalizeKeys(keys);
  if (
    next.length === selected.value.length &&
    next.every((key, index) => key === selected.value[index])
  )
    return;
  if (props.selectedRowKeys === undefined) localSelection.value = next;
  emit("update:selectedRowKeys", [...next]);
}
watch(
  () => JSON.stringify(selected.value),
  () => emit("selectionChange", getSelection()),
);
watch([rowMap, () => props.reserveSelection, isRemote], () => {
  if (
    props.selectedRowKeys === undefined &&
    !(props.reserveSelection ?? isRemote.value)
  ) {
    setSelection(selected.value.filter((key) => rowMap.value.has(key)));
  }
});
function toggleRowSelection(
  key: HysDataGridKey,
  checked = !selectionSet.value.has(key),
) {
  const item = rowMap.value.get(key);
  if (!props.selectable || !item || !canSelect(item)) return;
  if (!checked) setSelection(selected.value.filter((id) => id !== key));
  else
    setSelection(
      props.selectionType === "radio" ? [key] : [...selected.value, key],
    );
}
function clearSelection() {
  setSelection([]);
}
function selectPage(checked: boolean) {
  if (props.selectionType === "radio") return;
  const keys = new Set(pageKeys.value);
  setSelection(
    checked
      ? [...selected.value, ...keys]
      : selected.value.filter((key) => !keys.has(key)),
  );
}

function readColumnSettings(): HysDataGridColumnLayout {
  if (!props.storageKey || typeof localStorage === "undefined") return {};
  try {
    const value = JSON.parse(
      localStorage.getItem("hys-ui-grid:" + props.storageKey) || "{}",
    );
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}
const saved = normalizeGridColumnLayout(columnMap.value, readColumnSettings());
const order = ref(saved.order);
const hidden = ref(saved.hidden);
const widths = ref(saved.widths);
const pins = ref(saved.pins);
function getColumnLayout(): HysDataGridColumnLayoutSnapshot {
  return { order: [...order.value], hidden: [...hidden.value], widths: { ...widths.value },
    ...(Object.keys(pins.value).length ? { pins: { ...pins.value } } : {}) };
}
function setColumnLayout(layout: HysDataGridColumnLayout) {
  const next = normalizeGridColumnLayout(columnMap.value, {
    ...layout,
    order: props.columnOrder ?? layout.order,
  });
  order.value = next.order;
  hidden.value = next.hidden;
  widths.value = next.widths;
  pins.value = next.pins;
}
const previewWidth = shallowRef<{ key: string; width: number }>();
const widthOf = (column: GridColumn<T>) =>
  previewWidth.value?.key === column.key
    ? previewWidth.value.width
    : Object.hasOwn(widths.value, column.key)
      ? widths.value[column.key]
      : positiveInteger(column.width, 160);

watch(
  () => [
    props.columnOrder?.slice(),
    props.columns.map((column) => [
      column.key,
      column.hideable,
      column.pinnable,
      column.minWidth,
      column.maxWidth,
      column.resizable,
      column.width,
    ]),
  ],
  (_, previous) => {
    if (previous) cancelResize();
    setColumnLayout(getColumnLayout());
  },
  { immediate: true },
);
const visibleColumns = computed(() =>
  order.value.flatMap((key) => {
    const column = columnMap.value.get(key);
    return column && !hidden.value.includes(key) ? [column] : [];
  }),
);
function pinOf(column: GridColumn<T>) {
  return (Object.hasOwn(pins.value, column.key) ? pins.value[column.key] : column.pinned) ?? undefined;
}
const orderedColumns = computed(() => [
  ...visibleColumns.value.filter((column) => pinOf(column) === "left"),
  ...visibleColumns.value.filter((column) => !pinOf(column)),
  ...visibleColumns.value.filter((column) => pinOf(column) === "right"),
]);
const navigableColumnKeys = computed(() => new Set(orderedColumns.value.map(({ key }) => key)));
const cellView = computed(() => {
  if (busy.value || failure.value != null) return undefined;
  const entries = navigableEntries.value;
  const columns = orderedColumns.value;
  const columnIndices = new Map(columns.map(({ key }, index) => [key, index]));
  return {
    rowKeys: [...entries.values()].map(({ item }) => item.id),
    columnKeys: [...columnIndices.keys()],
    getCell(rowKey: HysDataGridKey, columnKey: string) {
      const entry = entries.get(gridToken(rowKey));
      const index = columnIndices.get(columnKey);
      return entry && index !== undefined ? cellContext(entry, columns[index], index) : undefined;
    },
  };
});
const cellNavigationState = useTabularCellNavigation({
  enabled: () => !!props.cellNavigation && !busy.value && failure.value == null,
  table: () => scrollRef.value?.querySelector(":scope > table"),
  first: () => {
    const rowToken = navigableTokens.value[0];
    const columnKey = orderedColumns.value[0]?.key;
    return rowToken !== undefined && columnKey !== undefined ? { rowToken, columnKey } : undefined;
  },
  has: (rowToken, columnKey) => navigableEntries.value.has(rowToken) && navigableColumnKeys.value.has(columnKey),
});
watch([navigableEntries, navigableColumnKeys, busy], () => {
  const cell = editing.value;
  if (cell && (busy.value || !navigableEntries.value.has(gridToken(cell.id)) || !navigableColumnKeys.value.has(cell.key)))
    editing.value = null;
});
const headerGroups = computed(() => gridHeaderGroups(orderedColumns.value, pinOf));
const hasHeaderGroups = computed(() => headerGroups.value.some(({ group }) => !!group));
const settingsItems = computed(() =>
  order.value.flatMap((key) => {
    const column = columnMap.value.get(key);
    return column ? [{ id: key, label: column.label }] : [];
  }),
);
watch([order, hidden, widths, pins], () => {
  if (props.storageKey && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(
        "hys-ui-grid:" + props.storageKey,
        JSON.stringify({
          order: order.value,
          hidden: hidden.value,
          widths: widths.value,
          pins: pins.value,
        }),
      );
    } catch {
      /* Storage can be unavailable. */
    }
  }
  emit(
    "columnsChange",
    orderedColumns.value.map((column) => column.key),
  );
  emit("columnLayoutChange", getColumnLayout());
});
function toggleColumn(column: GridColumn<T>) {
  setColumnVisibility(column.key, hidden.value.includes(column.key));
}
function setColumnVisibility(key: string, visible: boolean) {
  const column = columnMap.value.get(key);
  if (!column || visible === !hidden.value.includes(key)) return false;
  if (!visible && (column.hideable === false || visibleColumns.value.length <= 1)) return false;
  cancelResize();
  endColumnDrag();
  hidden.value = visible ? hidden.value.filter((item) => item !== key) : [...hidden.value, key];
  return true;
}
function pinColumn(key: string, side: HysDataGridPin | null) {
  const column = columnMap.value.get(key);
  if (!column || column.pinnable === false || (side !== null && side !== "left" && side !== "right") ||
      pinOf(column) === (side ?? undefined)) return false;
  cancelResize();
  endColumnDrag();
  columnMotion.cancel();
  pins.value = { ...pins.value, [key]: side };
  if (column.pinned === (side ?? undefined)) delete pins.value[key];
  return true;
}
function resizeColumn(key: string, width: number) {
  const column = columnMap.value.get(key);
  if (!column || column.resizable === false || !Number.isFinite(width)) return false;
  const next = boundWidth(column, width);
  if (next === widthOf(column)) return false;
  cancelResize();
  return commitWidth(key, next);
}
function commitWidth(key: string, width: number) {
  if (props.commitColumnWidth) return props.commitColumnWidth(key, width);
  widths.value = { ...widths.value, [key]: width };
  return true;
}
function resetColumnWidth(key: string) {
  if (!Object.hasOwn(widths.value, key)) return false;
  cancelResize();
  const next = { ...widths.value };
  delete next[key];
  widths.value = next;
  return true;
}
const tableWidth = computed(() =>
  orderedColumns.value.reduce(
    (sum, column) => sum + widthOf(column),
    (props.selectable ? 44 : 0) + (props.rowNumbers ? 48 : 0),
  ),
);
const tableColumnCount = computed(() =>
  Math.max(
    1,
    orderedColumns.value.length + Number(props.selectable) +
      Number(props.rowNumbers) + Number(!!props.fillRemainingWidth),
  ),
);
const columnOffsets = computed(() => {
  const offsets = [0];
  for (const column of orderedColumns.value) offsets.push(offsets.at(-1)! + widthOf(column));
  return offsets;
});
const bodyColumns = computed(() => {
  const columns = orderedColumns.value;
  const offsets = columnOffsets.value;
  const { left, width } = horizontal.value;
  const entries: ({ column: GridColumn<T>; index: number; skip?: undefined } | { skip: number; index: number; column?: undefined })[] = [];
  for (const [index, column] of columns.entries()) {
    if (!props.virtualColumns || pinOf(column) ||
      (offsets[index + 1] >= left - 320 && offsets[index] <= left + (width || 900) + 320)) {
      entries.push({ column, index });
    } else {
      const previous = entries.at(-1);
      if (previous?.skip) previous.skip++;
      else entries.push({ skip: 1, index });
    }
  }
  return entries;
});
const stickyOffsets = computed(() => {
  const offsets = new Map<string, { left?: string; right?: string }>();
  let left = (props.selectable ? 44 : 0) + (props.rowNumbers ? 48 : 0);
  for (const column of orderedColumns.value) {
    if (pinOf(column) !== "left") continue;
    offsets.set(column.key, { left: left + "px" });
    left += widthOf(column);
  }
  let right = 0;
  for (const column of [...orderedColumns.value].reverse()) {
    if (pinOf(column) !== "right") continue;
    offsets.set(column.key, { right: right + "px" });
    right += widthOf(column);
  }
  return offsets;
});
const pinnedStyle = (column: GridColumn<T>, header = false) =>
  pinOf(column)
    ? {
        position: "sticky" as const,
        ...stickyOffsets.value.get(column.key),
        zIndex: header ? 5 : 2,
      }
    : {};

async function closeColumnFilters(restoreFocus = true) {
  filtersVisible.value = false;
  if (!restoreFocus) return;
  await nextTick();
  const headers = [
    ...(tableRef.value?.querySelectorAll<HTMLElement>(
      "thead th[data-column-key]",
    ) ?? []),
  ];
  const header = headers.find(
    (cell) => cell.dataset.columnKey === activeFilterColumn.value,
  );
  const button =
    header?.querySelector<HTMLButtonElement>(".hys-ui-pf-grid-filter") ??
    tableRef.value?.querySelector<HTMLButtonElement>(".hys-ui-pf-grid-filter");
  button?.focus({ preventScroll: true });
}
async function showColumnFilters(column: GridColumn<T>) {
  if (filtersVisible.value && activeFilterColumn.value === column.key) {
    await closeColumnFilters(false);
    return;
  }
  activeFilterColumn.value = column.key;
  filtersVisible.value = true;
  await nextTick();
  const cells = [
    ...(tableRef.value?.querySelectorAll<HTMLElement>("[data-filter-key]") ??
      []),
  ];
  cells
    .find((cell) => cell.dataset.filterKey === column.key)
    ?.querySelector("input")
    ?.focus({ preventScroll: true });
}

let resizing:
  | {
      column: GridColumn<T>;
      pointer: number;
      start: number;
      width: number;
      scale: number;
      cursor: string;
    }
  | undefined;
let resizeFrame = 0;
let nextWidth = 0;
function updateResize(event: PointerEvent) {
  if (!resizing || event.pointerId !== resizing.pointer) return;
  nextWidth = boundWidth(
    resizing.column,
    resizing.width + (event.clientX - resizing.start) / resizing.scale,
  );
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    if (resizing)
      previewWidth.value = { key: resizing.column.key, width: nextWidth };
  });
}
function cancelResize() {
  if (!resizing) return;
  cancelAnimationFrame(resizeFrame);
  resizeFrame = 0;
  previewWidth.value = undefined;
  if (document.body.style.cursor === "col-resize")
    document.body.style.cursor = resizing.cursor;
  resizing = undefined;
  window.removeEventListener("pointermove", updateResize);
  window.removeEventListener("pointerup", finishResize);
  window.removeEventListener("pointercancel", cancelResizePointer);
  window.removeEventListener("blur", cancelResize);
  window.removeEventListener("keydown", cancelResizeKey, true);
}
function cancelResizePointer(event: PointerEvent) {
  if (event.pointerId === resizing?.pointer) cancelResize();
}
function cancelResizeKey(event: KeyboardEvent) {
  if (event.key === "Escape" && resizing) {
    event.preventDefault();
    event.stopPropagation();
    cancelResize();
  }
}
function finishResize(event: PointerEvent) {
  if (!resizing || event.pointerId !== resizing.pointer) return;
  const { column, start, width, scale } = resizing;
  const movement = (event.clientX - start) / scale;
  const finalWidth =
    movement === 0 ? width : boundWidth(column, width + movement);
  cancelResize();
  if (finalWidth !== width) commitWidth(column.key, finalWidth);
}
function startResize(event: PointerEvent, column: GridColumn<T>) {
  if (column.resizable === false || event.button !== 0 || resizing) return;
  event.preventDefault();
  event.stopPropagation();
  const handle = event.currentTarget as HTMLElement;
  const scale = handle.getBoundingClientRect().width / handle.offsetWidth;
  resizing = {
    column,
    pointer: event.pointerId,
    start: event.clientX,
    width: widthOf(column),
    scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
    cursor: document.body.style.cursor,
  };
  document.body.style.cursor = "col-resize";
  window.addEventListener("pointermove", updateResize);
  window.addEventListener("pointerup", finishResize);
  window.addEventListener("pointercancel", cancelResizePointer);
  window.addEventListener("blur", cancelResize);
  window.addEventListener("keydown", cancelResizeKey, true);
}
function resizeWithKeyboard(event: KeyboardEvent, column: GridColumn<T>) {
  const step = event.shiftKey ? 40 : 10;
  const current = widthOf(column);
  const value =
    event.key === "ArrowLeft"
      ? current - step
      : event.key === "ArrowRight"
        ? current + step
        : event.key === "Home"
          ? minWidth(column)
          : event.key === "End"
            ? maxWidth(column)
            : undefined;
  if (value === undefined) return;
  event.preventDefault();
  const next = boundWidth(column, value);
  if (next !== current) commitWidth(column.key, next);
}

const dragging = ref<string | null>(null);
const columnDropTarget = ref<{
  key: string;
  position: "before" | "after";
} | null>(null);
let columnDragFrame = 0;
let pendingColumnHover: {
  element: HTMLElement;
  column: GridColumn<T>;
  x: number;
} | null = null;
function endColumnDrag() {
  cancelAnimationFrame(columnDragFrame);
  columnDragFrame = 0;
  pendingColumnHover = null;
  dragging.value = null;
  columnDropTarget.value = null;
}
function startColumnDrag(event: DragEvent, column: GridColumn<T>) {
  if (props.columnOrder || resizing || column.reorderable === false || !event.dataTransfer) {
    event.preventDefault();
    return;
  }
  columnMotion.cancel();
  dragging.value = column.key;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", column.key);
}
function canDropColumn(column: GridColumn<T>) {
  const source = props.columns.find((item) => item.key === dragging.value);
  return (
    !!source &&
    !props.columnOrder &&
    source.key !== column.key &&
    source.reorderable !== false &&
    column.reorderable !== false &&
    pinOf(source) === pinOf(column)
  );
}
function columnDestination(
  column: GridColumn<T>,
  x: number,
  element: HTMLElement,
) {
  const bounds = element.getBoundingClientRect();
  return {
    key: column.key,
    position:
      x < bounds.left + bounds.width / 2
        ? ("before" as const)
        : ("after" as const),
  };
}
function previewColumnDrop(event: DragEvent, column: GridColumn<T>) {
  if (!canDropColumn(column)) {
    cancelAnimationFrame(columnDragFrame);
    columnDragFrame = 0;
    pendingColumnHover = null;
    columnDropTarget.value = null;
    return;
  }
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  pendingColumnHover = {
    element: event.currentTarget as HTMLElement,
    column,
    x: event.clientX,
  };
  if (columnDragFrame) return;
  columnDragFrame = requestAnimationFrame(() => {
    columnDragFrame = 0;
    const hover = pendingColumnHover;
    pendingColumnHover = null;
    if (!hover || !canDropColumn(hover.column)) return;
    const next = columnDestination(hover.column, hover.x, hover.element);
    if (
      columnDropTarget.value?.key !== next.key ||
      columnDropTarget.value.position !== next.position
    )
      columnDropTarget.value = next;
  });
}
function leaveColumnDrag(event: DragEvent) {
  if (
    event.relatedTarget instanceof Element &&
    event.relatedTarget.closest("th[data-column-key]") &&
    (event.currentTarget as HTMLElement).contains(event.relatedTarget)
  )
    return;
  cancelAnimationFrame(columnDragFrame);
  columnDragFrame = 0;
  pendingColumnHover = null;
  columnDropTarget.value = null;
}
function dropColumn(event: DragEvent, column: GridColumn<T>) {
  if (!canDropColumn(column)) {
    endColumnDrag();
    return;
  }
  event.preventDefault();
  const target = columnDestination(
    column,
    event.clientX,
    event.currentTarget as HTMLElement,
  );
  const next = order.value.filter((key) => key !== dragging.value);
  const index = next.indexOf(target.key);
  if (index < 0) {
    endColumnDrag();
    return;
  }
  next.splice(
    index + (target.position === "after" ? 1 : 0),
    0,
    dragging.value!,
  );
  endColumnDrag();
  if (next.every((key, index) => key === order.value[index])) return;
  const before = columnMotion.capture();
  order.value = next;
  void columnMotion.play(before);
}

function applyColumnLayout(layout: HysDataGridColumnLayout) {
  cancelResize();
  endColumnDrag();
  columnMotion.cancel();
  setColumnLayout(layout);
}
function resetColumns() {
  applyColumnLayout({});
}
function exportCsv() {
  const columns = visibleColumns.value;
  const quote = (value: string) => '"' + value.replace(/"/g, '""') + '"';
  const data = [
    columns.map((column) => quote(column.label)).join(","),
    ...processed.value.map(({ row }) =>
      columns.map((column) => quote(cellText(row, column))).join(","),
    ),
  ];
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + data.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "projectflow-table.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const maxHeightStyle = computed(() =>
  typeof props.maxHeight === "number"
    ? props.maxHeight > 0 && Number.isFinite(props.maxHeight)
      ? props.maxHeight + "px"
      : undefined
    : props.maxHeight,
);
function scrollTo(options: ScrollToOptions) {
  scrollRef.value?.scrollTo(options);
}
function scrollToRow(key: HysDataGridKey) {
  const row = [
    ...(scrollRef.value?.querySelectorAll<HTMLElement>("[data-grid-row]") ??
      []),
  ].find((element) => element.dataset.gridRow === gridToken(key));
  row?.scrollIntoView({ block: "nearest", inline: "nearest" });
  return !!row;
}
type DataEntry = Extract<DisplayRow, { kind: "row" }>;
function rowContext(entry: DataEntry): HysDataGridRowContext<T> {
  const { item, pageIndex } = entry;
  return { row: item.row, rowKey: item.id, index: item.index, pageIndex, depth: item.depth,
    selected: selectionSet.value.has(item.id), current: currentKey.value === item.id };
}
function cellContext(entry: DataEntry, column: GridColumn<T>, columnIndex: number): HysDataGridCellContext<T> {
  return { ...rowContext(entry), column, columnIndex, value: gridValue(entry.item.row, column) };
}
function displayedCell(entry: DataEntry, column: GridColumn<T>, index: number) {
  if (!column.formatter && column.emptyText === undefined && props.emptyCellText === undefined)
    return cellText(entry.item.row, column);
  const context = cellContext(entry, column, index);
  return tabularDisplayText(context.value, column.emptyText ?? props.emptyCellText, () => column.formatter?.(context));
}
function headerContext(column: GridColumn<T>, columnIndex: number): HysDataGridHeaderContext<T> {
  return { column, columnIndex, sort: effectiveSorts.value.find((sort) => sort.key === column.key)?.direction,
    filter: filterTerm(column.key), pinned: pinOf(column) };
}
function presentation<C, R>(value: R | ((context: C) => R | undefined) | undefined, context: C) {
  return typeof value === "function" ? (value as (context: C) => R | undefined)(context) : value;
}
function clickRow(entry: DataEntry, event: MouseEvent) {
  if (props.highlightCurrentRow && !(event.target as HTMLElement).closest("button,a,input,select,textarea,[contenteditable]"))
    setCurrentRow(entry.item.id);
  emit("rowClick", entry.item.row);
}
function openHeaderMenu(event: MouseEvent, column: GridColumn<T>, index: number) {
  const context = headerContext(column, index);
  if (event.type === "contextmenu") emit("headerContextmenu", context, event);
  void gridMenu.open({ ...context, type: "header" }, event);
}
function openRowMenu(event: MouseEvent, entry: DataEntry) {
  const context = rowContext(entry);
  emit("rowContextmenu", context, event);
  void gridMenu.open({ ...context, type: "row" }, event);
}
function openCellMenu(event: MouseEvent, entry: DataEntry, column: GridColumn<T>, index: number) {
  const context = cellContext(entry, column, index);
  emit("cellContextmenu", context, event);
  emit("rowContextmenu", rowContext(entry), event);
  if ((event.target as HTMLElement).closest("input,textarea,[contenteditable]")) return;
  void gridMenu.open({ ...context, type: "cell" }, event);
}
function doubleClickCell(event: MouseEvent, entry: DataEntry, column: GridColumn<T>, index: number) {
  emit("cellDblclick", cellContext(entry, column, index), event);
  if (!event.defaultPrevented &&
      !(event.target as HTMLElement).closest(tabularCellControls))
    beginEdit(entry, column, index);
}
function keydownCell(event: KeyboardEvent, entry: DataEntry, column: GridColumn<T>, index: number) {
  if (event.defaultPrevented || event.isComposing) return;
  if (event.key === "F2" || event.key === "Enter") {
    emit("cellKeydown", cellContext(entry, column, index), event);
    if (event.defaultPrevented) return;
  }
  if (props.cellNavigation && event.key === "F2" &&
      !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey &&
      beginEdit(entry, column, index)) {
    event.preventDefault();
    return;
  }
  gridMenu.keydown({ ...cellContext(entry, column, index), type: "cell" }, event);
}
function defaultMenuItems(context: HysDataGridContext<T>): HysContextMenuItem[] {
  if (context.type === "header") {
    const { column, pinned, sort, filter } = context;
    return [
      ...(column.sortable === false ? [] : [
        { label: "升序排列", value: "sort-asc", disabled: sort === "asc" },
        { label: "降序排列", value: "sort-desc", disabled: sort === "desc" },
        { label: "清除本列排序", value: "clear-sort", disabled: !sort },
      ]),
      ...(column.filterable === false ? [] : [
        { label: "筛选此列", value: "filter" },
        { label: "清除本列筛选", value: "clear-filter", disabled: !filter },
      ]),
      ...(column.pinnable === false ? [] : [
        { label: "固定在左侧", value: "pin-left", disabled: pinned === "left" },
        { label: "固定在右侧", value: "pin-right", disabled: pinned === "right" },
        { label: "取消固定", value: "unpin", disabled: !pinned },
      ]),
      { label: "隐藏此列", value: "hide-column", disabled: column.hideable === false || visibleColumns.value.length <= 1 },
      { label: "恢复列宽", value: "reset-width", disabled: !Object.hasOwn(widths.value, column.key) },
    ];
  }
  const item = rowMap.value.get(context.rowKey);
  return [
    ...(props.selectable ? [{ label: context.selected ? "取消选择此行" : "选择此行", value: "toggle-selection", disabled: !item || !canSelect(item) }] : []),
    ...(props.highlightCurrentRow ? [{ label: "设为当前行", value: "current-row", disabled: context.current }] : []),
    ...(context.type === "cell" && canEdit(context) ? [{ label: "编辑此单元格", value: "edit-cell" }] : []),
  ];
}
const gridMenu = useGridContextMenu<T>({
  enabled: (context) => !!props.contextMenu && !busy.value &&
    (context.type === "header"
      ? visibleColumns.value.some((column) => column.key === context.column.key)
      : navigableEntries.value.has(gridToken(context.rowKey))),
  config: () => props.contextMenu,
  defaults: defaultMenuItems,
  select(key, context, info) {
    if (context.type === "header") {
      const column = columnMap.value.get(context.column.key)!;
      if (key === "sort-asc") void applySort(column, "asc");
      if (key === "sort-desc") void applySort(column, "desc");
      if (key === "clear-sort") setQuery({ sort: effectiveSorts.value.filter((sort) => sort.key !== column.key), page: 1 });
      if (key === "filter") requestAnimationFrame(() => {
        if (scrollRef.value?.isConnected && visibleColumns.value.includes(column)) void showColumnFilters(column);
      });
      if (key === "clear-filter") setFilter(column.key, "");
      if (key === "pin-left") pinColumn(column.key, "left");
      if (key === "pin-right") pinColumn(column.key, "right");
      if (key === "unpin") pinColumn(column.key, null);
      if (key === "hide-column") setColumnVisibility(column.key, false);
      if (key === "reset-width") resetColumnWidth(column.key);
    } else {
      if (key === "toggle-selection") toggleRowSelection(context.rowKey);
      if (key === "current-row") setCurrentRow(context.rowKey);
      if (key === "edit-cell" && context.type === "cell") {
        requestAnimationFrame(() => {
          const entry = navigableEntries.value.get(gridToken(context.rowKey));
          const index = orderedColumns.value.findIndex(({ key }) => key === context.column.key);
          if (entry && index >= 0 && scrollRef.value?.isConnected)
            beginEdit(entry, orderedColumns.value[index], index);
        });
      }
    }
    emit("contextMenuSelect", key, context, info);
  },
});
watch([busy, () => props.contextMenu, pageRows, orderedColumns], gridMenu.close);
defineExpose({
  resetColumns,
  getColumnLayout,
  applyColumnLayout,
  setGroupBy,
  setGroupsExpanded,
  getQuery,
  setQuery,
  resetQuery,
  reload,
  getSelection,
  clearSelection,
  toggleRowSelection,
  scrollTo,
  scrollToRow,
  focusRow: (key: HysDataGridKey) => props.cellNavigation
    ? !!orderedColumns.value[0] && cellNavigationState.focusCell(gridToken(key), orderedColumns.value[0].key)
    : rowNavigation.focusRow(gridToken(key)),
  focusCell: focusGridCell,
  isCellVisible: (key: HysDataGridKey, columnKey: string) =>
    !busy.value && failure.value == null &&
    navigableEntries.value.has(gridToken(key)) && navigableColumnKeys.value.has(columnKey),
  getCellView: () => cellView.value,
  getCurrentRowKey: () => currentKey.value,
  setCurrentRow,
  setColumnVisibility,
  pinColumn,
  resizeColumn,
  resetColumnWidth,
});
function closeOutside(event: PointerEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node))
    settingsOpen.value = false;
}
watch(settingsOpen, (open) => {
  if (open) document.addEventListener("pointerdown", closeOutside);
  else document.removeEventListener("pointerdown", closeOutside);
});
function cleanup() {
  gridMenu.close();
  endColumnDrag();
  cancelResize();
  settingsOpen.value = false;
  document.removeEventListener("pointerdown", closeOutside);
}
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
</script>

<template>
  <section
    v-bind="hysRootAttrs"
    class="hys-ui-pf-grid"
    :class="['hys-ui-pf-grid--' + density, { 'hys-ui-pf-grid-striped': striped, 'hys-ui-pf-grid-has-selection': selectable }]"
    aria-label="数据表格"
    ref="tableRef"
    :aria-busy="busy || undefined"
  >
    <div v-if="showToolbar" class="hys-ui-pf-grid-toolbar">
      <label class="hys-ui-pf-grid-search"
        ><span>搜索</span
        ><HysInput
          size="sm"
          v-model="search"
          type="search"
          placeholder="搜索全部列…"
          aria-label="搜索表格"
          clearable /></label
      ><label v-if="groupable" class="hys-ui-pf-grid-group-label"
        >分组
        <HysSelect
          size="sm"
          :model-value="groupBy"
          @update:model-value="setGroupBy(String($event ?? ''))"
          aria-label="按列分组"
          :options="[
            { label: '不分组', value: '' },
            ...groupOptions.map((c) => ({ label: c.label, value: c.key })),
          ]"
      /></label>
      <div v-if="editable && selected.length" class="hys-ui-pf-grid-batch">
        <HysSelect
          size="sm"
          v-model="batchColumn"
          aria-label="批量编辑字段"
          :options="[
            { label: '选择编辑列', value: '' },
            ...columns
              .filter((c) => c.editable)
              .map((c) => ({ label: c.label, value: c.key })),
          ]"
        /><HysInput
          size="sm"
          v-model="batchValue"
          aria-label="批量编辑值"
          placeholder="新值"
        /><HysButton
          variant="ghost"
          size="sm"
          type="button"
          :disabled="!batchKeys.length"
          @click="commitBatch"
          >应用到 {{ batchColumn ? batchKeys.length : selected.length }} 行</HysButton
        >
      </div>
      <template v-if="filtersVisible">
        <HysButton
          variant="ghost"
          size="sm"
          type="button"
          @click="setQuery({ filters: {}, page: 1 })"
          >清空筛选</HysButton
        > </template
      ><span class="hys-ui-pf-grid-count"
        >{{ totalCount }} 条记录 · 已选 {{ selected.length }}</span
      >
      <div class="hys-ui-pf-grid-menu" ref="menuRef">
        <HysButton
          variant="ghost"
          size="sm"
          type="button"
          @click="settingsOpen = !settingsOpen"
          :aria-expanded="settingsOpen"
          aria-label="配置显示列"
          ><Settings2 :size="16" aria-hidden="true" /> 列设置</HysButton
        ><PopupMotion
          :popup-transition="props.popupTransition"
          :popup-transition-duration="props.popupTransitionDuration"
          @inactive="settingsOpen = false"
          ><div v-if="settingsOpen" class="hys-ui-pf-grid-panel hys-ui-scrollbar">
            <strong>显示列与排序</strong
            ><HysSortableList
              class="hys-ui-pf-grid-settings-list"
              :model-value="settingsItems"
              @update:model-value="
                (items) => (order = items.map((item) => item.id))
              "
            >
              <template #item="{ item }"
                ><HysCheckbox
                  :model-value="!hidden.includes(item.id)"
                  :label="item.label"
                  :disabled="
                    columns.find((column) => column.key === item.id)
                      ?.hideable === false ||
                    (!hidden.includes(item.id) && visibleColumns.length === 1)
                  "
                  @update:model-value="
                    toggleColumn(
                      columns.find((column) => column.key === item.id)!,
                    )
                  "
              /></template> </HysSortableList
            ><HysButton
              variant="ghost"
              size="sm"
              type="button"
              @click="resetColumns"
              >恢复默认列</HysButton
            >
          </div></PopupMotion
        >
      </div>
      <HysButton variant="ghost" size="sm" type="button" @click="exportCsv"
        >导出 CSV</HysButton
      >
      <slot name="toolbar-actions" :query="query" :selected-keys="selected" />
    </div>
    <div
      ref="scrollRef"
      class="hys-ui-pf-grid-scroll hys-ui-scrollbar"
      :style="{ maxHeight: maxHeightStyle }"
      tabindex="0"
      role="region"
      aria-label="表格滚动区域"
      @dragleave="leaveColumnDrag"
      @scroll="scrollWindow"
    >
      <table
        :class="{ 'hys-ui-pf-grid-sticky-head': stickyHeader }"
        :style="{ minWidth: tableWidth + 'px' }"
      >
        <caption v-if="caption">{{ caption }}</caption>
        <colgroup v-if="selectable"><col style="width: 44px" /></colgroup>
        <colgroup v-if="rowNumbers"><col style="width: 48px" /></colgroup>
        <colgroup v-for="entry in headerGroups" :key="entry.id">
          <col
            v-for="c in entry.columns"
            :key="c.key"
            :style="{ width: widthOf(c) + 'px' }"
          />
        </colgroup>
        <colgroup v-if="fillRemainingWidth"><col /></colgroup>
        <thead>
          <tr v-if="hasHeaderGroups" class="hys-ui-pf-grid-header-groups">
            <th v-if="selectable" class="hys-ui-pf-grid-select-col"></th>
            <th v-if="rowNumbers" class="hys-ui-pf-grid-row-number"></th>
            <th
              v-for="entry in headerGroups"
              :key="entry.id"
              :scope="entry.group ? 'colgroup' : undefined"
              :colspan="entry.columns.length"
              :style="pinnedStyle(entry.pinned === 'right' ? entry.columns[entry.columns.length - 1] : entry.columns[0], true)"
            >
              <slot v-if="entry.group" name="header-group" :group="entry.group" :columns="entry.columns" :pinned="entry.pinned">{{ entry.group.label }}</slot>
            </th>
            <th v-if="fillRemainingWidth" class="hys-ui-grid-filler" aria-hidden="true" />
          </tr>
          <tr>
            <th v-if="selectable" scope="col" class="hys-ui-pf-grid-select-col">
              <HysCheckbox
                v-if="selectionType !== 'radio'"
                aria-label="选择当前页全部行"
                :model-value="allPageSelected"
                :indeterminate="somePageSelected && !allPageSelected"
                :disabled="!pageKeys.length || busy || !!failure"
                @update:model-value="selectPage"
              /><span v-else>选择</span>
            </th>
            <th v-if="rowNumbers" scope="col" class="hys-ui-pf-grid-row-number"><slot name="row-number-header">#</slot></th>
            <th
              v-for="(c, index) in orderedColumns"
              :key="c.key"
              scope="col"
              :tabindex="contextMenu ? -1 : undefined"
              :data-column-key="c.key"
              :class="[presentation(headerClassName, headerContext(c, index)), { 'hys-ui-is-column-dragging': dragging === c.key, 'hys-ui-pf-grid-header-wrap': c.headerWrap }]"
              :data-drop-position="
                columnDropTarget?.key === c.key
                  ? columnDropTarget.position
                  : undefined
              "
              :draggable="!columnOrder && c.reorderable !== false"
              @dragstart="startColumnDrag($event, c)"
              @dragend="endColumnDrag"
              @dragover="previewColumnDrop($event, c)"
              @drop="dropColumn($event, c)"
              @click="emit('headerClick', headerContext(c, index), $event)"
              @contextmenu="openHeaderMenu($event, c, index)"
              @keydown="gridMenu.keydown({ ...headerContext(c, index), type: 'header' }, $event)"
              :aria-sort="
                effectiveSorts.find((s) => s.key === c.key)?.direction === 'asc'
                  ? 'ascending'
                  : effectiveSorts.find((s) => s.key === c.key)?.direction ===
                      'desc'
                    ? 'descending'
                    : 'none'
              "
              :style="[presentation(headerStyle, headerContext(c, index)), { ...pinnedStyle(c, true), textAlign: c.headerAlign || c.align || 'left' }]"
            >
              <div class="hys-ui-pf-grid-head">
                <div class="hys-ui-pf-grid-sort-group" :style="{ justifyContent: (c.headerAlign ?? c.align) === 'center' ? 'center' : (c.headerAlign ?? c.align) === 'right' ? 'end' : 'start' }">
                  <HysButton
                    v-if="c.sortable !== false"
                    variant="ghost"
                    size="sm"
                    type="button"
                    class="hys-ui-pf-grid-sort"
                    :class="{
                      'hys-ui-is-sorted': effectiveSorts.some(
                        (item) => item.key === c.key,
                      ),
                    }"
                    @click="toggleSort(c)"
                    ><span class="hys-ui-pf-grid-sort-label"><slot :name="'header-' + c.key" v-bind="headerContext(c, index)"><slot name="header-cell" v-bind="headerContext(c, index)">{{ c.label }}</slot></slot></span></HysButton
                  >
                  <span v-else class="hys-ui-pf-grid-sort-label"><slot :name="'header-' + c.key" v-bind="headerContext(c, index)"><slot name="header-cell" v-bind="headerContext(c, index)">{{ c.label }}</slot></slot></span>
                  <span
                    v-if="c.sortable !== false"
                    class="hys-ui-pf-grid-sort-controls"
                    role="group"
                    :aria-label="c.label + '排序'"
                  >
                    <HysButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      class="hys-ui-pf-grid-sort-direction"
                      :class="{
                        'hys-ui-is-active':
                          effectiveSorts.find((item) => item.key === c.key)
                            ?.direction === 'asc',
                      }"
                      :aria-label="c.label + '升序'"
                      :aria-pressed="
                        effectiveSorts.find((item) => item.key === c.key)
                          ?.direction === 'asc'
                      "
                      @click.stop="chooseSort(c, 'asc')"
                      ><ChevronUp :size="11" aria-hidden="true"
                    /></HysButton>
                    <HysButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      class="hys-ui-pf-grid-sort-direction"
                      :class="{
                        'hys-ui-is-active':
                          effectiveSorts.find((item) => item.key === c.key)
                            ?.direction === 'desc',
                      }"
                      :aria-label="c.label + '降序'"
                      :aria-pressed="
                        effectiveSorts.find((item) => item.key === c.key)
                          ?.direction === 'desc'
                      "
                      @click.stop="chooseSort(c, 'desc')"
                      ><ChevronDown :size="11" aria-hidden="true"
                    /></HysButton>
                  </span>
                </div>
                <HysButton
                  variant="ghost"
                  size="sm"
                  v-if="c.filterable !== false"
                  type="button"
                  class="hys-ui-pf-grid-filter"
                  :aria-label="'筛选' + c.label"
                  :aria-expanded="filtersVisible"
                  :aria-controls="filterRowId"
                  :title="
                    filtersVisible && activeFilterColumn === c.key
                      ? '再次点击收起筛选（Esc）'
                      : '筛选' + c.label
                  "
                  :class="{
                    'hys-ui-is-filtered': !!filterTerm(c.key),
                    'hys-ui-is-filtering':
                      filtersVisible && activeFilterColumn === c.key,
                  }"
                  @click="showColumnFilters(c)"
                  ><Search :size="13" aria-hidden="true" /></HysButton
                >
                <HysButton v-if="contextMenu && headerMenuButton" variant="ghost" size="sm" type="button" class="hys-ui-pf-grid-column-menu" :aria-label="'列操作 · ' + c.label" aria-haspopup="menu" @click.stop="openHeaderMenu($event, c, index)"><Ellipsis :size="14" aria-hidden="true" /></HysButton>
                <span
                  v-if="c.resizable !== false"
                  class="hys-ui-pf-grid-resize"
                  role="separator"
                  tabindex="0"
                  :aria-label="'调整' + c.label + '列宽'"
                  @pointerdown="startResize($event, c)"
                  aria-orientation="vertical"
                  :aria-valuemin="Math.min(minWidth(c), widthOf(c))"
                  :aria-valuemax="Math.max(maxWidth(c), widthOf(c))"
                  :aria-valuenow="widthOf(c)"
                  @keydown="resizeWithKeyboard($event, c)"
                />
              </div>
            </th>
            <th v-if="fillRemainingWidth" class="hys-ui-grid-filler" aria-hidden="true" />
          </tr>
          <tr
            v-if="filtersVisible"
            class="hys-ui-pf-grid-filter-row"
            :id="filterRowId"
            @keydown.esc.stop.prevent="closeColumnFilters()"
            aria-label="列筛选"
          >
            <td v-if="selectable" class="hys-ui-pf-grid-select-col"></td>
            <td v-if="rowNumbers" class="hys-ui-pf-grid-row-number"></td>
            <td
              v-for="column in orderedColumns"
              :key="column.key"
              :data-filter-key="column.key"
              :data-column-key="column.key"
              :style="pinnedStyle(column)"
            >
              <HysInput
                v-if="column.filterable !== false"
                :model-value="filterTerm(column.key)"
                @update:model-value="setFilter(column.key, $event)"
                @focus="activeFilterColumn = column.key"
                :aria-label="'过滤' + column.label"
                placeholder="筛选…"
                clearable
              />
            </td>
            <td v-if="fillRemainingWidth" class="hys-ui-grid-filler" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="busy">
            <td
              :colspan="tableColumnCount"
              class="hys-ui-pf-grid-empty"
            >
              <div class="hys-ui-pf-grid-state" role="status"><slot name="loading">正在加载…</slot></div>
            </td>
          </tr>
          <tr v-else-if="failure">
            <td
              :colspan="tableColumnCount"
              class="hys-ui-pf-grid-empty"
            >
              <div class="hys-ui-pf-grid-state">
                <slot name="error" :error="failure.error" :retry="reload">
                  <span role="status">加载失败</span>
                  <HysButton size="sm" variant="ghost" @click="reload">重试</HysButton>
                </slot>
              </div>
            </td>
          </tr>
          <template v-else>
            <tr v-if="windowedRows.before" class="hys-ui-grid-spacer" aria-hidden="true"><td :colspan="tableColumnCount" :style="{ height: windowedRows.before + 'px' }" /></tr>
            <template v-for="entry in windowedRows.entries" :key="entry.key">
              <tr
                v-if="entry.kind === 'group'"
                class="hys-ui-pf-grid-group-row"
              >
                <td :colspan="tableColumnCount">
                  <HysButton
                    variant="ghost"
                    size="sm"
                    :aria-expanded="!collapsedGroups.has(entry.key)"
                    @click="toggleGroup(entry.key)"
                  >
                    <component
                      :is="
                        collapsedGroups.has(entry.key)
                          ? ChevronRight
                          : ChevronDown
                      "
                      :size="15"
                      aria-hidden="true"
                    />
                    {{ columnMap.get(groupBy)?.label }}：{{ entry.label }}
                    <span>({{ entry.rows.length }})</span>
                  </HysButton>
                  <span v-if="groupSummary" class="hys-ui-pf-grid-group-summary">
                    <template v-for="column in orderedColumns" :key="column.key">
                      <span v-if="column.summary">{{ column.label }} {{ summaryValue(column, entry.rows) }}</span>
                    </template>
                  </span>
                </td>
              </tr>
              <tr
                v-else
                v-bind="mergeProps(contextMenu ? { tabindex: -1, onKeydown: (event: KeyboardEvent) => gridMenu.keydown({ ...rowContext(entry), type: 'row' }, event) } : {}, rowNavigation.rowNavigationAttrs(gridToken(entry.item.id)))"
                :data-grid-row="gridToken(entry.item.id)"
                :data-hys-cell-row="cellNavigation ? gridToken(entry.item.id) : undefined"
                :class="[rowClassName && presentation(rowClassName, rowContext(entry)), { 'hys-ui-pf-grid-current-row': highlightCurrentRow && currentKey === entry.item.id, 'hys-ui-pf-grid-even-row': striped && entry.pageIndex % 2 === 1 }]"
                :style="rowStyle && presentation(rowStyle, rowContext(entry))"
                :aria-current="highlightCurrentRow && currentKey === entry.item.id ? 'true' : undefined"
                @click="clickRow(entry, $event)"
                @dblclick="emit('rowDblclick', rowContext(entry), $event)"
                @contextmenu="openRowMenu($event, entry)"
              >
                <td v-if="selectable" class="hys-ui-pf-grid-select-col">
                  <HysRadio
                    v-if="selectionType === 'radio'"
                    :name="radioName"
                    :aria-label="'选择第' + (entry.pageIndex + 1) + '行'"
                    :model-value="selected[0] ?? null"
                    :value="entry.item.id"
                    :disabled="!canSelect(entry.item)"
                    @click.stop
                    @update:model-value="
                      toggleRowSelection(entry.item.id, true)
                    "
                  />
                  <HysCheckbox
                    v-else
                    :aria-label="'选择第' + (entry.pageIndex + 1) + '行'"
                    :model-value="selectionSet.has(entry.item.id)"
                    :disabled="!canSelect(entry.item)"
                    @click.stop
                    @update:model-value="
                      toggleRowSelection(entry.item.id, $event)
                    "
                  />
                </td>
                <th v-if="rowNumbers" scope="row" class="hys-ui-pf-grid-row-number"><slot name="row-number" v-bind="rowContext(entry)">{{ entry.item.index + 1 }}</slot></th>
                <template v-for="({ column, index, skip }) in bodyColumns" :key="column?.key ?? 'spacer:' + index">
                <td v-if="skip" :colspan="skip" class="hys-ui-grid-column-spacer" aria-hidden="true" />
                <td
                  v-else-if="column && cellSpan?.(cellContext(entry, column, index))?.rows !== 0"
                  :rowspan="cellSpan?.(cellContext(entry, column, index))?.rows"
                  :colspan="cellSpan?.(cellContext(entry, column, index))?.columns"
                  :data-column-key="column.key"
                  v-bind="mergeProps(contextMenu ? { tabindex: -1 } : {}, cellNavigationState.attrs(gridToken(entry.item.id), column.key, index))"
                  :class="[cellClassName && presentation(cellClassName, cellContext(entry, column, index)), { 'hys-ui-pf-grid-cell-editing': isEditing(entry.item, column) }]"
                  :style="[{ textAlign: column.align || 'left' }, cellStyle && presentation(cellStyle, cellContext(entry, column, index)), pinnedStyle(column)]"
                  :title="cellTooltip === false || isEditing(entry.item, column) || column.wrap === true ? undefined : displayedCell(entry, column, index)"
                  @click="emit('cellClick', cellContext(entry, column, index), $event)"
                  @dblclick="doubleClickCell($event, entry, column, index)"
                  @contextmenu.stop="openCellMenu($event, entry, column, index)"
                  @keydown.self="keydownCell($event, entry, column, index)"
                  @mouseenter="emit('cellMouseEnter', cellContext(entry, column, index), $event)"
                  @mouseleave="emit('cellMouseLeave', cellContext(entry, column, index), $event)"
                >
                  <HysInput
                    v-if="isEditing(entry.item, column)"
                    v-model="editValue"
                    class="hys-ui-pf-grid-edit"
                    :aria-label="'编辑' + column.label"
                    @click.stop
                    @press-enter="commitEdit(entry, column, index, true)"
                    @keydown.esc.stop="cancelEdit($event, entry.item, column)"
                    @focusout="commitEdit(entry, column, index)"
                  />
                  <span class="hys-ui-pf-grid-cell-display" :inert="isEditing(entry.item, column)">
                    <template v-if="treeMode && index === 0">
                      <HysButton
                        v-if="entry.item.hasChildren"
                        variant="ghost"
                        size="sm"
                        class="hys-ui-pf-grid-tree-toggle"
                        :style="{ marginLeft: entry.item.depth * 16 + 'px' }"
                        :aria-expanded="expandedTree.has(entry.item.id)"
                        :aria-label="
                          expandedTree.has(entry.item.id)
                            ? '折叠子行'
                            : '展开子行'
                        "
                        @click.stop="toggleTree(entry.item.id)"
                      >
                        <component
                          :is="
                            expandedTree.has(entry.item.id)
                              ? ChevronDown
                              : ChevronRight
                          "
                          :size="15"
                          aria-hidden="true"
                        />
                      </HysButton>
                      <span
                        v-else
                        :style="{
                          display: 'inline-block',
                          width: entry.item.depth * 16 + 20 + 'px',
                        }"
                      ></span>
                    </template>
                    <span v-bind="tabularCellWrap(column.wrap)">
                      <slot
                        :name="column.key"
                        v-bind="cellContext(entry, column, index)"
                      >
                        <slot name="body-cell" v-bind="cellContext(entry, column, index)">{{ displayedCell(entry, column, index) }}</slot>
                      </slot>
                    </span>
                  </span>
                </td>
                </template>
                <td v-if="fillRemainingWidth" class="hys-ui-grid-filler" aria-hidden="true" />
              </tr>
            </template>
            <tr v-if="windowedRows.after" class="hys-ui-grid-spacer" aria-hidden="true"><td :colspan="tableColumnCount" :style="{ height: windowedRows.after + 'px' }" /></tr>
            <tr v-if="!pageRows.length">
              <td
                :colspan="tableColumnCount"
                class="hys-ui-pf-grid-empty"
              >
                <div class="hys-ui-pf-grid-state">
                  <slot name="empty" :query="getQuery()">{{ emptyText }}</slot>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
        <tfoot v-if="showSummary && !busy && !failure && processed.length">
          <tr class="hys-ui-pf-grid-summary-row">
            <td v-if="selectable" class="hys-ui-pf-grid-select-col">合计</td>
            <td v-if="rowNumbers" class="hys-ui-pf-grid-row-number"></td>
            <td
              v-for="(column, index) in orderedColumns"
              :key="column.key"
              :data-column-key="column.key"
              :style="{
                ...pinnedStyle(column),
                textAlign: column.align || 'left',
              }"
            >
              {{
                column.summary || summaryMethod
                  ? summaryValue(column)
                  : !selectable && index === 0
                    ? "合计"
                    : ""
              }}
            </td>
            <td v-if="fillRemainingWidth" class="hys-ui-grid-filler" aria-hidden="true" />
          </tr>
        </tfoot>
      </table>
    </div>
    <footer v-if="pagination" class="hys-ui-pf-grid-footer">
      <HysPagination
        v-if="!loadRows || remoteTotal !== undefined"
        :page="page"
        :total="totalCount"
        :page-size="safePageSize"
        show-size-changer
        show-quick-jumper
        :disabled="loading"
        :page-size-options="[10, 12, 20, 50, 100]"
        @change="setPage"
        @update:page-size="onPageSizeChange"
      />
    </footer>
    <HysContextMenu
      v-if="contextMenu"
      ref="gridContextMenu"
      :trigger="[]"
      :items="gridMenu.items.value"
      class="hys-ui-pf-grid-menu-anchor"
      aria-label="表格操作"
      :popup-transition="popupTransition"
      :popup-transition-duration="popupTransitionDuration"
      @select="gridMenu.select"
    >
      <template v-if="slots['context-menu-item-control']" #item-control="scope">
        <slot name="context-menu-item-control" v-bind="scope" />
      </template>
    </HysContextMenu>
  </section>
</template>
<style scoped>
.hys-ui-pf-grid .hys-ui-grid-filler { padding-inline: 0; }
.hys-ui-pf-grid .hys-ui-grid-spacer td, .hys-ui-pf-grid .hys-ui-grid-column-spacer { padding: 0; border: 0; }
.hys-ui-pf-grid .hys-ui-pf-grid-row-number {
  position: sticky;
  left: 0;
  z-index: 2;
  text-align: center;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.hys-ui-pf-grid-has-selection .hys-ui-pf-grid-row-number { left: 44px; }
.hys-ui-pf-grid thead .hys-ui-pf-grid-row-number { position: sticky; z-index: 5; }
.hys-ui-pf-grid .hys-ui-cell-wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.hys-ui-pf-grid .hys-ui-cell-clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hys-ui-pf-grid [data-hys-cell-index]:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-pf-grid caption {
  position: sticky;
  inset-inline-start: 0;
  inline-size: min(100%, 100cqi);
  box-sizing: border-box;
  padding: 10px 12px;
  text-align: start;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-weight: 600;
}
.hys-ui-pf-grid .hys-ui-pf-grid-header-groups th {
  padding-block: 8px;
  text-align: center;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-pf-grid .hys-ui-pf-grid-header-wrap .hys-ui-pf-grid-sort-label {
  white-space: normal;
  overflow-wrap: anywhere;
}
.hys-ui-pf-grid .hys-ui-pf-grid-column-menu { flex: none; min-width: 24px; padding-inline: 3px; }
.hys-ui-pf-grid-menu-anchor { display: none; }
.hys-ui-pf-grid-scroll { container-type: inline-size; }
.hys-ui-pf-grid td.hys-ui-pf-grid-empty { padding-inline: 0 !important; overflow: visible; }
.hys-ui-pf-grid-state {
  position: sticky;
  inset-inline-start: 0;
  box-sizing: border-box;
  inline-size: min(100%, 100cqi);
  padding-inline: 16px;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
}
.hys-ui-pf-grid-head :deep(.hys-ui-btn),.hys-ui-pf-grid-head :deep(.hys-ui-btn:hover),.hys-ui-pf-grid-head :deep(.hys-ui-btn:active){background:transparent!important;border-color:transparent!important;box-shadow:none!important;transform:none!important}
.hys-ui-pf-grid{border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:12px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:var(--hys-ui-text,var(--hys-ui-theme-text,#25324b));min-width:0;font-size:13px}.hys-ui-pf-grid button,.hys-ui-pf-grid input{font:inherit}.hys-ui-pf-grid button{cursor:pointer}.hys-ui-pf-grid button:disabled{cursor:not-allowed;opacity:.4}.hys-ui-pf-grid-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:12px;border-bottom:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee))}.hys-ui-pf-grid-toolbar button,.hys-ui-pf-grid-footer button,.hys-ui-pf-grid-panel button{border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:6px;padding:7px 10px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:inherit}.hys-ui-pf-grid-search{display:flex;align-items:center;gap:8px}.hys-ui-pf-grid-search input,.hys-ui-pf-grid-count{margin-left:auto;color:var(--hys-ui-muted,var(--hys-ui-theme-muted,#74829b))}.hys-ui-pf-grid-menu{position:relative}.hys-ui-pf-grid-panel{position:absolute;z-index:30;right:0;top:calc(100% + 6px);background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:inherit;box-shadow:0 10px 32px #0002;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:10px;padding:12px;min-width:245px;max-height:360px;overflow:auto}.hys-ui-pf-grid-setting{display:flex;align-items:center;gap:5px;padding:5px 0}.hys-ui-pf-grid-setting label{flex:1;display:flex;gap:7px;align-items:center}.hys-ui-pf-grid-setting button{padding:3px 7px}.hys-ui-pf-grid-scroll{overflow:auto;max-width:100%}.hys-ui-pf-grid table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;min-width:max-content}.hys-ui-pf-grid th,.hys-ui-pf-grid td{border-bottom:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));padding:11px 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hys-ui-pf-grid th{position:relative;background:var(--hys-ui-surface-secondary,#f4f7fc);font-weight:600}.hys-ui-pf-grid-sticky-head thead th{position:sticky;top:0;z-index:4}.hys-ui-pf-grid-select-col{position:sticky!important;left:0;z-index:3;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff))}.hys-ui-pf-grid-sticky-head thead .hys-ui-pf-grid-select-col{z-index:6}.hys-ui-pf-grid tbody tr:hover{background:var(--hys-ui-surface-secondary,#f4f7fc)}.hys-ui-pf-grid-head{display:flex;align-items:center;position:relative;gap:3px}.hys-ui-pf-grid-sort,.hys-ui-pf-grid-filter{border:0;background:none;color:inherit;padding:4px;text-align:left}.hys-ui-pf-grid-sort{flex:1;overflow:hidden;text-overflow:ellipsis}.hys-ui-pf-grid-sort-hint{opacity:.4}.hys-ui-pf-grid-resize{position:absolute;right:-11px;top:-12px;bottom:-12px;width:10px;cursor:col-resize;touch-action:none;border-right:2px solid transparent}.hys-ui-pf-grid-resize:hover,.hys-ui-pf-grid-resize:focus{border-right-color:#3867f5;outline:none}.hys-ui-pf-grid-empty{text-align:center;color:var(--hys-ui-muted,var(--hys-ui-theme-muted,#74829b));padding:35px!important}.hys-ui-pf-grid-group-label{display:flex;align-items:center;gap:6px}.hys-ui-pf-grid-group-label select{padding:7px;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:6px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:inherit}.hys-ui-pf-grid-group-row td{background:var(--hys-ui-surface-secondary,#f4f7fc);font-weight:600;position:relative!important;left:auto!important}.hys-ui-pf-grid-group-row button{border:0;background:none;color:inherit;padding:3px;cursor:pointer}.hys-ui-pf-grid-group-row span{color:var(--hys-ui-muted,var(--hys-ui-theme-muted,#74829b));font-weight:400}.hys-ui-pf-grid-summary-row td{background:var(--hys-ui-surface-secondary,#f4f7fc);font-weight:700;border-top:2px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee))}.hys-ui-pf-grid-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px}.hys-ui-pf-grid-footer>div{display:flex;gap:6px}.hys-ui-pf-grid--compact td,.hys-ui-pf-grid--compact th{padding-top:6px;padding-bottom:6px}.hys-ui-pf-grid--comfortable td,.hys-ui-pf-grid--comfortable th{padding-top:17px;padding-bottom:17px}@media(max-width:600px){.hys-ui-pf-grid-count{margin-left:0}.hys-ui-pf-grid-footer{align-items:flex-start}}
.hys-ui-pf-grid-batch{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.hys-ui-pf-grid-batch input,.hys-ui-pf-grid-batch select{max-width:160px;min-width:65px;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:5px;padding:6px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:inherit}.hys-ui-pf-grid-tree-toggle{border:0;background:none;color:inherit;cursor:pointer;width:20px}.hys-ui-pf-grid-group-label :deep(.hys-ui-select-wrap){min-width:140px}
.hys-ui-pf-grid-cell-display { display: contents; }
.hys-ui-pf-grid td.hys-ui-pf-grid-cell-editing { position: relative; }
.hys-ui-pf-grid-cell-editing > .hys-ui-pf-grid-cell-display { visibility: hidden; }
.hys-ui-pf-grid-cell-editing > .hys-ui-pf-grid-edit {
  position: absolute;
  inset: 4px;
  inline-size: auto;
  text-align: inherit;
}
.hys-ui-pf-grid-edit :deep(.hys-ui-input-group),
.hys-ui-pf-grid-edit :deep(.hys-ui-input-shell) {
  box-sizing: border-box;
  block-size: 100%;
}
.hys-ui-pf-grid-edit :deep(.hys-ui-input-shell) {
  padding: 0 7px;
  border-radius: 4px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
}
.hys-ui-pf-grid-edit :deep(.hys-ui-input-shell:focus-within) {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: none;
}
.hys-ui-pf-grid-edit :deep(.hys-ui-input-shell .hys-ui-input) {
  block-size: 100%;
  min-block-size: 0;
  padding: 0;
  text-align: inherit;
}
.hys-ui-pf-grid-search :deep(.hys-ui-input-wrap){width:220px}
.hys-ui-pf-grid-setting>label{min-width:0;justify-content:flex-start}
.hys-ui-pf-grid :is(th, td).hys-ui-pf-grid-select-col {
  padding-inline: 0;
  text-align: center;
  vertical-align: middle;
}
.hys-ui-pf-grid-setting :deep(.hys-ui-check-label){justify-content:flex-start;text-align:left}


.hys-ui-pf-grid-sort{min-width:0;justify-content:flex-start}
.hys-ui-pf-grid-sort :deep(span){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hys-ui-pf-grid-footer :deep(.hys-ui-pf-pagination){width:100%}



.hys-ui-pf-grid-filter.hys-ui-is-filtered{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft))}
.hys-ui-pf-grid-panel{min-width:310px}
.hys-ui-pf-grid-settings-list{margin:12px 0}
.hys-ui-pf-grid-settings-list :deep(.hys-ui-v4-sort-row){padding:7px 8px;gap:6px;margin-bottom:6px}
.hys-ui-pf-grid-settings-list :deep(.hys-ui-pf-sort-label){flex:1;text-align:left;overflow:visible}
.hys-ui-pf-grid-settings-list :deep(.hys-ui-check-label){justify-content:flex-start;gap:8px;font-weight:400}
.hys-ui-pf-grid-settings-list :deep(.hys-ui-v4-sort-actions button){padding:4px;min-width:26px;min-height:26px}
.hys-ui-pf-grid-sort{gap:6px}
.hys-ui-pf-grid-sort-icon{flex-shrink:0;color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}
.hys-ui-pf-grid-sort-icon.hys-ui-is-idle{color:var(--hys-ui-muted,var(--hys-ui-theme-muted));opacity:.55}
.hys-ui-pf-grid-sort:hover .hys-ui-pf-grid-sort-icon.hys-ui-is-idle{opacity:1}
.hys-ui-pf-grid-sort.hys-ui-is-sorted .hys-ui-pf-grid-sort-label{color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}
.hys-ui-pf-grid-sort:hover,.hys-ui-pf-grid-filter:hover{background:transparent}
.hys-ui-pf-grid-filter.hys-ui-is-filtered:hover{background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft))}
.hys-ui-pf-grid-head .hys-ui-btn{transition-property:color,opacity,border-color}
.hys-ui-pf-grid-head .hys-ui-btn:hover,.hys-ui-pf-grid-head .hys-ui-btn:active{transform:none}
/* Keep both header rows together while scrolling. */
.hys-ui-pf-grid-sticky-head thead{position:sticky;top:0;z-index:4}
.hys-ui-pf-grid-sticky-head thead th{position:relative;top:auto}
.hys-ui-pf-grid-filter-row td{padding:8px;background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))}
.hys-ui-pf-grid-filter-row :deep(.hys-ui-input-wrap){min-width:0;width:100%}
.hys-ui-pf-grid-filter-row :deep(.hys-ui-input){min-height:32px;padding:6px 26px 6px 8px;font-size:12px;font-weight:400}
.hys-ui-pf-grid-filter-row :deep(.hys-ui-input-clear){right:2px;top:4px;width:22px;height:24px}
.hys-ui-pf-grid-head .hys-ui-pf-grid-filter{flex-shrink:0;min-width:24px;min-height:28px;padding:4px;color:var(--hys-ui-muted,var(--hys-ui-theme-muted));opacity:.5}
.hys-ui-pf-grid-head .hys-ui-pf-grid-filter:hover,.hys-ui-pf-grid-head .hys-ui-pf-grid-filter:focus-visible{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));opacity:1}
.hys-ui-pf-grid-head .hys-ui-pf-grid-filter.hys-ui-is-filtered{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));opacity:1}
/* The marker is contained inside the header, so it adds no layout shift. */
.hys-ui-pf-grid th.hys-ui-is-column-dragging{opacity:.45}
.hys-ui-pf-grid th[data-drop-position]::after{content:'';position:absolute;top:4px;bottom:4px;width:3px;border-radius:3px;background:var(--hys-ui-primary,var(--hys-ui-theme-primary));z-index:8;pointer-events:none}
.hys-ui-pf-grid th[data-drop-position="before"]::after{left:0}
.hys-ui-pf-grid th[data-drop-position="after"]::after{right:0}
.hys-ui-pf-grid-sort-group{display:flex;align-items:center;flex:1;min-width:0;gap:2px}
.hys-ui-pf-grid-sort-group .hys-ui-pf-grid-sort{flex:0 1 auto}
.hys-ui-pf-grid-sort-controls{display:inline-grid;grid-template-rows:repeat(2,9px);flex-shrink:0}
.hys-ui-pf-grid-head .hys-ui-pf-grid-sort-direction{display:grid;place-items:center;width:20px;min-width:20px;height:9px;min-height:9px;padding:0;border:0;border-radius:2px;background:transparent;color:var(--hys-ui-muted,var(--hys-ui-theme-muted));opacity:.55}
.hys-ui-pf-grid-head .hys-ui-pf-grid-sort-direction:hover,.hys-ui-pf-grid-head .hys-ui-pf-grid-sort-direction:focus-visible,.hys-ui-pf-grid-head .hys-ui-pf-grid-sort-direction.hys-ui-is-active{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));background:transparent;opacity:1}
/* Opaque cell surfaces are determined by the row section, including sticky cells. */
.hys-ui-pf-grid {
 --hys-ui-grid-header-background:var(--hys-ui-surface-secondary,var(--hys-ui-theme-bg,#f4f7fc));
 --hys-ui-grid-row-background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));
 --hys-ui-grid-hover-background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt,#f8faff));
}
.hys-ui-pf-grid thead th { background:var(--hys-ui-grid-header-background); }
.hys-ui-pf-grid tbody td { background:var(--hys-ui-grid-row-background); }
.hys-ui-pf-grid tbody .hys-ui-pf-grid-even-row { --hys-ui-grid-row-background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt)); }
.hys-ui-pf-grid tbody tr:is(:hover, :focus-visible) { --hys-ui-grid-row-background:var(--hys-ui-grid-hover-background); background:var(--hys-ui-grid-hover-background); }
.hys-ui-pf-grid tbody .hys-ui-pf-grid-current-row { --hys-ui-grid-row-background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft)); }
.hys-ui-pf-grid [data-grid-row]:focus-visible { outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary)); outline-offset: -2px; position: relative; }
.hys-ui-pf-grid-group-summary { display: inline-flex; flex-wrap: wrap; gap: 4px 14px; margin-inline-start: 12px; font-variant-numeric: tabular-nums; }
.hys-ui-pf-grid tbody .hys-ui-pf-grid-group-row td,
.hys-ui-pf-grid tfoot td { background:var(--hys-ui-grid-header-background); }
.hys-ui-pf-grid thead .hys-ui-pf-grid-filter-row td { background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt,#f8faff)); }
.hys-ui-pf-grid-toolbar :deep(.hys-ui-input-shell),
.hys-ui-pf-grid-toolbar :deep(.hys-ui-select),
.hys-ui-pf-grid-toolbar > .hys-ui-btn,
.hys-ui-pf-grid-toolbar .hys-ui-pf-grid-menu > .hys-ui-btn,
.hys-ui-pf-grid-toolbar .hys-ui-pf-grid-batch > .hys-ui-btn { height:32px;min-height:32px; }
.hys-ui-pf-grid-toolbar :deep(.hys-ui-input-shell .hys-ui-input) { height:30px;min-height:0;padding-block:4px; }
.hys-ui-pf-grid-head .hys-ui-pf-grid-filter.hys-ui-is-filtering { color:var(--hys-ui-primary,var(--hys-ui-theme-primary));opacity:1; }
.hys-ui-pf-grid-scroll:focus-visible{outline:2px solid var(--hys-ui-primary,var(--hys-ui-theme-primary));outline-offset:-2px}
</style>
