<script setup lang="ts" generic="T extends object = Record<string, unknown>">
import {
  computed,
  h,
  mergeProps,
  nextTick,
  ref,
  shallowRef,
  useId,
  watch,
  type FunctionalComponent,
} from "vue";
import { ChevronUp, ChevronDown, LoaderCircle } from "lucide-vue-next";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysRadio from "../HysRadio/HysRadio.vue";
import { useHysRootAttrs } from "../../config";
import {
  useVirtualTableLayout,
  virtualColumnStyle as cellStyle,
  type VirtualColumn,
} from "../../composables/useVirtualTableLayout";
import {
  virtualEntries,
  virtualKey,
  virtualValue,
  type HysVirtualTableProps,
  type HysVirtualTableColumn,
  type HysVirtualTableCell,
  type HysVirtualTableKey,
  type HysVirtualTableSort,
  type HysVirtualTableRange,
  type HysVirtualTableScroll,
  type HysVirtualTableAlign,
  type VirtualEntry,
} from "../../composables/virtualTable";

const props = withDefaults(defineProps<HysVirtualTableProps<T>>(), {
  rowKey: "id",
  rowHeight: 42,
  height: 280,
  headerHeight: 42,
  showHeader: true,
  overscan: 5,
  virtualColumns: false,
  columnOverscan: 1,
  loadingMode: "replace",
  selectionType: "checkbox",
  selectionWidth: 44,
  keyboard: false,
  endReachedThreshold: 42,
});
const emit = defineEmits<{
  "update:sortState": [sort: HysVirtualTableSort | null];
  sortChange: [sort: HysVirtualTableSort | null];
  "update:selectedRowKeys": [keys: HysVirtualTableKey[]];
  selectionChange: [keys: HysVirtualTableKey[], rows: T[]];
  "update:currentRowKey": [key: HysVirtualTableKey | null];
  currentChange: [row: T | null, key: HysVirtualTableKey | null];
  rowClick: [row: T, index: number, event: MouseEvent];
  rowDblclick: [row: T, index: number, event: MouseEvent];
  cellClick: [context: HysVirtualTableCell<T>, event: MouseEvent];
  scroll: [state: HysVirtualTableScroll];
  rangeChange: [range: HysVirtualTableRange];
  endReached: [info: { distance: number; total: number }];
}>();
const slots = defineSlots<{
  header?(props: {
    column: HysVirtualTableColumn<T>;
    columnIndex: number;
  }): any;
  cell?(props: HysVirtualTableCell<T>): any;
  empty?(): any;
  loading?(): any;
  footer?(props: {
    rows: readonly T[];
    range: HysVirtualTableRange;
    selectedRowKeys: HysVirtualTableKey[];
  }): any;
  [name: string]: ((props: any) => any) | undefined;
}>();
const attrs = useHysRootAttrs(),
  element = ref<HTMLElement>(),
  id = useId();
