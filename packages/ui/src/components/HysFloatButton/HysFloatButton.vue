<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useId, watch, type Component, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import { resolveScrollTarget, scrollTargetTo, scrollTargetTop } from "../../composables/scrollTarget";
import { useMotion } from "../../motion/useMotion";
import HysButton from "../HysButton/HysButton.vue";
import HysBadge from "../HysBadge/HysBadge.vue";
import { registerFloatButton } from "./floatButtonStack";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import { ArrowUp, Plus } from "../HysIcon/svgIcons";

export interface HysFloatAction {
  key: string | number;
  label: string;
  icon?: Component;
  disabled?: boolean;
}
export interface HysFloatButtonProps {
  /** 主入口的可访问名称与 Tooltip。 */
  label?: string;
  /** 主入口图标，默认加号；返回顶部模式默认向上箭头。 */
  icon?: Component;
  /** 可展开的操作列表。 */
  actions?: readonly HysFloatAction[];
  /** 禁用主入口及所有子操作。 */
  disabled?: boolean;
  /** 主入口执行返回顶部，支持指定滚动容器。 */
  backTop?: boolean;
  /** 返回顶部的滚动容器元素或选择器。 */
  container?: HTMLElement | string;
  /** 固定视口或定位在父容器，默认视口。 */
  contained?: boolean;
  /** 目标角落，默认 bottom-end。 */
  corner?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  /** 与边缘的像素距离，移动端叠加安全区。 */
  offset?: number;
  /** 滚动指定距离后显示，单位像素。省略时始终显示。 */
  showAfter?: number;
  /** 主按钮的徽标文案或数量。 */
  badge?: string | number;
  /** 显示徽标圆点。 */
  badgeDot?: boolean;
  /** 同一边角的组件自动避让，默认 true。 */
  autoStack?: boolean;
  /** 覆盖层级，默认视口为 40、父容器内为 1。 */
  zIndex?: number;
  /** 子操作的展开方向，默认根据所在角落计算。 */
  direction?: "up" | "down";
  /** 受控展开状态。 */
  open?: boolean;
}
const props = withDefaults(defineProps<HysFloatButtonProps>(), { corner: "bottom-end", offset: 18, open: undefined, autoStack: true });
const emit = defineEmits<{
  /** 主入口激活时发出。 */
  click: [event: MouseEvent];
  /** 激活子操作时发出操作键。 */
  action: [key: string | number];
  /** 展开状态变化时发出请求。 */
  "update:open": [open: boolean];
}>();
defineSlots<{
  /** 自定义主按钮内容，建议放置图标。 */
  default?: () => VNodeChild;
}>();
const skin = useHysRootAttrs();
const { effectiveMotion } = useMotion();
const local = ref(false);
const root = ref<HTMLElement>();
const scrollTop = ref(0);
const id = useId();
const edgeOffset = computed(() => Number.isFinite(props.offset) ? Math.max(0, props.offset) : 18);
const blockOffset = ref(edgeOffset.value);
const reservedSpace = ref(0);
const boundary = ref<{ width: number; height: number }>();
const availableOperations = "max(0px, calc(var(--float-height, 100dvh) - var(--float-block-offset) - var(--float-reserved) - 56px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)))";
const visible = computed(() => props.showAfter === undefined || scrollTop.value >= Math.max(0, props.showAfter));
let stopScroll: (() => void) | undefined;
let stopStack: (() => void) | undefined;
let boundaryObserver: ResizeObserver | undefined;
let current = false;
function disconnect() {
  stopScroll?.();
  stopScroll = undefined;
  stopStack?.();
  stopStack = undefined;
  boundaryObserver?.disconnect();
  boundaryObserver = undefined;
}
function connect() {
  disconnect();
  blockOffset.value = edgeOffset.value;
  reservedSpace.value = 0;
  boundary.value = undefined;
  const node = root.value;
  if (!current || !node) return;
  const target = resolveScrollTarget(props.container);
  if (target && props.showAfter !== undefined) {
    const read = () => { scrollTop.value = scrollTargetTop(target); };
    read();
    target.addEventListener("scroll", read, { passive: true });
    stopScroll = () => target.removeEventListener("scroll", read);
  }
  const scope = props.contained ? node.offsetParent ?? node.parentElement : node.ownerDocument;
  if (scope instanceof HTMLElement) {
    const measure = () => {
      boundary.value = { width: scope.clientWidth, height: scope.clientHeight };
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      boundaryObserver = new ResizeObserver(measure);
      boundaryObserver.observe(scope);
    }
  }
  if (props.autoStack && (scope instanceof HTMLElement || scope instanceof Document)) {
    const measureTrigger = () => trigger.value?.element?.offsetHeight || 44;
    stopStack = registerFloatButton(scope, node, props.corner, edgeOffset.value, measureTrigger, (offset, reserve) => {
      blockOffset.value = offset;
      reservedSpace.value = reserve;
    });
  }
}
function resume() { current = true; connect(); }
function stop() { current = false; disconnect(); }
onMounted(resume);
onActivated(resume);
onDeactivated(stop);
onBeforeUnmount(stop);
watch(() => [props.container, props.corner, props.showAfter, props.autoStack, props.contained, edgeOffset.value], connect, { flush: "post" });
const trigger = ref<InstanceType<typeof HysButton>>();
function setOpen(open: boolean, restore = false) {
  local.value = open;
  emit("update:open", open);
  if (restore) void nextTick(() => trigger.value?.focus());
}
function click(event: MouseEvent) {
  if (props.actions?.length) setOpen(!(props.open ?? local.value));
  else if (props.backTop) {
    const target = resolveScrollTarget(props.container);
    if (target) scrollTargetTo(target, 0, effectiveMotion.value !== "off");
  }
  emit("click", event);
}
function action(item: HysFloatAction) {
  if (props.disabled || item.disabled) return;
  emit("action", item.key);
  setOpen(false, true);
}
function escape(event: KeyboardEvent) {
  if (!(props.open ?? local.value)) return;
  event.stopPropagation();
  setOpen(false, true);
}
</script>
<template>
  <Transition name="float-visibility" :css="effectiveMotion !== 'off'">
  <div v-show="visible" :inert="!visible || undefined" ref="root" v-bind="skin" class="hys-float-button" :class="[corner, direction ?? (corner.startsWith('top') ? 'down' : 'up'), { contained }]"
    :style="{
      '--float-inline-offset': edgeOffset + 'px',
      '--float-block-offset': blockOffset + 'px',
      '--float-reserved': reservedSpace + 'px',
      '--float-width': boundary ? boundary.width + 'px' : undefined,
      '--float-height': boundary ? boundary.height + 'px' : undefined,
      zIndex,
    }" @keydown.escape="escape">
    <HysBadge :value="badge" :dot="badgeDot">
    <HysTooltip :text="label ?? (backTop ? '返回顶部' : '快捷操作')">
      <HysButton ref="trigger" :icon="$slots.default ? undefined : (icon ?? (backTop ? ArrowUp : Plus))"
        :aria-label="label ?? (backTop ? '返回顶部' : '快捷操作')" :aria-expanded="actions?.length ? (open ?? local) : undefined"
        :aria-controls="actions?.length && (open ?? local) ? id : undefined"
        :disabled="disabled" size="lg" round @click="click"><slot /></HysButton>
    </HysTooltip>
    </HysBadge>
    <Transition :name="effectiveMotion === 'off' ? undefined : 'float-actions'" :css="effectiveMotion !== 'off'">
    <HysScrollbar v-if="actions?.length && (open ?? local)" class="operations" direction="vertical"
      :max-height="availableOperations" :id="id" view-class="operation-items">
      <HysTooltip v-for="item in actions" :key="item.key" :text="item.label">
        <HysButton :icon="item.icon" variant="secondary" :disabled="disabled || item.disabled" :aria-label="item.label" round @click="action(item)">
          <template v-if="!item.icon">{{ item.label }}</template>
        </HysButton>
      </HysTooltip>
    </HysScrollbar>
    </Transition>
  </div>
  </Transition>
