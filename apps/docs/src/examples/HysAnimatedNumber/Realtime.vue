<script setup lang="ts">
import {
  onBeforeUnmount,
  onDeactivated,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysCheckbox,
  HysSelect,
  type HysAnimatedNumberInstance,
  type HysNumberInterrupt,
} from "hys-ui";

const metric = useTemplateRef<HysAnimatedNumberInstance>("metric");
const value = ref(1130);
const running = ref(false);
const policy = ref<HysNumberInterrupt>("retarget");
const updates = ref(0);
const settled = ref(0);
const strategies = [
  { value: "retarget", label: "平滑衔接" },
  { value: "restart", label: "从起点重播" },
  { value: "queue", label: "依次排队" },
  { value: "snap", label: "立即显示" },
];
let timer: ReturnType<typeof setInterval> | undefined;
function next() {
  const offset = [18, -13, 27, -8, 52, -36][updates.value % 6];
  updates.value++;
  metric.value?.setValue(value.value + offset);
}
watch(running, (enabled) => {
  clearInterval(timer);
  if (enabled) {
    next();
    timer = setInterval(next, 160);
  }
});
onDeactivated(() => {
  running.value = false;
  clearInterval(timer);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="demo-field"
        >更新策略<HysSelect v-model="policy" :options="strategies"
      /></label>
      <HysCheckbox v-model="running" label="每 160 ms 推送数据" />
      <HysButton size="sm" variant="secondary" @click="next"
        >推送一条</HysButton
      >
    </div>
    <HysAnimatedNumber
      ref="metric"
      v-model="value"
      title="实时请求数"
      group-separator=","
      :duration="520"
      :interrupt="policy"
      :update-interval="180"
      :queue-limit="5"
      :fps="30"
      :change-threshold="35"
      :threshold-effect="['highlight', 'flash']"
      color-by-direction
      stable-width
      :value-style="{ fontSize: '2rem', fontWeight: 650 }"
      @end="settled++"
    >
      <template #trend="{ direction, delta, percent, significant }">
        <span v-if="delta !== '0'" class="trend">
          {{ direction === "up" ? "↑" : "↓" }} {{ delta }} ·
          {{ percent === null ? "无基准" : percent + "%" }}
          <strong v-if="significant">显著变化</strong>
        </span>
      </template>
    </HysAnimatedNumber>
    <output
      >目标 {{ value }} · 已推送 {{ updates }} 次 · 已完成
      {{ settled }} 次</output
    >
  </div>
</template>

<style scoped>
.trend {
  color: var(--docs-muted);
  font-size: 0.8rem;
}
.trend strong {
  margin-inline-start: 0.4rem;
  color: var(--docs-text);
  font-weight: 600;
}
</style>
