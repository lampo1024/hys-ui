<script setup lang="ts">
import { ref } from "vue";
import { HysCronEditor } from "hys-ui";

const expression = ref("30 2 * * *");
const zone = ref("America/New_York");
const start = ref<Date | null>(new Date("2026-03-07T00:00:00-05:00"));
</script>

<template>
  <div class="demo-stack">
    <HysCronEditor v-model="expression" v-model:time-zone="zone" v-model:preview-from="start" :preview-count="5" />
    <p class="scenario-note">纽约在 2026 年 3 月 8 日前拨时钟，02:30 不存在，因此当天没有匹配时间。切换为 UTC，或将预览起点改到其他日期，对照运行时间与时区偏移。</p>
  </div>
</template>
