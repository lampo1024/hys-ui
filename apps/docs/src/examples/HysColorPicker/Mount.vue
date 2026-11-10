<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker, HysButton, type HysColorPickerInstance } from "hys-ui";
const color = ref("#3867f5"),
  api = ref<HysColorPickerInstance>();
</script>
<template>
  <div class="demo-stack">
    <div
      style="
        position: relative;
        min-height: 470px;
        padding: 20px;
        border: 1px dashed var(--hys-ui-border, var(--hys-ui-theme-border));
        border-radius: 12px;
      "
      class="color-mount-host"
    >
      <HysColorPicker
        ref="api"
        v-model="color"
        :append-to="false"
        placement="bottom-start"
        :popup-width="260"
        popup-class="color-contained-panel"
        label="容器内颜色"
      /><HysButton
        variant="ghost"
        size="sm"
        style="margin-top: 16px"
        @click="api?.show()"
        >打开容器内面板</HysButton
      >
    </div>
    <output class="state-output">{{ color }}</output>
    <p class="scenario-note">
      挂载在组件附近时，使用容器内坐标定位；父容器需要允许内容溢出。默认挂载到
      body，可避开普通容器裁剪。
    </p>
  </div>
</template>
