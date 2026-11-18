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
import { Download, ImageOff } from "../HysIcon/svgIcons";
import HysModal from "../HysModal/HysModal.vue";
import type { HysModalCloseReason, HysModalInstance } from "../../composables/modal";
import { useMotion } from "../../motion/useMotion";
import { useImageZoomMotion } from "./useImageZoomMotion";
import { useImageSwitchMotion, type HysImageViewerTransition as ImageTransition, type ImageDirection } from "./useImageSwitchMotion";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysSpin from "../HysSpin/HysSpin.vue";
import ImageViewerMinimap from "./ImageViewerMinimap.vue";
import ImageViewerToolbar from "./ImageViewerToolbar.vue";
import {
  imageViewerLabels,
  type HysImageViewerLabels as ViewerLabels,
} from "./imageViewerLabels";

export type HysImageViewerTransition = ImageTransition;
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
  /** 预览时显示的说明。 */
  description?: string;
  /** 指定原图的建议下载文件名。 */
  filename?: string;
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
  /** 到达首尾时循环切换，默认 true。 */
  loop?: boolean;
  /** 显示可点击的缩略图，默认 false。 */
  showThumbnails?: boolean;
  /** true 时使用 Ctrl 或 ⌘ 加滚轮缩放，false 时禁用滚轮缩放。省略时直接用滚轮缩放。 */
  wheelZoom?: boolean;
  /** 显式控制是否直接用滚轮缩放。false 时按 wheelZoom 设置使用组合键或关闭。 */
  directWheelZoom?: boolean;
  /** 放大后显示可点击、拖动及用方向键操作的图片小地图。默认 true。 */
  showMinimap?: boolean;
  /** 预览切换图片时的动效，fade 渐变、slide 滑动、zoom 推近、none 关闭。默认 slide。 */
  imageTransition?: HysImageViewerTransition;
  /** 启用双指缩放、拖动和横向手势翻图。默认 false。 */
  touchGestures?: boolean;
  /** 显示图片说明和原始宽高。 */
  showInfo?: boolean;
  /** 提供原图下载入口。跨域资源须由服务器允许下载。 */
  downloadable?: boolean;
}

