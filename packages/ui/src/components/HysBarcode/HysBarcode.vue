<script setup lang="ts">
import { computed, ref, watchPostEffect, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import { barcodeBars, encodeBarcode, type BarcodeFormat } from "./barcodeEncoding";

export type HysBarcodeFormat = BarcodeFormat;
export interface HysBarcodeProps {
  /** 待编码内容。零开头的商品编码请传字符串。 */
  value: string;
  /** CODE128、CODE39、EAN13、EAN8 或 UPCA，默认 CODE128。 */
  format?: HysBarcodeFormat;
  /** SVG 或 Canvas，默认 svg。 */
  type?: "svg" | "canvas";
  /** 期望总宽度（像素）。有效条宽始终为整数且不小于 moduleWidth。 */
  width?: number;
  /** 条纹的高度（像素），默认 72。 */
  height?: number;
  /** 最小单模块宽度（像素），默认 2。 */
  moduleWidth?: number;
  /** 两侧的静区模块数，默认 11，不低于所选标准所需宽度。 */
  margin?: number;
  /** 条纹颜色，默认深色。 */
  foreground?: string;
  /** 背景色，默认白色。 */
  background?: string;
  /** 显示含校验位的文字，默认 true。 */
  showValue?: boolean;
  /** 文字放在条纹上方或下方，默认 bottom。 */
  textPosition?: "top" | "bottom";
  /** 增加标签边框及内边距，打印时避免分页拆分。 */
  label?: boolean;
  /** 标签下方的补充说明。 */
  caption?: string;
}
const props = withDefaults(defineProps<HysBarcodeProps>(), {
  format: "CODE128", type: "svg", height: 72, moduleWidth: 2, margin: 11,
  foreground: "#171717", background: "#fff", showValue: true, textPosition: "bottom",
});
defineSlots<{
  /** 替换无效内容说明，reason 包含校验失败原因。 */
  invalid?: (scope: { reason: string }) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const result = computed(() => encodeBarcode(props.value, props.format));
const code = computed(() => "bits" in result.value ? result.value : undefined);
const error = computed(() => "error" in result.value ? result.value.error : "");
const quiet = computed(() => Math.max(props.format === "EAN8" ? 7 : props.format === "UPCA" ? 9 : 11, Math.min(64, Math.trunc(props.margin) || 0)));
const heightPx = computed(() => Math.max(12, Math.min(1024, Math.round(props.height) || 72)));
const units = computed(() => (code.value?.bits.length ?? 0) + 2 * quiet.value);
const scale = computed(() => Math.min(12, Math.max(1, Math.round(props.moduleWidth) || 2, Math.floor((props.width ?? 0) / units.value) || 0)));
const widthPx = computed(() => units.value * scale.value);
const bars = computed(() => barcodeBars(code.value?.bits ?? ""));
const canvas = ref<HTMLCanvasElement>();
watchPostEffect(() => {
  const context = canvas.value?.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, widthPx.value, heightPx.value);
  context.fillStyle = props.background;
  context.fillRect(0, 0, widthPx.value, heightPx.value);
  context.fillStyle = props.foreground;
  for (const bar of bars.value) {
    context.fillRect((quiet.value + bar.start) * scale.value, 0, bar.width * scale.value, heightPx.value);
  }
});
/** 导出包含条纹及编码的 PNG 或 SVG Blob，编码无效时返回 null。 */
async function exportImage(format: "svg" | "png" = "svg"): Promise<Blob | null> {
  if (!code.value || typeof document === "undefined") return null;
  const text = props.showValue ? code.value.value : "";
  const labelHeight = text ? 22 : 0;
  const height = heightPx.value + labelHeight;
  const y = props.textPosition === "top" ? labelHeight : 0;
  const textY = y ? labelHeight / 2 : height - labelHeight / 2;
  const ink = props.foreground;
  const paper = props.background;
  const width = widthPx.value;
  const scalePx = scale.value;
  const left = quiet.value;
  const rects = bars.value.map(bar => [(left + bar.start) * scalePx, bar.width * scalePx] as const);
  if (format === "png") {
    const target = document.createElement("canvas");
    target.width = width;
    target.height = height;
    const ctx = target.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = ink;
    for (const [x, w] of rects) ctx.fillRect(x, y, w, heightPx.value);
    if (text) {
      ctx.font = "13px monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(text, width / 2, textY, width);
    }
    return new Promise(resolve => target.toBlob(resolve, "image/png"));
  }
  const canvasNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(canvasNamespace, "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  function append(element: string, attrs: Record<string, string | number>, content?: string) {
    const node = document.createElementNS(canvasNamespace, element);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (content) node.textContent = content;
    svg.append(node);
  }
  append("rect", { width, height, fill: paper });
  for (const [x, w] of rects) append("rect", { x, y, width: w, height: heightPx.value, fill: ink });
  if (text) append("text", {
    x: width / 2, y: textY, fill: ink, "text-anchor": "middle", "dominant-baseline": "central",
    "font-family": "monospace", "font-size": 13,
  }, text);
  return new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
}
defineExpose({ exportImage });
</script>
<template>
  <div v-bind="skin" class="hys-barcode" :class="{ 'is-label': label }">
    <HysScrollbar v-if="code" direction="horizontal" aria-label="条形码">
      <figure :style="{ width: widthPx + 'px', background, color: foreground }" :data-position="textPosition">
        <svg v-if="type === 'svg'" :width="widthPx" :height="heightPx" :viewBox="'0 0 ' + widthPx + ' ' + heightPx"
          role="img" :aria-label="format + ' ' + code.value" shape-rendering="crispEdges">
          <rect :width="widthPx" :height="heightPx" :fill="background" />
          <rect v-for="bar in bars" :key="bar.start" :x="(quiet + bar.start) * scale" :width="bar.width * scale" :height="heightPx" :fill="foreground" />
        </svg>
        <canvas v-else ref="canvas" :width="widthPx" :height="heightPx" role="img" :aria-label="format + ' ' + code.value" />
        <figcaption v-if="showValue" class="barcode-value">{{ code.value }}</figcaption>
        <div v-if="caption" class="barcode-caption">{{ caption }}</div>
      </figure>
    </HysScrollbar>
    <p v-else class="invalid" role="status"><slot name="invalid" :reason="error">{{ error }}</slot></p>
  </div>
</template>
<style scoped>
.hys-barcode { min-width: 0; }
figure { display: flex; flex-direction: column; margin: 0; }
figure[data-position="top"] .barcode-value { order: -1; }
.is-label { border: 1px solid var(--hys-ui-theme-border); border-radius: var(--hys-ui-radius, 8px); padding: 8px; }
.barcode-caption { padding: 4px; font-size: 12px; text-align: center; }
@media print {
  .hys-barcode { break-inside: avoid; print-color-adjust: exact; }
  .hys-barcode.is-label { inline-size: fit-content; }
  .hys-barcode :deep(.hys-ui-scrollbar-viewport) { overflow: visible; }
  .hys-barcode :deep(.hys-ui-scrollbar-overlay) { display: none; }
}
svg, canvas { display: block; max-width: none; }
figcaption { padding: 3px; text-align: center; font: 13px ui-monospace, monospace; }
.invalid { margin: 0; padding: 8px; color: var(--hys-ui-theme-muted); }
</style>
