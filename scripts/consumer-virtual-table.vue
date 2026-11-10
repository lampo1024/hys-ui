<script setup lang="ts">
import { h, ref, shallowRef } from "vue";
import {
  HysButton,
  HysVirtualTable,
  provideHysConfig,
  type HysVirtualTableColumn,
  type HysVirtualTableProps,
  type HysVirtualTableRange,
  type HysVirtualTableInstance,
  type HysVirtualTableSort,
  type HysVirtualTableKey,
} from "hys-ui";
interface Inventory {
  sku: number;
  item: { name: string };
  stock: number;
}
const rows: readonly Inventory[] = Array.from({ length: 2000 }, (_, sku) => ({
  sku,
  item: { name: "Inventory " + sku },
  stock: 2000 - sku,
}));
const columns: readonly HysVirtualTableColumn<Inventory>[] = [
  { key: "sku", label: "SKU", width: 82, fixed: "left" },
  { key: "name", label: "Item", dataIndex: ["item", "name"], width: 460 },
  {
    key: "stock",
    label: "Stock",
    width: 96,
    align: "right",
    fixed: "right",
    sortable: true,
  },
];
const sort = ref<HysVirtualTableSort | null>(null),
  selected = ref<HysVirtualTableKey[]>([]);
const api = shallowRef<HysVirtualTableInstance<Inventory>>();
const initial: HysVirtualTableProps<Inventory> = {
  rows,
  columns,
  rowKey: (row) => row.sku,
  width: 620,
  height: 200,
  keyboard: true,
  selectable: true,
  virtualColumns: true,
};
const theme = ref<"green" | "dark">("green");
provideHysConfig({ theme, motion: "off" });
const range = shallowRef<HysVirtualTableRange>();
function jump() {
  void api.value?.focusCell(999, "name");
}
function verifyComponentType(
  value: Parameters<
    NonNullable<Parameters<typeof HysVirtualTable<Inventory>>[2]>
  >[0],
): HysVirtualTableInstance<Inventory> {
  return value;
}
void [h, verifyComponentType];
</script>
<template>
  <section style="display: grid; gap: 12px; padding: 20px; max-width: 700px">
    <HysButton @click="jump">Locate inventory row</HysButton>
    <HysButton @click="theme = theme === 'green' ? 'dark' : 'green'"
      >Change inventory theme</HysButton
    >
    <HysVirtualTable
      v-bind="initial"
      ref="api"
      v-model:sort-state="sort"
      v-model:selected-row-keys="selected"
      aria-label="Installed inventory table"
      @range-change="range = $event"
    >
      <template #footer
        >Visible {{ range?.visibleStart }} · Selected
        {{ selected.join(", ") }}</template
      >
    </HysVirtualTable>
  </section>
</template>
