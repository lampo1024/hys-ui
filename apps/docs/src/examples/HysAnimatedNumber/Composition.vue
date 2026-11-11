<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysChart,
  HysCheckbox,
  HysProgress,
  useHysAnimatedNumber,
} from "hys-ui";

const target = ref(62);
const stagger = ref(true);
const report = useHysAnimatedNumber(() => ({
  value: target.value,
  duration: 850,
  easing: "ease-in-out",
}));
const current = computed(() => Math.round(Number(report.frame.value.value)));
const chart = computed(() => [
  { label: "上期", value: 62 },
  { label: "本期", value: current.value },
  { label: "目标", value: 100 },
]);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" @click="target = target === 62 ? 86 : 62"
        >切换报表数据</HysButton
      >
      <HysCheckbox v-model="stagger" label="指标交错播放" />
    </div>
    <div class="metrics">
      <HysAnimatedNumber
        title="已成交"
        :value="target * 125"
        locale="zh-CN"
        suffix="单"
        effect="odometer"
        stable-width
      />
      <HysAnimatedNumber
        title="销售额"
        :value="target * 1640"
        :delay="stagger ? 160 : 0"
        number-format="currency"
        :precision="0"
        locale="zh-CN"
        stable-width
      />
      <HysAnimatedNumber
        title="达成率"
        :value="target"
        :delay="stagger ? 320 : 0"
        number-format="percent"
        percent-input="points"
        stable-width
      />
    </div>
    <HysChart :data="chart" :height="115" />
    <HysProgress
      :value="current"
      :animated="false"
      aria-label="本期目标完成度"
    />
  </div>
</template>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(8rem, 100%), 1fr));
  gap: 12px;
}
.metrics > span {
  box-sizing: border-box;
  padding: 0.85rem;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 650;
}
</style>
