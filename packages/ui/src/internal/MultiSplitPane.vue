<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useId, watch } from "vue";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-vue-next";
import { useHysRootAttrs } from "../config";
import type {
  HysSplitPaneHandleContext, HysSplitPaneLength, HysSplitPanePanel, HysSplitPanePanelContext,
  HysSplitPanePanelResize, HysSplitPanePanelResizeEnd, HysSplitPaneSizes,
} from "../components/HysSplitPane/HysSplitPane.vue";
import { fitPaneSizes, paneEpsilon, paneRatio } from "../composables/splitPaneSizes";
import { useSplitPaneDrag } from "../composables/useSplitPaneDrag";
import { readStoredPaneSizes, useSplitPaneStorage } from "../composables/useSplitPaneStorage";

const props = defineProps<{
  panels: readonly HysSplitPanePanel[];
  sizes?: HysSplitPaneSizes;
  vertical: boolean;
  disabled?: boolean;
  lazy?: boolean;
  step: number;
  ariaLabel: string;
  storageKey?: string;
  dividerSize: number;
  doubleClickAction?: "none" | "collapse" | "reset";
}>();
const emit = defineEmits<{
  "update:sizes": [sizes: HysSplitPaneSizes];
  panelResizeStart: [details: HysSplitPanePanelResize];
  panelResize: [details: HysSplitPanePanelResize];
  panelResizeEnd: [details: HysSplitPanePanelResizeEnd];
  panelCollapse: [id: string, collapsed: boolean];
}>();
defineSlots<{
  panel?: (context: HysSplitPanePanelContext) => unknown;
  "panel-collapse"?: (context: HysSplitPanePanelContext & { side: "start" | "end" }) => unknown;
  handle?: (context: HysSplitPaneHandleContext) => unknown;
}>();

const skin = useHysRootAttrs();
const id = useId();
const host = ref<HTMLElement>();
const available = ref(0);
const rtl = ref(false);
const local = ref<HysSplitPaneSizes>();
const activeBar = ref<number>();
useSplitPaneStorage(
  () => props.sizes === undefined && props.storageKey ? props.storageKey + ":panels" : undefined,
  local,
  readStoredPaneSizes,
);
const preview = ref<{ ratio: number; separator: number }>();
const panels = computed(() => {
  const seen = new Set<string>();
  return props.panels.filter((panel) => {
    if (seen.has(panel.id)) return false;
    seen.add(panel.id);
    return true;
  });
});
const ids = computed(() => panels.value.map((panel) => panel.id));
const panelId = (index: number) => `${id}-${index}`;
const barCount = computed(() => Math.max(0, panels.value.length - 1));
const lengths = computed(() => {
  const source = props.sizes ?? local.value;
  return panels.value.map((panel) => source && Object.hasOwn(source, panel.id) ? source[panel.id] : panel.size);
});
const bounds = computed(() => panels.value.map((panel) => {
  const min = Math.min(100, paneRatio(panel.min, available.value) ?? 0);
  return { min, max: Math.max(min, Math.min(100, paneRatio(panel.max, available.value) ?? 100)) };
}));
const ratios = computed(() => fitPaneSizes(panels.value.map((panel, index) => {
  const length = lengths.value[index];
  const preferred = paneRatio(length, available.value);
  if (preferred === 0 && panel.collapsible) return { preferred, min: 0, max: 0 };
  return { ...bounds.value[index], preferred, relative: typeof length === "string" && length.endsWith("%") };
})));
const collapsed = computed(() => panels.value.filter((panel, index) => panel.collapsible && ratios.value[index] <= paneEpsilon).map((panel) => panel.id));
const toPx = (value: number) => value * available.value / 100;
const toLength = (value: number, input: HysSplitPaneLength | undefined): HysSplitPaneLength => {
  if (typeof input === "number") return toPx(value);
  if (input?.endsWith("px")) return `${toPx(value)}px`;
  return `${value}%`;
};
const expanded = new Map<string, HysSplitPaneLength>();
watch(
  () => ids.value.map((key, index) => ({ key, ratio: ratios.value[index], length: lengths.value[index] })),
  (records) => {
    for (const record of records) {
      if (record.ratio > paneEpsilon) {
        expanded.set(record.key, available.value > 0
          ? toLength(record.ratio, record.length)
          : record.length ?? toLength(record.ratio, undefined));
      }
    }
    for (const key of expanded.keys()) {
      if (!ids.value.includes(key)) expanded.delete(key);
    }
  },
  { immediate: true },
);
watch(collapsed, (current, previous) => {
  for (const key of previous) if (!current.includes(key) && ids.value.includes(key)) emit("panelCollapse", key, false);
  for (const key of current) if (!previous.includes(key)) emit("panelCollapse", key, true);
});

