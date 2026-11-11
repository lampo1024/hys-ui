<script setup lang="ts">
import {
  computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted,
  ref, useId, watch,
} from "vue";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import { useSplitPaneDrag } from "../../composables/useSplitPaneDrag";
import { useSplitPaneStorage } from "../../composables/useSplitPaneStorage";
import MultiSplitPane from "../../internal/MultiSplitPane.vue";

export type HysSplitPaneSide = "first" | "second";
export type HysSplitPaneLength = number | `${number}px` | `${number}%`;
export interface HysSplitPanePanelOptions {
  /** Panel minimum size. Numbers are pixels; strings accept px and %. */
  min?: HysSplitPaneLength;
  /** Panel maximum size. Numbers are pixels; strings accept px and %. */
  max?: HysSplitPaneLength;
  resizable?: boolean;
  collapsible?: boolean;
}
export interface HysSplitPanePanel extends HysSplitPanePanelOptions {
  id: string;
  label?: string;
  /** 初始尺寸。省略时自动分配剩余空间。 */
  size?: HysSplitPaneLength;
}
export type HysSplitPaneSizes = Readonly<Record<string, HysSplitPaneLength | undefined>>;
export interface HysSplitPanePanelResize {
  separator: number;
  before: string;
  after: string;
  /** 每个面板当前或预览的像素尺寸。 */
  sizes: Record<string, number>;
}
export interface HysSplitPanePanelResizeEnd extends HysSplitPanePanelResize {
  cancelled: boolean;
}
export interface HysSplitPaneHandleContext {
  separator: number;
  before: string;
  after: string;
  vertical: boolean;
  disabled: boolean;
  resizing: boolean;
}
export interface HysSplitPaneProps {
  /** 第一块面板占可用空间的百分比，支持 v-model。 */
  modelValue?: number;
  /** 非受控初始比例，数字为百分比。 */
  defaultValue?: number;
  /** 兼容比例下限，firstPanel.min 优先。 */
  min?: number;
  /** 兼容比例上限，firstPanel.max 优先。 */
  max?: number;
  vertical?: boolean;
  /** 布局方向，指定时优先于 vertical。 */
  layout?: "horizontal" | "vertical";
  disabled?: boolean;
  /** 键盘调整的百分比步长。 */
  step?: number;
  /** 拖动时移动预览线，释放后才提交 v-model。 */
  lazy?: boolean;
  firstPanel?: HysSplitPanePanelOptions;
  secondPanel?: HysSplitPanePanelOptions;
  /** 按顺序渲染的面板配置，每项以唯一 id 标识。 */
  panels?: readonly HysSplitPanePanel[];
  /** 多面板受控尺寸，支持 v-model:sizes。 */
  sizes?: HysSplitPaneSizes;
  /** 以浏览器本地存储记住非受控布局。 */
  storageKey?: string;
  /** 分隔条实际占用的宽度或高度，单位为像素。 */
  dividerSize?: number;
  /** 双击分隔条时折叠相邻面板、重置尺寸或保持原状。 */
  doubleClickAction?: "none" | "collapse" | "reset";
  ariaLabel?: string;
  firstLabel?: string;
  secondLabel?: string;
}
export interface HysSplitPaneSlotContext {
  collapsed: boolean;
  toggle: () => Promise<boolean>;
}
export interface HysSplitPanePanelContext extends HysSplitPaneSlotContext {
  panel: HysSplitPanePanel;
  index: number;
  size: number;
}
export interface HysSplitPaneResizeEnd {
  cancelled: boolean;
}
export interface HysSplitPaneInstance {
  togglePanel: (side: HysSplitPaneSide) => Promise<boolean>;
  togglePane: (id: string, separator?: number) => Promise<boolean>;
  resizePane: (id: string, value: HysSplitPaneLength, separator?: number) => Promise<boolean>;
  getPanelSizes: () => Record<string, number>;
  getPaneElement: (id: string) => HTMLElement | undefined;
  resetSizes: () => Promise<boolean>;
}

