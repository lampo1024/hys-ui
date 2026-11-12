<script setup lang="ts" generic="T extends object = HysSortItem">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
  type VNodeChild,
} from "vue";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GripVertical,
} from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import { useMotion } from "../../motion/useMotion";
import { candidateAt, wholeRowDrag } from "./geometry";
import {
  buildSortIndex,
  feedback,
  keyToken,
  registerSortPort,
  sortPorts,
  type SortPort,
} from "./model";
import {
  discardSortHistory,
  keysArray,
  navigateHistory,
  resetSort,
  restoreStoredSort,
} from "./transactions";
import { useSortDrag } from "./useSortDrag";
import { useSortWindow } from "./useSortWindow";
import SortableGhost from "./SortableGhost/SortableGhost.vue";
import type {
  HysSortChange,
  HysSortDrag,
  HysSortFeedback,
  HysSortItem,
  HysSortKey,
  HysSortMoveOptions,
  HysSortPreview,
  HysSortRow,
  HysSortableListInstance,
  HysSortableListProps,
} from "./sortableList";

// Keep the gesture default available when hot reload reuses the imported prop type.
type Props<Item extends object> = Omit<
  HysSortableListProps<Item>,
  "showHandle"
> & {
  showHandle?: boolean;
};

const props = withDefaults(defineProps<Props<T>>(), {
  ariaLabel: "可排序列表",
  layout: "vertical",
  mode: "insert",
  handle: true,
  showHandle: true,
  showButtons: true,
  keyboard: true,
  dragDelay: 0,
  touchDelay: 180,
  dragThreshold: 5,
  axis: "both",
  livePreview: true,
  history: true,
  autoScroll: true,
  listTag: "div",
  motion: true,
  animationDuration: 180,
  animationEasing: "ease",
});
const emit = defineEmits<{
  "update:modelValue": [value: T[]];
  "update:selectedKeys": [keys: HysSortKey[]];
  start: [drag: HysSortDrag<T>];
  preview: [preview: HysSortPreview<T> | null];
  change: [change: HysSortChange<T>];
  cancel: [feedback: HysSortFeedback<T>];
  invalid: [feedback: HysSortFeedback<T>];
  conflict: [feedback: HysSortFeedback<T>];
  "save-error": [feedback: HysSortFeedback<T>];
}>();
defineSlots<{
  item?: (row: HysSortRow<T>) => VNodeChild;
  handle?: (row: HysSortRow<T>) => VNodeChild;
  preview?: (context: { drag: HysSortDrag<T>; allowed: boolean }) => VNodeChild;
  placeholder?: (row: HysSortRow<T>) => VNodeChild;
  empty?: () => VNodeChild;
  header?: () => VNodeChild;
  cells?: (row: HysSortRow<T>) => VNodeChild;
}>();

const rootAttrs = useHysRootAttrs();
const { effectiveMotion } = useMotion();
const instanceId = useId();
const instructionId = `${instanceId}-sort-help`;
const root = useTemplateRef<HTMLElement>("root");
const viewport = useTemplateRef<HTMLElement>("viewport");
const surface = useTemplateRef<HTMLElement>("surface");
const local = shallowRef<readonly T[]>(
  props.modelValue ?? props.defaultItems ?? [],
);
const initial = local.value.slice();
const localSelected = shallowRef<readonly HysSortKey[]>(
  props.defaultSelectedKeys ?? [],
);
const busy = shallowRef(false);
const announcement = shallowRef("");
const items = computed(() => props.modelValue ?? local.value);
const motion = computed(() => props.motion && effectiveMotion.value !== "off");
const table = computed(() => props.listTag === "table");
const rowTag = computed(() =>
  table.value
    ? "tr"
    : props.listTag === "ul" || props.listTag === "ol"
      ? "li"
      : "div",
);
const cellTag = computed(() => (table.value ? "td" : "div"));
const handleVisible = computed(() => props.showHandle !== false);
const hasGripCell = computed(() => handleVisible.value || props.selectable);
const columnCount = computed(
  () =>
    props.tableColumns ??
    1 + Number(hasGripCell.value) + Number(props.showButtons),
);
const isHorizontal = computed(
  () => props.layout === "horizontal" && !table.value,
);
const isGrid = computed(() => props.layout === "grid" && !table.value);

