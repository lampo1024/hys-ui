<script setup lang="ts">
import { defineComponent, h, ref, shallowRef } from "vue";
import {
  HysButton,
  HysVirtualTable,
  type HysVirtualTableInstance,
} from "hys-ui";
interface Asset {
  id: number;
  name: string;
  category: string;
  site: string;
}
const rows: Asset[] = Array.from({ length: 900 }, (_, i) => ({
  id: i + 1,
  name: "资产 " + (i + 1),
  category: i % 2 ? "设备" : "工装",
  site: i % 3 ? "总部仓" : "分部仓",
}));
const columns = [
  { key: "id", label: "资产号", width: 90 },
  { key: "name", label: "资产名称", width: 260 },
  { key: "category", label: "分类", width: 200 },
  { key: "site", label: "所在库位", width: 270 },
];
const table = shallowRef<HysVirtualTableInstance<Asset>>();
const active = ref(true),
  compact = ref(false);
const CachedTable = defineComponent({
  name: "CachedAssetTable",
  setup: () => () =>
    h(HysVirtualTable<Asset>, {
      ref: table,
      rows,
      columns,
      height: 200,
      virtualColumns: true,
      ariaLabel: "缓存资产列表",
    }),
});
function locate() {
  table.value?.scrollToRow(499, "center");
  table.value?.scrollToColumn("site", "end");
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" :disabled="!active" @click="locate"
        >定位资产 500</HysButton
      >
      <HysButton size="sm" @click="active = !active">{{
        active ? "离开表格" : "返回表格"
      }}</HysButton>
      <HysButton size="sm" @click="compact = !compact">{{
        compact ? "恢复容器宽度" : "缩小容器"
      }}</HysButton>
    </div>
    <div :style="{ width: compact ? 'min(420px,100%)' : '100%' }">
      <KeepAlive><CachedTable v-if="active" /></KeepAlive>
      <p v-if="!active" class="scenario-note">
        表格已缓存。返回后会恢复滚动位置。
      </p>
    </div>
    <p class="scenario-note">
      容器宽度变化时，表格会重算可见列；离开缓存页面时暂停滚动更新，返回时恢复。
    </p>
  </div>
</template>
