<script setup lang="ts" generic="T extends object, K extends HysTransferKey">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
  type CSSProperties,
  type FunctionalComponent,
  type VNodeChild,
} from "vue";
import { Search, GripVertical, X, LoaderCircle } from "lucide-vue-next";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysPagination from "../HysPagination/HysPagination.vue";
import { useHysRootAttrs } from "../../config";
import {
  transferToken,
  transferLabel,
  type HysTransferKey,
  type HysTransferSide,
  type HysTransferRecord,
  type HysTransferPagination,
  type HysTransferLocale,
  type HysTransferHeaderInfo,
} from "../../composables/transfer";
const props = defineProps<{
  side: HysTransferSide;
  title: string;
  id: string;
  items: readonly HysTransferRecord<T, K>[];
  total: number;
  filtered: number;
  checkedKeys: readonly K[];
  busy: boolean;
  loading?: boolean;
  filterable: boolean;
  query: string;
  placeholder: string;
  showSelectAll: boolean;
  showInvert: boolean;
  oneWay: boolean;
  size: "sm" | "md" | "lg";
  listHeight: number;
  itemHeight: number;
  overscan: number;
  virtual: boolean;
  draggable: boolean;
  moveOnDoubleClick?: boolean;
  draggedKeys: readonly K[];
  dropTarget: boolean;
  words: HysTransferLocale;
  page: number;
  pageSize: number;
  pagination: HysTransferPagination | false;
  listStyle?: CSSProperties;
  format?: (info: HysTransferHeaderInfo) => string;
  renderContent?: (option: T, side: HysTransferSide) => VNodeChild;
}>();
const emit = defineEmits<{
  check: [key: K, checked: boolean];
  rangeCheck: [keys: K[]];
  moveItem: [key: K];
  checkAll: [checked: boolean];
  invert: [];
  search: [value: string];
  remove: [key: K];
  page: [page: number];
  pageSize: [size: number];
  dragStart: [event: DragEvent, key: K];
  dragEnd: [];
  dragOver: [event: DragEvent];
  dragLeave: [event: DragEvent];
  drop: [event: DragEvent];
  scroll: [event: Event];
}>();
const attrs = useHysRootAttrs(),
  viewport = ref<HTMLElement>(),
  searchInput = ref<{ focus: () => void }>(),
  element = ref<HTMLElement>(),
  scrollTop = ref(0),
  actualHeight = ref(0);
let frame = 0,
  live = true;
let savedTop = 0,
  lifetime = 0;
let observer: ResizeObserver | undefined;
function observe() {
  observer?.disconnect();
  observer = undefined;
  if (!live || !props.virtual || !viewport.value) return;
  actualHeight.value = viewport.value.clientHeight;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => {
      if (live && viewport.value)
        actualHeight.value = viewport.value.clientHeight;
    });
    observer.observe(viewport.value);
  }
}
const checked = computed(() => new Set(props.checkedKeys)),
  dragged = computed(() => new Set(props.draggedKeys));
const eligible = computed(() => props.items.filter((item) => !item.disabled)),
  checkable = computed(() => !props.oneWay || props.side === "left");
const selectedCount = computed(
    () => eligible.value.filter((item) => checked.value.has(item.key)).length,
  ),
  allChecked = computed(
    () =>
      !!eligible.value.length && selectedCount.value === eligible.value.length,
  ),
  mixed = computed(() => selectedCount.value > 0 && !allChecked.value);
const info = computed<HysTransferHeaderInfo>(() => ({
  side: props.side,
  total: props.total,
  filtered: props.filtered,
  checked: props.checkedKeys.length,
}));
const height = computed(() =>
    Number.isFinite(props.listHeight)
      ? Math.max(80, Math.min(2000, props.listHeight))
      : 240,
  ),
  rowHeight = computed(() =>
    Number.isFinite(props.itemHeight)
      ? Math.max(24, Math.min(200, props.itemHeight))
      : 36,
  );