function keyOf(item: T) {
  return typeof props.itemKey === "function"
    ? props.itemKey(item)
    : (item[(props.itemKey ?? "id") as keyof T] as HysSortKey);
}
function labelOf(item: T) {
  const label =
    typeof props.itemLabel === "function"
      ? props.itemLabel(item)
      : item[(props.itemLabel ?? "label") as keyof T];
  return String(label ?? keyOf(item) ?? "");
}
const data = computed(() => buildSortIndex(items.value, keyOf, props.fixed));
const pinned = computed(
  () => new Map(data.value.fixed.map((entry) => [entry.key, entry.placement])),
);
const unavailable = computed(
  () =>
    new Set(typeof props.itemDisabled === "function" ? [] : props.itemDisabled),
);
const selected = computed(
  () =>
    new Set(
      (props.selectedKeys ?? localSelected.value).filter((key) =>
        data.value.keys.has(key),
      ),
    ),
);
let selectionAnchor: HysSortKey | undefined;

function apply(value: T[]) {
  if (props.modelValue === undefined) local.value = value;
  emit("update:modelValue", value);
}
function select(keys: readonly HysSortKey[]) {
  if (!props.selectable) return;
  const next = Array.from(new Set(keys)).filter((key) =>
    data.value.keys.has(key),
  );
  if (props.selectedKeys === undefined) localSelected.value = next;
  emit("update:selectedKeys", next);
}
function toggle(key: HysSortKey, event?: MouseEvent) {
  if (!props.selectable || props.disabled || busy.value) return;
  const next = new Set(selected.value);
  const from =
    selectionAnchor === undefined
      ? undefined
      : data.value.keys.get(selectionAnchor);
  const to = data.value.keys.get(key);
  if (event?.shiftKey && from !== undefined && to !== undefined) {
    for (let i = Math.min(from, to); i <= Math.max(from, to); i++) {
      const item = items.value[i];
      if (!rowUnavailable(item, i)) next.add(keyOf(item));
    }
  } else {
    if (next.has(key)) next.delete(key);
    else next.add(key);
    selectionAnchor = key;
  }
  select([...next]);
}
function rowOf(key: HysSortKey) {
  const token = keyToken(key);
  return Array.from(surface.value?.children ?? []).find(
    (row): row is HTMLElement =>
      row instanceof HTMLElement && row.dataset.sortKey === token,
  );
}
function reject(problem: HysSortFeedback<T>) {
  announcement.value = problem.message;
  if (problem.reason === "cancelled") emit("cancel", problem);
  else if (problem.reason === "save") emit("save-error", problem);
  else if (problem.reason === "conflict") emit("conflict", problem);
  else emit("invalid", problem);
}

const port: SortPort<T> = {
  id: () => props.listId ?? instanceId,
  props,
  key: keyOf,
  label: labelOf,
  row: rowOf,
  apply,
  focus,
  scroll: scrollTo,
  reject,
  root: () => root.value ?? undefined,
  surface: () => surface.value ?? undefined,
  data: () => data.value,
  lock: (value) => {
    busy.value = value;
  },
  start: (value) => emit("start", value),
  preview: (value) => emit("preview", value),
  change: (value) => emit("change", value),
  announce: (message) => {
    announcement.value = message;
  },
};

