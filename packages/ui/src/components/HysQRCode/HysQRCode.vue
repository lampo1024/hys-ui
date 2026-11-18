<script setup lang="ts">
import {
  computed,
  ref,
  useId,
  useTemplateRef,
  watch,
  watchPostEffect,
  type VNodeChild,
} from "vue";
import { drawCode, logoRegion, qrPath, type QrModuleShape } from "./qrArtwork";
import { qrSymbol } from "./qrMatrix";
import type { QrCorrection } from "./qrPayload";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import { CircleCheck, Grid2X2, RefreshCw } from "../HysIcon/svgIcons";
import HysSpin from "../HysSpin/HysSpin.vue";

export type HysQRCodeCorrection = QrCorrection;
export type HysQRCodeExportFormat = "svg" | "png";
export type HysQRCodeStatus = "active" | "loading" | "expired" | "scanned";
export interface HysQRCodeProps {
  /** 待编码的 UTF-8 文本。空字符串显示占位。 */
  value: string;
  /** 渲染类型 svg 或 canvas，默认 svg。 */
  type?: "svg" | "canvas";
  /** 二维码边长，单位为像素，默认 160。 */
  size?: number;
  /** 深色模块的 CSS 颜色，默认 #171717。优先于 color。 */
  foreground?: string;
  /** 深色模块颜色的别名，与 Ant Design Vue 用法对应。 */
  color?: string;
  /** 二维码底色，默认 #fff。优先于 bgColor。 */
  background?: string;
  /** 二维码底色的别名，可传 transparent。 */
  bgColor?: string;
  /** 四边静区的模块数，范围 4–32，默认 4。 */
  margin?: number;
  /** 纠错等级 L、M、Q 或 H，默认 M。优先于 errorLevel。 */
  errorCorrectionLevel?: HysQRCodeCorrection;
  /** 纠错等级的别名，与 Ant Design Vue 用法对应。 */
  errorLevel?: HysQRCodeCorrection;
  /** 中心图标的图片地址。加载失败时仍展示正常二维码。 */
  icon?: string;
  /** 中心图标目标边长，默认 40px。按纠错预算自动收缩。 */
  iconSize?: number;
  /** 显示外部细边框，默认 true，二维码静区不受影响。 */
  bordered?: boolean;
  /** 数据模块外观，默认 square。定位与计时模块保持方形。 */
  moduleShape?: QrModuleShape;
  /** 显示复制二维码图片按钮。 */
  copyable?: boolean;
  /** 由业务控制的扫描状态，默认 active。 */
  status?: HysQRCodeStatus;
  /** 辅助技术使用的名称，默认「二维码」。 */
  ariaLabel?: string;
  /** 覆盖空值、容量和扫描状态提示。 */
  labels?: Partial<{
    empty: string;
    capacity: string;
    expired: string;
    loading: string;
    scanned: string;
    refresh: string;
  }>;
}

const props = withDefaults(defineProps<HysQRCodeProps>(), {
  type: "svg",
  size: 160,
  margin: 4,
  iconSize: 40,
  bordered: true,
  status: "active",
  ariaLabel: "二维码",
});
const emit = defineEmits<{
  /** 过期状态下用户请求刷新。更新 value 和 status 由调用方完成。 */
  refresh: [];
  /** 复制二维码 PNG 成功后发出。 */
  copyImage: [];
  /** 复制失败时发出原因。 */
  copyError: [error: unknown];
}>();
defineSlots<{
  /** 自定义无内容或编码失败时的占位。 */
  empty?: (context: { reason: "empty" | "capacity" }) => VNodeChild;
  /** 二维码规格。modules 不含静区，version 为二维码版本。 */
  details?: (context: {
    modules: number;
    version: number;
    correction: HysQRCodeCorrection;
  }) => VNodeChild;
  /** 替换 loading、expired 或 scanned 的遮罩内容，可调用 refresh。 */
  status?: (context: {
    status: Exclude<HysQRCodeStatus, "active">;
    refresh: () => void;
  }) => VNodeChild;
}>();