const busy = computed(() => !!props.disabled || !!props.loading);
const fixedEntries = computed(() =>
  virtualEntries(props.fixedRows ?? [], props.rowKey),
);
const topRowCount = computed(
  () => (props.showHeader ? 1 : 0) + fixedEntries.value.length,
);
const entries = computed(() => virtualEntries(props.rows, props.rowKey));
const ownSort = shallowRef<HysVirtualTableSort | null>(
  props.defaultSort ?? null,
);
const sortState = computed(() =>
  props.sortState !== undefined ? props.sortState : ownSort.value,
);
const collator = new Intl.Collator(undefined, { numeric: true });
const rows = computed(() => {
  const sort = sortState.value,
    column = props.columns.find((c) => c.key === sort?.key);
  if (!sort || !column?.sortable || column.sortable === "custom")
    return entries.value;
  const direction = sort.direction === "desc" ? -1 : 1;
  const values = column.sorter
    ? []
    : entries.value.map((e) => virtualValue(e.row, column, e.sourceIndex));
  return [...entries.value].sort((a, b) => {
    const av = values[a.sourceIndex],
      bv = values[b.sourceIndex];
    const result = column.sorter
      ? column.sorter(a.row, b.row)
      : typeof av === "number" && typeof bv === "number"
        ? av - bv
        : collator.compare(String(av ?? ""), String(bv ?? ""));
    return Number.isFinite(result) && result
      ? result * direction
      : a.sourceIndex - b.sourceIndex;
  });
});
const {
  viewport,
  live,
  rowHeight,
  headerHeight,
  topHeight,
  bodyHeight,
  rootStyle,
  viewportStyle,
  columns,
  columnMap,
  renderColumns,
  contentWidth,
  scrollTop,
  scrollLeft,
  range,
  scrollTo,
  scrollToRow,
  scrollToColumn,
  onScroll,
  remeasure,
} = useVirtualTableLayout(
  props,
  () => rows.value.length,
  () => rows.value.at(-1)?.token,
  {
    scroll: (state) => emit("scroll", state),
    range: (state) => emit("rangeChange", state),
    end: (state) => emit("endReached", state),
  },
);
const visibleRows = computed(() =>
  rows.value.slice(range.value.start, range.value.end + 1),
);
const indices = computed(() => {
  const byKey = new Map<HysVirtualTableKey, number>(),
    byToken = new Map<string, number>();
  rows.value.forEach((entry, index) => {
    byToken.set(entry.token, index);
    if (entry.valid) byKey.set(entry.key, index);
  });
  return { byKey, byToken };
});
const rowByKey = (key: HysVirtualTableKey) => {
  const index = indices.value.byKey.get(key);
  return index === undefined ? undefined : rows.value[index]?.row;
};
const ownSelected = shallowRef<HysVirtualTableKey[]>([
  ...(props.defaultSelectedRowKeys ?? []),
]);
const ownCurrent = shallowRef<HysVirtualTableKey | null>(
  props.defaultCurrentRowKey ?? null,
);
const currentKey = computed(() =>
  props.currentRowKey !== undefined ? props.currentRowKey : ownCurrent.value,
);
const selectedRowKeys = computed(() => {
  const keys = [...new Set(props.selectedRowKeys ?? ownSelected.value)].filter(
    (key) =>
      virtualKey(key) &&
      (props.reserveSelection || indices.value.byKey.has(key)),
  );
  return props.selectionType === "radio" ? keys.slice(0, 1) : keys;
});
const selectedSet = computed(() => new Set(selectedRowKeys.value));
const canSelect = (entry: VirtualEntry<T>, index: number) =>
  entry.valid &&
  !!props.selectable &&
  (typeof props.selectable !== "function" ||
    props.selectable(entry.row, index));
const eligible = computed(() =>
  rows.value.filter(canSelect).map((entry) => entry.key),
);
const allSelected = computed(
  () =>
    eligible.value.length > 0 &&
    eligible.value.every((key) => selectedSet.value.has(key)),
);
const someSelected = computed(() =>
  eligible.value.some((key) => selectedSet.value.has(key)),
);
const activeCell = shallowRef<{ token: string; column: string } | null>(null);
const activeRowIndex = computed(() =>
  activeCell.value
    ? (indices.value.byToken.get(activeCell.value.token) ?? -1)
    : -1,
);
const cellId = (rowIndex: number, columnIndex: number) =>
  id + "-r" + rowIndex + "-c" + columnIndex;
const activeId = computed(() => {
  const active = activeCell.value;
  if (
    !active ||
    (props.loading && props.loadingMode === "replace") ||
    !renderColumns.value.some((c) => c.column?.key === active.column) ||
    !visibleRows.value.some((e) => e.token === active.token)
  )
    return undefined;
  return cellId(
    activeRowIndex.value,
    columnMap.value.get(active.column)!.index,
  );
});
let epoch = 0,
  selectionAnchor: HysVirtualTableKey | undefined;
