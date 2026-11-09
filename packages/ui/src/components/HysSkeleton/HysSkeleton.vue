<script setup lang="ts">
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
  type CSSProperties,
} from "vue";
import { Image as ImageIcon } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import { useMotion } from "../../motion/useMotion";
export type HysSkeletonVariant =
  "paragraph" | "text" | "circle" | "rect" | "image" | "button" | "input";
const props = withDefaults(
  defineProps<{
    lines?: number;
    loading?: boolean;
    active?: boolean;
    avatar?: boolean;
    avatarSize?: number;
    avatarShape?: "circle" | "square";
    title?: boolean;
    titleWidth?: number | string;
    widths?: readonly (number | string)[];
    round?: boolean;
    count?: number;
    variant?: HysSkeletonVariant;
    width?: number | string;
    height?: number | string;
    delay?: number;
    minDuration?: number;
    loadingText?: string;
  }>(),
  {
    lines: 3,
    loading: true,
    active: true,
    avatarSize: 40,
    avatarShape: "circle",
    title: true,
    titleWidth: "40%",
    count: 1,
    variant: "paragraph",
    delay: 0,
    minDuration: 0,
    loadingText: "加载中",
  },
);
const emit = defineEmits<{ visibilityChange: [visible: boolean] }>();
const attrs = useHysRootAttrs(),
  { effectiveMotion } = useMotion();
const shown = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined,
  live = true,
  started = 0;
const bounded = (n: number | undefined, fallback: number, max: number) =>
  Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n!))) : fallback;
const count = computed(() => bounded(props.count, 1, 100)),
  lines = computed(() => bounded(props.lines, 3, 100));
const length = (v: number | string | undefined) =>
  typeof v === "number" ? Math.max(0, v) + "px" : v;
const variantStyle = computed<CSSProperties>(() => ({
  width: length(props.width),
  height: length(props.height),
}));
const animated = computed(
  () => props.active && effectiveMotion.value !== "off",
);
function setShown(value: boolean) {
  if (!live || value === shown.value) return;
  shown.value = value;
  if (value) started = Date.now();
  emit("visibilityChange", value);
}
function clear() {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
}
function sync() {
  clear();
  if (!live) return;
  if (props.loading) {
    if (shown.value) return;
    const delay = bounded(props.delay, 0, 60000);
    if (delay)
      timer = setTimeout(() => {
        timer = undefined;
        setShown(true);
      }, delay);
    else setShown(true);
  } else if (shown.value) {
    const wait = bounded(props.minDuration, 0, 60000) - (Date.now() - started);
    if (wait > 0)
      timer = setTimeout(() => {
        timer = undefined;
        setShown(false);
      }, wait);
    else setShown(false);
  }
}
watch(() => [props.loading, props.delay, props.minDuration], sync, {
  immediate: true,
  flush: "sync",
});
function lineWidth(index: number) {
  return length(
    props.widths?.[index] ?? (index === lines.value - 1 ? "65%" : "100%"),
  );
}
onDeactivated(() => {
  live = false;
  clear();
});
onActivated(() => {
  live = true;
  sync();
});
onBeforeUnmount(() => {
  live = false;
  clear();
});
</script>
<template>
  <div
    v-bind="attrs"
    class="hys-ui-skeleton-root"
    :aria-busy="loading || shown"
    :class="{
      'hys-ui-skeleton-static': !animated,
      'hys-ui-skeleton-round': round,
    }"
  >
    <div
      v-if="shown"
      role="status"
      :aria-label="loadingText"
      class="hys-ui-skeleton-list"
    >
      <div
        v-for="index in count"
        :key="index"
        class="hys-ui-skeleton-item"
        aria-hidden="true"
      >
        <slot name="template" :index="index - 1" :active="animated">
          <div v-if="variant === 'paragraph'" class="hys-ui-skeleton-group">
            <div
              v-if="avatar"
              class="hys-ui-skeleton hys-ui-skeleton-avatar"
              :style="{
                width: length(avatarSize),
                height: length(avatarSize),
                borderRadius: avatarShape === 'circle' ? '50%' : '6px',
              }"
            />
            <div class="hys-ui-skeleton-paragraph">
              <div
                v-if="title"
                class="hys-ui-skeleton hys-ui-skeleton-title"
                :style="{ width: length(titleWidth) }"
              />
              <div
                v-for="line in lines"
                :key="line"
                class="hys-ui-skeleton"
                :style="{ width: lineWidth(line - 1) }"
              />
            </div>
          </div>
          <div
            v-else
            class="hys-ui-skeleton"
            :class="'hys-ui-skeleton-' + variant"
            :style="variantStyle"
          >
            <ImageIcon
              v-if="variant === 'image'"
              :size="32"
              :stroke-width="1.25"
            />
          </div>
        </slot>
      </div>
    </div>
    <slot v-else />
  </div>
</template>
<style scoped>
.hys-ui-skeleton-root {
  min-width: 0;
}
.hys-ui-skeleton-list {
  display: grid;
  gap: 20px;
}
.hys-ui-skeleton-item {
  min-width: 0;
}
.hys-ui-skeleton-group {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.hys-ui-skeleton-avatar {
  flex: none;
}
.hys-ui-skeleton-paragraph {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 10px;
}
.hys-ui-skeleton-title {
  height: 20px;
  margin-bottom: 4px;
}
.hys-ui-skeleton {
  max-width: 100%;
  box-sizing: border-box;
}
.hys-ui-skeleton-static :deep(.hys-ui-skeleton) {
  animation: none;
}
.hys-ui-skeleton-round :deep(.hys-ui-skeleton) {
  border-radius: 99px;
}
.hys-ui-skeleton-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.hys-ui-skeleton-rect {
  width: 100%;
  height: 100px;
}
.hys-ui-skeleton-image {
  display: grid;
  place-items: center;
  width: 100%;
  height: 160px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted, #8c97ab));
}
.hys-ui-skeleton-text {
  height: 17px;
}
.hys-ui-skeleton-button {
  display: inline-block;
  width: 88px;
  height: 36px;
}
.hys-ui-skeleton-input {
  width: 100%;
  height: 40px;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-skeleton-root :deep(.hys-ui-skeleton) {
    animation: none;
  }
}
</style>
