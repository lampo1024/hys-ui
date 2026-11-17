<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysTimePicker } from "hys-ui";
const time = ref<string | null>("23:58:40");
const locked = ref(false);
const disabled = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox v-model="locked">只读</HysCheckbox>
      <HysCheckbox v-model="disabled">禁用</HysCheckbox>
    </div>
    <HysTimePicker
      v-model="time"
      show-seconds
      :second-step="10"
      :readonly="locked"
      :disabled="disabled"
      min-time="23:55:00"
      max-time="23:59:50"
      aria-label="采集结束时间"
    />
    <span role="status">结束时间 · {{ time ?? "未设置" }}</span>
  </div>
</template>