const drag = useSortDrag(
  port,
  (key) => (selected.value.has(key) ? [...selected.value] : [key]),
  () => motion.value,
);
const { own, over, ghost, anchorForDisplay } = drag;
const projected = computed(() => {
  const current = own.value;
  const result = current?.result;
  return props.livePreview &&
    !(props.virtual && current?.drag.source === "keyboard") &&
    result &&
    !("reason" in result) &&
    result.target === port
    ? result.changes[0].next
    : items.value;
});
const { visibleItems, range, length, columns, reveal, syncPosition } =
  useSortWindow(props, projected, viewport, surface, keyOf);
const dragKeys = computed(() => new Set(own.value?.drag.keys ?? []));
const dropState = computed(() => {
  const result = over.value?.result;
  return result
    ? "reason" in result
      ? result.reason === "noop"
        ? undefined
        : "invalid"
      : "allowed"
    : undefined;
});
const dropMarker = computed(() =>
  dropState.value === "allowed" ? anchorForDisplay.value : undefined,
);
const styling = computed(() => ({
  "--hys-sort-duration": `${Math.max(0, props.animationDuration)}ms`,
  "--hys-sort-easing": props.animationEasing,
  "--hys-sort-virtual-columns": columns.value,
}));
const instruction = computed(() => {
  if (props.disabled) return "排序已禁用。";
  if (!props.keyboard) return "拖动项目调整顺序。";
  const arrows = isHorizontal.value
    ? "左右方向键"
    : isGrid.value
      ? "方向键"
      : "上下方向键";
  return `按空格拾起或放置，用${arrows}移动，Escape 取消。也可按 Alt 加${arrows}直接排序。${props.group ? "拾起后按 Ctrl 加方向键切换列表。" : ""}`;
});

function rowUnavailable(item: T, index: number) {
  if (props.disabled || !data.value.valid || pinned.value.has(keyOf(item)))
    return true;
  if (
    typeof props.itemDisabled === "function"
      ? props.itemDisabled(item, index)
      : unavailable.value.has(keyOf(item))
  )
    return true;
  const rule = props.canDrag?.(item, index);
  return rule === false || typeof rule === "string";
}
const rows = computed<HysSortRow<T>[]>(() =>
  visibleItems.value.map((item, index) => {
    const key = keyOf(item);
    const actual = data.value.keys.get(key) ?? index + range.value.start;
    return {
      item,
      key,
      index: actual,
      selected: selected.value.has(key),
      dragging: dragKeys.value.has(key),
      disabled: rowUnavailable(item, actual),
      fixed: pinned.value.get(key) ?? false,
      toggle: (event) => toggle(key, event),
      move: (offset) => drag.relative(key, offset, "button"),
    };
  }),
);

async function scrollTo(key: HysSortKey) {
  const index =
    projected.value === items.value
      ? data.value.keys.get(key)
      : projected.value.findIndex((item) => keyOf(item) === key);
  if (index === undefined || index < 0) return false;
  await reveal(index);
  await nextTick();
  const row = rowOf(key);
  row?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  return !!row;
}
async function focus(key: HysSortKey) {
  if (!(await scrollTo(key))) return false;
  const row = rowOf(key);
  row?.focus({ preventScroll: true });
  return !!row;
}
function move(
  keys: HysSortKey | readonly HysSortKey[],
  options: HysSortMoveOptions,
) {
  const target =
    options.to === undefined || options.to === port.id()
      ? port
      : sortPorts<T>().find(
          (item) =>
            item.id() === options.to &&
            item.root()?.ownerDocument === root.value?.ownerDocument,
        );
  if (!target) {
    reject(feedback("outside"));
    return Promise.resolve(false);
  }
  return drag.move(
    keysArray(keys),
    {
      ...candidateAt(port, target, options.index),
      operation: options.operation,
    },
    "api",
  );
}
function rowClick(event: MouseEvent, row: HysSortRow<T>) {
  if (row.disabled || !(event.ctrlKey || event.metaKey || event.shiftKey))
    return;
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest("[data-sort-root]") === root.value &&
    !target.closest(
      "button,input,select,textarea,a[href],label,[contenteditable],[data-sort-ignore]",
    )
  )
    row.toggle(event);
}
function focusOut(event: FocusEvent) {
  if (
    own.value?.drag.source === "keyboard" &&
    event.relatedTarget instanceof Node &&
    !root.value?.contains(event.relatedTarget)
  )
    drag.cancel();
}
function spacer(size: number) {
  return isHorizontal.value
    ? { inlineSize: `${size}px` }
    : { blockSize: `${size}px` };
}

