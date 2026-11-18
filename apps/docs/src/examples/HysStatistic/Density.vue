<script setup lang="ts">
import { ref } from "vue";
import { HysStatistic, HysSelect } from "hys-ui";
const align = ref<"start" | "center" | "end">("start");
const options = [{ label: "靠左", value: "start" }, { label: "居中", value: "center" }, { label: "靠右", value: "end" }];
</script>

<template>
  <div class="demo-stack">
    <HysSelect v-model="align" :options="options" aria-label="统计对齐方式" />
    <HysStatistic :align="align" size="lg" title="已完成巡检" :value="1048" suffix="项" :comparison-value="1000" />
  </div>
</template>
