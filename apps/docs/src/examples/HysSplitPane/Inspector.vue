<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysInput,
  HysSplitPane,
  type HysSplitPaneInstance,
} from "hys-ui";

const split = ref<HysSplitPaneInstance>();
const title = ref("运营概览");
const note = ref("用于项目运营看板的标题卡片");
const open = ref(true);

async function editProperties() {
  await split.value?.expandPane("second");
  await split.value?.resizePane("second", "48%");
  split.value?.getPaneElement("second")?.querySelector("input")?.focus();
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" variant="secondary" @click="editProperties"
        >打开属性并定位</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="!open"
        @click="split?.collapsePane('second')"
        >收起属性</HysButton
      >
      <HysButton size="sm" variant="ghost" @click="split?.resetSizes()"
        >恢复布局</HysButton
      >
    </div>
    <HysSplitPane
      ref="split"
      class="inspector-split"
      :default-value="58"
      :responsive-breakpoint="520"
      :second-panel="{ min: '30%', collapsible: true }"
      second-label="属性面板"
      aria-label="调整卡片预览与属性面板"
      @collapse="
        (side, collapsed) => {
          if (side === 'second') open = !collapsed;
        }
      "
    >
      <template #first>
        <section class="inspector-preview">
          <small>卡片预览</small>
          <div class="inspector-card">
            <strong>{{ title || "未命名卡片" }}</strong>
            <p>{{ note }}</p>
          </div>
        </section>
      </template>
      <template #second>
        <section class="inspector-fields" aria-label="卡片属性">
          <label>标题 <HysInput v-model="title" aria-label="标题" /></label>
          <label>说明 <HysInput v-model="note" aria-label="说明" /></label>
        </section>
      </template>
    </HysSplitPane>
  </div>
</template>

<style scoped>
.inspector-split {
  height: 288px;
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 10px;
}
.inspector-split[data-layout="vertical"] {
  height: 380px;
}
.inspector-preview,
.inspector-fields {
  display: grid;
  align-content: start;
  gap: 10px;
  min-block-size: 100%;
  padding: 14px;
}
.inspector-preview {
  background: var(--hys-ui-theme-surface-alt);
}
.inspector-preview small {
  color: var(--hys-ui-theme-muted);
}
.inspector-card {
  padding: 12px;
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 8px;
  background: var(--hys-ui-theme-surface);
  overflow-wrap: anywhere;
}
.inspector-card p {
  margin: 4px 0 0;
}
.inspector-fields label {
  display: grid;
  gap: 4px;
  font-size: 13px;
}
</style>
