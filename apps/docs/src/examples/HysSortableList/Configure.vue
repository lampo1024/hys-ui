<script setup lang="ts">
import { ref } from "vue";
import {
  HysAccordion,
  HysCheckbox,
  HysSelect,
  HysSortableList,
  type HysSortFixed,
  type HysSortMode,
} from "hys-ui";

const items = ref([
  { id: "intake", label: "接收申请", fixed: "top" },
  { id: "docs", label: "核对资料" },
  { id: "audit", label: "财务复核", restricted: true },
  { id: "approve", label: "部门确认" },
  { id: "archive", label: "归档", fixed: "bottom" },
] satisfies {
  id: string;
  label: string;
  fixed?: HysSortFixed;
  restricted?: boolean;
}[]);
const disabled = ref(false);
const whole = ref(false);
const showHandle = ref(true);
const delayed = ref(false);
const protect = ref(false);
const snap = ref(false);
const bounded = ref(false);
const mode = ref<HysSortMode>("insert");
const status = ref("首尾固定。财务复核不能被拖动。");
</script>

<template>
  <div class="demo-stack">
    <div class="demo-preview rule-toolbar">
      <label class="demo-toolbar-field rule-field"
        >放置方式
        <HysSelect
          v-model="mode"
          :options="[
            { value: 'insert', label: '插入' },
            { value: 'swap', label: '交换' },
          ]"
        />
      </label>
      <div class="demo-control-actions permissions">
        <HysCheckbox v-model="protect" label="保护财务复核位置" />
        <HysCheckbox v-model="disabled" label="禁用全部" />
      </div>
    </div>
    <HysSortableList
      v-model="items"
      aria-label="审批流程"
      :mode="mode"
      :disabled="disabled"
      :handle="!whole"
      :show-handle="showHandle"
      :drag-delay="delayed ? 350 : 0"
      :touch-delay="delayed ? 350 : 180"
      axis="y"
      :bounds="bounded ? 'list' : undefined"
      :snap="snap"
      :fixed="
        (item) => item.fixed || (protect && item.restricted ? true : undefined)
      "
      :can-drag="(item) => (item.restricted ? '财务复核由管理员排序' : true)"
      :can-drop="
        (proposal) =>
          proposal.targetItem?.id === 'audit' && protect
            ? '该位置暂不接受放置'
            : true
      "
      @invalid="status = $event.message"
      @change="status = '排序已更新'"
      @cancel="status = $event.message"
    >
      <template #item="{ item, fixed }">
        <span class="entry"
          >{{ item.label
          }}<small v-if="fixed || item.restricted">{{
            fixed === "top" ? "置顶" : fixed === "bottom" ? "置底" : "受限"
          }}</small></span
        >
      </template>
    </HysSortableList>
    <small class="status" role="status">{{ status }}</small>
    <small v-if="!showHandle || whole" class="status">
      按住文字可选中复制，从行内空白处拖动排序。
    </small>
    <HysAccordion :items="[{ title: '拖拽手势设置' }]" size="sm">
      <template #content>
        <div class="demo-control-actions">
          <HysCheckbox v-model="showHandle" label="显示拖拽手柄" />
          <HysCheckbox
            v-model="whole"
            label="整行拖动"
            :disabled="!showHandle"
          />
          <HysCheckbox v-model="delayed" label="按住 350 ms" />
          <HysCheckbox v-model="snap" label="边缘吸附" />
          <HysCheckbox v-model="bounded" label="限制在列表内" />
        </div>
      </template>
    </HysAccordion>
  </div>
</template>

<style scoped>
.entry {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.entry small,
.status {
  color: var(--docs-muted);
}
.rule-toolbar {
  align-items: flex-end;
  gap: 8px 16px;
}
.rule-field {
  inline-size: min(100%, 11rem);
}
.permissions {
  min-height: 38px;
}
</style>
