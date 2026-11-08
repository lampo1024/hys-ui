<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  toRaw,
  useAttrs,
  watch,
} from "vue";
import { UserRound } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import {
  avatarGroupKey,
  useAvatarSize,
  type HysAvatarProps,
  type HysAvatarLoadInfo,
} from "../../composables/avatar";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysAvatarProps>(), {
  name: "",
  fit: "cover",
  gap: 4,
  autoFit: true,
  draggable: undefined,
  bordered: undefined,
});
const emit = defineEmits<{
  error: [event: Event, info: HysAvatarLoadInfo];
  load: [event: Event, info: HysAvatarLoadInfo];
}>();
const attrs = useAttrs(),
  hysRootAttrs = useHysRootAttrs(),
  group = inject(avatarGroupKey, undefined),
  root = ref<HTMLElement>(),
  image = ref<HTMLImageElement>(),
  text = ref<HTMLElement>(),
  loaded = ref(false),
  failed = ref(false),
  stage = ref<"primary" | "fallback" | "content">("primary"),
  request = ref(0),
  lastError = ref<Event>();
const source = computed(() => props.src ?? props.imgProps?.src ?? ""),
  sources = computed(
    () => props.srcset ?? props.srcSet ?? props.imgProps?.srcset,
  ),
  pixelSize = useAvatarSize(computed(() => props.size ?? group?.size.value)),
  shape = computed(() => props.shape ?? group?.shape.value ?? "circle"),
  bordered = computed(() => props.bordered ?? group?.bordered.value ?? false);
const activeSource = computed(() =>
    stage.value === "content"
      ? ""
      : stage.value === "fallback"
        ? props.fallbackSrc || ""
        : source.value,
  ),
  imageKey = computed(
    () =>
      request.value + ":" + activeSource.value + ":" + (sources.value || ""),
  ),
  initials = computed(() =>
    Array.from(props.name.trim()).slice(0, 2).join("").toUpperCase(),
  );
const hasImage = computed(
  () =>
    stage.value !== "content" &&
    !!(activeSource.value || (stage.value === "primary" && sources.value)),
);
const imageProps = computed(() => {
  const { onError, onLoad, ...rest } = props.imgProps ?? {};
  return {
    ...rest,
    src: activeSource.value || undefined,
    srcset: stage.value === "fallback" ? undefined : sources.value,
    sizes: props.sizes ?? rest.sizes,
    alt: props.alt ?? rest.alt ?? props.name,
    draggable: props.draggable ?? rest.draggable ?? false,
    crossorigin: props.crossOrigin ?? rest.crossorigin,
    loading: props.lazy ? "lazy" : rest.loading,
    decoding: rest.decoding ?? "async",
    "data-hys-avatar-request": imageKey.value,
    style: [
      rest.style,
      { objectFit: props.fit, opacity: loaded.value ? 1 : 0 },
    ],
  };
});
function onLoad(event: Event) {
  if (
    (event.target as Element).getAttribute("data-hys-avatar-request") !==
    imageKey.value
  )
    return;
  const info = {
    src: activeSource.value || sources.value || "",
    fallback: stage.value === "fallback",
  };
  loaded.value = true;
  props.imgProps?.onLoad?.(event);
  emit("load", event, info);
}
function onError(event: Event) {
  if (
    (event.target as Element).getAttribute("data-hys-avatar-request") !==
    imageKey.value
  )
    return;
  const token = imageKey.value;
  const info = {
    src: activeSource.value || sources.value || "",
    fallback: stage.value === "fallback",
  };
  failed.value = true;
  lastError.value = event;
  props.imgProps?.onError?.(event);
  emit("error", event, info);
  let prevent = false;
  try {
    prevent = props.loadError?.(event) === false;
  } catch {}
  if (imageKey.value !== token) return;
  if (prevent) {
    loaded.value = true;
    return;
  }
  loaded.value = false;
  stage.value =
    stage.value === "primary" &&
    props.fallbackSrc &&
    props.fallbackSrc !== source.value
      ? "fallback"
      : "content";
}
function reset() {
  stage.value = "primary";
  loaded.value = false;
  failed.value = false;
  lastError.value = undefined;
}
function reload() {
  request.value++;
  reset();
}
watch(() => [source.value, sources.value, props.fallbackSrc], reset, {
  flush: "sync",
});
let live = true,
  frame: number | undefined,
  observer: ResizeObserver | undefined;
