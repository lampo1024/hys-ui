<script
  setup
  lang="ts"
  generic="
    T extends object = HysTransferOption,
    K extends HysTransferKey = HysTransferKey
  "
>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  provide,
  ref,
  useId,
  watch,
  type InjectionKey,
} from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import HysTransferPanel from "./HysTransferPanel.vue";
import { useHysRootAttrs } from "../../config";
import {
  useHysControlState,
  useHysFormItemContext,
  fieldKey,
  type HysFieldContext,
} from "../../composables/formContext";
import { useTransferMotion } from "../../composables/useTransferMotion";
import { useTransfer } from "../../composables/useTransfer";
import {
  transferLabel,
  type HysTransferProps,
  type HysTransferKey,
  type HysTransferSide,
  type HysTransferOption,
  type HysTransferPanelContext,
  type HysTransferSlots,
} from "../../composables/transfer";
const props = withDefaults(defineProps<HysTransferProps<T, K>>(), {
  filterable: true,
  showSelectAll: true,
  targetOrder: "original",
  draggable: true,
  dragChecked: true,
  moveOnDoubleClick: false,
  animated: true,
  moveAnimation: "flight",
  moveDuration: 240,
  maxAnimatedItems: 6,
  highlightOnArrival: true,
  listHeight: 240,
  itemHeight: 36,
  overscan: 4,
  validateEvent: true,
});
defineSlots<HysTransferSlots<T, K>>();
const emptySlot = (side: HysTransferSide): "left-empty" | "right-empty" =>
  side === "left" ? "left-empty" : "right-empty";
const footerSlot = (side: HysTransferSide): "left-footer" | "right-footer" =>
  side === "left" ? "left-footer" : "right-footer";
