<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysIcon,
  HysNumberInput,
  HysSelect,
  hysIconAnimations,
  type HysIconAnimation,
  type HysIconSource,
  type HysIconStatus,
} from "hys-ui";
const selected = ref<HysIconAnimation>("spin"),
  trigger = ref<"always" | "hover" | "click" | "state">("always");
const speed = ref(1),
  status = ref<HysIconStatus>("default"),
  icon = ref<InstanceType<typeof HysIcon>>();
const square: HysIconSource = {
  type: "svg",
  nodes: [{ tag: "path", attrs: { d: "M5 5L19 5L19 19L5 19Z" } }],
};
const choices = hysIconAnimations.map((value) => ({ value, label: value }));
const triggers = [
  { value: "always", label: "立即播放" },
  { value: "hover", label: "悬停或聚焦" },
  { value: "click", label: "点击触发" },
  { value: "state", label: "状态变化" },
];
const states = [
  "default",
  "loading",
  "success",
  "error",
  "warning",
  "info",
] as const;
function nextState() {
  status.value =
    states[
      (states.indexOf(status.value as (typeof states)[number]) + 1) %
        states.length
    ];
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >动画<HysSelect
            v-model="selected"
            :options="choices"
            aria-label="图标动画"
        /></label>
        <label class="demo-field"
          >触发方式<HysSelect
            v-model="trigger"
            :options="triggers"
            aria-label="动画触发方式"
        /></label>
        <label class="demo-field"
          >速度倍数<HysNumberInput
            v-model="speed"
            :min="0.2"
            :max="4"
            :step="0.2"
        /></label>
      </div>
    </div>
    <div class="demo-panel demo-control-actions">
      <HysIcon
        ref="icon"
        name="refresh"
        :source="selected === 'morph' ? square : undefined"
        size="xl"
        label="图标动效预览"
        clickable
        :animation="selected"
        :animate-on="trigger"
        :speed="speed"
        :status="status"
        morph-to="M12 2L22 12L12 22L2 12Z"
        :gradient="selected === 'gradient' ? ['#3d82ee', '#d5569a'] : undefined"
      />
      <HysButton variant="secondary" @click="nextState">切换状态</HysButton>
      <HysButton variant="secondary" @click="icon?.pause()">暂停</HysButton>
      <HysButton variant="secondary" @click="icon?.resume()">继续</HysButton>
      <HysButton variant="secondary" @click="icon?.restart()">重播</HysButton>
      <HysButton variant="ghost" @click="icon?.stop()">停止</HysButton>
    </div>
    <output class="state-output">当前状态 {{ status }}</output>
  </div>
</template>
