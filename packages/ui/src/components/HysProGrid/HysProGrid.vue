<script setup lang="ts" generic="T extends object = Record<string, unknown>">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
  type FunctionalComponent,
  type VNodeChild,
} from "vue";
import { Pencil } from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import HysDataGrid from "../HysDataGrid/HysDataGrid.vue";
import ProGridInlineEditor from "./ProGridInlineEditor/ProGridInlineEditor.vue";
import { useHysRootAttrs } from "../../config";
import {
  gridField,
  gridValue,
  type HysDataGridInstance,
  type HysDataGridKey,
  type HysDataGridQuery,
} from "../../composables/dataGrid";
import { gridKeyToken, isGridKey } from "../../composables/gridCore";
import { tabularDisplayText } from "../../composables/tabularCellDisplay";
import { tabularCellControls } from "../../composables/useTabularCellNavigation";
import type { HysMenuKey, HysMenuSelectInfo } from "../../composables/menu";
import type {
  HysDataGridCellContext,
  HysDataGridCellView,
  HysDataGridContext,
} from "../HysDataGrid/gridPresentation";
import type {
  HysDataGridColumnLayout,
  HysDataGridColumnLayoutSnapshot,
} from "../HysDataGrid/gridColumnLayout";
import type {
  HysProGridCancelReason,
  HysProGridCell,
  HysProGridChange,
  HysProGridEditorScope,
  HysProGridFailure,
  HysProGridProps,
  HysProGridSlots,
} from "./proGridTypes";
import { proGridMessages } from "./proGridValues";
import { useProGridEdit } from "./useProGridEdit";

const props = withDefaults(defineProps<{
  rows: HysProGridProps<T>["rows"];
  columns: HysProGridProps<T>["columns"];
  rowKey: HysProGridProps<T>["rowKey"];
  gridOptions?: HysProGridProps<T>["gridOptions"];
  readonly?: boolean;
  showEditButton?: boolean;
  showEditActions?: boolean;
  commitOnBlur?: boolean;
  typeToEdit?: boolean;
  enterToEdit?: boolean;
  saveCell?: HysProGridProps<T>["saveCell"];
  clipboard?: HysProGridProps<T>["clipboard"];
  messages?: HysProGridProps<T>["messages"];
}>(), {
  showEditButton: true,
  showEditActions: true,
  enterToEdit: true,
});
const slots = defineSlots<HysProGridSlots<T>>();
const emit = defineEmits<{
  editStart: [cell: HysProGridCell<T>];
  editCancel: [cell: HysProGridCell<T>, reason: HysProGridCancelReason];
  editError: [failure: HysProGridFailure];
  cellCommit: [change: HysProGridChange<T>];
  cellsCommit: [changes: readonly HysProGridChange<T>[]];
  "update:query": [query: HysDataGridQuery];
  queryChange: [query: HysDataGridQuery];
  "update:selectedRowKeys": [keys: HysDataGridKey[]];
  selectionChange: [keys: HysDataGridKey[]];
  "update:groupBy": [key: string];
  "update:currentRowKey": [key: HysDataGridKey | null];
  columnLayoutChange: [layout: HysDataGridColumnLayoutSnapshot];
  contextMenuSelect: [key: HysMenuKey, context: HysDataGridContext<T>, info: HysMenuSelectInfo];
}>();

const attrs = useHysRootAttrs();
const grid = useTemplateRef<HysDataGridInstance>("grid");
const root = useTemplateRef<HTMLElement>("root");
const active = shallowRef(true);
const batch = shallowRef<AbortController>();
let detachClipboard: (() => void) | undefined;
const inputId = useId();
const words = computed(() => ({ ...proGridMessages, ...props.messages }));
const columnsByKey = computed(
  () => new Map(props.columns.map((column) => [column.key, column])),
);
const rowsByKey = computed(() => {
  const rows = new Map<HysDataGridKey, T | undefined>();
  for (const row of props.rows) {
    const key =
      typeof props.rowKey === "function"
        ? props.rowKey(row)
        : gridField(row, props.rowKey);
    if (isGridKey(key)) rows.set(key, rows.has(key) ? undefined : row);
  }
  return rows;
});

function proCell(context: HysDataGridCellContext<T>) {
  const column = columnsByKey.value.get(context.column.key);
  return column ? { ...context, column } : undefined;
}

const edit = useProGridEdit({
  props,
  words: () => words.value,
  cell: proCell,
  current: (cell) =>
    columnsByKey.value.get(cell.column.key) === cell.column &&
    rowsByKey.value.get(cell.rowKey) === cell.row &&
    Object.is(gridValue(cell.row, cell.column), cell.value),
  visible: (cell) =>
    grid.value?.isCellVisible(cell.rowKey, cell.column.key) ?? false,
  hasCustomEditor: () => !!slots.editor,
  batchActive: () => !!batch.value,
  focus: (rowKey, columnKey) =>
    grid.value?.focusCell(rowKey, columnKey) ?? false,
  start: (cell) => emit("editStart", cell),
  committed: (change) => emit("cellCommit", change),
  failed: (failure) => emit("editError", failure),
  cancelled: (cell, reason) => emit("editCancel", cell, reason),
});
const { session, draft, phase, error, address } = edit;

