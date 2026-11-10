<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysInput,
  HysModal,
  type HysModalInstance,
} from "hys-ui";
const open = ref(false),
  safe = ref(true),
  modal = ref<HysModalInstance>();
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="safe" label="越界时保留可见移动手柄" /><HysButton
      @click="open = true"
      >查看边界与位置恢复</HysButton
    ><HysButton variant="secondary" @click="modal?.resetPosition()"
      >从宿主恢复位置</HysButton
    >
  </div>
  <HysModal
    ref="modal"
    v-model:open="open"
    title="可找回的工作面板"
    draggable
    resizable
    overflow
    :keep-handle-visible="safe"
    footer
    :width="640"
    :height="400"
  >
    <p>
      可从顶部居中的移动手柄拖动，让内容向两侧越界，默认保留移动手柄在视口边缘。缩小浏览器窗口后会自动调整到可继续拖动的位置。
    </p>
    <HysInput placeholder="在此输入框聚焦后按 Alt + Home 复位" />
    <div class="demo-content">
      <HysButton variant="secondary" @click="modal?.resetPosition()"
        >平滑恢复位置</HysButton
      ><HysButton variant="secondary" @click="modal?.resetSize()"
        >平滑恢复尺寸</HysButton
      >
    </div>
  </HysModal>
</template>