const props = withDefaults(defineProps<HysSplitPaneProps>(), {
  defaultValue: 40,
  min: 15,
  max: 85,
  step: 2,
  ariaLabel: "调整面板比例",
  firstLabel: "前面板",
  secondLabel: "后面板",
});
const emit = defineEmits<{
  "update:modelValue": [value: number];
  resizeStart: [];
  resize: [value: number];
  resizeEnd: [value: number, details: HysSplitPaneResizeEnd];
  collapse: [side: HysSplitPaneSide, collapsed: boolean];
  "update:sizes": [sizes: HysSplitPaneSizes];
  panelResizeStart: [details: HysSplitPanePanelResize];
  panelResize: [details: HysSplitPanePanelResize];
  panelResizeEnd: [details: HysSplitPanePanelResizeEnd];
  panelCollapse: [id: string, collapsed: boolean];
}>();
defineSlots<{
  first?: (context: HysSplitPaneSlotContext) => unknown;
  second?: (context: HysSplitPaneSlotContext) => unknown;
  "first-collapse"?: (context: HysSplitPaneSlotContext) => unknown;
  "second-collapse"?: (context: HysSplitPaneSlotContext) => unknown;
  panel?: (context: HysSplitPanePanelContext) => unknown;
  "panel-collapse"?: (context: HysSplitPanePanelContext & { side: "start" | "end" }) => unknown;
  /** 自定义抓手图标。分隔条保留键盘和指针行为。 */
  handle?: (context: HysSplitPaneHandleContext) => unknown;
}>();

const skin = useHysRootAttrs();
const id = useId();
const firstId = id + "-first";
const secondId = id + "-second";
const host = ref<HTMLElement>();
const bar = ref<HTMLElement>();
const multi = ref<InstanceType<typeof MultiSplitPane>>();
const available = ref(0);
const rtl = ref(false);
const preview = ref<number>();
const local = ref<number>();
const dragging = ref(false);
const divider = computed(() => Number.isFinite(props.dividerSize)
  ? Math.max(1, Math.min(48, props.dividerSize!)) : 6);
useSplitPaneStorage(
  () => props.panels === undefined && props.modelValue === undefined && props.storageKey
    ? props.storageKey + ":ratio" : undefined,
  local,
  (value) => typeof value === "number" && Number.isFinite(value) ? value : undefined,
);
const vertical = computed(() => props.layout ? props.layout === "vertical" : props.vertical);
const resizable = computed(() => !props.disabled && props.firstPanel?.resizable !== false && props.secondPanel?.resizable !== false);

const percent = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback;
function panelBound(length: HysSplitPaneLength | undefined, fallback: number) {
  if (length === undefined) return fallback;
  const value = typeof length === "number" ? length : Number.parseFloat(length);
  if (typeof length === "string" && length.endsWith("%")) return percent(value, fallback);
  return available.value > 0 ? percent(value / available.value * 100, fallback) : fallback;
}
const lower = computed(() => Math.max(
  panelBound(props.firstPanel?.min, percent(props.min, 0)),
  100 - panelBound(props.secondPanel?.max, 100),
));
const upper = computed(() => Math.max(lower.value, Math.min(
  panelBound(props.firstPanel?.max, percent(props.max, 100)),
  100 - panelBound(props.secondPanel?.min, 0),
)));
function clamp(value: number) {
  return Math.min(upper.value, Math.max(lower.value, Number.isFinite(value) ? value : lower.value));
}
const size = computed(() => {
  const value = props.modelValue ?? local.value ?? props.defaultValue;
  if ((value === 0 && props.firstPanel?.collapsible) || (value === 100 && props.secondPanel?.collapsible)) return value;
  return clamp(value);
});
const collapsed = computed<HysSplitPaneSide | undefined>(() =>
  size.value === 0 ? "first" : size.value === 100 ? "second" : undefined,
);
let expanded = size.value > 0 && size.value < 100 ? size.value : clamp(props.defaultValue);
watch(size, (value) => {
  if (value > 0 && value < 100) expanded = value;
}, { flush: "sync" });
watch(collapsed, (side, previous) => {
  if (props.panels !== undefined) return;
  if (previous) emit("collapse", previous, false);
  if (side) emit("collapse", side, true);
});

