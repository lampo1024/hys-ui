<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysCopyButton from "../HysCopyButton/HysCopyButton.vue";
import { highlightText, middleEllipsis } from "./overflowText";

export interface HysOverflowTextProps {
  /** 原始文字，支持换行。 */
  text: string;
  /** 收起时的行数，默认 1，最少 1。 */
  lines?: number;
  /** 最大宽度，支持数值像素或 CSS 长度。 */
  maxWidth?: number | string;
  /** 省略号位置。middle 用于单行文本，多行自动采用末尾省略。 */
  ellipsis?: "end" | "middle";
  /** 高亮关键词，按字面值匹配，忽略大小写。 */
  keywords?: string | readonly string[];
  /** 显示复制全文的操作。默认 false。 */
  copyable?: boolean;
  /** 显示展开/收起操作，默认 false。 */
  expandable?: boolean;
  /** 受控展开状态，配合 v-model:expanded。 */
  expanded?: boolean;
  /** 溢出时显示完整内容，默认 true。 */
  tooltip?: boolean;
  /** 展开按钮文案，默认「展开」。 */
  expandText?: string;
  /** 收起按钮文案，默认「收起」。 */
  collapseText?: string;
}
const props = withDefaults(defineProps<HysOverflowTextProps>(), {
  lines: 1, expanded: undefined, tooltip: true, expandText: "展开", collapseText: "收起",
});
const emit = defineEmits<{
  /** 切换时请求更新展开状态。 */
  "update:expanded": [expanded: boolean];
  /** 测量到文本溢出状态变化时发出。 */
  overflow: [overflowing: boolean];
}>();
defineSlots<{
  /** 替换测量到溢出时的 Tooltip 内容。 */
  tooltip?: (scope: { text: string }) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const local = ref(false);
const overflow = ref(false);
const measureText = ref<HTMLElement>();
const cropped = ref("");
const middle = computed(() => props.ellipsis === "middle" && Math.max(1, Math.trunc(props.lines) || 1) === 1);
const expanded = computed(() => props.expanded ?? local.value);
const flatText = computed(() => props.text.replace(/\r\n?|\n/g, " "));
const displayText = computed(() => !expanded.value && middle.value ? cropped.value || flatText.value : props.text);
const segments = computed(() => highlightText(displayText.value, props.keywords));
let observer: ResizeObserver | undefined;
let fonts: FontFaceSet | undefined;
function measure() {
  const node = measureText.value;
  if (!node?.clientWidth) return;
  const next = node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight;
  if (middle.value && next) {
    const context = node.ownerDocument.createElement("canvas").getContext("2d");
    if (context) {
      const style = getComputedStyle(node);
      context.font = style.font || [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(" ");
      const letterSpacing = parseFloat(style.letterSpacing) || 0;
      cropped.value = middleEllipsis(flatText.value, (text) =>
        context.measureText(text).width + Array.from(text).length * letterSpacing <= node.clientWidth - 1,
      );
    }
  } else {
    cropped.value = "";
  }
  if (next !== overflow.value) {
    overflow.value = next;
    emit("overflow", next);
  }
}
function observe() {
  stopObserving();
  fonts = measureText.value?.ownerDocument.fonts;
  fonts?.addEventListener("loadingdone", measure);
  if (measureText.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(measure);
    observer.observe(measureText.value);
  }
  measure();
}
function toggle() {
  const next = !(props.expanded ?? local.value);
  local.value = next;
  emit("update:expanded", next);
}
function stopObserving() {
  observer?.disconnect();
  fonts?.removeEventListener("loadingdone", measure);
  fonts = undefined;
}
onMounted(observe);
onActivated(observe);
onDeactivated(stopObserving);
onBeforeUnmount(stopObserving);
watch(() => [props.text, props.lines, props.maxWidth, props.ellipsis], () => nextTick(measure));
</script>

<template>
  <div v-bind="skin" class="hys-overflow-text"
    :style="{ maxWidth: typeof maxWidth === 'number' ? maxWidth + 'px' : maxWidth, '--hys-overflow-lines': Math.max(1, Math.trunc(lines) || 1) }">
    <span ref="measureText" aria-hidden="true" class="measure" :class="middle ? 'middle' : 'clamp'">{{ middle ? flatText : text }}</span>
    <HysTooltip :disabled="!tooltip || !overflow || (expanded ?? local)" :text="text" :max-width="'min(24rem, calc(100vw - 20px))'">
      <span class="content" :class="expanded ? undefined : middle ? 'middle' : 'clamp'"
        :tabindex="tooltip && overflow && !expanded ? 0 : undefined">
        <template v-for="(segment, index) in segments" :key="index"><mark v-if="segment.match">{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template>
      </span>
      <template v-if="$slots.tooltip" #content><slot name="tooltip" :text="text" /></template>
    </HysTooltip>
    <div v-if="copyable || (expandable && (overflow || expanded))" class="actions">
      <HysButton v-if="expandable && (overflow || expanded)" variant="text" size="sm"
        :aria-expanded="expanded" @click="toggle">{{ expanded ? collapseText : expandText }}</HysButton>
      <HysCopyButton v-if="copyable" :text="text" label="复制全文" icon-only variant="text" size="sm" />
    </div>
  </div>
</template>

<style scoped>
.hys-overflow-text { position: relative; min-width: 0; color: var(--hys-ui-theme-text); }
.hys-overflow-text > :deep(.hys-ui-tooltip-wrap) { display: block; min-width: 0; }
.content, .measure { display: block; white-space: pre-wrap; overflow-wrap: anywhere; }
.clamp { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: var(--hys-overflow-lines); }
.middle { overflow: hidden; white-space: pre; text-overflow: ellipsis; }
.actions { display: flex; align-items: center; gap: 4px; }
.content mark { color: inherit; background: var(--hys-ui-theme-primary-soft); border-radius: 2px; }
.measure { position: absolute; visibility: hidden; pointer-events: none; inset-inline: 0; }
</style>
