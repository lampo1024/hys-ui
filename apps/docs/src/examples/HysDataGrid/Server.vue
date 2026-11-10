<script setup lang="ts">
import { ref } from "vue";
import {
  HysCheckbox,
  HysDataGrid,
  type GridColumn,
  type HysDataGridLoader,
} from "hys-ui";

interface Task {
  id: number;
  name: string;
}
const columns: GridColumn<Task>[] = [
  { key: "id", label: "编号", width: 120 },
  { key: "name", label: "任务名称", width: 260 },
];
const tasks = Array.from({ length: 45 }, (_, index) => ({
  id: index + 1,
  name: "远程任务 " + (index + 1),
}));
const fail = ref(false);
const loadRows: HysDataGridLoader<Task> = async (query, { signal }) => {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 350);
    function abort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", abort, { once: true });
  });
  if (fail.value) throw new Error("任务加载失败");
  const term = query.search.trim();
  const matched = tasks.filter(
    (task) =>
      (!term || task.name.includes(term) || String(task.id).includes(term)) &&
      Object.entries(query.filters).every(([key, value]) =>
        String(task[key as keyof Task]).includes(value),
      ),
  );
  const order = query.sort[0];
  if (order) {
    const key = order.key as keyof Task;
    matched.sort(
      (a, b) =>
        String(a[key]).localeCompare(String(b[key]), "zh-CN", {
          numeric: true,
        }) * (order.direction === "asc" ? 1 : -1),
    );
  }
  const start = (query.page - 1) * query.pageSize;
  return {
    total: matched.length,
    rows: matched.slice(start, start + query.pageSize),
  };
};
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="fail" label="模拟请求失败" />
    <HysDataGrid
      :rows="[]"
      :columns="columns"
      :total-rows="tasks.length"
      :default-query="{ page: 3 }"
      :load-rows="loadRows"
    />
    <p class="scenario-note">
      表格从第 3
      页开始加载。快速切换查询会取消旧请求，模拟失败后取消勾选并点击重试。
    </p>
  </div>
</template>