</template>
<style scoped>
.hys-float-button {
  --float-safe-start: env(safe-area-inset-left, 0px);
  --float-safe-end: env(safe-area-inset-right, 0px);
  position: fixed;
  z-index: 40;
  display: grid;
  gap: 8px;
  justify-items: end;
  max-inline-size: max(44px, calc(var(--float-width, 100dvw) - var(--float-inline-offset) - 8px - var(--float-safe-start) - var(--float-safe-end)));
}
.hys-float-button:dir(rtl) {
  --float-safe-start: env(safe-area-inset-right, 0px);
  --float-safe-end: env(safe-area-inset-left, 0px);
}
.hys-float-button.contained { position: absolute; z-index: 1; }
.bottom-start, .bottom-end { inset-block-end: calc(var(--float-block-offset) + env(safe-area-inset-bottom, 0px)); }
.top-start, .top-end { inset-block-start: calc(var(--float-block-offset) + env(safe-area-inset-top, 0px)); }
.bottom-start, .top-start { inset-inline-start: calc(var(--float-inline-offset) + var(--float-safe-start)); justify-items: start; }
.bottom-end, .top-end { inset-inline-end: calc(var(--float-inline-offset) + var(--float-safe-end)); }
.operations { max-inline-size: 100%; justify-items: inherit; }
.operations :deep(.operation-items) { display: grid; gap: 7px; padding: 3px; justify-items: inherit; }
.operations :deep(.hys-ui-btn) { max-inline-size: 100%; overflow-wrap: anywhere; }
.up .operations { order: -1; }
.float-visibility-enter-active, .float-visibility-leave-active { transition: opacity .15s; }
.float-visibility-enter-from, .float-visibility-leave-to { opacity: 0; }
.float-actions-enter-active, .float-actions-leave-active { transition: transform .15s, opacity .15s; }
.float-actions-enter-from, .float-actions-leave-to { transform: translateY(5px); opacity: 0; }
</style>
