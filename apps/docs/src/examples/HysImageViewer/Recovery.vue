<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysImageViewer } from "hys-ui";
import chart from "../../../../../docs/assets/readme/chart-combination.png";
const simulate = ref(true);
const open = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox v-model="simulate">模拟图源不可用</HysCheckbox>
      <HysButton variant="secondary" @click="open = true"
        >查看交付附件</HysButton
      >
    </div>
    <p class="scenario-note">
      可在预览中点击重试。关闭后取消「模拟图源不可用」，即可查看恢复后的图片。
    </p>
    <HysImageViewer
      v-model:open="open"
      title="交付附件"
      :images="simulate ? 'data:image/png;base64,invalid' : chart"
    />
  </div>
</template>
