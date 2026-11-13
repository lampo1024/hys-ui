<script setup lang="ts">
import { useId } from "vue";
import metricsUrl from "./assets/metrics.svg?no-inline";
import { CloudSun } from "lucide-vue-next";
import { HysIcon, type HysIconSource } from "hys-ui";
const symbol = useId() + "-icon-sprite";
const sources: { label: string; source: HysIconSource }[] = [
  {
    label: "结构化 SVG",
    source: {
      type: "svg",
      nodes: [
        {
          tag: "path",
          attrs: {
            d: "M4 18V9m5 9V5m6 13v-5m5 5V8",
            "stroke-linecap": "round",
          },
        },
      ],
    },
  },
  { label: "SVG Sprite", source: { type: "sprite", href: "#" + symbol } },
  { label: "外部 SVG 图片", source: { type: "image", src: metricsUrl } },
  {
    label: "IconFont 字形",
    source: { type: "font", glyph: "◆", family: "system-ui" },
  },
  { label: "Unicode", source: { type: "text", text: "∞" } },
  { label: "Emoji", source: { type: "text", text: "📊" } },
  { label: "Lucide 组件", source: { type: "component", component: CloudSun } },
];
</script>

<template>
  <div class="demo-stack">
    <svg width="0" height="0" aria-hidden="true" class="icon-example-sprite">
      <symbol :id="symbol" viewBox="0 0 24 24">
        <path
          d="M12 2 22 12 12 22 2 12Zm0 5-5 5 5 5 5-5Z"
          fill-rule="evenodd"
        />
      </symbol>
    </svg>
    <div class="icon-source-grid">
      <div v-for="item in sources" :key="item.label" class="demo-panel">
        <HysIcon :source="item.source" size="lg" />
        <span>{{ item.label }}</span>
      </div>
    </div>
    <p class="scenario-note">
      字体来源使用应用已加载的字体族或类名。外部 SVG 通过图片元素显示，可通过
      allowedOrigins 限制来源。
    </p>
  </div>
</template>

<style scoped>
.icon-example-sprite {
  position: absolute;
}
.icon-source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 116px), 1fr));
  gap: 8px;
}
.icon-source-grid :deep(.demo-panel) {
  display: grid;
  justify-items: center;
  gap: 9px;
  text-align: center;
  padding: 12px 8px;
  font-size: 12px;
}
</style>