onActivated(() => (active.value = true));
onDeactivated(() => (active.value = false));
onBeforeUnmount(() => {
  detachClipboard?.();
  detachClipboard = undefined;
});
watch(
  [() => props.readonly, () => props.saveCell],
  () => batch.value?.abort(),
  { flush: "sync" },
);

watch(
  [() => props.clipboard, root, grid, active],
  ([binding, element, instance, enabled], _, cleanup) => {
    if (!binding || !element || !instance || !enabled) return;
    const detach = binding.attach({
      root: element,
      getView: () =>
        instance.getCellView() as HysDataGridCellView<T> | undefined,
      getCell: proCell,
      canEdit: edit.canBegin,
      reserve() {
        if (
          session.value ||
          batch.value ||
          props.readonly ||
          props.gridOptions?.loading
        )
          return;
        const task = new AbortController();
        batch.value = task;
        return task;
      },
      release(task) {
        if (batch.value === task) batch.value = undefined;
      },
      getSaveCell: () => props.saveCell,
      messages: () => words.value,
      commit: (changes) => emit("cellsCommit", changes),
    });
    detachClipboard = detach;
    cleanup(() => {
      if (detachClipboard !== detach) return;
      detachClipboard = undefined;
      detach();
    });
  },
  { flush: "post" },
);
const RenderContent: FunctionalComponent<{ value: VNodeChild }> = ({ value }) =>
  value;
const editorScope = computed<HysProGridEditorScope<T> | undefined>(() => {
  if (!session.value) return;
  return {
    cell: session.value.cell,
    draft: draft.value,
    phase: phase.value,
    error: error.value,
    inputId,
    errorId: error.value ? inputId + "-feedback" : undefined,
    setDraft: edit.setDraft,
    commit: () => edit.commit(),
    cancel: () => edit.cancel(),
  };
});

function isActive(context: HysDataGridCellContext<T>) {
  return (
    address.value?.rowKey === context.rowKey &&
    address.value.columnKey === context.column.key
  );
}

function cellClass(context: HysDataGridCellContext<T>) {
  const configured = props.gridOptions?.cellClassName;
  const base =
    typeof configured === "function" ? configured(context) : configured;
  return isActive(context)
    ? (base ? base + " " : "") + "hys-ui-pro-grid-cell-active"
    : base;
}

function cellDisplay(context: HysDataGridCellContext<T>) {
  const column = columnsByKey.value.get(context.column.key);
  if (column?.render) return column.render({ ...context, column });
  return tabularDisplayText(
    context.value,
    context.column.emptyText ?? props.gridOptions?.emptyCellText,
    () => context.column.formatter?.(context),
  );
}

function canEditCell(context: HysDataGridCellContext<T>) {
  const cell = proCell(context);
  return !!cell && edit.canBegin(cell);
}

function onCellDblclick(context: HysDataGridCellContext<T>, event: MouseEvent) {
  if (
    event.defaultPrevented ||
    (event.target as Element)?.closest(tabularCellControls)
  )
    return;
  if (edit.begin(context)) event.preventDefault();
}

function onCellKeydown(
  context: HysDataGridCellContext<T>,
  event: KeyboardEvent,
) {
  if (
    event.isComposing ||
    event.keyCode === 229 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    !["Enter", "F2"].includes(event.key) ||
    (event.key === "Enter" && !props.enterToEdit)
  )
    return;
  if (edit.begin(context)) event.preventDefault();
}

function typeInCell(event: KeyboardEvent) {
  if (
    !props.typeToEdit ||
    session.value ||
    event.defaultPrevented ||
    event.isComposing ||
    event.keyCode === 229 ||
    (event.shiftKey && event.code === "Space") ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    [...event.key].length !== 1
  )
    return;
  const cell = event.target as HTMLTableCellElement;
  if (
    !cell.matches?.("td[data-hys-cell-index]") ||
    cell.closest(".hys-ui-pro-grid") !== root.value
  )
    return;
  const columnKey = cell.dataset.columnKey!;
  const editor = columnsByKey.value.get(columnKey)?.editor;
  if (editor?.type !== "text" && editor?.type !== "number") return;
  const rowToken = cell.parentElement?.dataset.gridRow;
  const view = grid.value?.getCellView() as HysDataGridCellView<T> | undefined;
  const rowKey = view?.rowKeys.find((key) => gridKeyToken(key) === rowToken);
  const context =
    rowKey === undefined ? undefined : view?.getCell(rowKey, columnKey);
  if (context && edit.begin(context, event.key)) event.preventDefault();
}

async function commitAndMove(origin: HTMLTableCellElement, backwards: boolean) {
  if (!(await edit.commit())) return false;
  await nextTick();
  if (!origin.isConnected || session.value || document.activeElement !== origin)
    return true;
  const rows = origin.closest("tbody")?.rows;
  if (!rows) return true;
  const cells = Array.from(rows).flatMap((row) =>
    Array.from(row.cells).filter((cell) =>
      cell.hasAttribute("data-hys-cell-index"),
    ),
  );
  cells[cells.indexOf(origin) + (backwards ? -1 : 1)]?.focus();
  return true;
}

