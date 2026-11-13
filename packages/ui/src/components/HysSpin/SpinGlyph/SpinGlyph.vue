<script setup lang="ts">
import { computed } from "vue";
import { useSvgInstanceId } from "../../../composables/useSvgInstanceId";
import type { HysSpinAnimation } from "../spinCatalog";
import type { HysSpinStatus } from "../spinTypes";

const props = defineProps<{
  animation: HysSpinAnimation;
  status: HysSpinStatus;
  progress?: number;
  stroke: number;
  dot: number;
  spacing: number;
  colors?: readonly string[];
  gradient?: readonly string[];
  path?: string;
}>();
const id = useSvgInstanceId("spin-gradient");
const gradient = computed(() =>
  props.gradient?.length ? props.gradient : ["currentColor", "currentColor"],
);
const color = (index: number) =>
  props.colors?.length
    ? props.colors[index % props.colors.length]
    : "currentColor";
const ring = computed(() => {
  switch (props.animation) {
    case "dual-ring":
      return [
        { r: 19, dash: "62 119" },
        { r: 12, dash: "41 75" },
      ];
    case "triple-ring":
      return [
        { r: 19, dash: "52 119" },
        { r: 12, dash: "33 75" },
        { r: 6, dash: "17 38" },
      ];
    case "segment":
      return [{ r: 19, dash: "16 13.8" }];
    case "arc":
      return [{ r: 19, dash: "78 119" }];
    default:
      return [{ r: 19, dash: "30 119" }];
  }
});
const rings = [
  "circle",
  "dual-ring",
  "triple-ring",
  "segment",
  "arc",
  "gradient",
  "progress-ring",
  "custom",
];
const row = ["bouncing-dots", "flashing-dots", "scaling-dots", "wave", "bars"];
const paths: Record<string, string> = {
  infinity:
    "M24 24c-5-7-8-11-13-11a9 9 0 0 0 0 18c5 0 8-4 13-11 5-7 8-11 13-11a9 9 0 0 1 0 18c-5 0-8-4-13-11Z",
  spiral:
    "M24 24a2 2 0 1 1 2 2 5 5 0 1 1-5-5 8 8 0 1 1 8 8 11 11 0 1 1-11-11 15 15 0 1 1 15 15 19 19 0 1 1-19-19",
  draw: "M6 27h8l4-12 7 21 6-15 4 6h7",
};
const finished = computed(() =>
  ["success", "error", "cancelled", "timeout"].includes(props.status),
);
</script>

