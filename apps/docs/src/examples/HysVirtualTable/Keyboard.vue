<script setup lang="ts">
import { ref, shallowRef } from "vue";
import {
  HysButton,
  HysNumberInput,
  HysSelect,
  HysVirtualTable,
  type HysVirtualTableColumn,
  type HysVirtualTableInstance,
} from "hys-ui";
interface Delivery {
  id: number;
  name: string;
  location: string;
  stage: string;
}
const rows: Delivery[] = Array.from({ length: 1500 }, (_, i) => ({
  id: i + 1,
  name: "交付单 " + (i + 1),
  location: ["上海", "北京", "成都"][i % 3],
  stage: i % 2 ? "已签收" : "运输中",
}));
const columns: HysVirtualTableColumn<Delivery>[] = [
  { key: "id", label: "编号", width: 82, fixed: "left" },
  { key: "name", label: "交付单", width: 260 },
  { key: "location", label: "收货地址", width: 230 },
  { key: "stage", label: "状态", width: 210 },
];
const table = shallowRef<HysVirtualTableInstance<Delivery>>(),
  index = ref(1200),
  column = ref("location");
const choices = columns.map((c) => ({ label: c.label, value: c.key }));
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysNumberInput
        v-model="index"
        :min="1"
        :max="rows.length"
        :show-controls="false"
        select-on-focus
        size="sm"
        aria-label="目标行号"
        style="width: 106px"
      />
      <HysSelect
        v-model="column"
        :options="choices"
        size="sm"
        aria-label="目标列"
        style="width: 144px"
      />
      <HysButton
        size="sm"
        variant="primary"
        @click="table?.focusCell(index - 1, column)"
        >定位并聚焦</HysButton
      >
    </div>
    <HysVirtualTable
      ref="table"
      :rows="rows"
      :columns="columns"
      :height="220"
      keyboard
      selectable
      virtual-columns
      aria-label="可键盘定位的交付单"
    >
      <template #footer="{ selectedRowKeys }"
        >已选 {{ selectedRowKeys.length }} 项</template
      >
    </HysVirtualTable>
    <p class="scenario-note">
      方向键逐格移动，Page Up / Page Down 翻动一个视口，Ctrl + Home / End
      跳到首尾。空格勾选，Shift + 空格扩大选择范围。
    </p>
  </div>
</template>
