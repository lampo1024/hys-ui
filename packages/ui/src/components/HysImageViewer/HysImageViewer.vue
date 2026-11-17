<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { useChoiceModel } from "../../composables/choiceModel";
import HysButton from "../HysButton/HysButton.vue";
import HysAvatar from "../HysAvatar/HysAvatar.vue";
import HysEmpty from "../HysEmpty/HysEmpty.vue";
import { ImageOff } from "../HysIcon/svgIcons";
import HysModal from "../HysModal/HysModal.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysSpin from "../HysSpin/HysSpin.vue";
import ImageViewerToolbar from "./ImageViewerToolbar.vue";
import {
  imageViewerLabels,
  type HysImageViewerLabels as ViewerLabels,
} from "./imageViewerLabels";

export type HysImageViewerLabels = ViewerLabels;
export interface HysImageViewerItem {
  /** 图片地址，支持普通 URL 或本地对象 URL。 */
  src: string;
  /** 图片替代文字。 */
  alt?: string;
  /** 图片预览标题，默认使用组件标题。 */
  title?: string;
  /** 小尺寸预览地址。省略时使用 src。 */
  thumbnail?: string;
}
export interface HysImageViewerProps {
  /** 单张图片或一组图片，支持 URL 字符串和带替代文字的对象。 */
  images:
    string | HysImageViewerItem | readonly (string | HysImageViewerItem)[];
  /** 每次打开时显示的索引，从 0 起算并限制在有效范围。默认 0。 */
  initialIndex?: number;
  /** 受控显隐状态，支持 v-model:open。 */
  open?: boolean;
  /** 非受控初始显隐状态，默认 false。 */
  defaultOpen?: boolean;
  /** 默认图片预览标题。 */
  title?: string;
  /** 点击遮罩是否关闭。默认 true。 */
  closeOnMask?: boolean;
  /** 覆盖工具按钮、无图或加载失败等状态文案。 */
  labels?: Partial<HysImageViewerLabels>;
  /** 受控当前图片索引，支持 v-model:index。 */
  index?: number;
  /** 最后一张与第一张循环切换，默认 false。 */
  loop?: boolean;
  /** 显示可点击的缩略图，默认 false。 */
  showThumbnails?: boolean;
  /** Ctrl 或 ⌘ 加滚轮在图片区域缩放，默认 false。 */
  wheelZoom?: boolean;
}

const props = withDefaults(defineProps<HysImageViewerProps>(), {
  open: undefined,
  initialIndex: 0,
  title: "图片预览",
  closeOnMask: true,
});
const emit = defineEmits<{
  "update:open": [open: boolean];
  change: [index: number];
  close: [];
  /** 用户切换图片后请求的新索引，从 0 开始。 */
  "update:index": [index: number];
}>();
const model = useChoiceModel(
  {
    get modelValue() {
      return props.open;
    },
  },
  () => !!props.defaultOpen,
);
const images = computed(() => {
  const source = Array.isArray(props.images) ? props.images : [props.images];
  return source.flatMap((item) => {
    if (typeof item === "string")
      return item.trim()
        ? [
            {
              src: item.trim(),
              alt: undefined,
              title: undefined,
              thumbnail: undefined,
            },
          ]
        : [];
    return item?.src?.trim() ? [{ ...item, src: item.src.trim() }] : [];
  });
});
const index = ref(0);
const thumbnails = useTemplateRef("thumbnails");
const current = computed(() => images.value[index.value]);
const image = useTemplateRef<HTMLImageElement>("image");
const stage = useTemplateRef<HTMLElement>("stage");
const scrollbar = useTemplateRef("scrollbar");
const bounds = shallowRef({ width: 0, height: 0 });
const size = shallowRef({ width: 0, height: 0 });
const factor = ref(1);
const zoomBase = ref<"fit" | "actual">("fit");
const turns = ref(0);
const attempt = ref(0);
const status = ref<"loading" | "loaded" | "error">("loading");
const ready = computed(() => status.value === "loaded");
const labels = computed(() => ({ ...imageViewerLabels, ...props.labels }));