function fitText() {
  frame = undefined;
  if (!live || !text.value || !root.value) return;
  const available = Math.max(
      1,
      (root.value.clientWidth || pixelSize.value) -
        (Number.isFinite(props.gap) ? Math.max(0, props.gap) : 4) * 2,
    ),
    natural =
      text.value.offsetWidth ||
      text.value.scrollWidth ||
      text.value.getBoundingClientRect().width;
  const scale = props.autoFit && natural ? Math.min(1, available / natural) : 1;
  text.value.style.transform = `scale(${scale})`;
}
function scheduleFit() {
  if (live && text.value && frame === undefined)
    frame = requestAnimationFrame(fitText);
}
function stop() {
  observer?.disconnect();
  observer = undefined;
  if (frame !== undefined) cancelAnimationFrame(frame);
  frame = undefined;
  window.removeEventListener("resize", scheduleFit);
}
function start() {
  stop();
  if (!live || !root.value) return;
  observer =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(scheduleFit);
  observer?.observe(root.value);
  if (text.value) observer?.observe(text.value);
  if (!observer) window.addEventListener("resize", scheduleFit);
  scheduleFit();
}
watch(
  () => [pixelSize.value, props.gap, props.autoFit],
  () => void nextTick(scheduleFit),
);
watch(text, () => void nextTick(start), { flush: "post" });
onUpdated(scheduleFit);
onMounted(start);
onActivated(() => {
  live = true;
  void nextTick(start);
});
onDeactivated(() => {
  live = false;
  stop();
});
onBeforeUnmount(() => {
  live = false;
  stop();
});
defineExpose({ element: root, image, loaded, failed, reload });
</script>
<template>
  <span
    ref="root"
    v-bind="{ ...hysRootAttrs, ...attrs }"
    class="hys-ui-ex-avatar"
    :class="[
      'hys-ui-avatar-' + shape,
      {
        'hys-ui-avatar-bordered': bordered,
        'hys-ui-avatar-loading': hasImage && !loaded,
      },
    ]"
    :style="[
      {
        width: pixelSize + 'px',
        height: pixelSize + 'px',
        fontSize: Math.max(11, pixelSize * 0.34) + 'px',
        borderRadius:
          shape === 'circle'
            ? '50%'
            : typeof radius === 'number'
              ? radius + 'px'
              : (radius ?? Math.min(8, pixelSize * 0.2) + 'px'),
        background: color,
        color: textColor,
      },
      attrs.style as any,
    ]"
    role="img"
    :aria-label="
      (attrs['aria-label'] as string) ||
      alt ||
      imgProps?.alt ||
      name ||
      '用户头像'
    "
    :aria-busy="(hasImage && !loaded) || undefined"
  >
    <img
      v-if="hasImage"
      :key="imageKey"
      ref="image"
      v-bind="imageProps"
      @load="onLoad"
      @error="onError"
    />
    <span
      v-if="hasImage && !loaded && $slots.placeholder"
      class="hys-ui-avatar-placeholder"
      ><slot name="placeholder"
    /></span>
    <template v-if="!hasImage"
      ><span v-if="failed && $slots.fallback" class="hys-ui-avatar-custom"
        ><slot name="fallback" :error="lastError" :reload="reload" /></span
      ><span
        v-else-if="$slots.icon || icon"
        class="hys-ui-avatar-icon"
        :style="{
          width: pixelSize * 0.5 + 'px',
          height: pixelSize * 0.5 + 'px',
        }"
        ><slot name="icon"
          ><component
            :is="icon && toRaw(icon)"
            :size="pixelSize * 0.5" /></slot></span
      ><span
        v-else-if="$slots.default || initials"
        ref="text"
        class="hys-ui-avatar-text"
        ><slot>{{ initials }}</slot></span
      ><UserRound
        v-else
        :size="pixelSize * 0.5"
        :stroke-width="1.8"
        aria-hidden="true"
    /></template>
  </span>
</template>
<style scoped>
.hys-ui-ex-avatar {
  position: relative;
  flex: none;
  box-sizing: border-box;
  vertical-align: middle;
  isolation: isolate;
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  line-height: 1;
  font-weight: 600;
}
.hys-ui-ex-avatar img {
  display: block;
  flex: none;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}
.hys-ui-avatar-bordered {
  box-shadow: 0 0 0 2px var(--hys-ui-surface, var(--hys-ui-theme-surface));
}
.hys-ui-avatar-text {
  display: inline-block;
  flex: none;
  white-space: nowrap;
  transform-origin: center;
  line-height: 1.2;
}
.hys-ui-avatar-icon,
.hys-ui-avatar-placeholder,
.hys-ui-avatar-custom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.hys-ui-avatar-placeholder {
  position: absolute;
  inset: 0;
}
.hys-ui-avatar-custom {
  max-width: 100%;
  max-height: 100%;
}
.hys-ui-avatar-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