function publish(value: number) {
  if (value === size.value) return;
  if (props.modelValue === undefined) local.value = value;
  emit("update:modelValue", value);
}
async function togglePanel(side: HysSplitPaneSide) {
  if (props.panels !== undefined) return false;
  const options = side === "first" ? props.firstPanel : props.secondPanel;
  if (props.disabled || !options?.collapsible) return false;
  const before = collapsed.value;
  const value = before === side ? clamp(expanded) : side === "first" ? 0 : 100;
  drag.finish(true);
  publish(value);
  await nextTick();
  return before !== collapsed.value;
}
const firstScope = computed<HysSplitPaneSlotContext>(() => ({
  collapsed: collapsed.value === "first",
  toggle: () => togglePanel("first"),
}));
const secondScope = computed<HysSplitPaneSlotContext>(() => ({
  collapsed: collapsed.value === "second",
  toggle: () => togglePanel("second"),
}));
const prevIcon = computed(() => vertical.value ? ChevronUp : rtl.value ? ChevronRight : ChevronLeft);
const nextIcon = computed(() => vertical.value ? ChevronDown : rtl.value ? ChevronLeft : ChevronRight);
const handleScope = computed<HysSplitPaneHandleContext>(() => ({
  separator: 0,
  before: "first",
  after: "second",
  vertical: vertical.value,
  disabled: !resizable.value,
  resizing: dragging.value,
}));

async function resetSizes() {
  if (props.disabled) return false;
  if (props.panels !== undefined) return multi.value?.resetSizes() ?? false;
  drag.finish(true);
  const value = props.defaultValue;
  const target = (value === 0 && props.firstPanel?.collapsible) || (value === 100 && props.secondPanel?.collapsible)
    ? value : clamp(value);
  if (props.modelValue === undefined) local.value = undefined;
  if (props.modelValue !== target) emit("update:modelValue", target);
  await nextTick();
  return size.value === target;
}
function toggleAdjacent() {
  const side = collapsed.value;
  if (side && (side === "first" ? props.firstPanel : props.secondPanel)?.collapsible) {
    return togglePanel(side);
  }
  if (props.firstPanel?.collapsible) return togglePanel("first");
  if (props.secondPanel?.collapsible) return togglePanel("second");
}
function doubleClick() {
  if (props.doubleClickAction === "reset") void resetSizes();
  else if (props.doubleClickAction === "collapse") void toggleAdjacent();
}