function clamp(index: number) {
  return Math.max(
    0,
    Math.min(
      images.value.length - 1,
      Number.isFinite(index) ? Math.floor(index) : 0,
    ),
  );
}
function setOpen(value: boolean) {
  void model.commit(
    value,
    (next) => emit("update:open", next),
    () => {},
  );
}
function measure() {
  bounds.value = {
    width: stage.value?.clientWidth ?? 0,
    height: stage.value?.clientHeight ?? 0,
  };
}
watch(stage, (node, _, onCleanup) => {
  if (!node) return;
  measure();
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    onCleanup(() => observer.disconnect());
  } else {
    window.addEventListener("resize", measure);
    onCleanup(() => window.removeEventListener("resize", measure));
  }
});

function resetImage() {
  status.value = "loading";
  size.value = { width: 0, height: 0 };
  factor.value = 1;
  zoomBase.value = "fit";
  turns.value = 0;
  attempt.value++;
}
watch(
  model.current,
  (open) => {
    if (open) {
      index.value = clamp(props.index ?? props.initialIndex);
      resetImage();
    }
  },
  { immediate: true, flush: "sync" },
);
watch(images, (_, previous) => {
  if (props.index !== undefined) {
    index.value = clamp(props.index);
    return;
  }
  const source = previous?.[index.value]?.src;
  const matched = source
    ? images.value.findIndex((item) => item.src === source)
    : -1;
  index.value = matched < 0 ? clamp(index.value) : matched;
});
watch(
  () => props.index,
  (value) => {
    if (value !== undefined) index.value = clamp(value);
  },
);
watch(() => current.value?.src, resetImage);
onBeforeUnmount(() => {
  attempt.value++;
});

let navigation = 0;
/** 跳到指定图片，受控更新被接受时返回 true。 */
async function goTo(position: number) {
  if (!model.current.value || !images.value.length) return false;
  const next = clamp(position);
  if (next === index.value) return false;
  const request = ++navigation;
  if (props.index === undefined) index.value = next;
  emit("update:index", next);
  await nextTick();
  if (request !== navigation || !model.current.value || index.value !== next)
    return false;
  emit("change", next);
  return true;
}
function switchImage(offset: number) {
  const target = index.value + offset;
  const count = images.value.length;
  void goTo(props.loop && count ? (target + count) % count : target);
}
watch(
  [index, thumbnails],
  () => {
    const viewport = thumbnails.value?.viewport;
    const active = viewport?.querySelector<HTMLElement>(
      `[data-preview-index="${index.value}"]`,
    );
    if (!viewport || !active) return;
    const frame = viewport.getBoundingClientRect();
    const card = active.getBoundingClientRect();
    if (card.left < frame.left) viewport.scrollLeft += card.left - frame.left;
    else if (card.right > frame.right)
      viewport.scrollLeft += card.right - frame.right;
  },
  { flush: "post" },
);
function received(event: Event) {
  const element = event.target as HTMLImageElement;
  if (element !== image.value) return;
  if (element.naturalWidth > 0 && element.naturalHeight > 0) {
    size.value = { width: element.naturalWidth, height: element.naturalHeight };
    status.value = "loaded";
  } else status.value = "error";
}
function failed(event: Event) {
  if (event.target === image.value) status.value = "error";
}
function retry() {
  status.value = "loading";
  attempt.value++;
}

