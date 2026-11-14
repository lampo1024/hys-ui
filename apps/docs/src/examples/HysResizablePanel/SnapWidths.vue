<script setup lang="ts">
import { ref } from "vue";
import { HysResizablePanel } from "hys-ui";

const width = ref(240);
</script>

<template>
  <div class="demo-stack">
    <HysResizablePanel
      v-model="width"
      :min-width="160"
      :max-width="440"
      :snap="[180, 240, 320, 400]"
      :reset-width="240"
    >
      <template #default="{ width: current }">
        <div class="snap-preview">
          <strong>文件预览</strong>
          <span>{{ current }} px</span>
        </div>
      </template>
    </HysResizablePanel>
    <p class="snap-hint">
      拖动边缘试用吸附宽度。双击手柄，或按 Enter，恢复到 240 px。
    </p>
  </div>
</template>

<style scoped>
.snap-preview {
  display: grid;
  align-content: center;
  gap: 4px;
  min-height: 90px;
  padding: 12px 20px;
}
.snap-preview span,
.snap-hint {
  margin: 0;
  color: var(--docs-muted);
  font-size: 13px;
}
</style>
