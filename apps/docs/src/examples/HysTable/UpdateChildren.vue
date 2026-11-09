<script setup lang="ts">
import { ref } from "vue";
import {
  HysTable,
  HysButton,
  type HysTableColumn,
  type HysTableInstance,
} from "hys-ui";
type Item = { id: number; name: string; hasChildren?: boolean };
const table = ref<HysTableInstance<Item>>(),
  message = ref("展开目录以加载任务");
const rows: Item[] = [{ id: 0, name: "本周交付", hasChildren: true }];
const columns: HysTableColumn<Item>[] = [
  { key: "id", label: "编号", width: 90 },
  { key: "name", label: "任务" },
];
async function replace() {
  const ok = await table.value?.updateKeyChildren(0, [
    { id: 11, name: "更新后的设计评审" },
    { id: 12, name: "新增联调任务" },
  ]);
  if (ok) {
    await table.value?.toggleRowExpansion(0, true);
    message.value = "已替换目录子项，原始 rows 保持不变";
  }
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" variant="secondary" @click="replace"
        >更新目录任务</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="table?.updateKeyChildren(0, [])"
        >清空子项</HysButton
      >
    </div>
    <div class="demo-content">
      <HysTable
        ref="table"
        :rows="rows"
        :columns="columns"
        tree-mode
        :load-children="async () => [{ id: 1, name: '初始任务' }]"
      />
    </div>
    <output class="state-output">{{ message }}</output>
    <p class="scenario-note">
      updateKeyChildren
      可刷新已加载子项或替换静态子项，不修改宿主对象；未结束的旧请求会被取消，防止旧结果覆盖新数据。
    </p>
  </div>
</template>