let resizeObserver: ResizeObserver | undefined;
function measure() {
  if (!host.value || !bar.value) return;
  const element = host.value;
  const rect = element.getBoundingClientRect();
  const outer = vertical.value ? element.clientHeight || rect.height : element.clientWidth || rect.width;
  const thickness = vertical.value ? bar.value.offsetHeight : bar.value.offsetWidth;
  available.value = Math.max(0, outer - (thickness || divider.value));
  rtl.value = getComputedStyle(element).direction === "rtl";
}
function observe() {
  if (resizeObserver || !host.value || !bar.value) return;
  measure();
  if (typeof ResizeObserver !== "function") return;
  resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(host.value);
  resizeObserver.observe(bar.value);
}
const drag = useSplitPaneDrag(
  (value) => {
    if (props.lazy) preview.value = value;
    else publish(value);
    emit("resize", value);
  },
  (value, cancelled, notify) => {
    dragging.value = false;
    if (!cancelled && props.lazy) publish(value);
    preview.value = undefined;
    if (notify) void nextTick(() => emit("resizeEnd", size.value, { cancelled }));
  },
);
function down(event: PointerEvent) {
  if (!resizable.value || drag.active() || event.button !== 0) return;
  measure();
  if (!drag.start(event, {
    vertical: vertical.value,
    direction: !vertical.value && rtl.value ? -1 : 1,
    available: available.value,
    initial: size.value,
    constrain: (value) => clamp(Math.round(value)),
  })) return;
  dragging.value = true;
  if (props.lazy) preview.value = size.value;
  emit("resizeStart");
}
function key(event: KeyboardEvent) {
  if (event.key === "Enter" && !props.disabled && !drag.active() &&
      (props.firstPanel?.collapsible || props.secondPanel?.collapsible)) {
    event.preventDefault();
    void toggleAdjacent();
    return;
  }
  if (!resizable.value || drag.active() || !["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const increment = (Number.isFinite(props.step) && props.step > 0 ? props.step : 2) * (event.shiftKey ? 5 : 1);
  const positive = event.key === "ArrowDown" || event.key === (rtl.value && !vertical.value ? "ArrowLeft" : "ArrowRight");
  const value = event.key === "Home" ? lower.value :
    event.key === "End" ? upper.value : clamp(size.value + (positive ? increment : -increment));
  publish(value);
}
function stop() {
  drag.finish(true, false);
  resizeObserver?.disconnect();
  resizeObserver = undefined;
}
watch(
  [resizable, vertical, lower, upper, available, rtl, () => props.lazy],
  () => drag.finish(true),
  { flush: "sync" },
);
watch([vertical, divider], measure, { flush: "post" });
watch(() => props.panels !== undefined, (hasPanels) => {
  if (hasPanels) stop();
  else observe();
}, { flush: "post" });
onMounted(observe);
onActivated(observe);
onDeactivated(stop);
onBeforeUnmount(stop);
defineExpose({
  togglePanel,
  togglePane: (id: string, separator?: number) => multi.value?.togglePane(id, separator) ?? Promise.resolve(false),
  getPanelSizes: () => multi.value?.getPanelSizes() ?? {},
  getPaneElement: (id: string) => multi.value?.getPaneElement(id),
  resizePane: (id: string, value: HysSplitPaneLength, separator?: number) =>
    multi.value?.resizePane(id, value, separator) ?? Promise.resolve(false),
  resetSizes,
});
</script>

<template>
  <MultiSplitPane
    v-if="panels !== undefined"
    ref="multi"
    :panels="panels"
    :sizes="sizes"
    :vertical="vertical"
    :disabled="disabled"
    :lazy="lazy"
    :step="step"
    :storage-key="storageKey"
    :divider-size="divider"
    :double-click-action="doubleClickAction"
    v-bind="{ ariaLabel }"
    @update:sizes="emit('update:sizes', $event)"
    @panel-resize-start="emit('panelResizeStart', $event)"
    @panel-resize="emit('panelResize', $event)"
    @panel-resize-end="emit('panelResizeEnd', $event)"
    @panel-collapse="(id, collapsed) => emit('panelCollapse', id, collapsed)"
  >
    <template v-if="$slots.panel" #panel="context"><slot name="panel" v-bind="context" /></template>
    <template v-if="$slots['panel-collapse']" #panel-collapse="context">
      <slot name="panel-collapse" v-bind="context" />
    </template>
    <template v-if="$slots.handle" #handle="context"><slot name="handle" v-bind="context" /></template>
  </MultiSplitPane>
  <div
    v-else
    v-bind="skin"
    ref="host"
    class="hys-ui-ent-split"
    :class="{ 'hys-ui-vertical': vertical }"
    :style="{
      '--hys-ui-splitter-size': divider + 'px',
      '--hys-ui-split-ratio': size / 100,
      '--hys-ui-split-preview': (preview ?? 0) / 100,
    }"
  >
    <div :id="firstId" class="hys-ui-ent-split-first" :inert="firstScope.collapsed">
      <slot name="first" v-bind="firstScope" />
    </div>
    <div ref="bar" class="hys-ui-splitter-bar">
      <div
        class="hys-ui-ent-split-handle"
        role="separator"
        :tabindex="resizable ? 0 : -1"
        :aria-label="ariaLabel"
        :aria-controls="`${firstId} ${secondId}`"
        :aria-disabled="!resizable || undefined"
        :aria-orientation="vertical ? 'horizontal' : 'vertical'"
        :aria-valuenow="size"
        :aria-valuemin="firstPanel?.collapsible ? 0 : lower"
        :aria-valuemax="secondPanel?.collapsible ? 100 : upper"
        :data-resizing="dragging || undefined"
        :aria-keyshortcuts="firstPanel?.collapsible || secondPanel?.collapsible ? 'Enter' : undefined"
        @pointerdown="down"
        @lostpointercapture="drag.cancel"
        @keydown="key"
        @dblclick="doubleClick"
      >
        <span class="hys-ui-splitter-grip" aria-hidden="true">
          <slot name="handle" v-bind="handleScope"><span class="hys-ui-splitter-dots" /></slot>
        </span>
      </div>
      <button
        v-if="firstPanel?.collapsible"
        class="hys-ui-splitter-toggle hys-ui-splitter-toggle-first"
        type="button"
        :aria-label="(firstScope.collapsed ? '展开' : '折叠') + firstLabel"
        :aria-controls="firstId"
        :aria-expanded="!firstScope.collapsed"
        :data-collapsed="firstScope.collapsed || undefined"
        :disabled="disabled"
        @click="firstScope.toggle"
      >
        <slot name="first-collapse" v-bind="firstScope"><component :is="firstScope.collapsed ? nextIcon : prevIcon" :size="13" /></slot>
      </button>
      <button
        v-if="secondPanel?.collapsible"
        class="hys-ui-splitter-toggle hys-ui-splitter-toggle-second"
        type="button"
        :aria-label="(secondScope.collapsed ? '展开' : '折叠') + secondLabel"
        :aria-controls="secondId"
        :aria-expanded="!secondScope.collapsed"
        :data-collapsed="secondScope.collapsed || undefined"
        :disabled="disabled"
        @click="secondScope.toggle"
      >
        <slot name="second-collapse" v-bind="secondScope"><component :is="secondScope.collapsed ? prevIcon : nextIcon" :size="13" /></slot>
      </button>
    </div>
    <div :id="secondId" class="hys-ui-ent-split-second" :inert="secondScope.collapsed">
      <slot name="second" v-bind="secondScope" />
    </div>
    <div v-if="preview !== undefined" class="hys-ui-splitter-preview" aria-hidden="true" />
  </div>
</template>

<style>
.hys-ui-ent-split {
  position: relative;
  --hys-ui-splitter-size: 6px;
  --hys-ui-splitter-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  --hys-ui-splitter-surface: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
  --hys-ui-splitter-ink: var(--hys-ui-muted, var(--hys-ui-theme-muted, #64748b));
  --hys-ui-splitter-line: var(--hys-ui-border, var(--hys-ui-theme-border, #ccd4e0));
  --hys-ui-splitter-cursor: col-resize;
  --hys-ui-splitter-active: color-mix(in srgb, var(--hys-ui-splitter-color) 11%, var(--hys-ui-splitter-surface));
  --hys-ui-divider-count: 1;
  --hys-ui-preview-bar: 0.5;
  --hys-ui-splitter-content: calc(100% - var(--hys-ui-splitter-size) * var(--hys-ui-divider-count));
}
.hys-ui-ent-split.hys-ui-vertical {
  --hys-ui-splitter-cursor: row-resize;
}
.hys-ui-ent-split > .hys-ui-ent-split-first,
.hys-ui-multi-split > .hys-ui-splitter-pane {
  flex: 0 0 calc(var(--hys-ui-splitter-content) * var(--hys-ui-split-ratio));
}
.hys-ui-splitter-pane {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
.hys-ui-ent-split-first[inert],
.hys-ui-ent-split-second[inert],
.hys-ui-splitter-pane[inert] {
  visibility: hidden;
}
.hys-ui-splitter-bar {
  position: relative;
  flex: 0 0 var(--hys-ui-splitter-size);
  z-index: 1;
}
.hys-ui-splitter-bar > .hys-ui-ent-split-handle {
  position: absolute;
  inset: 0;
  background: transparent;
  color: var(--hys-ui-splitter-ink);
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
.hys-ui-splitter-bar > .hys-ui-ent-split-handle::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: calc(50% - 0.5px);
  width: 1px;
  background: var(--hys-ui-splitter-line);
  pointer-events: none;
}
.hys-ui-splitter-bar > .hys-ui-ent-split-handle:not([aria-disabled="true"])::after {
  content: "";
  position: absolute;
  inset: 0 -5px;
}
.hys-ui-ent-split.hys-ui-vertical > .hys-ui-splitter-bar > .hys-ui-ent-split-handle::before {
  inset-inline: 0;
  inset-block: calc(50% - 0.5px) auto;
  width: auto;
  height: 1px;
}
.hys-ui-ent-split.hys-ui-vertical > .hys-ui-splitter-bar > .hys-ui-ent-split-handle::after {
  inset: -5px 0;
}
.hys-ui-ent-split > .hys-ui-splitter-bar > .hys-ui-ent-split-handle:not([aria-disabled="true"]) {
  cursor: var(--hys-ui-splitter-cursor);
}
.hys-ui-ent-split > .hys-ui-splitter-bar > .hys-ui-ent-split-handle[aria-disabled="true"] {
  cursor: default;
  touch-action: auto;
}
.hys-ui-splitter-grip {
  position: absolute;
  display: grid;
  place-items: center;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
  box-sizing: border-box;
  width: 13px;
  height: 30px;
  border: 1px solid var(--hys-ui-splitter-line);
  border-radius: 999px;
  background: var(--hys-ui-splitter-surface);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--hys-ui-splitter-ink) 17%, transparent);
  pointer-events: none;
  transition: color 140ms, background-color 140ms, border-color 140ms, box-shadow 140ms;
}
.hys-ui-splitter-grip:dir(rtl),
.hys-ui-splitter-toggle:dir(rtl) {
  translate: 50% -50%;
}
.hys-ui-splitter-dots {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 -4px currentColor, 0 4px currentColor;
}
.hys-ui-ent-split.hys-ui-vertical > .hys-ui-splitter-bar .hys-ui-splitter-grip {
  width: 30px;
  height: 13px;
}
.hys-ui-ent-split.hys-ui-vertical > .hys-ui-splitter-bar .hys-ui-splitter-dots {
  box-shadow: -4px 0 currentColor, 4px 0 currentColor;
}
.hys-ui-ent-split-handle[aria-disabled="true"] > .hys-ui-splitter-grip {
  opacity: 0.4;
  box-shadow: none;
}
.hys-ui-ent-split-handle:not([aria-disabled="true"]):is(:hover, :focus-visible, [data-resizing="true"]) {
  color: var(--hys-ui-splitter-color);
}
.hys-ui-ent-split-handle:not([aria-disabled="true"]):is(:hover, :focus-visible, [data-resizing="true"])::before {
  background: var(--hys-ui-splitter-color);
}
.hys-ui-ent-split-handle:not([aria-disabled="true"]):is(:hover, :focus-visible, [data-resizing="true"]) > .hys-ui-splitter-grip {
  border-color: var(--hys-ui-splitter-color);
  background: var(--hys-ui-splitter-active);
}
.hys-ui-ent-split-handle:focus-visible > .hys-ui-splitter-grip,
.hys-ui-splitter-toggle:focus-visible {
  outline: 2px solid var(--hys-ui-splitter-color);
  outline-offset: 2px;
}
.hys-ui-splitter-toggle {
  --hys-ui-toggle-inline: var(--hys-ui-toggle-distance);
  --hys-ui-toggle-block: 0px;
  position: absolute;
  z-index: 1;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  padding: 0;
  inset-inline-start: calc(50% + var(--hys-ui-toggle-inline));
  inset-block-start: calc(50% + var(--hys-ui-toggle-block));
  translate: -50% -50%;
  border: 1px solid var(--hys-ui-splitter-line);
  border-radius: 50%;
  background: var(--hys-ui-splitter-surface);
  color: var(--hys-ui-splitter-ink);
  cursor: pointer;
  touch-action: manipulation;
  transition: color 140ms, background-color 140ms, border-color 140ms;
}
.hys-ui-splitter-toggle-first { --hys-ui-toggle-distance: -20px; }
.hys-ui-splitter-toggle-second { --hys-ui-toggle-distance: 20px; }
.hys-ui-splitter-toggle[data-collapsed="true"] {
  --hys-ui-toggle-inline: calc(-1 * var(--hys-ui-toggle-distance));
  --hys-ui-toggle-block: -26px;
}
.hys-ui-ent-split.hys-ui-vertical > .hys-ui-splitter-bar > .hys-ui-splitter-toggle {
  --hys-ui-toggle-inline: 0px;
  --hys-ui-toggle-block: var(--hys-ui-toggle-distance);
}
.hys-ui-ent-split.hys-ui-vertical > .hys-ui-splitter-bar > .hys-ui-splitter-toggle[data-collapsed="true"] {
  --hys-ui-toggle-inline: -26px;
  --hys-ui-toggle-block: calc(-1 * var(--hys-ui-toggle-distance));
}
.hys-ui-splitter-toggle:is(:hover, :focus-visible, [data-collapsed="true"]):not(:disabled) {
  background: var(--hys-ui-splitter-active);
  border-color: var(--hys-ui-splitter-color);
  color: var(--hys-ui-splitter-color);
}
.hys-ui-splitter-toggle svg {
  stroke-width: 2.25;
  pointer-events: none;
}
.hys-ui-splitter-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.hys-ui-ent-split > .hys-ui-splitter-preview {
  position: absolute;
  z-index: 2;
  inset-block: 0;
  inset-inline-start: calc(var(--hys-ui-splitter-content) * var(--hys-ui-split-preview) + var(--hys-ui-splitter-size) * var(--hys-ui-preview-bar));
  width: 2px;
  background: var(--hys-ui-splitter-color);
  pointer-events: none;
}
.hys-ui-ent-split.hys-ui-vertical > .hys-ui-splitter-preview {
  inset-inline: 0;
  inset-block: calc(var(--hys-ui-splitter-content) * var(--hys-ui-split-preview) + var(--hys-ui-splitter-size) * var(--hys-ui-preview-bar)) auto;
  width: auto;
  height: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-splitter-grip,
  .hys-ui-splitter-toggle { transition: none; }
}
.hys-ui-ent-split[data-hys-motion="off"] :is(.hys-ui-splitter-grip, .hys-ui-splitter-toggle) {
  transition: none;
}
</style>