watch(
  live,
  (value) => {
    if (!value) epoch++;
  },
  { flush: "sync" },
);
watch(
  () => [props.rowKey, props.rows],
  () => {
    selectionAnchor = undefined;
  },
);
// Keep local selection from reappearing after removed data is later reinserted.
watch(
  () => indices.value.byKey,
  (keys) => {
    if (!props.reserveSelection && props.selectedRowKeys === undefined)
      ownSelected.value = ownSelected.value.filter((key) => keys.has(key));
    if (
      props.currentRowKey === undefined &&
      ownCurrent.value !== null &&
      !keys.has(ownCurrent.value)
    )
      ownCurrent.value = null;
  },
);
function scrollToKey(
  key: HysVirtualTableKey,
  align: HysVirtualTableAlign = "nearest",
) {
  const index = indices.value.byKey.get(key);
  if (index === undefined || !live.value) return false;
  scrollToRow(index, align);
  return true;
}
async function focusCell(index: number, key?: string) {
  if (!live.value || !props.keyboard || busy.value || !Number.isFinite(index))
    return false;
  const entry = rows.value[Math.floor(index)],
    column =
      key === undefined
        ? columns.value.find((c) => c.column)?.column
        : columnMap.value.get(key)?.column;
  if (!entry || !column) return false;
  const request = epoch;
  activeCell.value = { token: entry.token, column: column.key };
  scrollToRow(index);
  scrollToColumn(column.key);
  await nextTick();
  if (!live.value || request !== epoch || !activeId.value) return false;
  element.value?.focus({ preventScroll: true });
  return true;
}
const sameSort = (
  a: HysVirtualTableSort | null,
  b: HysVirtualTableSort | null,
) => a?.key === b?.key && a?.direction === b?.direction;
async function setSort(value: HysVirtualTableSort | null) {
  if (busy.value || !live.value) return false;
  if (
    value &&
    (!columnMap.value.get(value.key)?.column?.sortable ||
      !["asc", "desc"].includes(value.direction))
  )
    return false;
  const sort = value ? { ...value } : null,
    request = epoch;
  if (sameSort(sortState.value, sort)) return true;
  emit("update:sortState", sort ? { ...sort } : null);
  if (props.sortState === undefined) ownSort.value = sort;
  await nextTick();
  if (!live.value || request !== epoch || !sameSort(sortState.value, sort))
    return false;
  emit("sortChange", sort ? { ...sort } : null);
  scrollTo({ top: 0 });
  return true;
}
function toggleSort(column: HysVirtualTableColumn<T>) {
  const sort = sortState.value;
  void setSort(
    sort?.key === column.key
      ? sort.direction === "asc"
        ? { key: column.key, direction: "desc" }
        : null
      : { key: column.key, direction: "asc" },
  );
}
const sameKeys = (
  a: readonly HysVirtualTableKey[],
  b: readonly HysVirtualTableKey[],
) => a.length === b.length && a.every((key, i) => key === b[i]);
async function selectKeys(value: HysVirtualTableKey[]) {
  if (busy.value || !props.selectable || !live.value) return false;
  const keys = [...new Set(value)],
    request = epoch;
  if (sameKeys(keys, selectedRowKeys.value)) return true;
  emit("update:selectedRowKeys", [...keys]);
  if (props.selectedRowKeys === undefined) ownSelected.value = keys;
  await nextTick();
  if (
    !live.value ||
    request !== epoch ||
    !sameKeys(keys, selectedRowKeys.value)
  )
    return false;
  emit(
    "selectionChange",
    [...keys],
    keys.flatMap((key) => {
      const row = rowByKey(key);
      return row ? [row] : [];
    }),
  );
  return true;
}
async function toggleRowSelection(key: HysVirtualTableKey, selected?: boolean) {
  const index = indices.value.byKey.get(key),
    entry = index === undefined ? undefined : rows.value[index];
  if (index === undefined || !entry || !canSelect(entry, index)) return false;
  const check = selected ?? !selectedSet.value.has(key);
  return selectKeys(
    check
      ? props.selectionType === "radio"
        ? [key]
        : [...selectedRowKeys.value, key]
      : selectedRowKeys.value.filter((k) => k !== key),
  );
}
const clearSelection = () => selectKeys([]);
function selectAll(selected = true) {
  if (props.selectionType === "radio") return Promise.resolve(false);
  const keys = new Set(eligible.value);
  return selectKeys(
    selected
      ? [...selectedRowKeys.value, ...keys]
      : selectedRowKeys.value.filter((k) => !keys.has(k)),
  );
}
async function setCurrentRow(key: HysVirtualTableKey | null) {
  if (
    busy.value ||
    !live.value ||
    (key !== null && !indices.value.byKey.has(key))
  )
    return false;
  if (key === currentKey.value) return true;
  const request = epoch;
  emit("update:currentRowKey", key);
  if (props.currentRowKey === undefined) ownCurrent.value = key;
  await nextTick();
  if (!live.value || request !== epoch || currentKey.value !== key)
    return false;
  emit("currentChange", key === null ? null : (rowByKey(key) ?? null), key);
  return true;
}
function rangeSelect(index: number) {
  const anchor =
      selectionAnchor === undefined
        ? index
        : (indices.value.byKey.get(selectionAnchor) ?? index),
    start = Math.min(anchor, index);
  const keys = rows.value
    .slice(start, Math.max(anchor, index) + 1)
    .filter((entry, offset) => canSelect(entry, start + offset))
    .map((e) => e.key);
  return selectKeys([...selectedRowKeys.value, ...keys]);
}
const interactive = (event: Event) =>
  event.target instanceof Element &&
  !!event.target.closest(
    'button,input,a,textarea,select,[contenteditable]:not([contenteditable="false"])',
  );
