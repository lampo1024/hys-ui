<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysSpace } from "hys-ui";
const showHelp = ref(true),
  stacked = ref(false);
const active = ref("概览");
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="showHelp" label="显示使用帮助" />
      <HysCheckbox v-model="stacked" label="改为竖排" />
    </div>
    <div class="demo-panel">
      <HysSpace
        :direction="stacked ? 'vertical' : 'horizontal'"
        :size="[8, 4]"
        align="center"
        wrap
      >
        <template #separator><span class="report-separator" /></template>
        <HysButton size="sm" variant="text" @click="active = '概览'"
          >概览</HysButton
        >
        <HysButton size="sm" variant="text" @click="active = '记录'"
          >记录</HysButton
        >
        <HysButton
          v-if="showHelp"
          size="sm"
          variant="text"
          @click="active = '帮助'"
          >帮助</HysButton
        >
      </HysSpace>
    </div>
    <output class="state-output" aria-live="polite"
      >当前查看 · {{ active }}</output
    >
  </div>
</template>

<style scoped>
.report-separator {
  display: block;
  inline-size: 3px;
  block-size: 3px;
  border-radius: 50%;
  background: currentColor;
}
</style>
