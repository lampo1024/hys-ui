<script setup lang="ts">
import { ref } from "vue";
import { HysSplitPane, HysTextarea, type HysSplitPanePanel, type HysSplitPaneSizes } from "hys-ui";

const panels: HysSplitPanePanel[] = [
  { id: "files", label: "文件", size: 110, min: 80, max: 160, collapsible: true },
  { id: "editor", label: "编辑器", min: "30%" },
  { id: "preview", label: "预览", min: "20%", collapsible: true },
];
const sizes = ref<HysSplitPaneSizes>({});
</script>

<template>
  <div class="demo-panel">
    <HysSplitPane v-model:sizes="sizes" :panels="panels" lazy>
      <template #panel="{ panel, size }">
        <div class="split-panes-demo-content">
          <strong>{{ panel.label }}</strong>
          <span>{{ Math.round(size) }} px</span>
          <p v-if="panel.id === 'files'">index.vue</p>
          <HysTextarea v-if="panel.id === 'editor'" label="内容" :rows="4" placeholder="输入正文" />
        </div>
      </template>
    </HysSplitPane>
  </div>
</template>

<style scoped>
.split-panes-demo-content {
  display: grid;
  gap: 8px;
  padding: 12px;
}
</style>