const buffer = computed(() =>
  Number.isFinite(props.overscan)
    ? Math.max(0, Math.min(30, Math.floor(props.overscan)))
    : 4,
);
const start = computed(() =>
    props.virtual
      ? Math.max(
          0,
          Math.min(
            Math.max(0, props.items.length - 1),
            Math.floor(scrollTop.value / rowHeight.value) - buffer.value,
          ),
        )
      : 0,
  ),
  end = computed(() =>
    props.virtual
      ? Math.min(
          props.items.length,
          Math.ceil(
            (scrollTop.value + (actualHeight.value || height.value)) /
              rowHeight.value,
          ) + buffer.value,
        )
      : props.items.length,
  );
const rendered = computed(() => props.items.slice(start.value, end.value));
const Content: FunctionalComponent<{ item: T }> = (p) =>
  props.renderContent?.(p.item, props.side) ?? "";
function onScroll(event: Event) {
  if (!live || !viewport.value?.isConnected) return;
  savedTop = viewport.value.scrollTop;
  emit("scroll", event);
  if (!props.virtual || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (live && viewport.value) scrollTop.value = viewport.value.scrollTop;
  });
}
function reset() {
  savedTop = 0;
  scrollTop.value = 0;
  if (viewport.value) viewport.value.scrollTop = 0;
}
watch(() => [props.query, props.page, props.pageSize, props.virtual], reset);
watch(
  () => props.items.length,
  () => {
    if (
      viewport.value &&
      scrollTop.value > props.items.length * rowHeight.value
    ) {
      viewport.value.scrollTop = Math.max(
        0,
        props.items.length * rowHeight.value - height.value,
      );
      scrollTop.value = viewport.value.scrollTop;
    }
  },
);
async function focusIndex(index: number) {
  const item = props.items[index];
  if (!item) return;
  if (props.virtual && viewport.value) {
    const top = index * rowHeight.value;
    if (top < viewport.value.scrollTop) viewport.value.scrollTop = top;
    else if (
      top + rowHeight.value >
      viewport.value.scrollTop + (actualHeight.value || height.value)
    )
      viewport.value.scrollTop =
        top + rowHeight.value - (actualHeight.value || height.value);
    scrollTop.value = viewport.value.scrollTop;
    savedTop = viewport.value.scrollTop;
  }
  await nextTick();
  if (!live) return;
  const row = [
    ...(viewport.value?.querySelectorAll<HTMLElement>("[data-transfer-key]") ??
      []),
  ].find((row) => row.dataset.transferKey === transferToken(item.key));
  row
    ?.querySelector<HTMLElement>("input:not(:disabled),button:not(:disabled)")
    ?.focus({ preventScroll: props.virtual });
}
let selectionAnchor: K | undefined, rangeClick: K | undefined;
function rangeTo(key: K) {
  const end = props.items.findIndex((item) => item.key === key);
  if (end < 0) return;
  const start = props.items.findIndex((item) => item.key === selectionAnchor),
    from = start < 0 ? end : start;
  if (start < 0) selectionAnchor = key;
  emit(
    "rangeCheck",
    props.items
      .slice(Math.min(from, end), Math.max(from, end) + 1)
      .filter((item) => !item.disabled)
      .map((item) => item.key),
  );
}
function itemCheck(key: K, value: boolean) {
  const range = rangeClick === key;
  rangeClick = undefined;
  if (range) {
    rangeTo(key);
    return;
  }
  selectionAnchor = key;
  emit("check", key, value);
}
function rowMouseDown(event: MouseEvent, item: HysTransferRecord<T, K>) {
  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    event.preventDefault();
    return;
  }
  if (
    props.moveOnDoubleClick &&
    !props.busy &&
    !item.disabled &&
    event.button === 0 &&
    event.detail > 1 &&
    !(event.target as HTMLElement).closest(
      'button,a,input,textarea,select,[contenteditable="true"]',
    )
  )
    // Text selection starts on the second press, before dblclick is dispatched.
    event.preventDefault();
}
function rowClick(event: MouseEvent, item: HysTransferRecord<T, K>) {
  if (props.busy || item.disabled || !checkable.value) return;
  const target = event.target as HTMLElement;
  if (
    target.closest(
      'button,a,textarea,select,input:not([type="checkbox"]),[contenteditable="true"]',
    )
  )
    return;
  if (target.matches('input[type="checkbox"]')) {
    if (event.shiftKey) rangeClick = item.key;
    return;
  }
  if (
    props.moveOnDoubleClick &&
    !event.shiftKey &&
    !event.ctrlKey &&
    !event.metaKey
  ) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement)
      .querySelector<HTMLElement>("input:not(:disabled)")
      ?.focus({ preventScroll: true });
    return;
  }
  if (
    event.shiftKey ||
    event.ctrlKey ||
    event.metaKey ||
    !target.closest(".hys-ui-transfer-check")
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey) rangeTo(item.key);
    else itemCheck(item.key, !checked.value.has(item.key));
    (event.currentTarget as HTMLElement)
      .querySelector<HTMLElement>("input:not(:disabled)")
      ?.focus({ preventScroll: true });
  }
}
function doubleClick(event: MouseEvent, item: HysTransferRecord<T, K>) {
  if (
    !props.moveOnDoubleClick ||
    event.shiftKey ||
    event.ctrlKey ||
    event.metaKey ||
    props.busy ||
    item.disabled ||
    (event.target as HTMLElement).closest(
      'button,a,input,textarea,select,[contenteditable="true"]',
    )
  )
    return;
  event.preventDefault();
  event.stopPropagation();
  emit("moveItem", item.key);
}
watch(
  () => [props.query, props.page, props.pageSize],
  () => {
    selectionAnchor = undefined;
    rangeClick = undefined;
  },
);
function keys(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (
    !target.matches('input[type="checkbox"]') &&
    !target.closest(".hys-ui-transfer-remove")
  )
    return;
  if (
    props.busy ||
    !["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)
  )
    return;
  const row = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-transfer-key]",
  );
  if (!row) return;
  const candidates = props.items
    .map((item, index) => ({ item, index }))
    .filter((x) => !x.item.disabled);
  if (!candidates.length) return;
  event.preventDefault();
  const current = candidates.findIndex(
      (x) => transferToken(x.item.key) === row.dataset.transferKey,
    ),
    next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? candidates.length - 1
          : Math.max(
              0,
              Math.min(
                candidates.length - 1,
                current + (event.key === "ArrowDown" ? 1 : -1),
              ),
            );
  if (event.shiftKey && checkable.value) {
    const key = props.items.find(
      (item) => transferToken(item.key) === row.dataset.transferKey,
    )?.key;
    if (selectionAnchor === undefined) selectionAnchor = key;
    rangeTo(candidates[next].item.key);
  }
  void focusIndex(candidates[next].index);
}
function stop() {
  live = false;
  selectionAnchor = undefined;
  rangeClick = undefined;
  lifetime++;
  observer?.disconnect();
  observer = undefined;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}
