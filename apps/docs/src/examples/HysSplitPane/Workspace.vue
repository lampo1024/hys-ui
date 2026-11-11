<script setup lang="ts">
import { ref } from "vue";
import { FileText, FolderOpen, PanelLeft, RotateCcw } from "lucide-vue-next";
import { HysButton, HysSplitPane, type HysSplitPaneInstance, type HysSplitPanePanel } from "hys-ui";

const split = ref<HysSplitPaneInstance>();
const selected = ref("index.vue");
const panels: HysSplitPanePanel[] = [
  { id: "files", label: "文件面板", size: 155, min: 95, max: "45%", collapsible: true },
  { id: "workspace", label: "工作区", min: "45%" },
];
</script>

<template>
  <section class="split-workspace">
    <header class="split-workspace-toolbar">
      <strong>项目工作区</strong>
      <HysButton :icon="PanelLeft" size="sm" variant="ghost" @click="split?.resizePane('files', '35%')">加宽文件栏</HysButton>
      <HysButton :icon="RotateCcw" size="sm" variant="ghost" @click="split?.resetSizes()">恢复布局</HysButton>
    </header>
    <HysSplitPane
      ref="split"
      :panels="panels"
      :divider-size="8"
      storage-key="docs-workspace"
      double-click-action="reset"
    >
      <template #panel="{ panel }">
        <div v-if="panel.id === 'files'" class="split-workspace-files">
          <strong><FolderOpen :size="16" /> 源文件</strong>
          <HysButton
            v-for="file in ['index.vue', 'styles.css']"
            :key="file"
            :icon="FileText"
            :aria-pressed="selected === file"
            size="sm"
            :variant="selected === file ? 'secondary' : 'ghost'"
            @click="selected = file"
          >{{ file }}</HysButton>
        </div>
        <HysSplitPane
          v-else
          layout="vertical"
          :default-value="70"
          :second-panel="{ collapsible: true }"
          second-label="输出面板"
          class="split-workspace-body"
        >
          <template #first>
            <label class="split-workspace-pane">
              {{ selected }}
              <textarea :key="selected" aria-label="文件内容" spellcheck="false" />
            </label>
          </template>
          <template #second>
            <div class="split-workspace-pane">输出</div>
          </template>
        </HysSplitPane>
      </template>
    </HysSplitPane>
  </section>
</template>

<style scoped>
.split-workspace {
  overflow: hidden;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 12px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
}
.split-workspace-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.split-workspace-toolbar strong { margin-inline-end: auto; }
.split-workspace-files, .split-workspace-pane {
  display: grid;
  justify-items: start;
  align-content: start;
  gap: 8px;
  padding: 12px;
}
.split-workspace-files {
  min-height: 100%;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.split-workspace-files strong { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.split-workspace-body { height: 100%; }
.split-workspace-pane textarea {
  box-sizing: border-box;
  width: 100%;
  height: 100px;
  resize: none;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 6px;
  padding: 8px;
  color: inherit;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
}
</style>