function queryChanged(query: HysDataGridQuery) {
  edit.cancel("view-change", false);
  emit("queryChange", query);
}

function layoutChanged(layout: HysDataGridColumnLayoutSnapshot) {
  if (address.value && layout.hidden.includes(address.value.columnKey))
    edit.cancel("view-change", false);
  emit("columnLayoutChange", layout);
}

watch(
  () => props.gridOptions?.groupBy,
  () => edit.cancel("view-change", false),
);
watch(
  () => {
    const cell = address.value;
    return (
      !cell || grid.value?.isCellVisible(cell.rowKey, cell.columnKey) !== false
    );
  },
  (visible) => {
    if (!visible) edit.cancel("view-change", false);
  },
  { flush: "post" },
);

defineExpose({
  editing: address,
  commitEdit: () => edit.commit(),
  cancelEdit: () => edit.cancel(),
  focusCell: (rowKey: HysDataGridKey, columnKey: string, focus = true) =>
    grid.value?.focusCell(rowKey, columnKey, focus) ?? false,
  getQuery: () => grid.value!.getQuery(),
  setQuery: (query: Partial<HysDataGridQuery>) => grid.value?.setQuery(query),
  getColumnLayout: () => grid.value!.getColumnLayout(),
  applyColumnLayout: (layout: HysDataGridColumnLayout) =>
    grid.value?.applyColumnLayout(layout),
});
</script>

<template>
  <div
    ref="root"
    v-bind="attrs"
    class="hys-ui-pro-grid"
    @keydown.capture="typeInCell"
  >
    <HysDataGrid
      ref="grid"
      v-bind="gridOptions"
      :columns="columns"
      :rows="rows"
      :row-key="rowKey"
      :editable="false"
      :load-rows="undefined"
      :cell-class-name="address ? cellClass : gridOptions?.cellClassName"
      cell-navigation
      @cell-dblclick="onCellDblclick"
      @cell-keydown="onCellKeydown"
      @update:query="emit('update:query', $event)"
      @query-change="queryChanged"
      @update:selected-row-keys="emit('update:selectedRowKeys', $event)"
      @selection-change="emit('selectionChange', $event)"
      @update:group-by="emit('update:groupBy', $event)"
      @update:current-row-key="emit('update:currentRowKey', $event)"
      @column-layout-change="layoutChanged"
      @context-menu-select="(key, context, info) => emit('contextMenuSelect', key, context, info)"
    >
      <template v-if="slots['header-cell']" #header-cell="context">
        <slot name="header-cell" v-bind="context" />
      </template>
      <template v-if="slots['row-number']" #row-number="context">
        <slot name="row-number" v-bind="context" />
      </template>
      <template v-if="slots['row-number-header']" #row-number-header>
        <slot name="row-number-header" />
      </template>
      <template v-if="slots['context-menu-item-control']" #context-menu-item-control="scope">
        <slot name="context-menu-item-control" v-bind="scope" />
      </template>
      <template #body-cell="context">
        <span
          v-if="columnsByKey.get(context.column.key)?.editor"
          class="hys-ui-pro-grid-cell"
          :inert="isActive(context)"
        >
          <slot
            v-if="slots.cell && proCell(context)"
            name="cell"
            v-bind="proCell(context)!"
            :editable="canEditCell(context)"
            :edit="() => edit.begin(context)"
          />
          <RenderContent v-else :value="cellDisplay(context)" />
          <HysButton
            v-if="showEditButton && canEditCell(context)"
            class="hys-ui-pro-grid-edit"
            variant="ghost"
            size="sm"
            :icon="Pencil"
            :aria-label="
              words.edit +
              ' ' +
              context.column.label +
              ' · ' +
              (context.pageIndex + 1)
            "
            :disabled="!!session || !!batch"
            :focusable="false"
            @click.stop="edit.begin(context)"
          />
          <span
            v-else-if="showEditButton"
            class="hys-ui-pro-grid-edit-spacer"
            aria-hidden="true"
          />
        </span>
        <slot
          v-else-if="slots.cell && proCell(context)"
          name="cell"
          v-bind="proCell(context)!"
          :editable="false"
          :edit="() => false"
        />
        <RenderContent v-else :value="cellDisplay(context)" />
        <ProGridInlineEditor
          v-if="session && editorScope && isActive(context)"
          :scope="editorScope"
          :editor="session.editor"
          :words="words"
          :show-actions="showEditActions"
          :commit-on-blur="commitOnBlur"
          :commit-from-blur="() => edit.commit(false)"
          :commit-and-move="commitAndMove"
        >
          <template v-if="slots.editor" #custom="scope">
            <slot name="editor" v-bind="scope" />
          </template>
        </ProGridInlineEditor>
      </template>
      <template v-if="slots['toolbar-actions']" #toolbar-actions="context">
        <slot name="toolbar-actions" v-bind="context" />
      </template>
      <template v-if="slots.empty" #empty="context"
        ><slot name="empty" v-bind="context"
      /></template>
    </HysDataGrid>
  </div>
</template>
