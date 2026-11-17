<script setup lang="ts">
import { ref } from "vue";
import { HysDropdown, type HysMenuItem } from "hys-ui";
import { Copy, Download, FileText } from "hys-ui/icons";
const last = ref("等待操作");
const items: HysMenuItem[] = [
  { key: "detail", label: "查看订单详情", icon: FileText },
  { key: "copy", label: "复制订单编号", icon: Copy },
  { type: "divider" },
  { key: "invoice", label: "下载发票", icon: Download, disabled: true },
];
</script>
<template>
  <div class="demo-row">
    <span>订单 ORD-042</span>
    <HysDropdown
      :items="items"
      @select="(_key, { item }) => (last = 'label' in item ? item.label : '')"
    />
    <span role="status">{{ last }}</span>
  </div>
</template>
