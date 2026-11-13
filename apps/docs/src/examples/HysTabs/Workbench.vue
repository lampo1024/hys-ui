<script setup lang="ts">
import { computed, ref } from "vue";
import { FileText, LayoutDashboard } from "lucide-vue-next";
import {
  HysButton,
  HysCheckbox,
  HysInput,
  HysTabs,
  type HysTabItem,
  type HysTabsInstance,
  type HysTabValue,
} from "hys-ui";
const tabs = ref<HysTabsInstance>(),
  active = ref<HysTabValue>("overview"),
  local = ref(false),
  status = ref("右键或长按页签可查看管理操作");
const seed: HysTabItem[] = [
  {
    value: "overview",
    label: "工作区",
    pinned: true,
    icon: LayoutDashboard,
    content: "固定页签保留在列表前方。",
  },
  { value: "draft", label: "客户回访", dirty: true, icon: FileText, badge: 2 },
  {
    value: "quote",
    label: "报价单",
    favorite: true,
    icon: FileText,
    status: "success",
  },
  { value: "archive", label: "项目归档", readonly: true },
];
const items = ref<HysTabItem[]>(seed.map((item) => ({ ...item })));
const drafts = ref<Record<string, string>>({});
let sequence = 0;
const storage = computed(() =>
  local.value ? "hys-doc-tabs-workbench" : undefined,
);
function create() {
  const id = "note-" + Date.now() + "-" + ++sequence;
  return { value: id, label: "新建记录 " + sequence, icon: FileText };
}
function update(item: HysTabItem, value: string) {
  drafts.value[String(item.value)] = value;
  items.value = items.value.map((entry) =>
    entry.value === item.value ? { ...entry, dirty: true } : entry,
  );
}
function save(item: HysTabItem) {
  items.value = items.value.map((entry) =>
    entry.value === item.value ? { ...entry, dirty: false } : entry,
  );
  status.value = "已保存 " + item.label;
}
function restoreItem(item: Pick<HysTabItem, "value" | "label">) {
  return {
    ...(seed.find((entry) => entry.value === item.value) ?? {}),
    ...item,
    icon: item.value === "overview" ? LayoutDashboard : FileText,
  };
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="local" label="保存当前会话" />
      <HysButton
        variant="secondary"
        :disabled="!tabs?.closed.length"
        @click="tabs?.restore()"
        >恢复最近关闭</HysButton
      >
    </div>
    <div class="demo-panel">
      <HysTabs
        ref="tabs"
        v-model="active"
        v-model:items="items"
        workbench
        draggable
        drag-handle
        :show-scroll-buttons="false"
        swipe
        shortcuts
        type="card"
        overflow="menu"
        :storage-key="storage"
        persist-scroll
        :restore-item="restoreItem"
        :create-tab="create"
        @reorder="status = '已更新页签顺序'"
        @close-batch="status = '已关闭 ' + $event.length + ' 项'"
        @restore="status = '已恢复 ' + $event.label"
        @rename="(key, label) => (status = '已重命名为 ' + label)"
      >
        <template #panel="{ item }">
          <div v-if="item.content">{{ item.content }}</div>
          <div v-else-if="item.readonly">归档内容可查看。</div>
          <div v-else class="workbench-editor">
            <HysInput
              :model-value="drafts[String(item.value)] ?? ''"
              :aria-label="item.label + '草稿'"
              placeholder="输入草稿可体验未保存提醒"
              @update:model-value="update(item, $event)"
            />
            <HysButton size="sm" variant="secondary" @click="save(item)"
              >保存</HysButton
            >
          </div>
        </template>
      </HysTabs>
    </div>
    <output class="state-output" aria-live="polite">{{ status }}</output>
  </div>
</template>
<style scoped>
.workbench-editor {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.workbench-editor > :first-child {
  flex: 1 1 160px;
  min-width: 0;
}
</style>
