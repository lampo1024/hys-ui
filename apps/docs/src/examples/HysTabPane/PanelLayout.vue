<script setup lang="ts">
import { HysInput, HysTabPane, HysTabs } from "hys-ui";
</script>

<template>
  <HysTabs aria-label="任务记录">
    <HysTabPane value="description" label="摘要"
      >订单已经交接，正在等待入库。</HysTabPane
    >
    <HysTabPane
      value="records"
      label="记录"
      :panel-style="{ maxHeight: '130px', overflow: 'auto' }"
      panel-class="task-records"
      :panel-tab-index="-1"
    >
      <div class="demo-stack">
        <HysInput aria-label="记录检索" placeholder="记录检索" />
        <p v-for="index in 6" :key="index">第 {{ index }} 次交接记录</p>
      </div>
    </HysTabPane>
  </HysTabs>
</template>