function rowClick(entry: VirtualEntry<T>, index: number, event: MouseEvent) {
  if (busy.value || interactive(event)) return;
  emit("rowClick", entry.row, index, event);
  if (props.highlightCurrentRow && entry.valid)
    void setCurrentRow(currentKey.value === entry.key ? null : entry.key);
  if (props.keyboard) {
    const column = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-column-key]",
    )?.dataset.columnKey;
    if (column !== undefined) activeCell.value = { token: entry.token, column };
  }
  if (props.selectOnClick && canSelect(entry, index)) {
    if (event.shiftKey && props.selectionType !== "radio")
      void rangeSelect(index);
    else {
      selectionAnchor = entry.key;
      void toggleRowSelection(entry.key);
    }
  }
}
function focusGrid() {
  if (!props.keyboard || activeId.value || busy.value) return;
  const entry = rows.value[range.value.visibleStart],
    column = renderColumns.value.find((c) => c.column)?.column;
  if (entry && column)
    activeCell.value = { token: entry.token, column: column.key };
}
function keys(event: KeyboardEvent) {
  if (!props.keyboard || busy.value || interactive(event)) return;
  const cells = columns.value.filter((c) => c.column),
    current =
      activeRowIndex.value < 0
        ? range.value.visibleStart
        : activeRowIndex.value;
  let index = current,
    column = Math.max(
      0,
      cells.findIndex((c) => c.column?.key === activeCell.value?.column),
    );
  if (event.key === "ArrowDown") index++;
  else if (event.key === "ArrowUp") index--;
  else if (event.key === "ArrowRight") column++;
  else if (event.key === "ArrowLeft") column--;
  else if (event.key === "PageDown")
    index += Math.max(1, Math.floor(bodyHeight.value / rowHeight.value));
  else if (event.key === "PageUp")
    index -= Math.max(1, Math.floor(bodyHeight.value / rowHeight.value));
  else if (event.key === "Home") {
    column = 0;
    if (event.ctrlKey || event.metaKey) index = 0;
  } else if (event.key === "End") {
    column = cells.length - 1;
    if (event.ctrlKey || event.metaKey) index = rows.value.length - 1;
  } else if (event.key === " " && props.selectable) {
    event.preventDefault();
    const entry = rows.value[current];
    if (entry && canSelect(entry, current)) {
      if (event.shiftKey && props.selectionType !== "radio")
        void rangeSelect(current);
      else {
        selectionAnchor = entry.key;
        void toggleRowSelection(entry.key);
      }
    }
    return;
  } else if (
    event.key === "Escape" &&
    (activeCell.value || currentKey.value !== null)
  ) {
    event.preventDefault();
    activeCell.value = null;
    void setCurrentRow(null);
    return;
  } else return;
  if (!rows.value.length || !cells.length) return;
  event.preventDefault();
  void focusCell(
    Math.min(rows.value.length - 1, Math.max(0, index)),
    cells[Math.min(cells.length - 1, Math.max(0, column))]?.column?.key,
  );
}
const RenderRow: FunctionalComponent<{
  entry: VirtualEntry<T>;
  index: number;
  fixed?: boolean;
}> = ({ entry, index, fixed }) => {
  const checked = entry.valid && selectedSet.value.has(entry.key),
    isCurrent =
      props.highlightCurrentRow &&
      entry.valid &&
      currentKey.value === entry.key;
  const role = props.keyboard ? "gridcell" : "cell";
  return h(
    "div",
    mergeProps(
      { ...props.customRow?.(entry.row, index) },
      {
        class: [
          "hys-ui-v4-table-row",
          "hys-ui-virtual-row",
          {
            "hys-ui-is-selected": !fixed && checked,
            "hys-ui-is-current": !fixed && isCurrent,
            "hys-ui-is-striped": props.striped && index % 2 === 1,
            "hys-ui-virtual-fixed-row": fixed,
          },
          typeof props.rowClassName === "function"
            ? props.rowClassName(entry.row, index)
            : props.rowClassName,
        ],
        role: "row",
        "aria-rowindex": fixed
          ? (props.showHeader ? 2 : 1) + index
          : topRowCount.value + index + 1,
        "aria-selected":
          !fixed && props.keyboard && props.selectable ? checked : undefined,
        "data-row-key": entry.token,
        style: [
          typeof props.rowStyle === "function"
            ? props.rowStyle(entry.row, index)
            : props.rowStyle,
          {
            height: rowHeight.value + "px",
            minWidth: contentWidth.value + "px",
          },
        ],
        onClick: (event: MouseEvent) => !fixed && rowClick(entry, index, event),
        onDblclick: (event: MouseEvent) => {
          if (!fixed && !busy.value && !interactive(event))
            emit("rowDblclick", entry.row, index, event);
        },
      },
    ),
    renderColumns.value.map((cell) => {
      if (cell.gap)
        return h("div", {
          key: cell.token,
          "aria-hidden": true,
          style: cellStyle(cell),
          class: "hys-ui-virtual-gap",
        });
      if (cell.selection) {
        const common = {
          disabled: busy.value || !canSelect(entry, index),
          ariaLabel: "选择第 " + (index + 1) + " 行",
          onClick: (e: Event) => e.stopPropagation(),
        };
        const control =
          props.selectionType === "radio"
            ? h(HysRadio<HysVirtualTableKey>, {
                ...common,
                value: entry.key,
                modelValue: selectedRowKeys.value[0] ?? null,
                name: id + "-selection",
                "onUpdate:modelValue": () => {
                  selectionAnchor = entry.key;
                  void toggleRowSelection(entry.key, true);
                },
              })
            : h(HysCheckbox<boolean>, {
                ...common,
                modelValue: checked,
                "onUpdate:modelValue": (value: boolean) => {
                  selectionAnchor = entry.key;
                  void toggleRowSelection(entry.key, value);
                },
              });
        return h(
          "div",
          {
            key: cell.token,
            role,
            "aria-colindex": 1,
            class:
              "hys-ui-virtual-cell hys-ui-virtual-pinned hys-ui-virtual-select",
            style: cellStyle(cell),
          },
          fixed ? [] : [control],
        );
      }
      const column = cell.column!,
        value = virtualValue(entry.row, column, entry.sourceIndex);
      const context: HysVirtualTableCell<T> = {
        row: entry.row,
        column,
        value,
        rowIndex: index,
        columnIndex: cell.index,
      };
      const active =
        !fixed &&
        activeCell.value?.token === entry.token &&
        activeCell.value?.column === column.key;
      const content =
        slots[column.key]?.(context) ??
        slots.cell?.(context) ??
        column.formatter?.(context) ??
        String(value ?? "");
      const custom = props.customCell?.(context);
      return h(
        "div",
        mergeProps(
          { ...custom },
          {
            key: cell.token,
            id: fixed ? undefined : cellId(index, cell.index),
            role,
            "aria-colindex": cell.index + 1 + (props.selectable ? 1 : 0),
            "data-column-key": column.key,
            class: [
              "hys-ui-virtual-cell",
              column.className,
              typeof props.cellClassName === "function"
                ? props.cellClassName(context)
                : props.cellClassName,
              {
                "hys-ui-virtual-pinned":
                  cell.left !== undefined || cell.right !== undefined,
                "hys-ui-virtual-active": active,
              },
            ],
            style: [
              typeof props.cellStyle === "function"
                ? props.cellStyle(context)
                : props.cellStyle,
              { textAlign: column.align },
              cellStyle(cell),
            ],
            title:
              custom?.title ??
              (typeof value === "object" ? undefined : String(value ?? "")),
            onClick: (event: MouseEvent) => {
              if (!fixed && !busy.value && !interactive(event))
                emit("cellClick", context, event);
            },
          },
        ),
        [
          h(
            "div",
            { class: "hys-ui-virtual-cell-content" },
            Array.isArray(content) ? content : [content],
          ),
        ],
      );
    }),
  );
};
defineExpose({
  element,
  viewport,
  scrollTop,
  scrollLeft,
  range,
  selectedRowKeys,
  sortState,
  scrollTo,
  scrollToRow,
  scrollToKey,
  scrollToColumn,
  focusCell,
  setSort,
  clearSelection,
  toggleRowSelection,
  selectAll,
  setCurrentRow,
  getRow: (index: number) => rows.value[index]?.row,
  remeasure,
});
</script>

