<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysDrawer } from "hys-ui";
const open = ref(false);
</script>
<template>
  <div class="demo-content">
    <HysButton @click="open = true">打开抽屉</HysButton
    ><HysDrawer :open="open" title="详情" @close="open = false"
      ><p>右侧详情面板</p>
      <template #footer
        ><HysButton @click="open = false">完成</HysButton></template
      ></HysDrawer
    >
  </div>
</template>
