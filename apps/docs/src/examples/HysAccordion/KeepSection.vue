<script setup lang="ts">
import { HysAccordion } from "hys-ui";
const items = [
  { id: "a", title: "配送方式", content: "常规商品使用标准配送。" },
  { id: "b", title: "退货规则", content: "退货申请可在订单详情提交。" },
];
</script>

<template>
  <HysAccordion :items="items" :default-active="['a']" mandatory />
</template>
