<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysInput, HysModal, HysTable } from "hys-ui";
const open = ref(false),
  query = ref("");
const rows = Array.from({ length: 120 }, (_, index) => ({
  id: index + 1,
  name: `资源记录 ${String(index + 1).padStart(3, "0")}`,
  owner: ["张工", "李工", "王工"][index % 3],
}));
const columns = [
  { key: "id", label: "编号", width: 90 },
  { key: "name", label: "资源名称", width: 240 },
  { key: "owner", label: "负责人", width: 140 },
];
</script>
<template>
  <div class="demo-content">
    <HysButton @click="open = true">打开长列表工作区</HysButton>
  </div>
  <HysModal
    v-model:open="open"
    title="资源工作区"
    footer
    draggable
    resizable
    show-fullscreen
    :width="820"
    :height="620"
  >
    <div style="display: grid; gap: 18px">
      <HysInput v-model="query" placeholder="搜索资源名称" clearable /><HysTable
        :rows="rows.filter((row) => row.name.includes(query))"
        :columns="columns"
        :pagination="false"
      />
    </div>
  </HysModal>
</template>
