<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysCheckbox,
  HysEmpty,
  HysTreeTable,
  type HysTableColumn,
} from "hys-ui";
type Team = { id: string; label: string; duty: string; children?: Team[] };
const groups: Team[] = Array.from({ length: 6 }, (_, region) => ({
  id: `R${region}`,
  label: `服务区 ${region + 1}`,
  duty: "区域服务",
  children: Array.from({ length: 5 }, (_, team) => ({
    id: `R${region}-T${team}`,
    label: `班组 ${team + 1}`,
    duty: "排班与支持",
    children: Array.from({ length: 3 }, (_, task) => ({
      id: `R${region}-T${team}-S${task}`,
      label: ["需求汇总", "异常转派", "回访跟踪"][task],
      duty: "值班工单",
    })),
  })),
}));
const columns: HysTableColumn<Team>[] = [
  { key: "label", label: "队列", minWidth: 154 },
  { key: "duty", label: "职责", minWidth: 115 },
];
const empty = ref(false);
const rows = computed(() => (empty.value ? [] : groups));
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="empty">模拟没有匹配的服务队列</HysCheckbox>
    <HysTreeTable
      :data="rows"
      :columns="columns"
      :max-height="315"
      :scroll-width="300"
      default-expand-all
    >
      <template #empty
        ><HysEmpty description="当前条件下没有可浏览的队列"
      /></template>
    </HysTreeTable>
  </div>
</template>
