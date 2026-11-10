<script setup lang="ts">
import { ref } from "vue";
import { HysDrawer, HysButton, type HysDrawerInstance } from "hys-ui";
const open = ref(false),
  drawer = ref<HysDrawerInstance>();
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="open = true">全屏与还原</HysButton>
    </div>
    <HysDrawer
      ref="drawer"
      v-model:open="open"
      title="宽屏工作区"
      :width="680"
      show-fullscreen
      footer
      resizable
      ><div class="demo-stack">
        <p>
          点击标题栏中的全屏按钮，或通过实例方法切换。还原后保留原有尺寸；全屏期间隐藏边缘缩放手柄。
        </p>
        <div class="demo-control-actions">
          <HysButton size="sm" @click="drawer?.setFullscreen(true)"
            >切换全屏</HysButton
          ><HysButton size="sm" @click="drawer?.setFullscreen(false)"
            >还原布局</HysButton
          >
        </div>
      </div></HysDrawer
    >
  </div>
</template>
