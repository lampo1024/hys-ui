<script setup lang="ts">
import { ref } from "vue";
import {
  HysCheckbox,
  HysColorPicker,
  HysNumberInput,
  HysQRCode,
  HysSegmented,
  HysSelect,
  type HysQRCodeCorrection,
} from "hys-ui";
import brandMark from "../HysIcon/assets/metrics.svg";
const type = ref<"canvas" | "svg">("svg");
const level = ref<HysQRCodeCorrection>("H");
const bordered = ref(true);
const branded = ref(true);
const color = ref("#162c56");
const background = ref("#ffffff");
const size = ref<number | null>(176);
</script>
<template>
  <div class="demo-stack">
    <HysQRCode
      value="https://example.com/check-in"
      :type="type"
      :icon="branded ? brandMark : undefined"
      :icon-size="52"
      :error-level="level"
      :bordered="bordered"
      :color="color"
      :bg-color="background"
      :size="size ?? 176"
    />
    <div class="demo-row">
      <HysSegmented
        v-model="type"
        aria-label="二维码渲染方式"
        :options="[
          { label: 'SVG', value: 'svg' },
          { label: 'Canvas', value: 'canvas' },
        ]"
      />
      <HysSelect
        v-model="level"
        aria-label="纠错等级"
        :options="
          ['L', 'M', 'Q', 'H'].map((value) => ({
            label: '纠错 ' + value,
            value,
          }))
        "
      />
      <HysNumberInput v-model="size" :min="112" :max="240" label="显示尺寸" />
    </div>
    <div class="demo-row">
      <HysCheckbox v-model="branded">显示中心图标</HysCheckbox>
      <HysCheckbox v-model="bordered">显示边框</HysCheckbox>
      <HysColorPicker v-model="color" aria-label="二维码前景色" />
      <HysColorPicker v-model="background" aria-label="二维码背景色" />
    </div>
  </div>
</template>
