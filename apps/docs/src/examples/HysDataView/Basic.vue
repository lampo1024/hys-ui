<script setup lang="ts">
import { ref } from "vue";
import { HysBadge, HysButton, HysDataView } from "hys-ui";
const projects = [
  { id: 1, name: "配送轨迹", owner: "林宁", state: "进行中" },
  { id: 2, name: "客户交接手册", owner: "周悦", state: "已发布" },
  { id: 3, name: "月结对账", owner: "陈晨", state: "待审核" },
];
const opened = ref("");
</script>

<template>
  <div class="demo-stack">
    <HysDataView :items="projects" item-key="id">
      <template #toolbar><strong>项目空间</strong></template>
      <template #list-item="{ item }">
        <div class="demo-row">
          <HysButton variant="text" size="sm" @click="opened = item.name">{{
            item.name
          }}</HysButton>
          <span>{{ item.owner }}</span>
          <HysBadge>{{ item.state }}</HysBadge>
        </div>
      </template>
      <template #grid-item="{ item }">
        <div class="demo-stack">
          <strong>{{ item.name }}</strong>
          <span>负责人 · {{ item.owner }}</span>
          <div class="demo-row">
            <HysBadge>{{ item.state }}</HysBadge
            ><HysButton variant="ghost" size="sm" @click="opened = item.name"
              >查看</HysButton
            >
          </div>
        </div>
      </template>
    </HysDataView>
    <span role="status">{{
      opened ? "当前项目 · " + opened : "选择项目查看"
    }}</span>
  </div>
</template>
