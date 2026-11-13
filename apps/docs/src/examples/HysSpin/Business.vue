<script setup lang="ts">
import { nextTick, ref } from "vue";
import { HysButton, HysDrawer, HysModal, HysSearch, HysSpin } from "hys-ui";
const rows = ref([
  { id: "HY-01", name: "经营月报", owner: "财务" },
  { id: "HY-02", name: "库存核对", owner: "运营" },
]);
const spin = ref<InstanceType<typeof HysSpin>>();
const detail = ref<InstanceType<typeof HysSpin>>();
const modal = ref(false),
  drawer = ref(false),
  open = ref(false),
  text = ref("");
function wait(signal: AbortSignal, duration = 650) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, duration);
    signal.addEventListener("abort", abort, { once: true });
  });
}
const all = [
  { id: "HY-01", name: "经营月报", owner: "财务" },
  { id: "HY-02", name: "库存核对", owner: "运营" },
  { id: "HY-03", name: "客户跟进", owner: "销售" },
  { id: "HY-04", name: "订单统计", owner: "运营" },
];
function search(query = "") {
  void spin.value
    ?.run(async ({ signal }) => {
      await wait(signal);
      rows.value = all.filter((row) =>
        (row.name + row.owner + row.id).includes(query),
      );
    })
    .catch(() => {});
}
async function details(kind: "modal" | "drawer") {
  modal.value = kind === "modal";
  drawer.value = kind === "drawer";
  open.value = true;
  text.value = "";
  const work = async ({ signal }: { signal: AbortSignal }) => {
    await wait(signal, 900);
    text.value = "4 条记录已完成同步，最近更新时间为 10:30。";
  };
  await nextTick();
  if (open.value) void detail.value?.run(work).catch(() => {});
}
function close() {
  open.value = false;
  modal.value = drawer.value = false;
  detail.value?.cancel();
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysSearch
        trigger="submit"
        enter-button="查询"
        placeholder="搜索报表、部门或编号"
        aria-label="报表查询"
        @search="search"
      />
      <HysButton variant="secondary" @click="search()">刷新数据</HysButton>
    </div>
    <HysSpin
      ref="spin"
      :default-spinning="false"
      mode="overlay"
      region-height="118px"
      :delay="120"
      :min-duration="250"
      message="正在查询报表"
    >
      <div class="spin-table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">编号</th>
              <th scope="col">名称</th>
              <th scope="col">部门</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.owner }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="3">没有匹配的记录</td>
            </tr>
          </tbody>
        </table>
      </div>
    </HysSpin>
    <div class="demo-control-actions">
      <HysButton variant="secondary" @click="details('modal')"
        >弹窗加载</HysButton
      >
      <HysButton variant="secondary" @click="details('drawer')"
        >抽屉加载</HysButton
      >
    </div>
    <HysModal v-if="modal" :open="modal" title="同步详情" @close="close">
      <HysSpin
        ref="detail"
        :default-spinning="false"
        mode="container"
        message="正在获取详情"
        ><p>{{ text }}</p></HysSpin
      >
    </HysModal>
    <HysDrawer v-if="drawer" :open="drawer" title="同步详情" @close="close">
      <HysSpin
        ref="detail"
        :default-spinning="false"
        mode="container"
        message="正在获取详情"
        ><p>{{ text }}</p></HysSpin
      >
    </HysDrawer>
  </div>
</template>

<style scoped>
.spin-table-scroll {
  overflow: auto;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
}
.spin-table-scroll table {
  border-collapse: collapse;
  width: 100%;
  font-size: 13px;
  text-align: start;
}
.spin-table-scroll :is(td, th) {
  padding: 9px 12px;
}
.spin-table-scroll th {
  background: var(--docs-bg);
}
.spin-table-scroll td {
  border-top: 1px solid var(--docs-border);
}
</style>