const skin = useHysRootAttrs();
const clipId = useId() + "-qr-logo";
const svg = useTemplateRef<SVGSVGElement>("svg");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const image = useTemplateRef<HTMLImageElement>("image");
const loaded = ref(false);
const anonymous = ref(true);
const logoSource = computed(() => {
  const input = props.icon?.trim();
  if (!input) return;
  const scheme = input
    .replace(/[\u0000-\u0020]/gu, "")
    .match(/^([a-z][a-z\d+.-]*):/iu)?.[1]
    ?.toLowerCase();
  if (
    !scheme ||
    ["http", "https", "blob"].includes(scheme) ||
    /^data:image\//iu.test(input)
  )
    return input;
});
watch(
  logoSource,
  () => {
    loaded.value = false;
    anonymous.value = true;
  },
  { flush: "sync" },
);
function logoLoad(event: Event) {
  if (event.target === image.value && image.value?.naturalWidth)
    loaded.value = true;
}
function logoError(event: Event) {
  if (event.target !== image.value) return;
  loaded.value = false;
  if (anonymous.value) anonymous.value = false;
}
const labels = computed(() => ({
  empty: "暂无二维码内容",
  capacity: "内容超出二维码容量",
  expired: "二维码已过期",
  loading: "正在生成二维码",
  scanned: "已扫码",
  refresh: "点击刷新",
  ...props.labels,
}));
const pixels = computed(() =>
  Number.isFinite(props.size) ? Math.min(4096, Math.max(24, props.size)) : 160,
);
const foreground = computed(() => props.foreground ?? props.color ?? "#171717");
const background = computed(() => props.background ?? props.bgColor ?? "#fff");
const margin = computed(() =>
  Number.isFinite(props.margin)
    ? Math.min(32, Math.max(4, Math.floor(props.margin)))
    : 4,
);
const correction = computed<QrCorrection>(() => {
  const value = props.errorCorrectionLevel ?? props.errorLevel;
  return value && ["L", "M", "Q", "H"].includes(value) ? value : "M";
});
const symbol = computed(() =>
  props.value ? qrSymbol(props.value, correction.value) : undefined,
);
const extent = computed(
  () => (symbol.value?.matrix.length ?? 0) + margin.value * 2,
);
const logo = computed(() =>
  symbol.value && loaded.value && props.iconSize > 0
    ? logoRegion(
        symbol.value,
        (props.iconSize / pixels.value) * extent.value,
        margin.value,
      )
    : undefined,
);
const styled = computed(() => props.moduleShape !== undefined && props.moduleShape !== "square");
const path = computed(() => {
  if (!symbol.value) return "";
  const matrix = logo.value
    ? symbol.value.matrix.map((row) => row.slice())
    : symbol.value.matrix;
  for (const region of logo.value?.regions ?? [])
    matrix[region.y - margin.value].fill(
      0,
      region.x - margin.value,
      region.x - margin.value + region.width,
    );
  return qrPath(matrix, margin.value, symbol.value.modules, props.moduleShape);
});

