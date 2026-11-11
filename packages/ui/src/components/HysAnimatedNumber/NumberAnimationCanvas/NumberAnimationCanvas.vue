<script setup lang="ts">
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import type { HysAnimatedNumberContext } from "../../../composables/animatedNumber";
import type { ResolvedNumberAnimation } from "../../../composables/numberAnimation";
import {
  digitCount,
  numberTokens,
} from "../../../composables/animatedNumberDigits";
import type { NumberPresentation } from "../../../composables/animatedNumberFormat";
import { persistentDisplay } from "../animation/digital";
import {
  clamp,
  glyph,
  localProgress,
  type PaintFrame,
} from "../animation/paint";
import { paintNumberAnimation } from "../animation/render";

const props = defineProps<{
  current: NumberPresentation;
  start: NumberPresentation;
  end: NumberPresentation;
  glyphs: readonly string[];
  context: HysAnimatedNumberContext;
  plans: readonly ResolvedNumberAnimation[];
  digitPlans: Readonly<Record<string, readonly ResolvedNumberAnimation[]>>;
  intensity: number;
  motion: boolean;
  axis?: "vertical" | "horizontal";
  theme?: string;
}>();
const root = useTemplateRef<HTMLElement>("root");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const painted = ref(false);
const text = computed(() =>
  props.current.parts.map(({ value }) => value).join(""),
);
const fromTokens = computed(
  () =>
    new Map(
      numberTokens(props.start.parts, true).map(({ key, text }) => [key, text]),
    ),
);
const toTokens = computed(
  () =>
    new Map(
      numberTokens(props.end.parts, true).map(({ key, text }) => [key, text]),
    ),
);
let observer: ResizeObserver | undefined;
let mounted = false;