onDeactivated(stop);
onBeforeUnmount(stop);
onMounted(observe);
watch(() => props.virtual, observe, { flush: "post" });
onActivated(() => {
  live = true;
  const ticket = ++lifetime;
  void nextTick(() => {
    if (!live || ticket !== lifetime || !viewport.value) return;
    viewport.value.scrollTop = savedTop;
    scrollTop.value = viewport.value.scrollTop;
    observe();
  });
});
async function scrollTo(options: {
  key?: K;
  top?: number;
  behavior?: ScrollBehavior;
}) {
  if (!live || !viewport.value) return;
  let top = options.top;
  if (options.key !== undefined) {
    const index = props.items.findIndex((row) => row.key === options.key);
    if (index < 0) return;
    if (props.virtual) top = index * rowHeight.value;
    else {
      await nextTick();
      const row = [
        ...viewport.value.querySelectorAll<HTMLElement>("[data-transfer-key]"),
      ].find((row) => row.dataset.transferKey === transferToken(options.key!));
      if (row) top = row.offsetTop;
    }
  }
  if (top !== undefined && Number.isFinite(top)) {
    viewport.value.scrollTo({ top, behavior: options.behavior ?? "auto" });
    savedTop = viewport.value.scrollTop;
    if (props.virtual) scrollTop.value = viewport.value.scrollTop;
  }
}
function focus() {
  if (props.busy) return;
  if (props.filterable) searchInput.value?.focus();
  else
    element.value
      ?.querySelector<HTMLElement>("input:not(:disabled),button:not(:disabled)")
      ?.focus();
}
function searchKeys(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.isComposing && event.keyCode !== 229)
    event.preventDefault();
}
defineExpose({ scrollTo, focus });
</script>
<template>
  <section
    ref="element"
    v-bind="attrs"
    class="hys-ui-v4-pane hys-ui-transfer-pane hys-ui-scrollbar"
    :class="{ 'hys-ui-is-drop-target': dropTarget }"
    :data-side="side"
    :aria-label="title"
    :aria-busy="loading || undefined"
    @dragover="emit('dragOver', $event)"
    @dragleave="emit('dragLeave', $event)"
    @drop="emit('drop', $event)"
  >
    <header class="hys-ui-pf-transfer-header">
      <slot
        name="header"
        :info="info"
        :all-checked="allChecked"
        :indeterminate="mixed"
      >
        <HysCheckbox
          v-if="showSelectAll && checkable"
          :model-value="allChecked"
          :indeterminate="mixed"
          :size="size"
          :disabled="busy || !eligible.length"
          :aria-label="transferLabel(words.selectAll, { title })"
          @change="emit('checkAll', $event)"
          ><strong :id="id + '-title'">{{ title }}</strong></HysCheckbox
        >
        <strong v-else :id="id + '-title'">{{ title }}</strong>
        <span class="hys-ui-transfer-count">{{
          format
            ? format(info)
            : checkedKeys.length
              ? checkedKeys.length + " / " + total
              : total
        }}</span>
      </slot>
    </header>
    <HysInput
      v-if="filterable"
      ref="searchInput"
      class="hys-ui-pf-transfer-search"
      :model-value="query"
      :size="size"
      :placeholder="placeholder"
      :aria-label="placeholder + ' · ' + title"
      :disabled="busy"
      clearable
      @update:model-value="emit('search', String($event))"
      @keydown="searchKeys"
      ><template #prefix><Search :size="14" aria-hidden="true" /></template
    ></HysInput>
    <div class="hys-ui-transfer-body">
      <div
        ref="viewport"
        class="hys-ui-pf-transfer-list hys-ui-scrollbar"
        :class="{ 'hys-ui-transfer-virtual': virtual }"
        :style="{
          height: height + 'px',
          '--hys-ui-transfer-item-height': rowHeight + 'px',
          ...listStyle,
        }"
        role="group"
        :aria-label="title"
        @scroll.passive="onScroll"
        @keydown="keys"
      >
        <slot name="panel">
          <div
            class="hys-ui-transfer-content"
            :style="
              virtual
                ? {
                    height: items.length * rowHeight + 'px',
                    position: 'relative',
                  }
                : undefined
            "
          >
            <div
              class="hys-ui-transfer-rows"
              :style="
                virtual
                  ? {
                      position: 'absolute',
                      top: start * rowHeight + 'px',
                      left: 0,
                      right: 0,
                    }
                  : undefined
              "
            >
              <div
                v-for="item in rendered"
                :key="transferToken(item.key)"
                class="hys-ui-v4-option hys-ui-transfer-row"
                :class="{
                  'hys-ui-is-checked': checked.has(item.key),
                  'hys-ui-is-disabled': item.disabled,
                  'hys-ui-is-dragging': dragged.has(item.key),
                }"
                :data-transfer-key="transferToken(item.key)"
                :draggable="
                  draggable &&
                  !busy &&
                  !item.disabled &&
                  !(oneWay && side === 'right')
                "
                :title="
                  item.disabled
                    ? undefined
                    : moveOnDoubleClick
                      ? side === 'left'
                        ? words.doubleClickRight
                        : words.doubleClickLeft
                      : side === 'left'
                        ? words.dragRight
                        : words.dragLeft
                "
                @click.capture="rowClick($event, item)"
                @dblclick="doubleClick($event, item)"
                @mousedown="rowMouseDown($event, item)"
                @dragstart="emit('dragStart', $event, item.key)"
                @dragend="emit('dragEnd')"
              >
                <HysCheckbox
                  v-if="checkable"
                  class="hys-ui-transfer-check"
                  :size="size"
                  :model-value="checked.has(item.key)"
                  :disabled="busy || item.disabled"
                  :aria-label="item.label"
                  @change="itemCheck(item.key, $event)"
                  ><span class="hys-ui-transfer-label"
                    ><slot
                      name="option"
                      :option="item.option"
                      :label="item.label"
                      :checked="checked.has(item.key)"
                      :disabled="busy || item.disabled"
                      ><Content
                        v-if="renderContent"
                        :item="item.option"
                      /><template v-else>{{ item.label }}</template></slot
                    ></span
                  ></HysCheckbox
                >
                <span v-else class="hys-ui-transfer-label"
                  ><slot
                    name="option"
                    :option="item.option"
                    :label="item.label"
                    :checked="false"
                    :disabled="busy || item.disabled"
                    ><Content
                      v-if="renderContent"
                      :item="item.option"
                    /><template v-else>{{ item.label }}</template></slot
                  ></span
                >
                <HysButton
                  v-if="oneWay && side === 'right'"
                  variant="ghost"
                  size="sm"
                  class="hys-ui-transfer-remove"
                  :disabled="busy || item.disabled"
                  :aria-label="
                    transferLabel(words.remove, { label: item.label })
                  "
                  @click.stop="emit('remove', item.key)"
                  ><X :size="14" aria-hidden="true"
                /></HysButton>
                <GripVertical
                  v-else-if="draggable && !item.disabled"
                  class="hys-ui-pf-transfer-grip"
                  :size="12"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          <div
            v-if="!items.length && !loading"
            class="hys-ui-pf-transfer-empty"
          >
            <slot name="empty" :query="query">{{
              query
                ? words.noMatch
                : side === "left"
                  ? words.emptyLeft
                  : words.emptyRight
            }}</slot>
          </div>
        </slot>
      </div>
      <div
        v-if="loading"
        class="hys-ui-transfer-loading"
        role="status"
        :aria-label="words.loading"
      >
        <slot name="loading"
          ><LoaderCircle
            :size="18"
            class="hys-ui-icon-spin"
            aria-hidden="true"
          /><span>{{ words.loading }}</span></slot
        >
      </div>
    </div>
    <div v-if="showInvert && checkable" class="hys-ui-transfer-extra">
      <HysButton
        variant="ghost"
        size="sm"
        :disabled="busy || !eligible.length"
        @click="emit('invert')"
        >{{ words.invert }}</HysButton
      ><span v-if="filtered !== total" class="hys-ui-transfer-filter-count"
        >{{ filtered }} / {{ total }}</span
      >
    </div>
    <div v-if="pagination" class="hys-ui-transfer-pagination">
      <HysPagination
        :page="page"
        :page-size="pageSize"
        :total="filtered"
        :disabled="busy"
        :compact="pagination.compact ?? true"
        :show-total="false"
        :show-size-changer="pagination.showSizeChanger"
        :page-size-options="pagination.pageSizeOptions"
        :labels="{
          first: words.firstPage,
          previous: words.previousPage,
          next: words.nextPage,
          last: words.lastPage,
          perPage: words.perPage,
        }"
        @update:page="emit('page', $event)"
        @update:page-size="emit('pageSize', $event)"
      />
    </div>
    <footer v-if="$slots.footer" class="hys-ui-transfer-footer">
      <slot name="footer" :info="info" />
    </footer>
  </section>
