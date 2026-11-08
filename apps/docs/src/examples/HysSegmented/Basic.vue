<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented } from "hys-ui";
const view = ref("week"),
  options = [
    { label: "日", value: "day" },
    { label: "周", value: "week" },
    { label: "月", value: "month" },
  ];
</script>
<template>
  <div class="demo-content">
    <div class="rating-demo-field">
      <span>切换视图</span
      ><HysSegmented v-model="view" :options="options" aria-label="视图选择" />
    </div>
    <div class="rating-demo-field">
      <span>非受控初值</span
      ><HysSegmented
        :options="['概览', '明细', '日志']"
        default-value="明细"
        aria-label="非受控分段"
      />
    </div>
    <output>{{ view }}</output>
  </div>
</template>
