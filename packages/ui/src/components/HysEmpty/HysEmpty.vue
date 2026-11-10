<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  watch,
} from "vue";
import { Inbox, FolderOpen, LoaderCircle } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import {
  feedbackImage,
  feedbackNumber,
  type HysEmptyProps,
  type HysEmptySlots,
  type HysEmptySlotContext,
} from "../../composables/feedback";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysEmptyProps>(), {
  title: "暂无数据",
  description: "当前没有符合条件的内容",
  image: undefined,
  imageFit: "contain",
  imageLoading: "eager",
  illustration: "inbox",
  size: "md",
  showImageLoading: true,
});
const emit = defineEmits<{
    imageLoad: [event: Event];
    imageError: [event: Event];
  }>(),
  slots = defineSlots<HysEmptySlots>(),
  attrs = useAttrs(),
  skin = useHysRootAttrs();
const element = ref<HTMLElement>(),
  imageElement = ref<HTMLImageElement>(),
  live = ref(true),
  loading = ref(false),
  failed = ref(false),
  nonce = ref(0),
  customImage = ref(!!slots.image);
const url = computed(() => feedbackImage(props.image)),
  native = computed(() => !!url.value && !customImage.value),
  size = computed(() =>
    feedbackNumber(
      props.imageSize,
      { sm: 32, md: 48, lg: 72 }[props.size],
      0,
      2000,
    ),
  );
function reset() {
  nonce.value++;
  loading.value = native.value;
  failed.value = !!props.image && !url.value;
}
watch(
  () => [
    url.value,
    props.image,
    props.crossOrigin,
    props.referrerPolicy,
    customImage.value,
  ],
  reset,
  { immediate: true },
);
function owned(event?: Event) {
  return (
    live.value &&
    native.value &&
    !!imageElement.value &&
    imageElement.value.getAttribute("src") === url.value &&
    (!event || event.target === imageElement.value)
  );
}
function loaded(event: Event) {
  if (!owned(event)) return;
  loading.value = false;
  failed.value = false;
  emit("imageLoad", event);
}
function errored(event: Event) {
  if (!owned(event)) return;
  loading.value = false;
  failed.value = true;
  emit("imageError", event);
}
function sync(allowFailure = false) {
  if (!owned() || !imageElement.value?.complete) return;
  if (imageElement.value.naturalWidth > 0) {
    loading.value = false;
    failed.value = false;
  } else if (allowFailure) {
    loading.value = false;
    failed.value = true;
  }
}
function retryImage() {
  if (!live.value || !native.value || props.image === false) return false;
  nonce.value++;
  failed.value = false;
  loading.value = true;
  return true;
}
let deactivated = false;
onMounted(() => {
  void nextTick(() => sync());
});
onUpdated(() => {
  if (customImage.value !== !!slots.image) customImage.value = !!slots.image;
  else sync();
});
onActivated(() => {
  const returning = deactivated;
  deactivated = false;
  live.value = true;
  void nextTick(() => sync(returning));
});
onDeactivated(() => {
  deactivated = true;
  live.value = false;
});
onBeforeUnmount(() => {
  live.value = false;
});
const context = computed<HysEmptySlotContext>(() => ({
  title: props.title,
  description: props.description,
  imageLoading: loading.value && native.value,
  imageError: failed.value,
  retryImage,
}));
const imageStyle = computed(() => ({
  width: size.value + "px",
  height: size.value + "px",
  ...props.imageStyle,
}));
defineExpose({
  element,
  imageElement,
  loadingImage: loading,
  failedImage: failed,
  retryImage,
});
</script>
<template>
  <div
    ref="element"
    v-bind="{ ...skin, ...attrs }"
    class="hys-ui-ex-empty hys-ui-empty-panel"
    :class="'hys-ui-empty-' + props.size"
    :aria-label="ariaLabel"
    :aria-live="ariaLive"
    :aria-atomic="ariaLive ? true : undefined"
    :data-image-state="
      failed ? 'error' : loading ? 'loading' : native ? 'loaded' : 'none'
    "
  >
    <div
      v-if="image !== false && size > 0"
      class="hys-ui-ex-empty-icon hys-ui-empty-image"
      :aria-hidden="
        !imageAlt && !slots.image && !slots.fallback ? true : undefined
      "
      :style="imageStyle"
    >
      <slot name="image" v-bind="context">
        <img
          v-if="url && !failed"
          ref="imageElement"
          :key="url + nonce"
          :src="url"
          :alt="imageAlt || ''"
          :loading="imageLoading"
          :crossorigin="crossOrigin"
          :referrerpolicy="referrerPolicy"
          :style="{
            objectFit: imageFit,
            opacity: loading && showImageLoading ? 0 : 1,
          }"
          @load="loaded"
          @error="errored"
        />
        <slot
          v-else-if="failed && slots.fallback"
          name="fallback"
          v-bind="context"
        />
        <svg
          v-else-if="illustration === 'default'"
          class="hys-ui-empty-illustration"
          viewBox="0 0 120 100"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="60"
            cy="89"
            rx="42"
            ry="6"
            fill="currentColor"
            opacity=".08"
          />
          <rect
            x="25"
            y="18"
            width="70"
            height="62"
            rx="8"
            fill="currentColor"
            opacity=".08"
          />
          <path
            d="M33 48h15l6 9h12l6-9h15v29H33V48Z"
            fill="currentColor"
            opacity=".15"
          />
          <path
            d="M33 48h15l6 9h12l6-9h15v29H33V48Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path
            d="M45 32h30M45 39h20"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            opacity=".4"
          />
        </svg>
        <FolderOpen
          v-else-if="illustration === 'simple'"
          class="hys-ui-empty-builtin"
          :size="size"
          aria-hidden="true"
        />
        <Inbox
          v-else
          class="hys-ui-empty-builtin"
          :size="size"
          aria-hidden="true"
        />
        <LoaderCircle
          v-if="loading && showImageLoading"
          class="hys-ui-empty-loading"
          :size="Math.min(size, 24)"
          aria-hidden="true"
        />
      </slot>
    </div>
    <strong
      v-if="title !== false && (title || slots.title)"
      class="hys-ui-empty-title"
      ><slot name="title" v-bind="context">{{ title }}</slot></strong
    >
    <div
      v-if="description !== false && (description || slots.description)"
      class="hys-ui-empty-description"
    >
      <slot name="description" v-bind="context">{{ description }}</slot>
    </div>
    <div v-if="slots.default || slots.action" class="hys-ui-empty-action">
      <slot name="action" v-bind="context"><slot v-bind="context" /></slot>
    </div>
  </div>
