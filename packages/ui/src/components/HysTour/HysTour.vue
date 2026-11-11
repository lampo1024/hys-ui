<script setup lang="ts">
import { computed, nextTick, ref, watch, type CSSProperties, type FunctionalComponent } from "vue";
import { X } from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import HysModal from "../HysModal/HysModal.vue";
import type { HysModalInstance } from "../../composables/modal";
import type {
  HysTourButtonProps, HysTourContent, HysTourContext, HysTourProps,
} from "../../composables/tour";
import { useTourLayout } from "../../composables/useTourLayout";

const props = withDefaults(defineProps<HysTourProps>(), {
  open: undefined,
  appendTo: "body",
  placement: "bottom",
  mask: true,
  showArrow: undefined,
  arrow: undefined,
  type: "default",
  scrollIntoViewOptions: true,
  targetAreaClickable: true,
  showClose: true,
  closeOnEscape: true,
  skipText: "跳过",
  prevText: "上一步",
  nextText: "下一步",
  finishText: "完成",
});
const model = defineModel<boolean>({ default: false });
const emit = defineEmits<{
  "update:open": [open: boolean];
  "update:current": [index: number];
  change: [index: number];
  finish: [];
  close: [];
}>();
defineSlots<{
  /** 自定义引导说明，接收当前步骤与导航方法。 */
  default?: (context: HysTourContext) => unknown;
  header?: (context: HysTourContext) => unknown;
  cover?: (context: HysTourContext) => unknown;
  indicators?: (context: HysTourContext) => unknown;
  footer?: (context: HysTourContext) => unknown;
  "close-icon"?: (context: HysTourContext) => unknown;
}>();

const modal = ref<HysModalInstance>();
const shown = computed(() => props.open ?? model.value);
const index = ref(normalize(props.current ?? 0));
let requestedStart: number | undefined;
const step = computed(() => props.steps[index.value]);
const last = computed(() => index.value >= props.steps.length - 1);
const appearance = computed(() => ({
  ...props,
  ...step.value,
  gap: { ...props.gap, ...step.value?.gap },
  contentStyle: { ...props.contentStyle, ...step.value?.contentStyle },
}));
const { bounds, view, card, arrow, path } = useTourLayout(
  computed(() => modal.value?.open === true),
  computed(() => modal.value?.element),
  appearance,
  computed(() => step.value?.target),
);
const showMask = computed(() => appearance.value.mask !== false);
const interactive = computed(() => !!bounds.value && appearance.value.targetAreaClickable !== false);
const maskConfig = computed(() => {
  const mask = appearance.value.mask;
  return typeof mask === "object" ? mask : undefined;
});
const overlayStyle: CSSProperties = {
  background: "transparent",
  backdropFilter: "none",
  pointerEvents: "none",
};
const panelStyle = computed<CSSProperties>(() => ({
  ...appearance.value.contentStyle,
  pointerEvents: "auto",
  ...(card.value
    ? { position: "fixed", left: card.value.x + "px", top: card.value.y + "px" }
    : {}),
  "--hys-ui-tour-arrow-x": (arrow.value?.x ?? 0) + "px",
  "--hys-ui-tour-arrow-y": (arrow.value?.y ?? 0) + "px",
}));
const placement = computed(() => {
  const showArrow = appearance.value.showArrow ?? (appearance.value.arrow !== false);
  if (!card.value || !showArrow) return;
  return card.value.placement;
});
const title = computed(() => typeof step.value?.title === "string" ? step.value.title : "引导");
const customTitle = computed(() => step.value?.title && typeof step.value.title !== "string");
const transition = computed(() => props.popupTransition === "none" ? false :
  props.popupTransition === "slide-fade" ? "slide" : props.popupTransition);

const TourContent: FunctionalComponent<{ value?: HysTourContent }> = ({ value }) =>
  typeof value === "function" ? value() : value;

function normalize(value: number) {
  return Math.max(0, Math.min(props.steps.length - 1, Number.isFinite(value) ? Math.floor(value) : 0));
}
watch(() => props.current, (value) => {
  if (value !== undefined) index.value = normalize(value);
});
watch(shown, (value) => {
  if (value && requestedStart === undefined) index.value = normalize(props.current ?? 0);
}, { flush: "sync" });
watch(() => props.steps.length, () => { index.value = normalize(index.value); });

function setOpen(value: boolean) {
  if (props.open !== undefined) emit("update:open", value);
  else model.value = value;
}
function goTo(value: number) {
  const nextIndex = normalize(value);
  if (index.value === nextIndex) return;
  index.value = nextIndex;
  emit("change", nextIndex);
  emit("update:current", nextIndex);
}
function start(value = props.current ?? 0) {
  const initial = normalize(value);
  if (!shown.value) {
    requestedStart = initial;
    setOpen(true);
    void nextTick(() => {
      if (requestedStart === initial) requestedStart = undefined;
    });
  }
  goTo(initial);
}
function close() {
  if (!shown.value) return;
  setOpen(false);
  step.value?.onClose?.();
  emit("close");
}
function previous() {
  goTo(index.value - 1);
}
function next() {
  if (!last.value) {
    goTo(index.value + 1);
    return;
  }
  emit("finish");
  close();
}
function button(config: HysTourButtonProps | undefined) {
  const { children, onClick, ...buttonProps } = config ?? {};
  return { children, onClick, props: buttonProps };
}
const prevButton = computed(() => button(appearance.value.prevButtonProps));
const nextButton = computed(() => button(appearance.value.nextButtonProps));
function onNavigate(event: MouseEvent, direction: "previous" | "next") {
  const config = direction === "previous" ? prevButton.value : nextButton.value;
  config.onClick?.(event);
  if (!event.defaultPrevented) (direction === "previous" ? previous : next)();
}
const scope = computed<HysTourContext>(() => ({
  step: step.value,
  current: index.value,
  total: props.steps.length,
  goTo,
  previous,
  next,
  close,
}));
defineExpose({ start, close, goTo, previous, next });
</script>