<template>
  <svg
    class="hys-spin-glyph"
    :data-animation="animation"
    :data-status="status"
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs v-if="animation === 'gradient'">
      <linearGradient :id="id" x1="0" y1="1" x2="1" y2="0">
        <stop
          v-for="(entry, index) in gradient"
          :key="index"
          :offset="gradient.length === 1 ? 0 : index / (gradient.length - 1)"
          :stop-color="entry"
          :stop-opacity="!props.gradient?.length && index === 0 ? 0.14 : 1"
        />
      </linearGradient>
    </defs>
    <g
      v-if="finished"
      class="hys-spin-result"
      stroke="currentColor"
      :stroke-width="stroke"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="24" cy="24" r="19" opacity=".25" />
      <path v-if="status === 'success'" d="m14 24 7 7 13-15" />
      <path v-else-if="status === 'timeout'" d="M24 13v12l7 4" />
      <path v-else-if="status === 'cancelled'" d="m17 17 14 14m0-14L17 31" />
      <path v-else d="M24 14v12m0 7h.01" />
    </g>
    <g v-else-if="progress !== undefined">
      <circle
        cx="24"
        cy="24"
        r="19"
        :stroke-width="stroke"
        class="hys-spin-track"
      />
      <circle
        cx="24"
        cy="24"
        r="19"
        :stroke-width="stroke"
        stroke="currentColor"
        stroke-linecap="round"
        pathLength="100"
        :stroke-dasharray="progress + ' 100'"
        transform="rotate(-90 24 24)"
        class="hys-spin-meter"
      />
    </g>
    <g v-else-if="rings.includes(animation)" stroke-linecap="round">
      <circle
        v-if="ring.length === 1"
        cx="24"
        cy="24"
        r="19"
        :stroke-width="stroke"
        class="hys-spin-track"
      />
      <circle
        v-for="(layer, index) in ring"
        :key="layer.r"
        cx="24"
        cy="24"
        :r="layer.r"
        :stroke-width="stroke"
        :stroke="animation === 'gradient' ? 'url(#' + id + ')' : color(index)"
        :stroke-dasharray="layer.dash"
        class="hys-spin-rotate"
        :class="{ 'hys-spin-reverse': index % 2 }"
        :style="{ '--hys-spin-i': index }"
      />
    </g>
    <g v-else-if="animation === 'dot-spin'" class="hys-spin-rotate">
      <circle
        v-for="index in 8"
        :key="index"
        :cx="24 + Math.cos((index * Math.PI) / 4) * 17"
        :cy="24 + Math.sin((index * Math.PI) / 4) * 17"
        :r="dot * 0.78"
        :fill="color(index - 1)"
        :opacity="0.2 + index * 0.1"
      />
    </g>
    <g v-else-if="animation === 'dot-grid' || animation === 'grid'">
      <template v-for="index in 9" :key="index">
        <circle
          v-if="animation === 'dot-grid'"
          class="hys-spin-grid-cell"
          :cx="24 + (((index - 1) % 3) - 1) * spacing"
          :cy="24 + (Math.floor((index - 1) / 3) - 1) * spacing"
          :r="dot"
          :fill="color(index - 1)"
          :style="{ '--hys-spin-i': index - 1 }"
        />
        <rect
          v-else
          class="hys-spin-grid-cell"
          :x="24 + (((index - 1) % 3) - 1) * spacing - dot"
          :y="24 + (Math.floor((index - 1) / 3) - 1) * spacing - dot"
          :width="dot * 2"
          :height="dot * 2"
          rx="1.25"
          :fill="color(index - 1)"
          :style="{ '--hys-spin-i': index - 1 }"
        />
      </template>
    </g>
    <g v-else-if="row.includes(animation)">
      <template
        v-for="index in animation === 'wave' || animation === 'bars' ? 5 : 3"
        :key="index"
      >
        <rect
          v-if="animation === 'wave' || animation === 'bars'"
          class="hys-spin-row-item"
          :x="24 + (index - 3) * Math.min(spacing, 9) - 2"
          y="9"
          width="4"
          height="30"
          rx="2"
          :fill="color(index - 1)"
          :style="{ '--hys-spin-i': index - 1 }"
        />
        <circle
          v-else
          class="hys-spin-row-item"
          :cx="24 + (index - 2) * spacing"
          cy="24"
          :r="dot"
          :fill="color(index - 1)"
          :style="{ '--hys-spin-i': index - 1 }"
        />
      </template>
    </g>
    <g v-else-if="animation === 'orbit' || animation === 'chase'">
      <circle
        v-if="animation === 'orbit'"
        cx="24"
        cy="24"
        r="16"
        :stroke-width="stroke * 0.65"
        class="hys-spin-track"
      />
      <g
        v-for="index in animation === 'orbit' ? 2 : 3"
        :key="index"
        class="hys-spin-rotate hys-spin-orbit"
        :style="{ '--hys-spin-i': index - 1 }"
      >
        <circle
          :cx="animation === 'orbit' && index === 2 ? 32 : 24"
          :cy="8 + (animation === 'orbit' ? (index - 1) * 8 : 0)"
          :r="dot * (1 - (index - 1) * 0.1)"
          :fill="color(index - 1)"
        />
      </g>
    </g>
    <g v-else-if="animation === 'bar-spin'" class="hys-spin-rotate">
      <rect x="20" y="6" width="8" height="36" rx="4" fill="currentColor" />
      <rect
        x="6"
        y="20"
        width="36"
        height="8"
        rx="4"
        fill="currentColor"
        opacity=".36"
      />
    </g>
    <rect
      v-else-if="animation === 'square' || animation === 'cube-flip'"
      class="hys-spin-shape"
      x="10"
      y="10"
      width="28"
      height="28"
      rx="4"
      :fill="animation === 'square' ? 'none' : 'currentColor'"
      stroke="currentColor"
      :stroke-width="stroke"
    />
    <g v-else-if="animation === 'ripple'">
      <circle
        v-for="index in 2"
        :key="index"
        class="hys-spin-ripple"
        cx="24"
        cy="24"
        r="18"
        stroke="currentColor"
        :stroke-width="stroke"
        :style="{ '--hys-spin-i': index - 1 }"
      />
    </g>
    <circle
      v-else-if="animation === 'ball'"
      class="hys-spin-ball"
      cx="24"
      cy="26"
      :r="dot * 1.4"
      fill="currentColor"
    />
    <path
      v-else-if="animation === 'heartbeat'"
      class="hys-spin-beat"
      fill="currentColor"
      d="M24 40 8 24a9 9 0 0 1 16-9 9 9 0 0 1 16 9Z"
    />
    <circle
      v-else-if="animation === 'pulse' || animation === 'breathing'"
      class="hys-spin-rhythm"
      cx="24"
      cy="24"
      r="14"
      fill="currentColor"
    />
    <g v-else-if="animation === 'radar'">
      <circle
        v-for="r in [7, 13, 19]"
        :key="r"
        cx="24"
        cy="24"
        :r="r"
        class="hys-spin-track"
        :stroke-width="stroke / 2"
      />
      <path
        class="hys-spin-rotate"
        fill="currentColor"
        d="M24 24V5a19 19 0 0 1 17 11Z"
        opacity=".55"
      />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </g>
    <path
      v-else
      class="hys-spin-path"
      :d="path || paths[animation] || paths.draw"
      pathLength="100"
      stroke="currentColor"
      :stroke-width="stroke"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style src="./spinGlyph.css"></style>