const props = withDefaults(defineProps<HysImageViewerProps>(), {
  open: undefined,
  wheelZoom: undefined,
  directWheelZoom: undefined,
  showMinimap: true,
  imageTransition: "slide",
  loop: true,
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
const images = computed<HysImageViewerItem[]>(() => {
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
const downloadUrl = computed(() => {
  const src = current.value?.src;
  if (!src) return;
  try {
    const url = new URL(src, typeof location === "undefined" ? "https://localhost/" : location.href);
    if (/^(https?:|blob:)$/.test(url.protocol) || /^data:image\//i.test(src)) return src;
  } catch { /* Invalid URLs cannot be downloaded. */ }
});
const image = useTemplateRef<HTMLImageElement>("image");
const modal = useTemplateRef<HysModalInstance>("modal");
const fullscreen = ref(false);
const stage = useTemplateRef<HTMLElement>("stage");
const { effectiveMotion } = useMotion();
const { cancel: cancelZoom, zoom: animateZoom, zooming } = useImageZoomMotion(image, effectiveMotion);
const { outgoing, prepare: prepareSwitch, transition: animateSwitch, finish: finishSwitch } = useImageSwitchMotion(
  image, stage, () => props.imageTransition, effectiveMotion,
);
const viewport = useTemplateRef<HTMLDivElement>("viewport");
const position = shallowRef({ left: 0, top: 0 });
const minimapPlacement = shallowRef({ x: 1, y: 1 });
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
  const before = bounds.value;
  const after = { width: stage.value?.clientWidth ?? 0, height: stage.value?.clientHeight ?? 0 };
  if (after.width === before.width && after.height === before.height) return;
  const view = viewport.value;
  const last = geometry.value;
  const preserve = ready.value && view && before.width > 0 && before.height > 0;
  const x = (position.value.left + before.width / 2 - last.canvasWidth / 2) / last.ratio;
  const y = (position.value.top + before.height / 2 - last.canvasHeight / 2) / last.ratio;
  const source = image.value;
  cancelZoom();
  if (before.width && before.height) finishSwitch();
  bounds.value = after;
  if (preserve) void nextTick(() => {
    if (image.value !== source || bounds.value !== after) return;
    const next = geometry.value;
    panTo({
      left: next.canvasWidth / 2 + x * next.ratio - after.width / 2,
      top: next.canvasHeight / 2 + y * next.ratio - after.height / 2,
    });
  });
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
  cancelZoom();
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
    finishSwitch();
    if (open) {
      index.value = clamp(props.index ?? props.initialIndex);
      fullscreen.value = false;
      minimapPlacement.value = { x: 1, y: 1 };
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
let navigationIntent: { index: number; direction: ImageDirection } | undefined;
watch([() => current.value?.src, index], ([source, currentIndex], [lastSource, lastIndex]) => {
  if (source === lastSource) return;
  if (model.current.value && source && lastSource) {
    const enteredFrom = navigationIntent?.index === currentIndex
      ? navigationIntent.direction
      : currentIndex >= lastIndex ? 1 : -1;
    prepareSwitch(enteredFrom, ready.value, turns.value);
  } else finishSwitch();
  resetImage();
});
onBeforeUnmount(() => {
  attempt.value++;
});

let navigation = 0;
/** 跳到指定图片，受控更新被接受时返回 true。 */
function goTo(position: number) {
  return navigate(position);
}
async function navigate(position: number, direction?: ImageDirection) {
  if (!model.current.value || !images.value.length) return false;
  const next = clamp(position);
  if (next === index.value) return false;
  const request = ++navigation;
  navigationIntent = { index: next, direction: direction ?? (next > index.value ? 1 : -1) };
  if (props.index === undefined) index.value = next;
  emit("update:index", next);
  await nextTick();
  if (request === navigation) navigationIntent = undefined;
  if (request !== navigation || !model.current.value || index.value !== next)
    return false;
  emit("change", next);
  return true;
}
function switchImage(offset: number) {
  const target = index.value + offset;
  const count = images.value.length;
  void navigate(props.loop && count ? (target + count) % count : target, offset > 0 ? 1 : -1);
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
    animateSwitch();
  } else failed(event);
}
function failed(event: Event) {
  if (event.target !== image.value) return;
  finishSwitch();
  status.value = "error";
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
const oversized = computed(() => ready.value && (
  geometry.value.canvasWidth > bounds.value.width + 2 ||
  geometry.value.canvasHeight > bounds.value.height + 2
));
function readPosition() {
  const view = viewport.value;
  const left = view?.scrollLeft ?? 0;
  const top = view?.scrollTop ?? 0;
  if (left !== position.value.left || top !== position.value.top)
    position.value = { left, top };
}
function panTo({ left, top }: { left: number; top: number }) {
  const view = viewport.value;
  if (!view) return;
  view.scrollLeft = left;
  view.scrollTop = top;
  readPosition();
}
watch(viewport, readPosition);
function center() {
  const view = viewport.value;
  if (view) panTo({
    left: (view.scrollWidth - view.clientWidth) / 2,
    top: (view.scrollHeight - view.clientHeight) / 2,
  });
}
const clampFactor = (value: number) => Math.max(.25, Math.min(4, value));
function zoom(offset: number) {
  const next = clampFactor(factor.value + offset);
  if (next === factor.value) return;
  finishSwitch();
  animateZoom(() => { factor.value = next; }, center);
}
function rotate() {
  finishSwitch();
  cancelZoom();
  turns.value = (turns.value + 1) % 4;
  void nextTick(center);
}
function setZoomBase(base: "fit" | "actual") {
  finishSwitch();
  if (factor.value === 1 && zoomBase.value === base) {
    center();
    return;
  }
  animateZoom(() => {
    zoomBase.value = base;
    factor.value = 1;
  }, center);
}
/** 缩放适应视口，保留旋转角度。 */
function fit() { setZoomBase("fit"); }
/** 切换到原始像素大小，保留旋转角度。 */
function actualSize() {
  if (ready.value) setZoomBase("actual");
}
function setFullscreen(value: boolean) {
  finishSwitch();
  cancelZoom();
  return modal.value?.setFullscreen(value);
}
async function beforeClose(reason: HysModalCloseReason) {
  if (reason !== "escape" || !fullscreen.value) return true;
  await setFullscreen(false);
  return false;
}
function toggleOriginal() {
  if (!ready.value) return;
  if (zoomBase.value === "actual" || factor.value !== 1) fit();
  else actualSize();
}
function wheel(event: WheelEvent) {
  const view = viewport.value;
  const direct = props.directWheelZoom ?? (props.wheelZoom === undefined);
  const modified = props.wheelZoom && (event.ctrlKey || event.metaKey);
  if (!view || !ready.value || (!direct && !modified) || !event.deltaY) return;
  event.preventDefault();

  const next = clampFactor(factor.value + (event.deltaY < 0 ? .25 : -.25));
  if (factor.value === next) return;

  finishSwitch();
  const photo = image.value?.getBoundingClientRect();
  if (!photo?.width || !photo.height) {
    zoom(next - factor.value);
    return;
  }
  const frame = view.getBoundingClientRect();
  const x = (event.clientX - frame.left) * view.clientWidth / frame.width;
  const y = (event.clientY - frame.top) * view.clientHeight / frame.height;
  const imageX = (event.clientX - photo.left) / photo.width - .5;
  const imageY = (event.clientY - photo.top) / photo.height - .5;
  const sideways = turns.value % 2 !== 0;
  animateZoom(() => { factor.value = next; }, () => {
    const { canvasWidth, canvasHeight, width, height } = geometry.value;
    panTo({
      left: canvasWidth / 2 + imageX * (sideways ? height : width) - x,
      top: canvasHeight / 2 + imageY * (sideways ? width : height) - y,
    });
  });
}
const pan = shallowRef<{
  pointer: number;
  x: number;
  y: number;
  left: number;
  top: number;
}>();
const touches = new Map<number, { x: number; y: number }>();
let touchStart: { x: number; y: number } | undefined;
let pinch: { distance: number; scale: number } | undefined;
function distance() {
  const [first, second] = touches.values();
  return second ? Math.hypot(first.x - second.x, first.y - second.y) : 0;
}
function touchDown(event: PointerEvent) {
  if (!props.touchGestures || !ready.value || touches.size >= 2) return;
  finishSwitch();
  cancelZoom();
  const point = { x: event.clientX, y: event.clientY };
  touches.set(event.pointerId, point);
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  if (touches.size === 1) {
    touchStart = point;
  } else {
    pinch = { distance: Math.max(1, distance()), scale: factor.value };
    touchStart = undefined;
  }
}
function touchMove(event: PointerEvent) {
  const before = touches.get(event.pointerId);
  if (!before) return;
  touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pinch && touches.size === 2) {
    const next = clampFactor(pinch.scale * distance() / pinch.distance);
    if (next !== factor.value) { factor.value = next; void nextTick(center); }
    return;
  }
  const view = viewport.value;
  if (view) panTo({
    left: view.scrollLeft + before.x - event.clientX,
    top: view.scrollTop + before.y - event.clientY,
  });
}
function touchEnd(event: PointerEvent) {
  if (!touches.delete(event.pointerId)) return;
  if (touches.size) return;
  pinch = undefined;
  const start = touchStart;
  touchStart = undefined;
  if (!start || event.type !== "pointerup" || factor.value !== 1 || zoomBase.value !== "fit") return;
  const x = event.clientX - start.x;
  const y = event.clientY - start.y;
  if (Math.abs(x) > 44 && Math.abs(x) > Math.abs(y) * 1.4) switchImage(x < 0 ? 1 : -1);
}
watch([current, () => props.touchGestures], () => { touches.clear(); pinch = undefined; touchStart = undefined; });
function beginPan(event: PointerEvent) {
  if (event.pointerType === "touch") return touchDown(event);
  const view = viewport.value;
  if (
    event.pointerType !== "mouse" ||
    event.button !== 0 ||
    !view ||
    (view.scrollWidth <= view.clientWidth &&
      view.scrollHeight <= view.clientHeight)
  )
    return;
  finishSwitch();
  cancelZoom();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  pan.value = {
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    left: view.scrollLeft,
    top: view.scrollTop,
  };
  event.preventDefault();
}
function movePan(event: PointerEvent) {
  if (event.pointerType === "touch") return touchMove(event);
  const view = viewport.value;
  if (!view || !pan.value || pan.value.pointer !== event.pointerId) return;
  panTo({
    left: pan.value.left + pan.value.x - event.clientX,
    top: pan.value.top + pan.value.y - event.clientY,
  });
}
function endPan(event: PointerEvent) {
  if (event.pointerType === "touch") return touchEnd(event);
  if (pan.value?.pointer === event.pointerId) pan.value = undefined;
}
defineExpose({ goTo, actualSize, fit });
function reset() {
  if (!turns.value) { fit(); return; }
  cancelZoom();
  turns.value = 0;
  zoomBase.value = "fit";
  factor.value = 1;
  void nextTick(center);
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
    ref="modal"
    v-model:fullscreen="fullscreen"
    :open="model.current.value"
    :overlay-class="fullscreen ? 'hys-image-viewer-overlay-fullscreen' : undefined"
    :body-class="fullscreen ? 'hys-image-viewer-body-fullscreen' : undefined"
    :before-close="beforeClose"
    :title="current?.title || title"
    :close-on-mask="closeOnMask"
    :close-text="labels.close"
    width="min(94vw, 960px)"
    footer
    @update:open="setOpen"
    @close="emit('close')"
    @keydown="keydown"
  >
    <div ref="stage" class="hys-image-stage" :class="{ 'is-fullscreen': fullscreen }">
      <img
        v-if="outgoing" ref="outgoingImage" class="hys-image-outgoing" :src="outgoing.src"
        alt="" aria-hidden="true" draggable="false"
        :style="{
          left: outgoing.left + 'px',
          top: outgoing.top + 'px',
          width: outgoing.width + 'px',
          height: outgoing.height + 'px',
          transform: outgoing.transform,
        }"
      />
      <div
        v-if="current"
        ref="viewport"
        class="hys-image-viewport"
        role="region"
        tabindex="0"
        :aria-label="current.alt || labels.content"
        @wheel="wheel"
        @scroll.passive="readPosition"
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
              'use-touch-gestures': touchGestures,
              'is-panning': !!pan,
              'is-pannable': oversized,
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
            @dblclick="toggleOriginal"
            @pointerdown="beginPan"
            @pointermove="movePan"
            @lostpointercapture="endPan"
            @pointercancel="endPan"
            @pointerup="endPan"
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
      </div>
      <HysEmpty v-else :description="labels.empty" class="hys-image-message" />
      <ImageViewerMinimap
        v-if="current && showMinimap && oversized"
        v-model:placement="minimapPlacement"
        :src="current.src"
        :label="labels.minimap"
        :move-label="labels.moveMinimap"
        :turns="turns"
        :geometry="geometry"
        :bounds="bounds"
        :position="position"
        :zooming="zooming"
        @pan="cancelZoom(); panTo($event)"
      />
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
      <div v-if="current && (showInfo || (downloadable && downloadUrl))" class="hys-image-details">
        <span v-if="showInfo && ready">{{ size.width }} × {{ size.height }} px</span>
        <span v-if="showInfo && current.description">{{ current.description }}</span>
        <HysButton v-if="downloadable && downloadUrl" :href="downloadUrl" :download="current.filename || ''"
          target="_blank" variant="text" size="sm" :icon="Download">下载原图</HysButton>
      </div>
      <ImageViewerToolbar
        v-if="images.length"
        :index="index"
        :count="images.length"
        :ready="ready"
        :labels="labels"
        :factor="factor"
        :loop="loop"
        :fullscreen="fullscreen"
        :zoom="Math.round(geometry.ratio * 100)"
        @move="switchImage"
        @zoom="zoom"
        @rotate="rotate"
        @fit="fit"
        @actual="actualSize"
        @reset="reset"
        @toggle-fullscreen="setFullscreen(!fullscreen)"
      />
    </template>
  </HysModal>
</template>

<style scoped>
.hys-image-details { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; font-size: 12px; color: var(--hys-ui-theme-muted); }
.hys-image-photo.use-touch-gestures { touch-action: none; }
.hys-image-stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  min-width: 0;
  height: clamp(115px, 56dvh, 640px);
  overflow: hidden;
  border-radius: 8px;
  background: var(--hys-ui-theme-surface-alt);
}
:global(.hys-image-viewer-overlay-fullscreen) {
  width: 100dvw;
}
:global(.hys-image-viewer-body-fullscreen > .hys-ui-scrollbar-viewport > .hys-ui-scrollbar-view),
:global(.hys-image-viewer-body-fullscreen > .hys-ui-scrollbar-viewport > .hys-ui-scrollbar-view > .hys-ui-modal-content) {
  height: 100%;
}
:global(.hys-image-viewer-body-fullscreen > .hys-ui-scrollbar-viewport > .hys-ui-scrollbar-view > .hys-ui-modal-content > .hys-ui-modal-content-main) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.hys-image-stage.is-fullscreen {
  height: auto;
  flex: 1 1 0;
}
.hys-image-viewport {
  direction: ltr;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
.hys-image-viewport::-webkit-scrollbar {
  display: none;
}
.hys-image-viewport:focus-visible {
  outline: 2px solid var(--hys-ui-theme-primary);
  outline-offset: -2px;
}
.hys-image-canvas {
  position: relative;
  display: grid;
  min-width: 100%;
  min-height: 100%;
  place-items: center;
  overflow: clip;
}
.hys-image-outgoing {
  position: absolute;
  max-width: none;
  pointer-events: none;
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
  flex: none;
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