function paint(element: string, fallback: string) {
  const shape = svg.value?.querySelector(element);
  if (!shape) return fallback;
  const style = shape.ownerDocument.defaultView?.getComputedStyle(shape);
  const color = style?.fill || shape.getAttribute("fill") || fallback;
  if (/^(?:url|var)\(/iu.test(color)) return fallback;
  if (color.toLowerCase() === "currentcolor") return style?.color || fallback;
  return color === "none" ? "transparent" : color;
}
watchPostEffect(() => {
  if (canvas.value && symbol.value)
    drawCode(
      canvas.value,
      symbol.value.matrix,
      margin.value,
      pixels.value *
        (canvas.value.ownerDocument.defaultView?.devicePixelRatio ?? 1),
      paint("path[data-qr-modules]", foreground.value),
      paint("rect", background.value),
      logo.value,
      image.value ?? undefined,
      styled.value ? path.value : undefined,
    );
});

function refresh() {
  if (props.status === "expired") emit("refresh");
}

/** 导出独立 SVG 或 PNG Blob。失败、空值及非 active 状态返回 null。 */
async function exportImage(
  format: HysQRCodeExportFormat = "svg",
  size = pixels.value,
): Promise<Blob | null> {
  if (!symbol.value || !svg.value || props.status !== "active") return null;
  const ink = paint("path[data-qr-modules]", foreground.value);
  const paper = paint("rect", background.value);
  const edge = Number.isFinite(size)
    ? Math.min(4096, Math.max(extent.value, Math.round(size)))
    : extent.value;
  const document = svg.value.ownerDocument;
  try {
    if (format === "png") {
      const target = document.createElement("canvas");
      if (
        !drawCode(
          target,
          symbol.value.matrix,
          margin.value,
          edge,
          ink,
          paper,
          logo.value,
          image.value ?? undefined,
          styled.value ? path.value : undefined,
        )
      )
        return null;
      return await new Promise((resolve) =>
        target.toBlob(resolve, "image/png"),
      );
    }
    const code = svg.value.cloneNode(true) as SVGSVGElement;
    code.removeAttribute("hidden");
    code.removeAttribute("aria-hidden");
    code.setAttribute("width", String(edge));
    code.setAttribute("height", String(edge));
    code.querySelector("path[data-qr-modules]")?.setAttribute("d", path.value);
    code.querySelector("path[data-qr-modules]")?.setAttribute("fill", ink);
    code.querySelector("rect")?.setAttribute("fill", paper);
    const embedded = code.querySelector("image");
    if (embedded && image.value) {
      const target = document.createElement("canvas");
      const ratio = Math.min(
        1,
        512 / Math.max(image.value.naturalWidth, image.value.naturalHeight),
      );
      target.width = Math.max(1, Math.round(image.value.naturalWidth * ratio));
      target.height = Math.max(
        1,
        Math.round(image.value.naturalHeight * ratio),
      );
      const context = target.getContext("2d");
      if (!context) return null;
      context.drawImage(image.value, 0, 0, target.width, target.height);
      embedded.setAttribute("href", target.toDataURL("image/png"));
    }
    return new Blob([new XMLSerializer().serializeToString(code)], {
      type: "image/svg+xml;charset=utf-8",
    });
  } catch {
    return null;
  }
}
const copying = ref(false);
const copyNotice = ref("");
watch([() => props.value, () => props.status], () => { copyNotice.value = ""; });
/** 将当前二维码以 PNG 写入剪贴板，成功时返回 true。 */
async function copyImage() {
  if (copying.value || !symbol.value || props.status !== "active") return false;
  copying.value = true;
  copyNotice.value = "";
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") throw new Error("浏览器不支持复制图片");
    const png = exportImage("png").then(blob => {
      if (!blob) throw new Error("无法生成图片");
      return blob;
    });
    // Clipboard writes may be rejected before the browser reads the PNG.
    void png.catch(() => undefined);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    copyNotice.value = "已复制图片";
    emit("copyImage");
    return true;
  } catch (error) {
    copyNotice.value = "复制图片失败";
    emit("copyError", error);
    return false;
  } finally {
    copying.value = false;
  }
}
defineExpose({ exportImage, copyImage });
</script>

