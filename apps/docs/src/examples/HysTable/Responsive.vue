<script setup lang="ts">
import { ref } from "vue";
import { HysTable, HysSlider, type HysTableColumn } from "hys-ui";
const width = ref(820);
const rows = [
  {
    id: 1,
    name: "陈晓",
    team: "设计",
    email: "chen@example.test",
    note: "正在进行设计交付",
  },
  {
    id: 2,
    name: "林夕",
    team: "研发",
    email: "lin@example.test",
    note: "正在开发组件",
  },
];
const columns: HysTableColumn<(typeof rows)[number]>[] = [
  { key: "name", label: "姓名", width: 120 },
  { key: "team", label: "团队", width: 100 },
  {
    key: "email",
    label: "邮箱",
    width: 240,
    responsive: ["md", "lg", "xl", "xxl"],
  },
  { key: "note", label: "说明", width: 230, responsive: ["lg", "xl", "xxl"] },
];
</script>
<template>
  <div>
    <label class="table-responsive-width"
      >容器宽度：{{ width }}px<HysSlider
        v-model="width"
        :min="280"
        :max="1100"
        :step="10"
    /></label>
    <div
      class="demo-content"
      :style="{ width: width + 'px', maxWidth: '100%', marginTop: '24px' }"
    >
      <HysTable :rows="rows" :columns="columns" />
    </div>
    <p class="scenario-note">
      responsive 按表格容器宽度匹配 xs / sm / md / lg / xl /
      xxl。缩小容器时隐藏次要信息，列选择与原始数据保留。
    </p>
  </div>
</template>
<style scoped>
.table-responsive-width {
  display: grid;
  gap: 14px;
  font-size: 12px;
  color: var(--docs-muted);
  max-width: 460px;
}
</style>