</template>
<style scoped>
.hys-ui-transfer-pane {
  display: flex;
  flex-direction: column;
  container: transferpane / inline-size;
}
.hys-ui-pf-transfer-header {
  min-height: 44px;
  box-sizing: border-box;
  flex: none;
}
.hys-ui-pf-transfer-header :deep(.hys-ui-choice-label) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-pf-transfer-header > strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-transfer-count {
  flex: none;
  font-variant-numeric: tabular-nums;
}
.hys-ui-transfer-pane > .hys-ui-pf-transfer-search {
  display: block;
  width: auto;
  padding: 0;
  border: 0;
  flex: none;
  align-items: stretch;
}
.hys-ui-transfer-body {
  position: relative;
  min-height: 0;
  flex: 1;
}
.hys-ui-pf-transfer-list {
  box-sizing: border-box;
  max-height: none;
  overscroll-behavior: contain;
  overflow: auto;
}
.hys-ui-transfer-rows {
  position: relative;
  min-width: 0;
}
.hys-ui-transfer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-width: 0;
}
.hys-ui-transfer-check {
  flex: 1;
  min-width: 0;
  width: 100%;
  overflow: hidden;
}
.hys-ui-transfer-check :deep(.hys-ui-choice-label) {
  min-width: 0;
  flex: 1;
}
.hys-ui-transfer-label {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.hys-ui-transfer-remove {
  flex: none;
  width: 28px;
  min-width: 28px !important;
  height: 28px !important;
  padding: 0 !important;
}
.hys-ui-transfer-virtual .hys-ui-transfer-row {
  height: var(--hys-ui-transfer-item-height);
  min-height: var(--hys-ui-transfer-item-height);
  padding-block: 0;
  margin: 0;
}
.hys-ui-transfer-virtual {
  overflow-anchor: none;
}
.hys-ui-transfer-extra,
.hys-ui-transfer-footer,
.hys-ui-transfer-pagination {
  flex: none;
  padding: 6px 10px;
  border-top: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ee));
}
.hys-ui-transfer-extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.hys-ui-transfer-filter-count {
  font-size: 11px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted, #778397));
}
.hys-ui-transfer-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: color-mix(
    in srgb,
    var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff)) 85%,
    transparent
  );
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted, #778397));
  font-size: 12px;
}
.hys-ui-transfer-pagination :deep(.hys-ui-pf-pagination) {
  padding: 2px 0;
  gap: 6px;
  justify-content: center;
}
.hys-ui-transfer-pagination :deep(.hys-ui-pf-pagination-actions) {
  justify-content: center;
  min-width: 0;
  gap: 8px;
  max-width: 100%;
}
.hys-ui-transfer-pagination :deep(.hys-ui-pf-pagination-controls) {
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px;
}
.hys-ui-transfer-pagination
  :deep(.hys-ui-pf-pagination-controls > button:first-child),
.hys-ui-transfer-pagination
  :deep(.hys-ui-pf-pagination-controls > button:last-child) {
  display: none;
}
.hys-ui-transfer-pagination :deep(.hys-ui-pf-pagination-size) {
  font-size: 11px;
}
@container transferpane (max-width:250px) {
  .hys-ui-pf-transfer-header {
    padding: 9px 7px;
  }
  .hys-ui-transfer-count {
    font-size: 10px;
  }
  .hys-ui-transfer-extra {
    padding: 4px 6px;
  }
  .hys-ui-pf-transfer-search {
    margin: 6px;
  }
  .hys-ui-transfer-pagination {
    padding: 4px;
  }
  .hys-ui-transfer-pagination :deep(.hys-ui-pf-pagination-size) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }
}
</style>
