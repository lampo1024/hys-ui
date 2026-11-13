<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysBadge,
  HysButton,
  HysDescriptions,
  HysSpace,
  type HysDescriptionItem,
} from "hys-ui";
const paid = ref(false),
  visible = ref(true);
const fields = computed<HysDescriptionItem[]>(() =>
  visible.value
    ? [
        { key: "number", label: "订单编号", value: "SO-10752" },
        { key: "status", label: "付款状态", value: paid.value },
        {
          key: "amount",
          label: "金额",
          value: 428.5,
          format: (value) =>
            new Intl.NumberFormat("zh-CN", {
              style: "currency",
              currency: "CNY",
            }).format(Number(value)),
        },
        {
          key: "memo",
          label: "备注",
          value: "开票信息随出库单提供。",
          span: "full",
        },
      ]
    : [],
);
</script>

<template>
  <div class="demo-panel">
    <HysDescriptions
      title="订单详情"
      :items="fields"
      :columns="{ xs: 1, sm: 2, md: 3 }"
      bordered
    >
      <template #extra>
        <HysSpace wrap>
          <HysButton
            v-if="visible"
            size="sm"
            variant="secondary"
            @click="paid = !paid"
            >{{ paid ? "设为未付款" : "标记已付款" }}</HysButton
          >
          <HysButton size="sm" variant="ghost" @click="visible = !visible">{{
            visible ? "清空示例数据" : "恢复示例数据"
          }}</HysButton>
        </HysSpace>
      </template>
      <template #value-status="{ value }">
        <HysBadge
          :status="value ? 'success' : 'warning'"
          :text="value ? '已付款' : '待付款'"
        />
      </template>
      <template #label-amount="{ item }">{{ item.label }}（含税）</template>
      <template #empty>当前没有订单可展示。</template>
    </HysDescriptions>
  </div>
</template>
