<script setup lang="ts">
import { ref } from "vue";
import { HysTable, type HysTableColumn } from "hys-ui";

const scrollContainer = ref<HTMLElement>();
const sticky = {
  offsetHeader: 8,
  offsetScroll: 8,
  getContainer: () => scrollContainer.value,
};
const rows = Array.from({ length: 18 }, (_, index) => ({
  id: index + 1,
  task: `任务 ${index + 1}`,
  description: "核对执行计划和交付记录",
  owner: ["设计组", "研发组", "质量组"][index % 3],
}));
const columns: HysTableColumn<(typeof rows)[number]>[] = [
  { key: "id", label: "编号", width: 76, fixed: "left" },
  {
    key: "details",
    label: "任务明细",
    children: [
      { key: "task", label: "名称", width: 260 },
      { key: "description", label: "说明", width: 620 },
    ],
  },
  { key: "owner", label: "负责团队", width: 140, fixed: "right" },
];
</script>

<template>
  <div class="demo-stack">
    <div
      ref="scrollContainer"
      class="sticky-demo-scroll"
      tabindex="0"
      aria-label="任务列表滚动容器"
    >
      <HysTable
        :rows="rows"
        :columns="columns"
        :sticky="sticky"
        :native-scrollbar="false"
      />
    </div>
    <p class="scenario-note">
      在容器内纵向滚动。多级表头和横向滚动条分别固定在顶部和底部，水平滚动时两侧固定列保持位置。
    </p>
  </div>
</template>

<style scoped>
.sticky-demo-scroll {
  height: 300px;
  overflow-y: auto;
}
</style>
