<script setup lang="ts">
import { ref } from "vue";
import { HysTimePicker, HysButton } from "hys-ui";
const time = ref<string | null>("14:30");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysTimePicker
        v-model="time"
        min-time="08:30"
        max-time="18:00"
        :minute-step="15"
        aria-label="交接时间"
      />
      <HysButton variant="ghost" @click="time = '08:30'"
        >安排首个时段</HysButton
      >
    </div>
    <p class="scenario-note">
      交接从 08:30 开始，每 15 分钟一个时段，最晚 18:00。
    </p>
  </div>
</template>
