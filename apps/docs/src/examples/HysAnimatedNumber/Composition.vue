<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysButtonGroup,
  HysChart,
  HysProgress,
  HysSelect,
  useHysAnimatedNumber,
  useHysNumberAnimationGroup,
  type HysAnimatedNumberInstance,
} from "hys-ui";

const target = ref(62);
const timing = ref<"together" | "stagger" | "sequence">("stagger");
const modes = [
  { value: "together", label: "同时" },
  { value: "stagger", label: "交错" },
  { value: "sequence", label: "依次" },
];
const duration = 850;
const delay = (position: number) =>
  position * { together: 0, stagger: 160, sequence: duration }[timing.value];
const orders = useTemplateRef<HysAnimatedNumberInstance>("orders");
const sales = useTemplateRef<HysAnimatedNumberInstance>("sales");
const rate = useTemplateRef<HysAnimatedNumberInstance>("rate");
const report = useHysAnimatedNumber(() => ({
  value: target.value,
  duration,
  delay: delay(2),
  easing: "ease-in-out",
}));
const group = useHysNumberAnimationGroup(() => [
  orders.value,
  sales.value,
  rate.value,
  report,
]);
const current = computed(() => Math.round(Number(report.frame.value.value)));
const chart = computed(() => [
  { label: "上期", value: 62 },
  { label: "本期", value: current.value },
  { label: "目标", value: 100 },
]);
</script>

<template>
  <div class="demo-stack demo-interaction">
    <div class="demo-preview demo-input-toolbar">
      <label class="demo-toolbar-field">
        <span>播放顺序</span>
        <HysSelect v-model="timing" :options="modes" aria-label="播放顺序" />
      </label>
      <HysButton @click="target = target === 62 ? 86 : 62">
        切换报表数据
      </HysButton>
      <div class="demo-toolbar-options">
        <HysButtonGroup variant="secondary" aria-label="整组播放控制">
          <HysButton @click="group.pause()">暂停整组</HysButton>
          <HysButton @click="group.resume()">继续整组</HysButton>
        </HysButtonGroup>
      </div>
    </div>
    <div class="metrics">
      <HysAnimatedNumber
        ref="orders"
        title="已成交"
        :value="target * 125"
        :duration="duration"
        locale="zh-CN"
        suffix="单"
        effect="odometer"
        stable-width
      />
      <HysAnimatedNumber
        ref="sales"
        title="销售额"
        :value="target * 1640"
        :duration="duration"
        :delay="delay(1)"
        number-format="currency"
        :precision="0"
        locale="zh-CN"
        stable-width
      />
      <HysAnimatedNumber
        ref="rate"
        title="达成率"
        :value="target"
        :duration="duration"
        :delay="delay(2)"
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
@container (max-width: 407px) {
  .metrics > :last-child {
    grid-column: 1 / -1;
  }
}
</style>