function sameSizes(left: readonly number[], right: readonly number[]) {
  return left.length === right.length && left.every((value, index) => Math.abs(value - right[index]) <= paneEpsilon);
}
function publish(next: readonly number[]) {
  if (sameSizes(next, ratios.value)) return;
  const sizes = Object.fromEntries(ids.value.map((key, index) => [key, toLength(next[index], lengths.value[index])]));
  if (props.sizes === undefined) local.value = sizes;
  emit("update:sizes", sizes);
}
function panelSizes(values = ratios.value) {
  return Object.fromEntries(ids.value.map((key, index) => [key, toPx(values[index])]));
}
function detail(separator: number, before: string, after: string, values = ratios.value): HysSplitPanePanelResize {
  return { separator, before, after, sizes: panelSizes(values) };
}
function replacePair(values: readonly number[], index: number, first: number) {
  const next = [...values];
  next[index + 1] = Math.max(0, values[index] + values[index + 1] - first);
  next[index] = first;
  return next;
}
function limits(index: number) {
  const first = ratios.value[index];
  const total = first + ratios.value[index + 1];
  const a = bounds.value[index];
  const b = bounds.value[index + 1];
  const min = Math.max(a.min, total - b.max);
  const max = Math.min(a.max, total - b.min);
  if (min > max) return { min: first, max: first };
  return { min, max };
}
function isResizable(index: number) {
  if (props.disabled || panels.value[index]?.resizable === false || panels.value[index + 1]?.resizable === false) return false;
  const { min, max } = limits(index);
  return max - min > paneEpsilon;
}

function toggleValue(index: number, separator: number) {
  if (props.disabled || !panels.value[index]?.collapsible) return;
  if (separator < 0 || separator >= barCount.value || (separator !== index && separator !== index - 1)) return;
  const other = separator === index ? index + 1 : index - 1;
  const current = ratios.value[index];
  const total = current + ratios.value[other];
  if (current > paneEpsilon) return total <= bounds.value[other].max + paneEpsilon ? 0 : undefined;
  const minimum = Math.max(bounds.value[index].min, total - bounds.value[other].max);
  const maximum = Math.min(bounds.value[index].max, total - bounds.value[other].min);
  if (maximum < minimum || maximum <= paneEpsilon) return;
  const previous = paneRatio(expanded.get(ids.value[index]) ?? panels.value[index].size, available.value) || total / 2;
  return Math.min(maximum, Math.max(minimum, previous));
}
async function togglePane(key: string, separator?: number) {
  if (available.value <= 0) return false;
  const index = ids.value.indexOf(key);
  const bars = separator === undefined ? [index, index - 1] : [separator];
  for (const bar of bars) {
    const value = toggleValue(index, bar);
    if (value === undefined) continue;
    const wasCollapsed = ratios.value[index] <= paneEpsilon;
    const total = ratios.value[bar] + ratios.value[bar + 1];
    drag.finish(true);
    publish(replacePair(ratios.value, bar, index === bar ? value : total - value));
    await nextTick();
    const currentIndex = ids.value.indexOf(key);
    return currentIndex >= 0 && wasCollapsed !== (ratios.value[currentIndex] <= paneEpsilon);
  }
  return false;
}
async function resetSizes() {
  if (props.disabled) return false;
  drag.finish(true);
  if (props.sizes === undefined) local.value = undefined;
  emit("update:sizes", {});
  await nextTick();
  return panels.value.every((panel, index) => panel.size === lengths.value[index]);
}
async function resizePane(key: string, length: HysSplitPaneLength, separator?: number) {
  if (available.value <= 0) return false;
  const index = ids.value.indexOf(key);
  const wanted = paneRatio(length, available.value);
  if (index < 0 || wanted === undefined) return false;
  const current = ratios.value[index];
  if (wanted === 0 && panels.value[index].collapsible) {
    return current > paneEpsilon ? togglePane(key, separator) : false;
  }
  const bars = separator === undefined ? [index, index - 1] : [separator];
  let nearest: { bar: number; first: number; distance: number } | undefined;
  for (const bar of bars) {
    if (bar < 0 || bar >= barCount.value || (bar !== index && bar !== index - 1) || !isResizable(bar)) continue;
    const total = ratios.value[bar] + ratios.value[bar + 1];
    const target = bar === index ? wanted : total - wanted;
    const { min, max } = limits(bar);
    const first = Math.min(max, Math.max(min, target));
    const distance = Math.abs(first - target);
    if (!nearest || distance < nearest.distance) nearest = { bar, first, distance };
  }
  if (!nearest) return false;
  drag.finish(true);
  publish(replacePair(ratios.value, nearest.bar, nearest.first));
  await nextTick();
  const currentIndex = ids.value.indexOf(key);
  return currentIndex >= 0 && Math.abs(ratios.value[currentIndex] - current) > paneEpsilon;
}
function toggleIndex(separator: number) {
  const candidates = [separator, separator + 1].filter((index) => toggleValue(index, separator) !== undefined);
  return candidates.find((index) => ratios.value[index] <= paneEpsilon) ?? candidates[0];
}
function toggleAdjacent(separator: number) {
  const index = toggleIndex(separator);
  if (index !== undefined) return togglePane(ids.value[index], separator);
}
function doubleClick(separator: number) {
  if (props.doubleClickAction === "reset") void resetSizes();
  else if (props.doubleClickAction === "collapse") void toggleAdjacent(separator);
}
function getPaneElement(key: string) {
  const index = ids.value.indexOf(key);
  return index >= 0 ? host.value?.ownerDocument.getElementById(panelId(index)) ?? undefined : undefined;
}
const slotsByPanel = computed(() => panels.value.map((panel, index): HysSplitPanePanelContext => ({
  panel,
  index,
  size: toPx(ratios.value[index]),
  collapsed: ratios.value[index] <= paneEpsilon,
  toggle: () => togglePane(panel.id),
})));