function draw() {
  const layer = canvas.value,
    host = root.value;
  const playing =
    ["playing", "paused"].includes(props.context.status) &&
    props.context.progress < 1;
  const digits = digitCount(props.current.parts);
  const canPaint =
    props.motion && props.intensity > 0 && digits <= 48 && digits > 0;
  if (
    !mounted ||
    !layer ||
    !host ||
    !canPaint ||
    typeof window.CanvasRenderingContext2D === "undefined"
  ) {
    painted.value = false;
    return;
  }
  const hasPersistent = [
    ...props.plans,
    ...Object.values(props.digitPlans).flat(),
  ].some(
    ({ entry }) =>
      entry?.category === "digital" && persistentDisplay(entry.variant),
  );
  if (!playing && !hasPersistent) {
    painted.value = false;
    return;
  }
  try {
    const ctx = layer.getContext("2d");
    const cssWidth = layer.clientWidth,
      cssHeight = layer.clientHeight;
    if (!ctx || !cssWidth || !cssHeight) {
      painted.value = false;
      return;
    }
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const physicalWidth = Math.round(cssWidth * dpr),
      physicalHeight = Math.round(cssHeight * dpr);
    if (layer.width !== physicalWidth) layer.width = physicalWidth;
    if (layer.height !== physicalHeight) layer.height = physicalHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    const style = getComputedStyle(host);
    const size = Number.parseFloat(style.fontSize) || 16;
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${size}px ${style.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const color = style.color;
    const accent =
      style.getPropertyValue("--hys-ui-theme-primary").trim() || color;
    const spacing = Number.parseFloat(style.letterSpacing) || 0;
    const tokens = numberTokens(props.current.parts, true);
    const digitWidth = Math.max(
      ...props.glyphs.map((digit) => ctx.measureText(digit).width),
    );
    const widths = tokens.map(
      ({ text, section }) =>
        (section ? digitWidth : ctx.measureText(text).width) + spacing,
    );
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    const scale =
      totalWidth > host.clientWidth + 1 && host.clientWidth > 0
        ? host.clientWidth / totalWidth
        : 1;
    let cursor = (cssWidth - totalWidth * scale) / 2;
    let index = 0;
    tokens.forEach((token, position) => {
      const width = widths[position];
      const cell = token.section ? index++ : 0;
      const own = token.section
        ? (props.digitPlans[`${token.section}:${token.position}`] ??
          props.digitPlans["*"])
        : undefined;
      const plans = own ?? props.plans;
      const enabled = plans.filter(
        ({ entry }) =>
          token.section ||
          (entry?.category === "data" && [3, 4, 5].includes(entry.variant)),
      );
      const from =
        fromTokens.value.get(token.key) ??
        (token.section ? props.glyphs[0] : token.text);
      const to = toTokens.value.get(token.key) ?? token.text;
      const base: Omit<
        PaintFrame,
        "plan" | "p" | "axis" | "seed" | "strength" | "cycles"
      > = {
        ctx,
        from,
        to,
        digit: token.text,
        section: token.section,
        glyphs: props.glyphs,
        fromIndex: Math.max(0, props.glyphs.indexOf(from)),
        toIndex: Math.max(0, props.glyphs.indexOf(to)),
        color,
        accent,
        size,
        width,
        count: digits,
        index: cell,
      };
      ctx.save();
      ctx.translate(cursor + (width * scale) / 2, cssHeight / 2);
      ctx.scale(scale, 1);
      const effective = playing
        ? enabled
        : enabled.filter(
            ({ entry }) =>
              entry?.category === "digital" && persistentDisplay(entry.variant),
          );
      if (!effective.length) {
        glyph(
          {
            ...base,
            p: 1,
            axis: props.axis ?? "vertical",
            seed: 0,
            strength: 1,
            cycles: 1,
            plan: {},
          },
          token.text,
        );
      }
      effective.forEach((plan, order) => {
        const p = playing
          ? clamp(
              plan.stagger
                ? localProgress(
                    props.context.progress,
                    cell,
                    digits,
                    plan.stagger,
                  )
                : props.context.easedProgress,
            )
          : 1;
        const strength = Math.min(2, (plan.strength ?? 1) * props.intensity);
        const stable =
          plan.entry?.category === "digital" &&
          persistentDisplay(plan.entry.variant);
        const frame: PaintFrame = {
          ...base,
          p,
          strength,
          plan,
          cycles: plan.cycles ?? 1,
          seed: (plan.seed ?? 37) + cell * 97,
          axis: plan.axis ?? props.axis ?? "vertical",
          to: !playing ? token.text : base.to,
          toIndex: !playing
            ? Math.max(0, props.glyphs.indexOf(token.text))
            : base.toIndex,
        };
        ctx.save();
        ctx.globalAlpha *= order === 0 ? 1 : 0.62;
        if (order === 0 && strength < 1)
          glyph(frame, token.text, { alpha: 1 - strength });
        ctx.globalAlpha *= Math.min(1, strength);
        if (strength > 0 && ((p > 0 && p < 1) || stable))
          paintNumberAnimation(frame);
        else glyph(frame, p === 0 ? from : p === 1 ? to : token.text);
        ctx.restore();
      });
      ctx.restore();
      cursor += width * scale;
    });
    painted.value = true;
  } catch {
    painted.value = false;
  }
}

function attach() {
  if (mounted) return;
  mounted = true;
  if (root.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(draw);
    observer.observe(root.value);
  }
  window.addEventListener("resize", draw);
  void document.fonts?.ready.then(draw);
  draw();
}
function detach() {
  mounted = false;
  observer?.disconnect();
  observer = undefined;
  window.removeEventListener("resize", draw);
}

watch(
  () => [
    props.current,
    props.start,
    props.end,
    props.context,
    props.plans,
    props.digitPlans,
    props.motion,
    props.intensity,
    props.axis,
    props.theme,
  ],
  draw,
  { flush: "post" },
);
onMounted(attach);
onActivated(attach);
onDeactivated(detach);
onBeforeUnmount(detach);
</script>

<template>
  <span
    ref="root"
    class="hys-number-canvas"
    :data-painted="painted ? '' : undefined"
  >
    <span class="hys-number-canvas-text">{{ text }}</span>
    <canvas ref="canvas" aria-hidden="true" />
  </span>
</template>

<style scoped>
.hys-number-canvas {
  display: inline-block;
  position: relative;
  max-inline-size: 100%;
  min-inline-size: 0;
  overflow: clip;
  overflow-clip-margin: 1em;
}
.hys-number-canvas-text {
  overflow-wrap: anywhere;
}
.hys-number-canvas canvas {
  position: absolute;
  inset: -0.85em -1em;
  inline-size: calc(100% + 2em);
  block-size: calc(100% + 1.7em);
  pointer-events: none;
  visibility: hidden;
}
.hys-number-canvas[data-painted] canvas {
  visibility: visible;
}
.hys-number-canvas[data-painted] .hys-number-canvas-text {
  opacity: 0;
}
</style>
