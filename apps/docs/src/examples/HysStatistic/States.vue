<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented, HysStatistic } from "hys-ui";
const state = ref("ready");
const options = [
  { value: "ready", label: "有数据" },
  { value: "loading", label: "加载中" },
  { value: "empty", label: "无数据" },
];
</script>

<template>
  <div class="demo-stack">
    <HysSegmented v-model="state" :options="options" aria-label="指标状态" />
    <HysStatistic
      title="待同步记录"
      :value="state === 'empty' ? null : 0"
      :loading="state === 'loading'"
      empty-text="暂无记录"
      :formatter="(_value, text) => text + ' 条'"
      :trend="{ direction: 'flat', text: '与昨日一致' }"
    />
  </div>
</template>
