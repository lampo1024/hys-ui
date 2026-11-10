<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysSelect,
  HysModal,
  type HysModalInstance,
  type HysModalDragEffect,
} from "hys-ui";
const open = ref(false),
  overflow = ref(false),
  effect = ref<HysModalDragEffect>("lift"),
  mode = ref<"live" | "preview">("live"),
  modal = ref<HysModalInstance>();
</script>
<template>
  <div class="demo-content">
    <HysSelect
      v-model="mode"
      style="width: 220px"
      :options="[
        { label: '直接跟手', value: 'live' },
        { label: '预览框定位', value: 'preview' },
      ]"
    />
    <HysSelect
      v-model="effect"
      style="width: 220px"
      :options="[
        { label: '柔和抬升', value: 'lift' },
        { label: '边缘高亮', value: 'outline' },
        { label: '主题柔光', value: 'glow' },
        { label: '悬浮投影', value: 'shadow' },
        { label: '半透明移动', value: 'ghost' },
        { label: '关闭特效', value: 'none' },
      ]"
    />
    <HysCheckbox v-model="overflow" label="允许超出视口" /><HysButton
      @click="open = true"
      >打开可调整弹窗</HysButton
    >
  </div>
  <HysModal
    ref="modal"
    v-model:open="open"
    title="可移动工作面板"
    draggable
    :drag-mode="mode"
    :drag-effect="effect"
    resizable
    show-fullscreen
    :overflow="overflow"
    :min-width="360"
    :min-height="240"
    :width="620"
    :height="400"
    footer
  >
    <p>
      从标题左侧手柄拖动位置，从右下角拖动尺寸。默认限制在可见视口内；拖动过程中按
      Esc 可撤销本次移动。
    </p>
    <ul>
      <li>双击手柄或 Alt + Home：恢复位置。</li>
      <li>移动手柄聚焦后 Alt + 方向键：每次移动 10px，Shift 加速。</li>
      <li>尺寸手柄聚焦后方向键：微调大小，Home 恢复尺寸。</li>
    </ul>
    <div class="demo-content">
      <HysButton variant="secondary" @click="modal?.resetPosition()"
        >恢复位置</HysButton
      ><HysButton variant="secondary" @click="modal?.resetSize()"
        >恢复尺寸</HysButton
      >
    </div>
  </HysModal>
</template>