<template>
  <div
    ref="element"
    v-bind="attrs"
    class="hys-ui-v4-table hys-ui-virtual-table"
    :class="{
      'hys-ui-virtual-bordered': bordered,
      'hys-ui-is-disabled': disabled,
    }"
    :style="rootStyle"
    :role="keyboard ? 'grid' : 'table'"
    :tabindex="keyboard && !disabled ? 0 : undefined"
    :aria-label="ariaLabel || '虚拟表格'"
    :aria-rowcount="rows.length + topRowCount"
    :aria-colcount="columns.length"
    :aria-busy="loading || undefined"
    :aria-disabled="disabled || undefined"
    :aria-multiselectable="
      keyboard && selectable ? selectionType !== 'radio' : undefined
    "
    :aria-activedescendant="keyboard ? activeId : undefined"
    @keydown="keys"
    @focus.self="focusGrid"
  >
    <div
      ref="viewport"
      class="hys-ui-v4-table-viewport"
      :style="viewportStyle"
      @scroll.passive="onScroll"
    >
      <div
        class="hys-ui-v4-table-content"
        :style="{ minWidth: contentWidth + 'px' }"
      >
        <div
          v-if="showHeader || fixedEntries.length"
          class="hys-ui-virtual-top"
          role="rowgroup"
        >
          <div
            v-if="showHeader"
            role="row"
            aria-rowindex="1"
            class="hys-ui-v4-table-row hys-ui-v4-table-head hys-ui-virtual-row"
            :style="{
              height: headerHeight + 'px',
              minWidth: contentWidth + 'px',
            }"
          >
            <template v-for="cell in renderColumns" :key="cell.token">
              <div
                v-if="cell.gap"
                aria-hidden="true"
                class="hys-ui-virtual-gap"
                :style="cellStyle(cell)"
              />
              <div
                v-else-if="cell.selection"
                role="columnheader"
                aria-colindex="1"
                class="hys-ui-virtual-cell hys-ui-virtual-pinned hys-ui-virtual-select"
                :style="cellStyle(cell)"
              >
                <HysCheckbox
                  v-if="selectionType !== 'radio'"
                  :model-value="allSelected"
                  :indeterminate="someSelected && !allSelected"
                  :disabled="busy || !eligible.length"
                  aria-label="选择全部行"
                  @update:model-value="(value) => selectAll(!!value)"
                />
              </div>
              <div
                v-else
                v-bind="customHeaderCell?.(cell.column!, cell.index)"
                role="columnheader"
                :aria-colindex="cell.index + 1 + (selectable ? 1 : 0)"
                :aria-sort="
                  cell.column!.sortable
                    ? sortState?.key === cell.column!.key
                      ? sortState.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                    : undefined
                "
                :data-column-key="cell.column!.key"
                class="hys-ui-virtual-cell"
                :class="[
                  cell.column!.headerClassName,
                  {
                    'hys-ui-virtual-pinned':
                      cell.left !== undefined || cell.right !== undefined,
                  },
                ]"
                :style="[
                  { textAlign: cell.column!.headerAlign || cell.column!.align },
                  cellStyle(cell),
                ]"
              >
                <div
                  class="hys-ui-virtual-header-content"
                  :style="{
                    justifyContent:
                      (cell.column!.headerAlign || cell.column!.align) ===
                      'right'
                        ? 'flex-end'
                        : (cell.column!.headerAlign || cell.column!.align) ===
                            'center'
                          ? 'center'
                          : undefined,
                  }"
                >
                  <button
                    v-if="cell.column!.sortable"
                    type="button"
                    class="hys-ui-virtual-sort-label"
                    :disabled="busy"
                    @click="toggleSort(cell.column!)"
                  >
                    <slot
                      name="header"
                      :column="cell.column!"
                      :column-index="cell.index"
                      >{{ cell.column!.label }}</slot
                    >
                  </button>
                  <span v-else class="hys-ui-virtual-header-label"
                    ><slot
                      name="header"
                      :column="cell.column!"
                      :column-index="cell.index"
                      >{{ cell.column!.label }}</slot
                    ></span
                  >
                  <span
                    v-if="cell.column!.sortable"
                    class="hys-ui-virtual-sort"
                  >
                    <button
                      v-for="direction in ['asc', 'desc'] as const"
                      :key="direction"
                      type="button"
                      :disabled="busy"
                      :aria-label="
                        cell.column!.label +
                        (direction === 'asc' ? '升序' : '降序')
                      "
                      :aria-pressed="
                        sortState?.key === cell.column!.key &&
                        sortState.direction === direction
                      "
                      @click="
                        setSort(
                          sortState?.key === cell.column!.key &&
                            sortState.direction === direction
                            ? null
                            : { key: cell.column!.key, direction },
                        )
                      "
                    >
                      <component
                        :is="direction === 'asc' ? ChevronUp : ChevronDown"
                        aria-hidden="true"
                        :size="12"
                      />
                    </button>
                  </span>
                </div>
              </div>
            </template>
          </div>
          <RenderRow
            v-for="(entry, index) in fixedEntries"
            :key="'fixed:' + entry.token"
            :entry="entry"
            :index="index"
            :fixed="true"
          />
        </div>
        <div
          role="rowgroup"
          class="hys-ui-virtual-space"
          :style="{
            height:
              Math.max(rows.length * rowHeight, !rows.length ? rowHeight : 0) +
              'px',
          }"
          :inert="loading || undefined"
        >
          <div
            v-if="!(loading && loadingMode === 'replace')"
            :style="{
              transform: 'translateY(' + range.start * rowHeight + 'px)',
            }"
          >
            <RenderRow
              v-for="(entry, index) in visibleRows"
              :key="entry.token"
              :entry="entry"
              :index="range.start + index"
            />
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="loading || !rows.length"
      class="hys-ui-virtual-status"
      :class="{
        'hys-ui-virtual-overlay': loading && loadingMode === 'overlay',
      }"
      :style="{ top: topHeight + 'px', height: bodyHeight + 'px' }"
      role="status"
      aria-live="polite"
    >
      <slot v-if="loading" name="loading"
        ><slot name="empty"
          ><LoaderCircle
            :size="18"
            aria-hidden="true"
            class="hys-ui-virtual-spinner"
          />{{ loadingText || "加载中…" }}</slot
        ></slot
      >
      <slot v-else name="empty">{{ emptyText || "暂无数据" }}</slot>
    </div>
    <div v-if="$slots.footer" class="hys-ui-virtual-footer">
      <slot
        name="footer"
        :rows="props.rows"
        :range="range"
        :selected-row-keys="selectedRowKeys"
      />
    </div>
  </div>
