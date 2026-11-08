<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysSlider, type HysSliderInstance } from "hys-ui";
const value = ref(30),
  slider = ref<HysSliderInstance>(),
  messages = ref<string[]>([]);
function record(name: string, value: number) {
  messages.value = [`${name}：${value}`, ...messages.value].slice(0, 4);
}
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton variant="secondary" size="sm" @click="slider?.focus()"
        >聚焦滑块</HysButton
      ><HysButton variant="secondary" size="sm" @click="slider?.setValue(50)"
        >设置为 50</HysButton
      >
    </div>
    <HysSlider
      ref="slider"
      v-model="value"
      label="键盘与事件"
      :step="5"
      @input="record('input', $event)"
      @change="record('change', $event)"
    />
    <output class="state-output" aria-live="polite">{{
      messages.join("\n") || "拖动、点击轨道或使用方向键，查看输入和确认事件。"
    }}</output>
    <p class="scenario-note">
      方向键调整一步，Shift + 方向键与 PageUp/PageDown 调整十步，Home/End
      定位边界。拖动期间按 Escape 撤销本次操作；change 在拖动释放后触发。
    </p>
  </div>
</template>