const emit = defineEmits<{
  "update:modelValue": [value: K[]];
  change: [value: K[], direction: HysTransferSide, movedKeys: K[]];
  "update:checkedKeys": [keys: K[]];
  checkChange: [side: HysTransferSide, keys: K[]];
  selectChange: [left: K[], right: K[]];
  "update:searchValues": [values: Record<HysTransferSide, string>];
  search: [side: HysTransferSide, value: string];
  "update:pages": [pages: Record<HysTransferSide, number>];
  pageChange: [side: HysTransferSide, page: number, pageSize: number];
  "update:pageSizes": [sizes: Record<HysTransferSide, number>];
  pageSizeChange: [side: HysTransferSide, size: number];
  scroll: [side: HysTransferSide, event: Event];
  dragStart: [side: HysTransferSide, keys: K[], event: DragEvent];
  dragEnd: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const attrs = useHysRootAttrs(),
  element = ref<HTMLElement>(),
  id = useId(),
  field = useHysFormItemContext(),
  control = useHysControlState(props);
// Panel search and checkbox state are internal to this composite form field.
provide(fieldKey as InjectionKey<HysFieldContext | undefined>, undefined);
const store = useTransfer(
  props,
  control.disabled,
  (name, ...args) =>
    (emit as (name: string, ...args: any[]) => void)(name, ...args),
  () => {
    void field.validate("change");
  },
);
const {
  live,
  busy,
  keys,
  checked,
  words,
  all,
  filtered,
  visible,
  pages,
  pageSizes,
  pagination,
  searchValues,
  announcement,
  getCheckedKeys,
  check,
  checkAll,
  invertSelection,
  setSearch,
  setPage,
  setPageSize,
} = store;
const transferMotion = useTransferMotion(element, props);
watch(
  [() => store.keys.value, () => store.data.value],
  transferMotion.cancelPlaying,
);
watch(
  [
    () => store.searchValues.value.left,
    () => store.searchValues.value.right,
    () => props.loading,
    () => control.disabled.value,
  ],
  transferMotion.stop,
);
async function move(
  direction: HysTransferSide,
  requested: readonly K[] = getCheckedKeys(
    direction === "right" ? "left" : "right",
  ),
) {
  if (busy.value) return false;
  const valid = [...new Set(requested)].filter((key) => {
    const row = store.data.value.map.get(key);
    return (
      row &&
      !row.disabled &&
      store.targetSet.value.has(key) !== (direction === "right")
    );
  });
  const snapshot = transferMotion.capture(direction, valid),
    accepted = await store.move(direction, requested);
  if (accepted) {
    await nextTick();
    transferMotion.play(snapshot);
  }
  return accepted;
}
const sides = ["left", "right"] as const;
const titles = computed(() => ({
    left: props.titles?.[0] ?? words.value.leftTitle,
    right: props.titles?.[1] ?? words.value.rightTitle,
  })),
  panels = computed(() =>
    sides.map((side) => ({ side, title: titles.value[side] })),
  );
const dragged = ref<K[]>([]) as { value: K[] },
  dragSide = ref<HysTransferSide>(),
  dropTarget = ref<HysTransferSide>();
let dragging = false;
const panelRefs = new Map<
  HysTransferSide,
  {
    scrollTo: (options: {
      key?: K;
      top?: number;
      behavior?: ScrollBehavior;
    }) => Promise<void>;
    focus: () => void;
  }
>();
function setPanelRef(side: HysTransferSide, value: unknown) {
  if (value)
    panelRefs.set(
      side,
      value as typeof panelRefs extends Map<any, infer V> ? V : never,
    );
  else panelRefs.delete(side);
}
function placeholder(side: HysTransferSide) {
  return typeof props.filterPlaceholder === "string"
    ? props.filterPlaceholder
    : (props.filterPlaceholder?.[side === "left" ? 0 : 1] ??
        words.value.search);
}
function scope(side: HysTransferSide): HysTransferPanelContext<T, K> {
  return {
    side,
    items: visible.value[side].map((row) => row.option),
    filteredItems: filtered.value[side].map((row) => row.option),
    checkedKeys: getCheckedKeys(side),
    disabled: busy.value,
    query: searchValues.value[side],
    check: (key, value) =>
      store.targetSet.value.has(key) === (side === "right")
        ? check(key, value)
        : Promise.resolve(false),
    setCheckedKeys: (values) =>
      store.setCheckedKeys([
        ...getCheckedKeys(side === "left" ? "right" : "left"),
        ...values.filter(
          (key) => store.targetSet.value.has(key) === (side === "right"),
        ),
      ]),
    checkAll: (selected = true) => checkAll(side, selected),
    remove: (values) => move("left", values),
  };
}
function dragEnd() {
  const was = dragging;
  dragged.value = [];
  dragSide.value = undefined;
  dropTarget.value = undefined;
  dragging = false;
  window.removeEventListener("keydown", dragKeys);
  window.removeEventListener("blur", dragEnd);
  if (was && live.value) emit("dragEnd");
}
function dragKeys(event: KeyboardEvent) {
  if (event.key === "Escape") dragEnd();
}
function dragStart(event: DragEvent, side: HysTransferSide, key: K) {
  const row = store.data.value.map.get(key);
  if (
    busy.value ||
    !props.draggable ||
    row?.disabled ||
    !row ||
    (props.oneWay && side === "right") ||
    !event.dataTransfer
  ) {
    event.preventDefault();
    return;
  }
  dragEnd();
  dragged.value =
    props.dragChecked && store.checkedSet.value.has(key)
      ? getCheckedKeys(side)
      : [key];
  dragSide.value = side;
  dragging = true;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "text/plain",
    dragged.value.map(String).join(", "),
  );
  event.dataTransfer.setData("application/x-hys-ui-transfer", id);
  window.addEventListener("keydown", dragKeys);
  window.addEventListener("blur", dragEnd);
  emit("dragStart", side, [...dragged.value], event);
}
const validDrag = computed(
  () =>
    !busy.value &&
    !!props.draggable &&
    dragged.value.length > 0 &&
    !(props.oneWay && dragSide.value === "right") &&
    dragged.value.every((key) => {
      const row = store.data.value.map.get(key);
      return (
        row &&
        !row.disabled &&
        store.targetSet.value.has(key) === (dragSide.value === "right")
      );
    }),
);
function canDrop(side: HysTransferSide) {
  return validDrag.value && dragSide.value !== side;
}
function dragOver(event: DragEvent, side: HysTransferSide) {
  if (!canDrop(side)) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  dropTarget.value = side;
}
function dragLeave(event: DragEvent) {
  if (
    event.relatedTarget instanceof Node &&
    (event.currentTarget as HTMLElement).contains(event.relatedTarget)
  )
    return;
  dropTarget.value = undefined;
}
function drop(event: DragEvent, side: HysTransferSide) {
  if (canDrop(side)) {
    event.preventDefault();
    void move(side, [...dragged.value]);
  }
  dragEnd();
}
watch(
  () => [
    busy.value,
    props.draggable,
    props.oneWay,
    store.data.value,
    store.keys.value,
  ],
  () => {
    if (
      dragged.value.length &&
      (busy.value ||
        !props.draggable ||
        !canDrop(dragSide.value === "left" ? "right" : "left"))
    )
      dragEnd();
  },
  { flush: "sync" },
);
onDeactivated(dragEnd);
onBeforeUnmount(dragEnd);
function focus(side: HysTransferSide = "left") {
  if (!busy.value) panelRefs.get(side)?.focus();
}
async function scrollTo(
  side: HysTransferSide,
  options: { key?: K; top?: number; behavior?: ScrollBehavior },
) {
  if (!live.value) return;
  if (options.key !== undefined && props.pagination) {
    const index = filtered.value[side].findIndex(
      (row) => row.key === options.key,
    );
    if (index < 0) return;
    const page = Math.floor(index / pageSizes.value[side]) + 1;
    setPage(side, page);
    await nextTick();
    if (pages.value[side] !== page) return;
  }
  await panelRefs.get(side)?.scrollTo(options);
}
function blur(event: FocusEvent) {
  if (
    event.relatedTarget instanceof Node &&
    element.value?.contains(event.relatedTarget)
  )
    return;
  emit("blur", event);
  if (props.validateEvent && !control.disabled.value)
    void field.validate("blur");
}
function onFocus(event: FocusEvent) {
  if (!(
    event.relatedTarget instanceof Node &&
    element.value?.contains(event.relatedTarget)
  ))
    emit("focus", event);
}
defineExpose({
  element,
  targetKeys: keys,
  checkedKeys: checked,
  getCheckedKeys,
  getTargetItems: () => all.value.right.map((row) => row.option),
  move,
  remove: (values: readonly K[]) => move("left", values),
  setCheckedKeys: store.setCheckedKeys,
  clearChecked: store.clearChecked,
  checkAll,
  invertSelection,
  setSearch,
  clearSearch: store.clearSearch,
  setPage,
  setPageSize,
  scrollTo,
  focus,
});
</script>
<template>
  <div
    :id="field.id.value"
    ref="element"
    v-bind="attrs"
    class="hys-ui-v4-transfer hys-ui-pf-transfer hys-ui-transfer"
    :class="{
      'hys-ui-transfer-error': status === 'error' || field.invalid.value,
      'hys-ui-transfer-warning': status === 'warning',
    }"
    :data-size="control.size.value"
    role="group"
    :aria-label="ariaLabel || field.label.value || '穿梭选择'"
    :aria-invalid="status === 'error' || field.invalid.value || undefined"
    :aria-describedby="field.describedBy.value"
    :aria-busy="loading || undefined"
    @focusin="onFocus"
    @focusout="blur"
  >
    <template v-for="(panel, index) in panels" :key="panel.side">
      <div v-if="index === 1" class="hys-ui-v4-move" :style="operationStyle">
        <slot
          name="operations"
          :move="move"
          :disabled="busy"
          :left-checked="getCheckedKeys('left')"
          :right-checked="getCheckedKeys('right')"
        >
          <HysButton
            variant="secondary"
            :size="control.size.value === 'lg' ? 'md' : 'sm'"
            class="hys-ui-transfer-move"
            :disabled="busy || !getCheckedKeys('left').length"
            :aria-label="words.moveRight"
            @click="move('right')"
            ><ChevronRight :size="16" aria-hidden="true" /><span
              v-if="buttonTexts?.[0]"
              >{{ buttonTexts[0] }}</span
            ></HysButton
          >
          <HysButton
            v-if="!oneWay"
            variant="secondary"
            :size="control.size.value === 'lg' ? 'md' : 'sm'"
            class="hys-ui-transfer-move"
            :disabled="busy || !getCheckedKeys('right').length"
            :aria-label="words.moveLeft"
            @click="move('left')"
            ><ChevronLeft :size="16" aria-hidden="true" /><span
              v-if="buttonTexts?.[1]"
              >{{ buttonTexts[1] }}</span
            ></HysButton
          >
        </slot>
        <span
          v-if="dragged.length > 1"
          class="hys-ui-transfer-drag-count"
          aria-hidden="true"
          >{{ dragged.length }}</span
        >
      </div>
      <HysTransferPanel
        :ref="(value) => setPanelRef(panel.side, value)"
        :id="id + '-' + panel.side"
        :side="panel.side"
        :title="panel.title"
        :items="visible[panel.side]"
        :total="all[panel.side].length"
        :filtered="filtered[panel.side].length"
        :checked-keys="getCheckedKeys(panel.side)"
        :busy="busy"
        :loading="loading"
        :filterable="filterable"
        :query="searchValues[panel.side]"
        :placeholder="placeholder(panel.side)"
        :show-select-all="showSelectAll"
        :show-invert="!!showInvert"
        :one-way="!!oneWay"
        :size="control.size.value"
        :list-height="listHeight"
        :item-height="itemHeight"
        :overscan="overscan"
        :virtual="!!virtual"
        :draggable="draggable"
        :move-on-double-click="moveOnDoubleClick"
        :dragged-keys="dragged"
        :drop-target="dropTarget === panel.side"
        :words="words"
        :page="pages[panel.side]"
        :page-size="pageSizes[panel.side]"
        :pagination="props.pagination ? pagination : false"
        :list-style="listStyle"
        :format="format"
        :render-content="renderContent"
        @check="check"
        @range-check="
          (values) =>
            store.setCheckedKeys([...new Set([...checked, ...values])])
        "
        @move-item="
          (value) => move(panel.side === 'left' ? 'right' : 'left', [value])
        "
        @check-all="checkAll(panel.side, $event)"
        @invert="invertSelection(panel.side)"
        @search="setSearch(panel.side, $event)"
        @remove="move('left', [$event])"
        @page="setPage(panel.side, $event)"
        @page-size="setPageSize(panel.side, $event)"
        @drag-start="(event, key) => dragStart(event, panel.side, key)"
        @drag-end="dragEnd"
        @drag-over="dragOver($event, panel.side)"
        @drag-leave="dragLeave"
        @drop="drop($event, panel.side)"
        @scroll="emit('scroll', panel.side, $event)"
      >
        <template v-if="$slots.option || $slots.default" #option="item"
          ><slot name="option" v-bind="item" :side="panel.side"
            ><slot v-bind="item" :side="panel.side">{{
              item.label
            }}</slot></slot
          ></template
        >
        <template v-if="$slots.header" #header="header"
          ><slot
            name="header"
            v-bind="header"
            v-bind:side="panel.side"
            :check-all="(selected = true) => checkAll(panel.side, selected)"
        /></template>
        <template v-if="$slots.panel" #panel
          ><slot name="panel" v-bind="scope(panel.side)"
        /></template>
        <template v-if="$slots[emptySlot(panel.side)] || $slots.empty" #empty
          ><slot :name="emptySlot(panel.side)" v-bind="scope(panel.side)"
            ><slot name="empty" v-bind="scope(panel.side)" /></slot
        ></template>
        <template v-if="$slots[footerSlot(panel.side)] || $slots.footer" #footer
          ><slot :name="footerSlot(panel.side)" v-bind="scope(panel.side)"
            ><slot name="footer" v-bind="scope(panel.side)" /></slot
        ></template>
        <template v-if="$slots.loading" #loading
          ><slot name="loading" :side="panel.side"
        /></template>
      </HysTransferPanel>
    </template>
    <span class="hys-ui-pf-transfer-status" role="status" aria-live="polite">{{
      dragged.length
        ? transferLabel(words.dragCount, { count: dragged.length })
        : announcement
    }}</span>
  </div>
