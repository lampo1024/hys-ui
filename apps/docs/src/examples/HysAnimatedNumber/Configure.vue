<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysCheckbox,
  HysNumberInput,
  HysSelect,
  type HysAnimatedNumberInstance,
  type HysNumberEasing,
} from "hys-ui";

const sample = useTemplateRef<HysAnimatedNumberInstance>("sample");
const duration = ref(900);
const delay = ref(120);
const speed = ref(1);
const disabled = ref(false);
const curve = ref("ease-out");
const curves: Record<string, HysNumberEasing> = {
  linear: "linear",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  spring: "spring",
  bounce: "bounce",
  bezier: [0.25, 0.85, 0.4, 1],
  custom: (progress) => progress ** 4,
};
const options = Object.keys(curves).map((value) => ({ label: value, value }));
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-fields">
      <label class="demo-field"
        >时长（ms）<HysNumberInput
          v-model="duration"
          :min="0"
          :max="5000"
          :step="100"
      /></label>
      <label class="demo-field"
        >延迟（ms）<HysNumberInput
          v-model="delay"
          :min="0"
          :max="2000"
          :step="100"
      /></label>
      <label class="demo-field"
        >速度倍率<HysNumberInput
          v-model="speed"
          :min="0.25"
          :max="4"
          :step="0.25"
      /></label>
      <label class="demo-field"
        >缓动<HysSelect v-model="curve" :options="options"
      /></label>
    </div>
    <div class="demo-control-actions">
      <HysAnimatedNumber
        ref="sample"
        trigger="manual"
        :from="-48"
        :value="120"
        :duration="duration"
        :delay="delay"
        :speed="speed"
        :easing="curves[curve]"
        :disabled="disabled"
        :value-style="{ fontSize: '2rem', fontWeight: 650 }"
        stable-width
      />
      <HysButton size="sm" @click="sample?.restart()">应用配置并播放</HysButton>
      <HysCheckbox v-model="disabled" label="关闭动画" />
    </div>
  </div>
</template>
