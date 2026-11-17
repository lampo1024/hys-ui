<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysImageViewer } from "hys-ui";
import chart from "../../../../../docs/assets/readme/chart-combination.png";
const open = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div>
      <HysButton variant="secondary" @click="open = true"
        >预览图表截图</HysButton
      >
    </div>
    <HysImageViewer
      v-model:open="open"
      :images="{ src: chart, alt: '柱线组合图及图例', title: '图表截图' }"
    />
  </div>
</template>
