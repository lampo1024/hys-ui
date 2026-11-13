<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysSplitPane,
  type HysSplitPaneInstance,
  type HysSplitPanePanel,
} from "hys-ui";

const split = ref<HysSplitPaneInstance>();
const cascade = ref(true);
const lockNav = ref(false);
const panels = computed<HysSplitPanePanel[]>(() => [
  {
    id: "navigation",
    label: "导航",
    size: "25%",
    min: "10%",
    max: "40%",
    resizable: !lockNav.value,
  },
  { id: "results", label: "搜索结果", size: "25%", min: "15%", max: "36%" },
  { id: "detail", label: "详情", size: "25%", min: "19%", max: "45%" },
  { id: "history", label: "历史", size: "25%", min: "12%", max: "42%" },
]);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="cascade" label="跨面板联动" />
      <HysCheckbox v-model="lockNav" label="锁定导航" />
      <HysButton variant="secondary" size="sm" @click="split?.resetSizes()"
        >恢复尺寸</HysButton
      >
    </div>
    <HysSplitPane
      ref="split"
      class="cascade-demo"
      :panels="panels"
      :resize-mode="cascade ? 'cascade' : 'adjacent'"
      aria-label="调整搜索工作台面板"
    >
      <template #panel="{ panel, size }">
        <section class="cascade-pane">
          <strong>{{ panel.label }}</strong>
          <span>{{ Math.round(size) }} px</span>
          <small v-if="panel.resizable === false">已锁定</small>
        </section>
      </template>
    </HysSplitPane>
    <p class="cascade-tip">
      向右拖动中间的分隔条。详情缩到最小尺寸后，联动模式会继续缩小历史面板。
    </p>
  </div>
</template>

<style scoped>
.cascade-demo {
  height: 134px;
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 10px;
}
.cascade-pane {
  display: grid;
  align-content: start;
  gap: 6px;
  min-block-size: 100%;
  padding: clamp(6px, 2vw, 14px);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.cascade-demo :deep(.hys-ui-splitter-pane:nth-child(4n + 1)) {
  background: var(--hys-ui-theme-surface-alt);
}
.cascade-pane span,
.cascade-pane small,
.cascade-tip {
  color: var(--hys-ui-theme-muted);
}
.cascade-tip {
  margin: 0;
  font-size: 13px;
}
</style>
