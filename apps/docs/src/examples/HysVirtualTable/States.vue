<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysEmpty, HysSelect, HysVirtualTable } from "hys-ui";
const rows = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  name: "报表 " + (i + 1),
  status: i % 2 ? "已完成" : "等待处理",
}));
const columns = [
  { key: "id", label: "编号", width: 80 },
  { key: "name", label: "报表名称", width: 180 },
  { key: "status", label: "处理状态", width: 130 },
];
const options = [
  { label: "有数据", value: "normal" },
  { label: "空数据", value: "empty" },
  { label: "替换加载", value: "replace" },
  { label: "覆盖加载", value: "overlay" },
  { label: "禁用", value: "disabled" },
];
const state = ref("empty");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysSelect
        v-model="state"
        :options="options"
        size="sm"
        aria-label="表格状态"
        style="width: 156px"
      />
    </div>
    <HysVirtualTable
      :rows="state === 'empty' ? [] : rows"
      :columns="columns"
      :height="210"
      fit
      selectable
      :disabled="state === 'disabled'"
      :loading="state === 'replace' || state === 'overlay'"
      :loading-mode="state === 'overlay' ? 'overlay' : 'replace'"
      aria-label="报表加载状态"
    >
      <template #empty
        ><HysEmpty
          title="暂无报表"
          description="刷新后查看最新处理记录"
          size="sm"
          ><template #action
            ><HysButton size="sm" @click="state = 'normal'"
              >查看报表</HysButton
            ></template
          ></HysEmpty
        ></template
      >
      <template #loading>正在更新报表…</template>
    </HysVirtualTable>
    <p class="scenario-note">
      替换加载隐藏数据行；覆盖加载保留数据作为背景。两种加载方式都会暂时停用表格操作。
    </p>
  </div>
</template>