let unregister: (() => void) | undefined;
function register() {
  if (!unregister && root.value)
    unregister = registerSortPort(root.value, port);
}
function detach() {
  unregister?.();
  unregister = undefined;
  drag.detach();
}
onMounted(() => {
  register();
  restoreStoredSort(port);
});
onActivated(register);
onDeactivated(detach);
onBeforeUnmount(() => {
  detach();
  discardSortHistory(port);
});
watch(data, () => drag.dataChanged(), { flush: "post" });
watch(
  () => props.disabled,
  (value) => {
    if (value) drag.cancel();
  },
);

defineExpose({
  move,
  select,
  scrollTo,
  focus,
  undo: () => navigateHistory(port, "undo"),
  redo: () => navigateHistory(port, "redo"),
  reset: () => resetSort(port, initial),
  cancel: () => drag.cancel(),
} satisfies HysSortableListInstance);
</script>

<template>
  <div
    ref="root"
    v-bind="rootAttrs"
    data-sort-root
    class="hys-sort"
    :class="{ 'hys-sort-moving': !!own, 'hys-sort-no-motion': !motion }"
    :data-drop-state="dropState"
    :aria-busy="busy || undefined"
    :style="styling"
    @focusout="focusOut"
  >
    <div
      ref="viewport"
      class="hys-sort-viewport"
      :class="{ 'hys-sort-virtual': virtual }"
      :style="{ maxBlockSize: length }"
      @scroll.passive="syncPosition"
    >
      <component
        :is="table ? 'table' : 'div'"
        :class="table ? 'hys-sort-table' : undefined"
        :aria-label="table ? ariaLabel : undefined"
      >
        <slot v-if="table" name="header" />
        <component
          :is="table ? 'tbody' : listTag"
          ref="surface"
          data-sort-surface
          class="hys-sort-list"
          :class="{
            'hys-sort-horizontal': isHorizontal,
            'hys-sort-grid': isGrid,
          }"
          :role="table ? undefined : 'list'"
          :aria-label="table ? undefined : ariaLabel"
          :aria-describedby="instructionId"
          :data-sort-columns="isGrid && virtual ? columns : undefined"
        >
          <TransitionGroup
            name="hys-sort-motion"
            :css="false"
            :move-class="
              motion && !virtual ? moveClass : 'hys-sort-static-move'
            "
          >
            <component
              v-if="range.before"
              :is="rowTag"
              key="before-spacer"
              class="hys-sort-spacer"
              :style="spacer(range.before)"
              aria-hidden="true"
            >
              <td v-if="table" :colspan="columnCount" />
            </component>
            <component
              v-for="(row, visualIndex) in rows"
              :key="
                data.valid
                  ? 'row:' + keyToken(row.key)
                  : 'invalid:' + visualIndex
              "
              :is="rowTag"
              class="hys-sort-row"
              :class="{
                'hys-sort-picked': row.dragging,
                'hys-sort-selected': row.selected,
                'hys-sort-whole': wholeRowDrag(props) && !row.disabled,
              }"
              :role="table ? undefined : 'listitem'"
              :tabindex="keyboard ? 0 : undefined"
              :data-sort-id="row.key"
              :data-sort-key="keyToken(row.key)"
              :data-sort-index="range.start + visualIndex"
              :data-drop-position="
                dropMarker?.key === row.key ? dropMarker?.position : undefined
              "
              :aria-posinset="table ? undefined : row.index + 1"
              :aria-setsize="table ? undefined : items.length"
              :aria-label="labelOf(row.item)"
              :aria-disabled="row.disabled || undefined"
              @pointerdown="drag.pointerDown($event, row.key, row.disabled)"
              @keydown="drag.keyboard($event, row.key, row.disabled)"
              @click="rowClick($event, row)"
              @dragstart.prevent
            >
              <component
                v-if="hasGripCell"
                :is="cellTag"
                class="hys-sort-grip-cell"
              >
                <input
                  v-if="selectable"
                  type="checkbox"
                  :checked="row.selected"
                  :disabled="row.disabled || busy"
                  :aria-label="'选择' + labelOf(row.item)"
                  @click.prevent="row.toggle($event)"
                />
                <button
                  v-if="handleVisible"
                  type="button"
                  data-sort-handle
                  class="hys-sort-handle"
                  :disabled="row.disabled || busy"
                  :aria-label="'拖动排序' + labelOf(row.item)"
                >
                  <slot name="handle" v-bind="row"
                    ><GripVertical :size="16" aria-hidden="true"
                  /></slot>
                </button>
              </component>
              <slot v-if="table && $slots.cells" name="cells" v-bind="row" />
              <component v-else :is="cellTag" class="hys-sort-content">
                <slot name="item" v-bind="row">{{ labelOf(row.item) }}</slot>
              </component>
              <component
                v-if="showButtons"
                :is="cellTag"
                class="hys-sort-actions-cell"
              >
                <div class="hys-sort-actions">
                  <button
                    type="button"
                    :disabled="row.disabled || busy || row.index === 0"
                    :aria-label="
                      (isHorizontal ? '前移' : '上移') + labelOf(row.item)
                    "
                    @click="row.move(-1)"
                  >
                    <component
                      :is="isHorizontal ? ChevronLeft : ChevronUp"
                      :size="15"
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    :disabled="
                      row.disabled || busy || row.index === items.length - 1
                    "
                    :aria-label="
                      (isHorizontal ? '后移' : '下移') + labelOf(row.item)
                    "
                    @click="row.move(1)"
                  >
                    <component
                      :is="isHorizontal ? ChevronRight : ChevronDown"
                      :size="15"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </component>
              <component
                v-if="row.dragging && $slots.placeholder"
                :is="cellTag"
                class="hys-sort-placeholder"
                aria-hidden="true"
              >
                <slot name="placeholder" v-bind="row" />
              </component>
            </component>
            <component
              v-if="range.after"
              :is="rowTag"
              key="after-spacer"
              class="hys-sort-spacer"
              :style="spacer(range.after)"
              aria-hidden="true"
            >
              <td v-if="table" :colspan="columnCount" />
            </component>
          </TransitionGroup>
          <component v-if="!items.length" :is="rowTag" class="hys-sort-empty">
            <component :is="cellTag" :colspan="table ? columnCount : undefined"
              ><slot name="empty">暂无项目</slot></component
            >
          </component>
        </component>
      </component>
    </div>
    <span :id="instructionId" class="hys-sort-sr">{{ instruction }}</span>
    <span class="hys-sort-sr" role="status">{{ announcement }}</span>
    <Teleport v-if="ghost" to="body">
      <SortableGhost
        :track="ghost"
        :appearance="rootAttrs"
        :ghost-class="ghostClass"
        :ghost-style="ghostStyle"
        :motion="motion"
      >
        <template #default="context">
          <slot name="preview" v-bind="context">
            {{ labelOf(context.drag.items[0])
            }}<template v-if="context.drag.items.length > 1">
              等 {{ context.drag.items.length }} 项</template
            >
          </slot>
        </template>
      </SortableGhost>
    </Teleport>
  </div>
</template>

<style scoped src="./sortable.css"></style>
