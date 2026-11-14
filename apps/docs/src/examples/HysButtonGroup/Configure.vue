<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysButtonGroup, HysCheckbox } from "hys-ui";

const disabled = ref(false);
const joined = ref(true);
const action = ref("");
</script>

<template>
  <div class="button-group-demo">
    <HysCheckbox v-model="disabled" label="锁定操作" />
    <HysCheckbox v-model="joined" label="连接按钮" />
    <HysButtonGroup aria-label="文档操作" direction="vertical" variant="secondary" :disabled="disabled" :joined="joined" :gap="6">
      <HysButton @click="action = '已复制'">复制</HysButton>
      <HysButton @click="action = '已归档'">归档</HysButton>
      <HysButton danger @click="action = '已移除'">移除</HysButton>
    </HysButtonGroup>
    <output v-if="action" aria-live="polite">{{ action }}</output>
  </div>
</template>

<style scoped>
.button-group-demo { display: grid; justify-items: start; gap: 10px; }
</style>
