<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysTimePicker } from "hys-ui";
const value = ref<string | null>("16:30");
const localFormat = ref(true);
const field = ref<InstanceType<typeof HysTimePicker>>();
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="localFormat">显示 12 小时制</HysCheckbox>
    <div class="demo-row">
      <HysTimePicker
        ref="field"
        v-model="value"
        :twelve-hour="localFormat"
        aria-label="访客到达时间"
      />
      <HysButton size="sm" variant="secondary" @click="field?.openPanel()"
        >选择到达时间</HysButton
      >
    </div>
    <span role="status">提交给业务的时间 · {{ value ?? "未设置" }}</span>
    <small>可输入 04:30 PM、12:00 AM 或 16:30，然后按 Enter。</small>
  </div>
</template>