</template>
<style scoped>
.hys-ui-transfer {
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
  align-items: stretch;
}
.hys-ui-transfer .hys-ui-v4-move {
  min-width: 32px;
  max-width: 130px;
}
.hys-ui-transfer-move {
  padding: 6px !important;
  min-width: 32px !important;
  gap: 5px;
}
.hys-ui-transfer-move span {
  font-size: 12px;
  white-space: normal;
}
.hys-ui-transfer-drag-count {
  font-size: 11px;
  text-align: center;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-transfer-error :deep(.hys-ui-transfer-pane) {
  border-color: var(--hys-ui-danger, #e43f52);
}
.hys-ui-transfer-warning :deep(.hys-ui-transfer-pane) {
  border-color: var(--hys-ui-warning, #d9860c);
}
.hys-ui-transfer[data-size="sm"] :deep(.hys-ui-transfer-row) {
  font-size: 12px;
}
.hys-ui-transfer[data-size="lg"] :deep(.hys-ui-transfer-row) {
  font-size: 14px;
}
@media (max-width: 420px) {
  .hys-ui-transfer {
    gap: 6px;
  }
  .hys-ui-transfer .hys-ui-v4-move {
    max-width: 68px;
  }
  .hys-ui-transfer-move {
    flex-wrap: wrap;
  }
}
</style>
