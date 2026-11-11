<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysCheckbox,
  HysSelect,
  type HysAnimatedNumberInstance,
  type HysNumberEffect,
} from "hys-ui";

const sample = useTemplateRef<HysAnimatedNumberInstance>("sample");
const selected = ref<HysNumberEffect>("odometer");
const axis = ref<"vertical" | "horizontal">("vertical");
const lowFirst = ref(false);
const combined = ref(false);
const pad = ref(true);
const options: { value: HysNumberEffect; label: string }[] = [
  { value: "count", label: "数值插值" },
  { value: "odometer", label: "里程表进退位" },
  { value: "wheel", label: "滚轮" },
  { value: "flip", label: "翻牌" },
  { value: "slot", label: "老虎机" },
  { value: "random", label: "随机跳动" },
  { value: "scramble", label: "随机滚轮定格" },
  { value: "appear", label: "逐位出现" },
  { value: "disappear", label: "逐位消失" },
  { value: "fade", label: "淡入淡出" },
  { value: "scale", label: "缩放" },
  { value: "bounce", label: "弹跳" },
  { value: "spring", label: "弹性" },
  { value: "slide", label: "滑入滑出" },
  { value: "blur", label: "模糊" },
  { value: "flash", label: "闪烁" },
  { value: "highlight", label: "高亮" },
  { value: "gradient", label: "颜色渐变" },
];
const effect = computed<HysNumberEffect[]>(() =>
  combined.value ? [selected.value, "scale", "highlight"] : [selected.value],
);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-preview">
      <HysAnimatedNumber
        ref="sample"
        trigger="manual"
        :from="998"
        :value="1012"
        :duration="1600"
        :effect="effect"
        :axis="axis"
        :stagger="90"
        :digit-duration="1250"
        :digit-order="lowFirst ? 'low-to-high' : 'high-to-low'"
        :minimum-integer-digits="pad ? 4 : 1"
        stable-width
        :value-style="{
          fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          fontWeight: 700,
          letterSpacing: '.07em',
        }"
      />
      <div class="demo-control-actions">
        <HysButton size="sm" @click="sample?.restart()">播放效果</HysButton>
        <HysButton size="sm" variant="secondary" @click="sample?.reverse()">
          反向播放
        </HysButton>
      </div>
    </div>
    <div class="demo-control-fields effect-fields">
      <label class="demo-field"
        >效果<HysSelect v-model="selected" :options="options"
      /></label>
      <label class="demo-field"
        >轴向<HysSelect
          v-model="axis"
          :options="[
            { value: 'vertical', label: '垂直' },
            { value: 'horizontal', label: '水平' },
          ]"
      /></label>
    </div>
    <div class="demo-control-actions">
      <HysCheckbox v-model="lowFirst" label="低位先动" />
      <HysCheckbox v-model="combined" label="叠加缩放和高亮" />
      <HysCheckbox v-model="pad" label="补齐四位" />
    </div>
  </div>
</template>

<style scoped>
.effect-fields {
  grid-template-columns: repeat(auto-fit, minmax(min(130px, 100%), 1fr));
  max-inline-size: 32rem;
  gap: 12px;
}
</style>