const geometry = computed(() => {
  const { width, height } = size.value;
  const quarter = turns.value % 2 !== 0;
  const horizontal = quarter ? height : width;
  const vertical = quarter ? width : height;
  const fit =
    width && height && bounds.value.width && bounds.value.height
      ? Math.min(
          1,
          (bounds.value.width - Math.min(bounds.value.width - 1, 16)) /
            horizontal,
          (bounds.value.height - Math.min(bounds.value.height - 1, 16)) /
            vertical,
        )
      : 1;
  const ratio = (zoomBase.value === "actual" ? 1 : fit) * factor.value;
  return {
    ratio,
    width: width * ratio,
    height: height * ratio,
    canvasWidth: Math.max(bounds.value.width, horizontal * ratio + 16),
    canvasHeight: Math.max(bounds.value.height, vertical * ratio + 16),
  };
});
function center() {
  void nextTick(() => {
    const viewport = scrollbar.value?.viewport;
    if (viewport) {
      viewport.scrollLeft = Math.max(
        0,
        (viewport.scrollWidth - viewport.clientWidth) / 2,
      );
      viewport.scrollTop = Math.max(
        0,
        (viewport.scrollHeight - viewport.clientHeight) / 2,
      );
    }
  });
}
function zoom(offset: number) {
  factor.value = Math.max(0.25, Math.min(4, factor.value + offset));
  center();
}
function rotate() {
  turns.value = (turns.value + 1) % 4;
  center();
}
function fit() {
  zoomBase.value = "fit";
  factor.value = 1;
  center();
}
/** 切换到原始像素大小，保留当前旋转角度。 */
function actualSize() {
  if (!ready.value) return;
  zoomBase.value = "actual";
  factor.value = 1;
  center();
}
function wheel(event: WheelEvent) {
  if (
    !props.wheelZoom ||
    !ready.value ||
    !(event.ctrlKey || event.metaKey) ||
    !event.deltaY
  )
    return;
  event.preventDefault();
  zoom(event.deltaY < 0 ? 0.25 : -0.25);
}
const pan = shallowRef<{
  pointer: number;
  x: number;
  y: number;
  left: number;
  top: number;
}>();
function beginPan(event: PointerEvent) {
  const viewport = scrollbar.value?.viewport;
  if (
    event.pointerType !== "mouse" ||
    event.button !== 0 ||
    !viewport ||
    (viewport.scrollWidth <= viewport.clientWidth &&
      viewport.scrollHeight <= viewport.clientHeight)
  )
    return;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  pan.value = {
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    left: viewport.scrollLeft,
    top: viewport.scrollTop,
  };
  event.preventDefault();
}
function movePan(event: PointerEvent) {
  const viewport = scrollbar.value?.viewport;
  if (!viewport || !pan.value || pan.value.pointer !== event.pointerId) return;
  viewport.scrollLeft = pan.value.left - (event.clientX - pan.value.x);
  viewport.scrollTop = pan.value.top - (event.clientY - pan.value.y);
}
function endPan(event: PointerEvent) {
  if (pan.value?.pointer === event.pointerId) pan.value = undefined;
}
defineExpose({ goTo, actualSize, fit });
function reset() {
  turns.value = 0;
  fit();
}

function keydown(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return;
  if (images.value.length < 2) return;
  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    void goTo(event.key === "Home" ? 0 : images.value.length - 1);
    return;
  }
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  switchImage(event.key === "ArrowLeft" ? -1 : 1);
}
</script>

