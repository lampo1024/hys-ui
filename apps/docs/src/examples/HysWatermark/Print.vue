<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysWatermark } from "hys-ui";
const print = ref(true);
const dense = ref(false);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox v-model="print">打印时显示水印</HysCheckbox>
      <HysCheckbox v-model="dense">增加水印密度</HysCheckbox>
    </div>
    <HysWatermark :text="['采购核对单', '供内审使用']" :size="[125, 80]" :gap="dense ? [4, 3] : [34, 24]" :print="print" maintain>
      <div style="padding: 28px; min-height: 150px"><strong>仓库物料核对</strong><p>核对办公用品、设备配件和培训物料的送达数量。</p></div>
    </HysWatermark>
  </div>
</template>
