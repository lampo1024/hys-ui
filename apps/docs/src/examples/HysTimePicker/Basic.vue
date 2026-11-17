<script setup lang="ts">
import { ref } from "vue";
import { HysTimePicker } from "hys-ui";
const time = ref<string | null>("09:05");
</script>
<template>
  <div class="demo-stack">
    <HysTimePicker v-model="time" aria-label="提醒时间" />
    <span role="status">{{
      time ? "每日 " + time + " 发送提醒" : "未设置提醒"
    }}</span>
  </div>
</template>
