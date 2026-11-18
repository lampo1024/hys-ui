<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";

export interface HysWatermarkProps {
  /** 单行或多行平铺文字。字符串中的换行符也会拆成多行。 */
  text?: string | readonly string[];
  /** 图片可用时同一块图案同时显示文字与图片。 */
  combine?: boolean;
  /** 覆盖层层级，默认 1。 */
  zIndex?: number;
  /** 是否保留水印用于打印，默认 true。 */
  print?: boolean;
  /** 覆盖层节点被意外移除时恢复它。默认 false。 */
  maintain?: boolean;
  /** 水印图片 URL。跨域图片需要允许 Canvas 读取。 */
  image?: string;
  /** 每块图案的横纵尺寸（像素），默认 [160, 88]。 */
  size?: readonly [number, number];
  /** 相邻图案的横纵间距（像素），默认 [40, 24]。 */
  gap?: readonly [number, number];
  /** 起始偏移（像素），默认 [0, 0]。 */
  offset?: readonly [number, number];
  /** 转角，单位度，默认 -22。 */
  rotate?: number;
  /** 水印透明度，范围 0–1，默认 0.2。 */
  opacity?: number;
  /** 自定义文字字号（像素），默认 15。 */
  fontSize?: number;
  /** 自定义字体。 */
  fontFamily?: string;
  /** 文字颜色，默认跟随主题正文色。 */
  color?: string;
}
const props = withDefaults(defineProps<HysWatermarkProps>(), {
  size: () => [160, 88], gap: () => [40, 24], offset: () => [0, 0],
  rotate: -22, opacity: .2, fontSize: 15, fontFamily: "sans-serif", zIndex: 1, print: true,
});
defineSlots<{
  /** 被水印覆盖且仍可操作的内容。 */
  default?: () => VNodeChild;
}>();
const skin = useHysRootAttrs();
const root = ref<HTMLElement>();
const tile = ref<HTMLElement>();
const mounted = ref(false);
let observer: MutationObserver | undefined;
const imageSource = ref("");
let request = 0;
const bound = (value: number, fallback: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
const width = computed(() => bound(props.size[0], 160, 1, 1024));
const height = computed(() => bound(props.size[1], 88, 1, 1024));
const tileWidth = computed(() => Math.ceil(width.value + bound(props.gap[0], 40, 0, 1024)));
const tileHeight = computed(() => Math.ceil(height.value + bound(props.gap[1], 24, 0, 1024)));
const angle = computed(() => bound(props.rotate, -22, -360, 360));
const alpha = computed(() => bound(props.opacity, .2, 0, 1));
const fontSizePx = computed(() => bound(props.fontSize, 15, 1, 120));
const themedColor = ref("#172640");
const lines = computed(() => typeof props.text === "string" ? props.text.split(/\r\n|\r|\n/) : props.text ?? []);
const ink = computed(() => props.color ?? themedColor.value);
const lineHeight = computed(() => fontSizePx.value * 1.3);
function escape(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
}
const backgroundStyle = computed(() => ({
  backgroundImage: "url(" + JSON.stringify(imageSource.value || textTile.value) + ")",
  backgroundPosition: props.offset[0] + "px " + props.offset[1] + "px",
  zIndex: props.zIndex,
}));
const textTile = computed(() => {
  if (!lines.value.some(Boolean)) return "";
  const xml = '<svg xmlns="http://www.w3.org/2000/svg" width="' + tileWidth.value + '" height="' + tileHeight.value + '">' +
    '<text text-anchor="middle" dominant-baseline="central" x="' + width.value / 2 + '" y="' + height.value / 2 +
    '" transform="rotate(' + angle.value + ' ' + width.value / 2 + ' ' + height.value / 2 + ')" fill="' +
    escape(ink.value) + '" fill-opacity="' + alpha.value + '" font-family="' + escape(props.fontFamily) +
    '" font-size="' + fontSizePx.value + '">' + lines.value.map((line, index) =>
      '<tspan x="' + width.value / 2 + '" y="' + (height.value / 2 + (index - (lines.value.length - 1) / 2) * lineHeight.value) + '">' + escape(line) + '</tspan>',
    ).join("") + '</text></svg>';
  return "data:image/svg+xml," + encodeURIComponent(xml.replace(/[\uD800-\uDFFF]/gu, "\ufffd"));
});
function build() {
  const revision = ++request;
  imageSource.value = "";
  if (!mounted.value) return;
  if (root.value) themedColor.value = getComputedStyle(root.value).color;
  if (!props.image) return;
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    if (revision !== request || !mounted.value || !image.naturalWidth || !image.naturalHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = tileWidth.value;
    canvas.height = tileHeight.value;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const caption = props.combine ? lines.value : [];
    const captionHeight = Math.min(height.value / 2, lineHeight.value * caption.length);
    const scale = Math.min(width.value / image.naturalWidth, (height.value - captionHeight) / image.naturalHeight);
    ctx.translate(width.value / 2, height.value / 2);
    ctx.rotate(angle.value * Math.PI / 180);
    ctx.globalAlpha = alpha.value;
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    ctx.drawImage(image, -w / 2, -h / 2 - captionHeight / 2, w, h);
    if (captionHeight > 0) {
      const step = captionHeight / caption.length;
      ctx.fillStyle = ink.value;
      ctx.font = Math.min(fontSizePx.value, step / 1.3) + "px " + props.fontFamily;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      caption.forEach((line, index) => ctx.fillText(line, 0, height.value / 2 - captionHeight + step * (index + .5), width.value));
    }
    try { imageSource.value = canvas.toDataURL(); } catch { /* A restricted image leaves the text watermark available. */ }
  };
  image.src = props.image;
}
function observe() {
  observer?.disconnect();
  const node = root.value;
  if (!mounted.value || !props.maintain || !node || typeof MutationObserver === "undefined") return;
  observer = new MutationObserver(() => {
    if (tile.value && tile.value.parentNode !== node) node.append(tile.value);
  });
  observer.observe(node, { childList: true });
}
onMounted(() => { mounted.value = true; build(); observe(); });
onBeforeUnmount(() => { mounted.value = false; observer?.disconnect(); request++; });
watch(() => props.maintain, observe);
watch(() => [props.image, tileWidth.value, tileHeight.value, width.value, height.value, angle.value, alpha.value, skin.value, lines.value, props.combine, props.fontFamily, props.fontSize, props.color], build, { flush: "post" });
</script>
<template>
  <div ref="root" v-bind="skin" class="hys-watermark">
    <slot />
    <div v-if="imageSource || textTile" ref="tile" class="tile" :class="{ 'no-print': !print }" aria-hidden="true"
      :style="backgroundStyle" />
  </div>
</template>
<style scoped>
.hys-watermark { position: relative; isolation: isolate; min-width: 0; color: var(--hys-ui-theme-text); }
.tile { position: absolute; inset: 0; pointer-events: none; background-repeat: repeat; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
@media print { .no-print { display: none; } }
</style>
