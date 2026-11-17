<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysSelect, HysStatistic } from "hys-ui";
const locale = ref("zh-CN");
const grouping = ref(true);
const options = [
  { value: "zh-CN", label: "中文（中国）" },
  { value: "de-DE", label: "德语（德国）" },
  { value: "en-IN", label: "英语（印度）" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysSelect
        v-model="locale"
        :options="options"
        aria-label="地区格式"
        style="width: 164px"
      />
      <HysCheckbox v-model="grouping">数字分组</HysCheckbox>
    </div>
    <HysStatistic
      title="待核对金额"
      value="-12345678901234567.89"
      :locale="locale"
      :grouping="grouping"
      :precision="2"
      suffix=" CNY"
    />
  </div>
</template>
