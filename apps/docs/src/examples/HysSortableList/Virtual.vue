<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysSelect,
  HysSortableList,
  type HysSortLayout,
  type HysSortableListInstance,
} from "hys-ui";

const list = useTemplateRef<HysSortableListInstance>("list");
const layout = ref<HysSortLayout>("vertical");
const scroll = ref(true);
const status = ref("靠近列表边缘时会自动滚动。");
const items = ref(
  Array.from({ length: 2000 }, (_, i) => ({
    id: i + 1,
    label: `素材 ${String(i + 1).padStart(4, "0")}`,
    note: (i + 1) % 4 === 0 ? "等待内容审核，确认后可发布" : "",
  })),
);
const settings = computed(() => ({
  height: layout.value === "horizontal" ? "auto" : 220,
  estimateSize: layout.value === "horizontal" ? 176 : 54,
  overscan: 5,
  columns: (width: number) => (width >= 650 ? 3 : width >= 370 ? 2 : 1),
}));

async function jump() {
  if (await list.value?.focus(1500)) status.value = "已定位到素材 1500";
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-preview virtual-toolbar">
      <label class="demo-toolbar-field virtual-field"
        >布局
        <HysSelect
          v-model="layout"
          :options="[
            { value: 'vertical', label: '纵向列表' },
            { value: 'horizontal', label: '横向滚动' },
            { value: 'grid', label: '响应式网格' },
          ]"
        />
      </label>
      <div class="demo-control-actions virtual-actions">
        <HysCheckbox v-model="scroll" label="边缘自动滚动" />
        <HysButton size="sm" @click="jump">定位到素材 1500</HysButton>
      </div>
    </div>
    <div class="virtual-frame">
      <HysSortableList
        :key="layout"
        ref="list"
        v-model="items"
        :layout="layout"
        :virtual="settings"
        :auto-scroll="scroll ? { threshold: 40, speed: 18 } : false"
        :show-buttons="false"
        aria-label="两千项素材"
        @change="status = '素材顺序已更新'"
      >
        <template #item="{ item }">
          <span class="asset"
            >{{ item.label
            }}<small v-if="item.note">{{ item.note }}</small></span
          >
        </template>
      </HysSortableList>
    </div>
    <small class="virtual-status" role="status"
      >{{ items.length.toLocaleString("zh-CN") }} 项 · {{ status }}</small
    >
  </div>
</template>

<style scoped>
.virtual-toolbar {
  align-items: flex-end;
}
.virtual-field {
  inline-size: min(100%, 11rem);
}
.virtual-actions {
  min-height: 38px;
}
.virtual-frame {
  overflow: hidden;
  padding: 8px;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: var(--docs-bg);
}
.asset {
  display: grid;
  gap: 2px;
  font-variant-numeric: tabular-nums;
}
.asset small,
.virtual-status {
  color: var(--docs-muted);
}
</style>