<template>
  <div
    v-bind="skin"
    class="hys-qr-code"
    :style="{ inlineSize: pixels + 'px' }"
    :data-status="status"
  >
    <div
      class="hys-qr-frame"
      :class="{ 'is-bordered': bordered }"
      :aria-busy="status === 'loading' || undefined"
    >
      <svg
        v-if="symbol"
        ref="svg"
        :hidden="type === 'canvas' ? true : undefined"
        role="img"
        :aria-label="ariaLabel"
        :aria-hidden="status !== 'active' || type === 'canvas' || undefined"
        :viewBox="'0 0 ' + extent + ' ' + extent"
        :shape-rendering="styled ? undefined : 'crispEdges'"
      >
        <rect :width="extent" :height="extent" :fill="background" />
        <path
          data-qr-modules
          :d="type === 'svg' ? path : undefined"
          :fill="foreground"
        />
        <template v-if="logo">
          <defs>
            <clipPath :id="clipId"><path :d="logo.clip" /></clipPath>
          </defs>
          <image
            :href="logoSource"
            :x="logo.x"
            :y="logo.y"
            :width="logo.size"
            :height="logo.size"
            :clip-path="'url(#' + clipId + ')'"
          />
        </template>
      </svg>
      <canvas
        v-if="symbol && type === 'canvas'"
        ref="canvas"
        role="img"
        :aria-label="ariaLabel"
        :aria-hidden="status !== 'active' || undefined"
      />
      <img
        v-if="symbol && logoSource"
        :key="logoSource + ':' + anonymous"
        ref="image"
        :src="logoSource"
        :crossorigin="anonymous ? 'anonymous' : undefined"
        alt=""
        hidden
        @load="logoLoad"
        @error="logoError"
      />
      <div
        v-if="!symbol && status === 'active'"
        class="hys-qr-placeholder"
        role="status"
      >
        <slot name="empty" :reason="value ? 'capacity' : 'empty'">
          <Grid2X2 :size="20" aria-hidden="true" /><span>{{
            value ? labels.capacity : labels.empty
          }}</span>
        </slot>
      </div>
      <div v-if="status !== 'active'" class="hys-qr-state">
        <slot name="status" :status="status" :refresh="refresh">
          <HysSpin
            v-if="status === 'loading'"
            size="sm"
            :text="labels.loading"
          />
          <template v-else-if="status === 'expired'">
            <span role="status">{{ labels.expired }}</span>
            <HysButton
              size="sm"
              variant="text"
              :icon="RefreshCw"
              @click="refresh"
              >{{ labels.refresh }}</HysButton
            >
          </template>
          <span v-else class="hys-qr-scanned" role="status"
            ><CircleCheck :size="18" aria-hidden="true" />{{
              labels.scanned
            }}</span
          >
        </slot>
      </div>
    </div>
    <slot
      v-if="symbol"
      name="details"
      :modules="symbol.matrix.length"
      :version="symbol.version"
      :correction="correction"
    />
    <div v-if="copyable && status === 'active' && symbol" class="hys-qr-copy">
      <HysButton size="sm" variant="text" :loading="copying" @click="copyImage">复制图片</HysButton>
      <span aria-live="polite">{{ copyNotice }}</span>
    </div>
  </div>
</template>

<style scoped>
.hys-qr-code {
  max-inline-size: 100%;
  display: grid;
  gap: 4px;
  color: var(--hys-ui-theme-muted);
}
.hys-qr-copy { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 12px; }
.hys-qr-frame {
  position: relative;
  aspect-ratio: 1;
}
.hys-qr-frame.is-bordered {
  outline: 1px solid var(--hys-ui-theme-border);
  border-radius: 8px;
}
.hys-qr-frame > svg:not([hidden]),
.hys-qr-frame > canvas {
  display: block;
  width: 100%;
  height: auto;
  border-radius: inherit;
}
.hys-qr-frame > svg[hidden] {
  display: none;
}
.hys-qr-frame > canvas {
  image-rendering: pixelated;
}
.hys-qr-placeholder,
.hys-qr-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.hys-qr-state {
  background: var(--hys-ui-theme-surface);
  color: var(--hys-ui-theme-text);
}
.hys-qr-scanned {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--hys-ui-theme-green);
}
</style>
