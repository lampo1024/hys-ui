<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker, HysButton } from "hys-ui";
const color = ref("rgba(56, 103, 245, 1)"),
  updates = ref(0);
</script>
<template>
  <div class="demo-stack">
    <HysColorPicker
      v-model="color"
      inline
      show-alpha
      label="连续拖动颜色"
      @update:model-value="updates++"
    />
    <div class="demo-control-actions">
      <HysButton variant="ghost" @click="updates = 0">重置更新计数</HysButton>
    </div>
    <output class="state-output"
      >模型更新 {{ updates }} 次 · {{ color }}</output
    >
    <p class="scenario-note">
      拖动开始时记录轨道位置，移动按动画帧合并，避免每次指针事件都读取布局。释放后校验一次；取消或离开页面会释放手势。
    </p>
  </div>
</template>