</template>

<style scoped>
.hys-ui-virtual-table {
  position: relative;
  max-width: 100%;
  min-width: 0;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  font-size: 14px;
  --hys-ui-virtual-bg: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  --hys-ui-virtual-head: var(
    --hys-ui-primary-soft,
    var(--hys-ui-theme-primary-soft)
  );
}
.hys-ui-virtual-table:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 2px;
}
.hys-ui-virtual-top {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--hys-ui-virtual-bg);
}
.hys-ui-virtual-table :deep(.hys-ui-virtual-row) {
  display: flex;
  position: relative;
  align-items: stretch;
  min-width: 0;
  box-sizing: border-box;
  background: var(--hys-ui-virtual-row-bg, var(--hys-ui-virtual-bg));
}
.hys-ui-virtual-table .hys-ui-v4-table-head {
  position: relative;
  top: auto;
  z-index: auto;
  --hys-ui-virtual-row-bg: var(--hys-ui-virtual-head);
}
.hys-ui-virtual-table :deep(.hys-ui-virtual-cell) {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-width: 0;
  height: 100%;
  padding: 0 12px;
  background: var(--hys-ui-virtual-row-bg, var(--hys-ui-virtual-bg));
  overflow: hidden;
}
.hys-ui-virtual-table :deep(.hys-ui-virtual-cell-content) {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.hys-ui-virtual-table :deep(.hys-ui-virtual-pinned) {
  z-index: 2;
}
.hys-ui-virtual-table :deep(.hys-ui-virtual-select) {
  justify-content: center;
  padding: 0 6px;
}
.hys-ui-virtual-table :deep(.hys-ui-virtual-gap) {
  height: 100%;
  pointer-events: none;
  background: var(--hys-ui-virtual-row-bg, var(--hys-ui-virtual-bg));
}
.hys-ui-virtual-space {
  position: relative;
}
.hys-ui-virtual-header-content {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 6px;
}
.hys-ui-virtual-header-label,
.hys-ui-virtual-sort-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-virtual-sort-label {
  padding: 0;
  border: 0;
  font: inherit;
  text-align: inherit;
  background: none;
  color: inherit;
  cursor: pointer;
}
.hys-ui-virtual-sort {
  display: flex;
  flex-direction: column;
  flex: none;
  gap: 0;
}
.hys-ui-virtual-sort button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 10px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  opacity: 0.65;
  cursor: pointer;
}
.hys-ui-virtual-sort button[aria-pressed="true"] {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  opacity: 1;
}
.hys-ui-virtual-sort button:focus-visible {
  outline: 1px solid currentColor;
  border-radius: 3px;
}
.hys-ui-virtual-sort button:disabled,
.hys-ui-virtual-sort-label:disabled {
  cursor: not-allowed;
}
.hys-ui-virtual-table :deep(.hys-ui-is-striped) {
  --hys-ui-virtual-row-bg: var(
    --hys-ui-surface-alt,
    var(--hys-ui-theme-surface-alt)
  );
}
.hys-ui-virtual-table
  :deep(
    .hys-ui-virtual-row:not(.hys-ui-v4-table-head):not(
        .hys-ui-virtual-fixed-row
      ):hover
  ) {
  --hys-ui-virtual-row-bg: var(
    --hys-ui-surface-hover,
    var(--hys-ui-theme-surface-hover, var(--hys-ui-virtual-head))
  );
}
.hys-ui-virtual-table :deep(.hys-ui-virtual-row.hys-ui-is-selected),
.hys-ui-virtual-table :deep(.hys-ui-virtual-row.hys-ui-is-current) {
  --hys-ui-virtual-row-bg: var(--hys-ui-virtual-head);
}
.hys-ui-virtual-table :deep(.hys-ui-virtual-active) {
  box-shadow: inset 0 0 0 2px var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-virtual-bordered :deep(.hys-ui-virtual-cell) {
  border-right: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-virtual-table :deep(.hys-ui-virtual-fixed-row) {
  font-weight: 600;
}
.hys-ui-virtual-status {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  z-index: 4;
  background: var(--hys-ui-virtual-bg);
  box-sizing: border-box;
  padding: 16px;
}
.hys-ui-virtual-overlay {
  background: color-mix(in srgb, var(--hys-ui-virtual-bg) 84%, transparent);
}
.hys-ui-virtual-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 13px;
}
.hys-ui-virtual-spinner {
  animation: hys-ui-virtual-spin 1s linear infinite;
}
.hys-ui-virtual-table[data-hys-motion="off"] .hys-ui-virtual-spinner {
  animation: none;
}
.hys-ui-is-disabled {
  opacity: 0.65;
}
@keyframes hys-ui-virtual-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-virtual-spinner {
    animation: none;
  }
}
</style>