let observer: ResizeObserver | undefined;
function measure() {
  const element = host.value;
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const bar = element.querySelector<HTMLElement>(":scope > .hys-ui-splitter-bar");
  const axis = props.vertical ? element.clientHeight || rect.height : element.clientWidth || rect.width;
  const divider = (props.vertical ? bar?.offsetHeight : bar?.offsetWidth) || props.dividerSize;
  available.value = Math.max(0, axis - divider * barCount.value);
  rtl.value = getComputedStyle(element).direction === "rtl";
}
function observe() {
  if (observer || !host.value) return;
  measure();
  if (typeof ResizeObserver !== "function") return;
  observer = new ResizeObserver(measure);
  observer.observe(host.value);
}
function stop() {
  drag.finish(true, false);
  observer?.disconnect();
  observer = undefined;
}
const prevIcon = computed(() => props.vertical ? ChevronUp : rtl.value ? ChevronRight : ChevronLeft);
const nextIcon = computed(() => props.vertical ? ChevronDown : rtl.value ? ChevronLeft : ChevronRight);

let gesture: { separator: number; before: string; after: string; initial: number[]; requested?: number[] } | undefined;
const drag = useSplitPaneDrag(
  (value) => {
    if (!gesture) return;
    const { separator, before, after, initial } = gesture;
    const next = replacePair(initial, separator, value);
    if (props.lazy) preview.value = { separator, ratio: next.slice(0, separator + 1).reduce((sum, part) => sum + part, 0) };
    else {
      gesture.requested = next;
      publish(next);
    }
    emit("panelResize", detail(separator, before, after, next));
  },
  (value, cancelled, notify) => {
    if (!gesture) return;
    const { separator, before, after, initial } = gesture;
    gesture = undefined;
    activeBar.value = undefined;
    preview.value = undefined;
    if (!cancelled && props.lazy) publish(replacePair(initial, separator, value));
    if (notify) void nextTick(() => emit("panelResizeEnd", { ...detail(separator, before, after), cancelled }));
  },
);
function down(event: PointerEvent, index: number) {
  if (drag.active() || event.button !== 0) return;
  measure();
  if (!isResizable(index)) return;
  const initial = ratios.value;
  const { min, max } = limits(index);
  if (!drag.start(event, {
    vertical: props.vertical,
    available: available.value,
    direction: !props.vertical && rtl.value ? -1 : 1,
    initial: initial[index],
    constrain: (value) => Math.min(max, Math.max(min, value)),
  })) return;
  const [before, after] = ids.value.slice(index, index + 2);
  gesture = { separator: index, before, after, initial };
  activeBar.value = index;
  emit("panelResizeStart", detail(index, before, after));
}
function key(event: KeyboardEvent, index: number) {
  if (event.key === "Enter" && !drag.active() && toggleIndex(index) !== undefined) {
    event.preventDefault();
    void toggleAdjacent(index);
    return;
  }
  if (drag.active() || !isResizable(index) || available.value <= 0) return;
  if (!["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const { min, max } = limits(index);
  const step = (Number.isFinite(props.step) && props.step > 0 ? props.step : 2) * (event.shiftKey ? 5 : 1);
  const positive = event.key === "ArrowDown" || event.key === (rtl.value && !props.vertical ? "ArrowLeft" : "ArrowRight");
  const value = event.key === "Home" ? min : event.key === "End" ? max
    : Math.min(max, Math.max(min, ratios.value[index] + (positive ? step : -step)));
  publish(replacePair(ratios.value, index, value));
}

const geometry = computed(() => JSON.stringify(panels.value.map((panel) => [panel.id, panel.min, panel.max, panel.resizable, panel.collapsible])));
watch([geometry, available, rtl, () => props.disabled, () => props.lazy, () => props.vertical], () => drag.finish(true), { flush: "sync" });
watch(ratios, (current, previous) => {
  if (gesture && !sameSizes(current, previous) && !sameSizes(current, gesture.requested ?? gesture.initial)) {
    drag.finish(true);
  }
}, { flush: "post" });
watch([barCount, () => props.vertical, () => props.dividerSize], measure, { flush: "post" });
onMounted(observe);
onActivated(observe);
onDeactivated(stop);
onBeforeUnmount(stop);
defineExpose({ togglePane, getPanelSizes: panelSizes, getPaneElement, resizePane, resetSizes });
</script>

<template>
  <div
    ref="host"
    v-bind="skin"
    class="hys-ui-ent-split hys-ui-multi-split"
    :class="{ 'hys-ui-vertical': vertical }"
    :style="{
      '--hys-ui-splitter-size': dividerSize + 'px',
      '--hys-ui-divider-count': barCount,
      '--hys-ui-split-preview': (preview?.ratio ?? 0) / 100,
      '--hys-ui-preview-bar': (preview?.separator ?? 0) + 0.5,
    }"
  >
    <template v-for="(entry, index) in slotsByPanel" :key="entry.panel.id">
      <div
        :id="panelId(index)"
        class="hys-ui-splitter-pane"
        :data-hys-pane="entry.panel.id"
        :inert="entry.collapsed"
        :style="{ '--hys-ui-split-ratio': ratios[index] / 100 }"
      >
        <slot name="panel" v-bind="entry">{{ entry.panel.label }}</slot>
      </div>
      <div v-if="index < barCount" class="hys-ui-splitter-bar" :data-hys-separator="index">
        <div
          class="hys-ui-ent-split-handle"
          role="separator"
          :tabindex="isResizable(index) ? 0 : -1"
          :aria-label="`${ariaLabel} ${index + 1}`"
          :aria-controls="`${panelId(index)} ${panelId(index + 1)}`"
          :aria-disabled="!isResizable(index) || undefined"
          :aria-orientation="vertical ? 'horizontal' : 'vertical'"
          :aria-valuenow="ratios[index]"
          :aria-valuemin="Math.min(ratios[index], limits(index).min)"
          :aria-valuemax="Math.max(ratios[index], limits(index).max)"
          :aria-keyshortcuts="toggleIndex(index) === undefined ? undefined : 'Enter'"
          :data-resizing="activeBar === index || undefined"
          @pointerdown="down($event, index)"
          @lostpointercapture="drag.cancel"
          @keydown="key($event, index)"
          @dblclick="doubleClick(index)"
        >
          <span class="hys-ui-splitter-grip" aria-hidden="true">
            <slot
              name="handle"
              :separator="index"
              :before="entry.panel.id"
              :after="panels[index + 1].id"
              :vertical="vertical"
              :disabled="!isResizable(index)"
              :resizing="activeBar === index"
            >
              <span class="hys-ui-splitter-dots" />
            </slot>
          </span>
        </div>
        <template v-for="side in [index, index + 1]" :key="side">
          <button
            v-if="panels[side].collapsible"
            class="hys-ui-splitter-toggle"
            :class="side === index ? 'hys-ui-splitter-toggle-first' : 'hys-ui-splitter-toggle-second'"
            type="button"
            :aria-label="(slotsByPanel[side].collapsed ? '展开' : '折叠') + (panels[side].label ?? panels[side].id)"
            :aria-controls="panelId(side)"
            :aria-expanded="!slotsByPanel[side].collapsed"
            :data-collapsed="slotsByPanel[side].collapsed || undefined"
            :disabled="toggleValue(side, index) === undefined"
            @click="togglePane(panels[side].id, index)"
          >
            <slot
              name="panel-collapse"
              v-bind="slotsByPanel[side]"
              :side="side === index ? 'start' : 'end'"
              :toggle="() => togglePane(panels[side].id, index)"
            >
              <component :is="(side === index) !== slotsByPanel[side].collapsed ? prevIcon : nextIcon" :size="13" />
            </slot>
          </button>
        </template>
      </div>
    </template>
    <div v-if="preview" class="hys-ui-splitter-preview" aria-hidden="true" />
  </div>
</template>
