<script setup lang="ts">
import { HysButton, HysTabPane, HysTabs, type HysTabLoadContext } from "hys-ui";

let attempts = 0;
async function load({ signal }: HysTabLoadContext) {
  await new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, 450);
    signal.addEventListener("abort", finish, { once: true });
  });
  if (signal.aborted) return null;
  if (attempts++ === 0) throw new Error("查询超时");
  return "最近一次盘点已完成，三条库存记录均已复核。";
}
</script>

<template>
  <HysTabs aria-label="库存记录">
    <HysTabPane value="overview" label="概览"
      >打开盘点记录可查询最新结果。</HysTabPane
    >
    <HysTabPane value="history" label="盘点记录" :load="load">
      <template #loading>正在查询盘点记录…</template>
      <template #error="{ reload }">
        <span>盘点记录查询超时。</span>
        <HysButton size="sm" variant="secondary" @click="reload()"
          >重新查询</HysButton
        >
      </template>
    </HysTabPane>
  </HysTabs>
</template>
