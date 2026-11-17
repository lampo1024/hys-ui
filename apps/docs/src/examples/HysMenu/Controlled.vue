<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysMenu, type HysMenuItem, type HysMenuKey } from "hys-ui";
const open = ref<readonly HysMenuKey[]>(["operations"]);
const chosen = ref("待处理");
const items: HysMenuItem[] = [
  {
    key: "operations",
    label: "配送运营",
    children: [
      {
        key: "orders",
        label: "订单管理",
        children: [
          { key: "pending", label: "待处理" },
          { key: "dispatched", label: "已出库" },
        ],
      },
      { key: "exceptions", label: "配送异常" },
    ],
  },
  {
    key: "billing",
    label: "费用结算",
    children: [{ key: "invoices", label: "对账单" }],
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysButton
        variant="secondary"
        size="sm"
        @click="open = ['operations', 'orders']"
        >展开订单管理</HysButton
      >
      <HysButton variant="ghost" size="sm" @click="open = []"
        >全部收起</HysButton
      >
    </div>
    <HysMenu
      v-model:open-keys="open"
      :items="items"
      :default-selected-keys="['pending']"
      aria-label="配送运营"
      style="max-width: 278px"
      @select="(_key, { item }) => (chosen = 'label' in item ? item.label : '')"
    />
    <span role="status">当前页面 · {{ chosen }}</span>
  </div>
</template>
