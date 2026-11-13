<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { HysButton, HysCheckbox, HysTabs, useHysRouteTabs } from "hys-ui";
const route = useRoute(),
  router = useRouter();
const permit = ref(true);
const labels: Record<string, string> = {
  overview: "报表中心",
  sales: "销售报表",
  stock: "库存报表",
};
function pathFor(key: string) {
  return router.resolve({
    path: "/components/hys-tabs",
    query: { ...route.query, tabReport: key === "overview" ? undefined : key },
    hash: route.hash,
  }).fullPath;
}
const tabs = useHysRouteTabs({
  route: () => route.fullPath,
  resolve: () => {
    if (route.path !== "/components/hys-tabs") return;
    const key =
      typeof route.query.tabReport === "string"
        ? route.query.tabReport
        : "overview";
    if (!Object.hasOwn(labels, key)) return;
    return {
      value: key,
      label: labels[key],
      to: pathFor(key),
      pinned: key === "overview",
      content: "当前路由文档：" + labels[key],
    };
  },
  navigate: (item) => (item.to ? router.push(item.to) : false),
  allow: (item) => item.value !== "stock" || permit.value,
  fallback: () => ({
    value: "overview",
    label: "报表中心",
    to: pathFor("overview"),
  }),
});
const { items, active, history } = tabs;
const recent = computed(() =>
  history.value.map((key) => labels[key]).join("、"),
);
function open(key: string) {
  void router.push(pathFor(key));
}
function changePermission(next: boolean) {
  permit.value = next;
  if (!next && route.query.tabReport === "stock") open("overview");
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton variant="secondary" @click="open('sales')"
        >从路由打开销售报表</HysButton
      >
      <HysButton variant="secondary" :disabled="!permit" @click="open('stock')"
        >从路由打开库存报表</HysButton
      >
      <HysCheckbox
        :model-value="permit"
        label="允许查看库存"
        @update:model-value="changePermission"
      />
    </div>
    <div class="demo-panel">
      <HysTabs
        :items="items"
        :model-value="active"
        :before-leave="(next) => tabs.select(next)"
        :before-close="tabs.beforeClose"
        closable
        type="card"
        @close="
          (key) => tabs.setItems(items.filter((item) => item.value !== key))
        "
      />
    </div>
    <output class="state-output" aria-live="polite"
      >当前查询 · {{ route.query.tabReport ?? "overview" }}<br />最近访问 ·
      {{ recent }}</output
    >
  </div>
</template>