<template>
  <HysModal
    ref="modal"
    :open="shown"
    :title="title"
    :modal="showMask && !interactive"
    modal-penetrable
    :close-on-escape="closeOnEscape"
    :close-on-mask="false"
    :show-close="appearance.showClose !== false"
    :append-to="appendTo"
    :z-index="zIndex"
    :transition="transition"
    :transition-duration="popupTransitionDuration"
    overflow
    :keep-handle-visible="false"
    :width="step?.target ? 'min(380px, calc(100vw - 24px))' : undefined"
    :data-hys-tour-placement="placement"
    :modal-class="'hys-ui-tour-card hys-ui-tour-card-' + (appearance.type ?? 'default')"
    :modal-style="panelStyle"
    :mask-style="overlayStyle"
    @close="close"
  >
    <template v-if="showMask" #backdrop>
      <svg
        v-if="path"
        class="hys-ui-tour-mask"
        :viewBox="`0 0 ${view.width} ${view.height}`"
        preserveAspectRatio="none"
        aria-hidden="true"
        :style="maskConfig?.style"
      >
        <rect
          v-if="!interactive"
          :width="view.width"
          :height="view.height"
          fill="transparent"
          class="hys-ui-tour-mask-hit"
        />
        <path
          :d="path"
          fill-rule="evenodd"
          :fill="maskConfig?.color ?? 'rgba(11, 24, 61, 0.48)'"
          class="hys-ui-tour-mask-hit"
        />
      </svg>
    </template>
    <template v-if="customTitle || $slots.header" #header="{ titleId }">
      <h2 :id="titleId" class="hys-ui-tour-heading">
        <slot name="header" v-bind="scope"><TourContent :value="step?.title" /></slot>
      </h2>
    </template>
    <template #close-icon>
      <slot name="close-icon" v-bind="scope">
        <span v-if="typeof appearance.closeIcon === 'string'">{{ appearance.closeIcon }}</span>
        <component :is="appearance.closeIcon ?? X" v-else :size="18" />
      </slot>
    </template>
    <div v-if="step?.cover || $slots.cover" class="hys-ui-tour-cover">
      <slot name="cover" v-bind="scope"><TourContent :value="step?.cover" /></slot>
    </div>
    <slot v-bind="scope">
      <TourContent v-if="step?.description" :value="step.description" />
      <span v-else-if="!step">暂无引导步骤</span>
    </slot>
    <template #footer>
      <slot name="footer" v-bind="scope">
        <span class="hys-ui-tour-indicators" aria-live="polite">
          <slot name="indicators" v-bind="scope">{{ steps.length ? index + 1 : 0 }} / {{ steps.length }}</slot>
        </span>
        <HysButton size="sm" variant="ghost" @click="close">{{ skipText }}</HysButton>
        <HysButton size="sm" variant="secondary" v-bind="prevButton.props" :disabled="index === 0 || prevButton.props.disabled" @click="onNavigate($event, 'previous')">
          <TourContent :value="prevButton.children ?? prevText" />
        </HysButton>
        <HysButton size="sm" :variant="appearance.type === 'primary' ? 'secondary' : 'primary'" v-bind="nextButton.props" @click="onNavigate($event, 'next')">
          <TourContent :value="nextButton.children ?? (last ? finishText : nextText)" />
        </HysButton>
      </slot>
    </template>
  </HysModal>
</template>

<style>
.hys-ui-tour-mask {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.hys-ui-tour-mask-hit {
  pointer-events: fill;
}
.hys-ui-tour-heading {
  margin: 0;
  font-size: inherit;
}
.hys-ui-tour-cover {
  margin-bottom: 12px;
}
.hys-ui-tour-cover img,
.hys-ui-tour-cover video {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
.hys-ui-tour-indicators {
  margin-inline-end: auto;
}
.hys-ui-tour-card[data-hys-tour-placement]::before {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  background: inherit;
  transform: translate(-50%, -50%) rotate(45deg);
  pointer-events: none;
}
.hys-ui-tour-card[data-hys-tour-placement^="bottom"]::before {
  left: var(--hys-ui-tour-arrow-x);
  top: 0;
}
.hys-ui-tour-card[data-hys-tour-placement^="top"]::before {
  left: var(--hys-ui-tour-arrow-x);
  top: 100%;
}
.hys-ui-tour-card[data-hys-tour-placement^="right"]::before {
  left: 0;
  top: var(--hys-ui-tour-arrow-y);
}
.hys-ui-tour-card[data-hys-tour-placement^="left"]::before {
  left: 100%;
  top: var(--hys-ui-tour-arrow-y);
}
.hys-ui-tour-card-primary {
  --hys-ui-surface: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  --hys-ui-text: var(--hys-ui-tour-primary-text, #fff);
  --hys-ui-muted: var(--hys-ui-tour-primary-text, #fff);
  --hys-ui-border: color-mix(in srgb, currentColor 28%, transparent);
}
.hys-ui-tour-card-primary .hys-ui-button-ghost {
  color: var(--hys-ui-tour-primary-text, #fff);
}
</style>
