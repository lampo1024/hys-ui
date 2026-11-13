<script setup lang="ts">
import { ref } from "vue";
import {
  HysCheckbox,
  HysSelect,
  HysTabs,
  type HysTabItem,
  type HysTabValue,
} from "hys-ui";
const active = ref<HysTabValue>("todo"),
  wheel = ref<"none" | "scroll" | "switch">("none");
const preview = ref(true),
  input = ref("当前：待处理");
const items: HysTabItem[] = [
  {
    value: "todo",
    label: "待处理",
    badge: 8,
    status: "warning",
    content: "有 8 项工单等待处理。",
  },
  {
    value: "doing",
    label: "处理中",
    status: "loading",
    content: "正在跟进 3 项工单。",
  },
  {
    value: "done",
    label: "已完成",
    status: "success",
    content: "本周已关闭 12 项工单。",
  },
  {
    value: "archived",
    label: "已归档",
    disabled: true,
    content: "此分类暂不可用。",
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >滚轮行为<HysSelect
            v-model="wheel"
            aria-label="滚轮行为"
            :options="[
              { label: '跟随页面', value: 'none' },
              { label: '滚动页签栏', value: 'scroll' },
              { label: '切换页签', value: 'switch' },
            ]"
        /></label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="preview" label="悬停预览" />
      </div>
    </div>
    <div class="demo-panel">
      <HysTabs
        v-model="active"
        :items="items"
        :preview="preview"
        :wheel="wheel"
        swipe
        shortcuts
        context-menu
        :long-press="520"
        :panel-height="112"
        aria-label="工单状态"
        @selection-change="(event) => (input = '已切换 · ' + event.source)"
        @tab-dblclick="input = '收到双击操作'"
        @tab-longpress="input = '收到长按操作'"
      >
        <template #preview="{ item }">预览 · {{ item.content }}</template>
        <template #contextmenu="{ item, run, close }">
          <button
            type="button"
            role="menuitem"
            class="context-tab-action"
            @click="
              run('reload');
              close();
              input = '已刷新 ' + item.label;
            "
          >
            刷新 {{ item.label }}
          </button>
        </template>
      </HysTabs>
    </div>
    <output class="state-output" aria-live="polite"
      >{{ input }} · 触屏可左右滑动内容区</output
    >
  </div>
</template>
<style scoped>
.context-tab-action {
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  padding: 7px 10px;
  cursor: pointer;
  font: inherit;
}
.context-tab-action:hover {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
</style>