<template>
  <HysModal
    :open="model.current.value"
    :title="current?.title || title"
    :close-on-mask="closeOnMask"
    :close-text="labels.close"
    width="min(94vw, 960px)"
    footer
    @update:open="setOpen"
    @close="emit('close')"
    @keydown="keydown"
  >
    <div ref="stage" class="hys-image-stage" @wheel="wheel">
      <HysScrollbar
        v-if="current"
        ref="scrollbar"
        height="100%"
        :aria-label="current.alt || labels.content"
      >
        <div
          class="hys-image-canvas"
          :style="
            ready
              ? {
                  width: geometry.canvasWidth + 'px',
                  height: geometry.canvasHeight + 'px',
                }
              : undefined
          "
        >
          <img
            v-if="status !== 'error'"
            :key="attempt"
            ref="image"
            :src="current.src"
            :alt="current.alt ?? ''"
            class="hys-image-photo"
            :class="{
              'is-loaded': ready,
              'is-panning': !!pan,
              'is-pannable':
                ready &&
                (geometry.canvasWidth > bounds.width + 2 ||
                  geometry.canvasHeight > bounds.height + 2),
            }"
            :style="
              ready
                ? {
                    width: geometry.width + 'px',
                    height: geometry.height + 'px',
                    transform:
                      'translate(-50%, -50%) rotate(' + 90 * turns + 'deg)',
                  }
                : undefined
            "
            :data-rotation="90 * turns"
            draggable="false"
            @load="received"
            @error="failed"
            @pointerdown="beginPan"
            @pointermove="movePan"
            @lostpointercapture="endPan"
            @pointercancel="endPan"
          />
          <HysSpin
            v-if="status === 'loading'"
            :text="labels.loading"
            size="sm"
          />
          <div
            v-else-if="status === 'error'"
            class="hys-image-message"
            role="status"
          >
            <ImageOff :size="28" aria-hidden="true" />
            <span>{{ labels.error }}</span>
            <HysButton variant="secondary" size="sm" @click="retry">{{
              labels.retry
            }}</HysButton>
          </div>
        </div>
      </HysScrollbar>
      <HysEmpty v-else :description="labels.empty" class="hys-image-message" />
    </div>
    <HysScrollbar
      v-if="showThumbnails && images.length > 1"
      ref="thumbnails"
      class="hys-image-thumbnails"
      direction="horizontal"
    >
      <div
        class="hys-image-thumbnail-strip"
        role="group"
        :aria-label="labels.thumbnails"
      >
        <HysButton
          v-for="(item, position) in images"
          :key="position"
          :data-preview-index="position"
          size="sm"
          variant="ghost"
          class="hys-image-thumbnail"
          :aria-label="
            item.title || item.alt || position + 1 + ' / ' + images.length
          "
          :aria-current="position === index ? 'true' : undefined"
          @click="goTo(position)"
        >
          <HysAvatar
            :src="item.thumbnail || item.src"
            :size="34"
            shape="square"
            lazy
            aria-hidden="true"
            >{{ position + 1 }}</HysAvatar
          >
        </HysButton>
      </div>
    </HysScrollbar>
    <template #footer>
      <ImageViewerToolbar
        v-if="images.length"
        :index="index"
        :count="images.length"
        :ready="ready"
        :labels="labels"
        :factor="factor"
        :loop="loop"
        :zoom="Math.round(geometry.ratio * 100)"
        @move="switchImage"
        @zoom="zoom"
        @rotate="rotate"
        @fit="fit"
        @actual="actualSize"
        @reset="reset"
      />
    </template>
  </HysModal>
</template>

<style scoped>
.hys-image-stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  height: clamp(115px, 56dvh, 640px);
  overflow: hidden;
  border-radius: 8px;
  background: var(--hys-ui-theme-surface-alt);
}
.hys-image-stage :deep(.hys-ui-scrollbar-view) {
  min-height: 100%;
}
.hys-image-canvas {
  position: relative;
  display: grid;
  min-width: 100%;
  min-height: 100%;
  place-items: center;
  overflow: clip;
}
.hys-image-photo {
  position: absolute;
  top: 50%;
  left: 50%;
  display: none;
  max-width: none;
  user-select: none;
}
.hys-image-photo.is-loaded {
  display: block;
}
.hys-image-photo.is-pannable {
  cursor: grab;
}
.hys-image-photo.is-panning {
  cursor: grabbing;
}
.hys-image-thumbnails {
  margin-block-start: 7px;
}
.hys-image-thumbnail-strip {
  display: flex;
  width: max-content;
  max-width: none;
  gap: 5px;
  padding: 3px;
}
.hys-image-thumbnail-strip .hys-image-thumbnail {
  min-width: 42px;
  height: 42px;
  padding: 3px;
}
.hys-image-thumbnail[aria-current="true"] {
  box-shadow: inset 0 0 0 2px var(--hys-ui-theme-primary);
}
.hys-image-message {
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  gap: 8px;
  color: var(--hys-ui-theme-muted);
}
</style>
