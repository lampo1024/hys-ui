<script setup lang="ts">
import {
  ref,
  onMounted,
  onActivated,
  onDeactivated,
  onBeforeUnmount,
} from "vue";
import {
  HysTable,
  HysCheckbox,
  HysButton,
  HysAlert,
  type HysTableColumn,
  type HysTableQuery,
} from "hys-ui";
type Item = { id: number; name: string; team: string; amount: number };
const source: Item[] = Array.from({ length: 72 }, (_, i) => ({
  id: i + 1,
  name: "订单 " + String(i + 1).padStart(3, "0"),
  team: ["design", "dev", "qa"][i % 3],
  amount: 150 + i * 27,
}));
const columns: HysTableColumn<Item>[] = [
  { key: "id", label: "编号", width: 90 },
  { key: "name", label: "订单名称", width: 180, filterable: true },
  {
    key: "team",
    label: "团队",
    width: 120,
    filters: [
      { label: "设计", value: "design" },
      { label: "研发", value: "dev" },
      { label: "质量", value: "qa" },
    ],
  },
  {
    key: "amount",
    label: "金额",
    width: 140,
    sortable: "custom",
    align: "right",
  },
];
const rows = ref<Item[]>([]),
  page = ref(1),
  size = ref(5),
  total = ref(source.length),
  loading = ref(false),
  fail = ref(false),
  pageCountOnly = ref(false),
  error = ref(""),
  message = ref("");
let controller: AbortController | undefined,
  lastQuery: HysTableQuery<Item> | undefined;
async function fetchPage(query: HysTableQuery<Item>) {
  lastQuery = query;
  controller?.abort();
  const current = new AbortController();
  controller = current;
  loading.value = true;
  error.value = "";
  try {
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      };
      const timer = setTimeout(() => {
        current.signal.removeEventListener("abort", abort);
        resolve();
      }, 400);
      current.signal.addEventListener("abort", abort, { once: true });
    });
    if (fail.value) throw Error("暂时无法获取订单");
    let result = source.filter((row) =>
      Object.entries(query.filters).every(
        ([key, values]) =>
          !values.length ||
          values.some((value) =>
            key === "name"
              ? row.name.includes(String(value))
              : row.team === value,
          ),
      ),
    );
    const sort = query.sorts[0];
    if (sort)
      result = [...result].sort(
        (a, b) => (a.amount - b.amount) * (sort.direction === "asc" ? 1 : -1),
      );
    if (controller !== current) return;
    total.value = result.length;
    rows.value = result.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    );
    message.value = query.action + " · 第 " + query.page + " 页";
  } catch (reason) {
    if (!current.signal.aborted)
      error.value = reason instanceof Error ? reason.message : "加载失败";
  } finally {
    if (controller === current) loading.value = false;
  }
}
function refresh() {
  void fetchPage(
    lastQuery ?? {
      action: "page",
      page: page.value,
      pageSize: size.value,
      sorts: [],
      filters: {},
      currentData: [],
    },
  );
}
let resume = false;
function cleanup() {
  resume = loading.value;
  controller?.abort();
  controller = undefined;
  loading.value = false;
}
onMounted(refresh);
onActivated(() => {
  if (resume) {
    resume = false;
    refresh();
  }
});
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysCheckbox v-model="fail">模拟失败</HysCheckbox
      ><HysCheckbox v-model="pageCountOnly">仅返回总页数</HysCheckbox>
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="loading"
        @click="refresh"
        >重新加载</HysButton
      >
    </div>
    <HysAlert
      v-if="error"
      tone="danger"
      :title="error"
      style="margin-top: 16px"
    />
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        v-model:page="page"
        v-model:page-size="size"
        :rows="rows"
        :columns="columns"
        server-mode
        :total="pageCountOnly ? undefined : total"
        :loading="loading"
        :pagination="{
          pageCount: pageCountOnly ? Math.max(1, Math.ceil(total / size)) : undefined,
          showQuickJumper: true,
          pageSizeOptions: [5, 10, 20],
        }"
        @query-change="fetchPage"
      />
    </div>
    <output class="state-output"
      >{{ message || "正在请求数据" }} · {{ pageCountOnly ? Math.max(1, Math.ceil(total / size)) + ' 页' : total + ' 条' }}</output
    >
    <p class="scenario-note">
      serverMode
      仅发出查询状态，排序、筛选与分页由宿主处理。后端只提供总页数时，可用 pagination.pageCount 驱动翻页。
    </p>
  </div>
</template>
