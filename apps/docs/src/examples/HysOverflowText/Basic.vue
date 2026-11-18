<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysOverflowText } from "hys-ui";
const narrow = ref(true);
const note = "本次交付包含华东地区三个仓库的入库记录、夜班签收凭证和待补充的温控信息。请在发货前更新异常明细，并通知当班负责人。";
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="narrow">窄列预览</HysCheckbox>
    <HysOverflowText :text="note" :lines="2" :max-width="narrow ? 192 : 620" expandable />
  </div>
</template>