</template>
<style scoped>
.hys-ui-ex-empty.hys-ui-empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  padding: 25px 10px;
  text-align: center;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.hys-ui-empty-panel.hys-ui-empty-sm {
  gap: 5px;
  padding: 16px 8px;
  font-size: 12px;
}
.hys-ui-empty-panel.hys-ui-empty-lg {
  gap: 12px;
  padding: 40px 16px;
  font-size: 15px;
}
.hys-ui-ex-empty-icon.hys-ui-empty-image {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  max-width: 100%;
  opacity: 1;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: inherit;
}
.hys-ui-empty-image > img,
.hys-ui-empty-illustration {
  display: block;
  max-width: 100%;
  width: 100%;
  height: 100%;
}
.hys-ui-empty-builtin {
  opacity: 0.6;
  max-width: 100%;
  max-height: 100%;
}
.hys-ui-empty-panel .hys-ui-empty-title {
  display: block;
  margin: 0;
  max-width: 100%;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  font-size: inherit;
  font-weight: 600;
}
.hys-ui-empty-description {
  max-width: 100%;
  margin: 0;
}
.hys-ui-empty-action {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
  max-width: 100%;
}
.hys-ui-empty-loading {
  position: absolute;
  left: 50%;
  top: 50%;
  margin: -12px 0 0 -12px;
  animation: hys-ui-empty-spin 1s linear infinite;
}
.hys-ui-empty-panel[data-hys-motion="off"] .hys-ui-empty-loading {
  animation: none;
}
@keyframes hys-ui-empty-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-empty-loading {
    animation: none !important;
  }
}
</style>
