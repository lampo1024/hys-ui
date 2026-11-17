<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysPageHeader } from "hys-ui";
const status = ref("待发货");
const path = [{ label: "订单管理" }, { label: "订单详情" }];
</script>

<template>
  <div class="demo-stack">
    <HysPageHeader title="订单 ORD-042" :subtitle="status" :breadcrumbs="path">
      <template #extra>
        <HysButton @click="status = '已发货'" :disabled="status === '已发货'"
          >确认发货</HysButton
        >
      </template>
    </HysPageHeader>
  </div>
</template>
