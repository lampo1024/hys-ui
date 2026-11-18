<script lang="ts">
type Key = string | number;
</script>

<script setup lang="ts" generic="T">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, shallowRef, useId, watch, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import { fixedVirtualRange } from "../../composables/fixedVirtualRange";
import { virtualOffsetIndex } from "../../composables/virtualOffsets";
import { virtualAligned, virtualFinite, type HysVirtualTableAlign } from "../../composables/virtualTable";
import HysEmpty from "../HysEmpty/HysEmpty.vue";
import HysScrollbar, { type HysScrollbarPosition } from "../HysScrollbar/HysScrollbar.vue";
import HysSkeleton from "../HysSkeleton/HysSkeleton.vue";

export interface HysVirtualListProps<T> {
  /** 完整列表数据，只有可见区和缓冲区的条目进入 DOM。 */
  items: readonly T[];
  /** 返回唯一稳定的条目键，跟踪更新前后位置。省略时使用索引。 */
  itemKey?: (item: T, index: number) => Key;
  /** 固定条目的像素长度，默认 40。dynamic 时用作估计值。 */
  rowHeight?: number;
  /** 滚动容器高度，默认 320px。 */
  height?: number | string;
  /** 可视区两侧额外渲染的条目数，默认 4。 */
  overscan?: number;
  /** 按内容实际尺寸测量每一项。默认 false。 */
  dynamic?: boolean;
  /** 使用横向滚动，rowHeight 此时表示每项宽度。 */
  horizontal?: boolean;
  /** 当前区域的分组名称，显示在滚动列表上方。 */
  groupBy?: (item: T, index: number) => string;
  /** 启用方向键、Home 和 End 定位，Enter 激活。默认 false。 */
  keyboardNavigation?: boolean;
  /** 恢复时使用的初始滚动偏移量，单位像素。 */
  initialOffset?: number;
  /** 启用触底加载事件，内容未填满视口时也可请求下一批。 */
  hasMore?: boolean;
  /** 距末端多少像素开始请求下一页，默认 40。 */
  loadDistance?: number;
  /** 显示加载骨架。已有内容时保留滚动视口。 */
  loading?: boolean;
  /** 列表的辅助技术名称。 */
  ariaLabel?: string;
}
const props = withDefaults(defineProps<HysVirtualListProps<T>>(), { rowHeight: 40, height: 320, overscan: 4, loadDistance: 40, ariaLabel: "虚拟列表" });
const emit = defineEmits<{
  /** 滚动时发出主轴位置，纵向为滚动高度，横向为滚动宽度。 */
  scroll: [offset: number];
  /** 到达加载距离时发出，每个列表长度最多请求一次。 */
  loadMore: [];
  /** 按下 Enter 激活当前条目时发出。 */
  activate: [item: T, index: number];
}>();
defineSlots<{
  /** 渲染一项。dynamic 模式测量其自然尺寸。 */
  item: (scope: { item: T; index: number }) => VNodeChild;
  /** 替换加载占位。 */
  loading?: () => VNodeChild;
  /** 替换空数据占位。 */
  empty?: () => VNodeChild;
  /** 替换固定的当前分组标题。 */
  group?: (scope: { label: string }) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const scroll = ref<InstanceType<typeof HysScrollbar>>();
const space = ref<HTMLElement>();
const id = useId();
const selected = ref(-1);
const active = ref(false);
const viewport = computed(() => scroll.value?.viewport);
const top = ref(0);
const client = ref(0);
const pixels = computed(() => virtualFinite(props.rowHeight, 40, 1, 4096));
const over = computed(() => Math.floor(virtualFinite(props.overscan, 4, 0, 100)));
const keys = computed(() => props.items.map((item, i) => props.itemKey?.(item, i) ?? i));
const extent = computed(() => client.value || (!props.horizontal && typeof props.height === "number" ? props.height : 320));
const sizes = shallowRef(new Map<Key, number>());
const offsets = computed(() => {
  if (!props.dynamic) return undefined;
  const boundaries = [0];
  for (const key of keys.value) boundaries.push(boundaries.at(-1)! + (sizes.value.get(key) ?? pixels.value));
  return boundaries;
});
const total = computed(() => offsets.value?.at(-1) ?? props.items.length * pixels.value);
const byIndex = (index: number) => offsets.value?.[index] ?? index * pixels.value;
function indexAt(point: number, points = offsets.value) {
  return points ? virtualOffsetIndex(points, point) : Math.min(props.items.length - 1, Math.floor(point / pixels.value));
}
const range = computed(() => {
  if (!offsets.value || !props.items.length)
    return fixedVirtualRange(props.items.length, pixels.value, top.value, extent.value, over.value);
  const visibleStart = indexAt(top.value);
  return { start: Math.max(0, visibleStart - over.value), end: Math.min(props.items.length - 1, indexAt(top.value + extent.value) + over.value), visibleStart };
});
const rendered = computed(() => props.items.slice(range.value.start, range.value.end + 1).map((item, local) => ({
  item, index: range.value.start + local,
})));
const group = computed(() => {
  const index = range.value.visibleStart;
  return props.items.length ? props.groupBy?.(props.items[index], index) : undefined;
});
function seek(value: number) {
  const next = Math.max(0, Math.min(value, Math.max(0, total.value - extent.value)));
  top.value = next;
  if (props.horizontal) scroll.value?.setScrollLeft(next);
  else scroll.value?.setScrollTop(next);
}
let loadedThrough = -1;
function didScroll({ scrollLeft, scrollTop }: HysScrollbarPosition) {
  top.value = props.horizontal ? scrollLeft : scrollTop;
  emit("scroll", top.value);
}
function requestMore() {
  if (!active.value || !viewport.value || !client.value || !props.hasMore || props.loading ||
    loadedThrough === props.items.length) return;
  if (total.value - extent.value - top.value <= virtualFinite(props.loadDistance, 40, 0, Infinity)) {
    loadedThrough = props.items.length;
    emit("loadMore");
  }
}
let observer: ResizeObserver | undefined;
let rowObserver: ResizeObserver | undefined;
let restored = false;
const measured = new Set<HTMLElement>();
function observeRows() {
  if (!rowObserver) return;
  const nodes = new Set(space.value?.querySelectorAll<HTMLElement>("[data-virtual-index]"));
  for (const node of measured) if (!nodes.has(node)) rowObserver.unobserve(node);
  for (const node of nodes) if (!measured.has(node)) rowObserver.observe(node);
  measured.clear();
  for (const node of nodes) measured.add(node);
}
function measureRows(entries: ResizeObserverEntry[]) {
  const anchor = indexAt(top.value);
  if (anchor < 0) return;
  const within = top.value - byIndex(anchor);
  const next = new Map(sizes.value);
  let changed = false;
  for (const { target } of entries) {
    const node = target as HTMLElement;
    const key = keys.value[Number(node.dataset.virtualIndex)];
    if (key === undefined || !node.isConnected) continue;
    const size = props.horizontal ? node.offsetWidth : node.offsetHeight;
    if (size < 1 || size === (next.get(key) ?? pixels.value)) continue;
    next.set(key, size);
    changed = true;
  }
  if (!changed) return;
  sizes.value = next;
  void nextTick(() => { if (active.value) seek(byIndex(anchor) + within); });
}
function bind() {
  observer?.disconnect();
  rowObserver?.disconnect();
  rowObserver = undefined;
  measured.clear();
  const node = viewport.value;
  if (!node || !active.value) return;
  const measure = () => { client.value = props.horizontal ? node.clientWidth : node.clientHeight; };
  measure();
  if (!restored) {
    restored = true;
    seek(props.initialOffset ?? 0);
  } else {
    top.value = props.horizontal ? node.scrollLeft : node.scrollTop;
  }
  if (typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver(measure);
  observer.observe(node);
  if (props.dynamic) {
    rowObserver = new ResizeObserver(measureRows);
    observeRows();
  }
}
function start() { active.value = true; bind(); }
function stop() { active.value = false; observer?.disconnect(); rowObserver?.disconnect(); measured.clear(); }
onMounted(start);
onActivated(start);
onDeactivated(stop);
onBeforeUnmount(stop);
watch([viewport, () => props.dynamic, () => props.horizontal], bind, { flush: "post" });
watch(rendered, observeRows, { flush: "post" });
watch(() => props.hasMore, (hasMore) => { if (!hasMore) loadedThrough = -1; });
watch(
  [active, viewport, client, top, total, () => props.items.length, () => props.hasMore, () => props.loading, () => props.loadDistance],
  requestMore,
  { flush: "post" },
);
watch(() => props.horizontal, () => { sizes.value = new Map(); });
watch(keys, (next, previous) => {
  const oldOffsets = props.dynamic ? [0] : undefined;
  if (oldOffsets) for (const key of previous) oldOffsets.push(oldOffsets.at(-1)! + (sizes.value.get(key) ?? pixels.value));
  const previousTop = top.value;
  const at = oldOffsets ? virtualOffsetIndex(oldOffsets, previousTop) : Math.floor(previousTop / pixels.value);
  const nextIndex = props.itemKey && at < previous.length ? next.indexOf(previous[at]) : -1;
  const within = previousTop - (oldOffsets?.[at] ?? at * pixels.value);
  if (next.length < previous.length) loadedThrough = -1;
  const retained = new Set(next);
  sizes.value = new Map([...sizes.value].filter(([key]) => retained.has(key)));
  if (selected.value >= 0) {
    selected.value = props.itemKey
      ? next.indexOf(previous[selected.value])
      : Math.min(selected.value, next.length - 1);
  }
  void nextTick(() => {
    if (active.value) seek(nextIndex < 0 ? previousTop : byIndex(nextIndex) + within);
  });
});
/** 滚动到索引，从 0 开始；超出范围时返回 false。 */
function scrollToIndex(index: number, align: HysVirtualTableAlign = "nearest") {
  if (!Number.isInteger(index) || index < 0 || index >= props.items.length) return false;
  const start = byIndex(index);
  seek(virtualAligned(start, byIndex(index + 1) - start, top.value, extent.value, align));
  return true;
}
/** 滚动到给定的条目键。 */
function scrollToKey(key: Key, align: HysVirtualTableAlign = "nearest") { return scrollToIndex(keys.value.indexOf(key), align); }
/** 读取当前位置，可用于下次挂载时恢复。 */
function getOffset() { return top.value; }
function keyboard(event: KeyboardEvent) {
  if (!props.keyboardNavigation || event.target !== viewport.value || !props.items.length) return;
  const previous = props.horizontal ? "ArrowLeft" : "ArrowUp";
  const next = props.horizontal ? "ArrowRight" : "ArrowDown";
  const base = selected.value < 0 ? range.value.visibleStart : selected.value;
  switch (event.key) {
    case previous: selected.value = Math.max(0, selected.value < 0 ? base : base - 1); break;
    case next: selected.value = Math.min(props.items.length - 1, selected.value < 0 ? base : base + 1); break;
    case "Home": selected.value = 0; break;
    case "End": selected.value = props.items.length - 1; break;
    case "Enter": selected.value = base; emit("activate", props.items[base], base); break;
    default: return;
  }
  event.preventDefault();
  scrollToIndex(selected.value);
}
defineExpose({ scrollToIndex, scrollToKey, getOffset });
</script>

<template>
  <div v-bind="skin" class="hys-virtual-list" :class="{ horizontal }" :aria-busy="loading || undefined" @keydown="keyboard">
    <slot v-if="loading && !items.length" name="loading"><HysSkeleton :lines="4" /></slot>
    <slot v-else-if="!items.length" name="empty"><HysEmpty description="暂无列表数据" /></slot>
    <template v-else>
      <div v-if="group" class="virtual-group"><slot name="group" :label="group">{{ group }}</slot></div>
      <HysScrollbar ref="scroll" :height="height" :direction="horizontal ? 'horizontal' : 'vertical'"
        :aria-label="ariaLabel" :tabindex="0" :wrap-style="{ overflowAnchor: 'none', direction: horizontal ? 'ltr' : undefined }" @scroll="didScroll">
        <div ref="space" role="list" class="space" :style="horizontal ? { width: total + 'px' } : { height: total + 'px' }">
          <div v-for="{ item, index } in rendered" :id="id + '-' + index" :key="keys[index]" role="listitem" class="row"
            :aria-posinset="index + 1" :aria-setsize="items.length" :aria-current="keyboardNavigation && index === selected ? 'true' : undefined"
            :data-keyboard-active="keyboardNavigation && index === selected" :data-virtual-index="index"
            :style="horizontal ? { left: byIndex(index) + 'px', width: dynamic ? undefined : pixels + 'px' } : { top: byIndex(index) + 'px', height: dynamic ? undefined : pixels + 'px' }">
            <slot name="item" :item="item" :index="index" />
          </div>
        </div>
      </HysScrollbar>
    </template>
  </div>
</template>

<style scoped>
.hys-virtual-list { min-width: 0; }
.space { position: relative; }
.horizontal .space { height: 100%; }
.row { position: absolute; inset-inline: 0; min-block-size: 1px; overflow: hidden; box-sizing: border-box; }
.horizontal .row { inset-inline-end: auto; inset-block: 0; width: max-content; max-width: 4096px; }
.row[data-keyboard-active="true"] { outline: 1px solid var(--hys-ui-theme-primary); outline-offset: -1px; }
.virtual-group { padding: 5px 10px; font-size: 12px; font-weight: 600; background: var(--hys-ui-theme-surface-alt); color: var(--hys-ui-theme-muted); }
</style>
