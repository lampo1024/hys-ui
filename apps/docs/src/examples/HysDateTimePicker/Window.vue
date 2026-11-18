<script setup lang="ts">
import { ref } from "vue";
import { HysDateTimePicker, HysCheckbox } from "hys-ui";
const value = ref("2026-11-18 14:30");
const readonly = ref(false);
const min = new Date(2026, 10, 18, 9, 0);
const max = new Date(2026, 10, 18, 18, 0);
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="readonly">锁定已确认时间</HysCheckbox>
    <HysDateTimePicker v-model="value" :min="min" :max="max" :readonly="readonly" use12-hours :show-seconds="false" value-format="YYYY-MM-DD HH:mm"
      :shortcuts="[{ label: '午后交接', value: new Date(2026,10,18,14,30) }]" aria-label="轮班交接时间" />
    <small>可直接输入日期及上午或下午时间，例如 2026-11-18 02:30 PM。</small>
    <p aria-live="polite">提交值 {{ value || "未设置" }}</p>
  </div>
</template>
