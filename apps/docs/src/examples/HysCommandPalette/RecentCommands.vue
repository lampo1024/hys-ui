<script setup lang="ts">
import { ref } from "vue";
import { HysCommandPalette, type HysCommandAction } from "hys-ui";
const actions: HysCommandAction[] = [
  { id: "project", label: "打开项目概览" },
  { id: "notes", label: "打开交接记录" },
  { id: "queue", label: "查看待办队列" },
];
const recent = ref<string[]>([]);
const picked = ref("");
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCommandPalette
        v-model:recent="recent"
        :actions="actions"
        :recent-limit="2"
        :hotkey="false"
        @select="
          picked = actions.find((action) => action.id === $event)?.label ?? ''
        "
      />
    </div>
    <output v-if="picked" class="state-output" aria-live="polite"
      >最近执行 {{ picked }}。重新打开命令面板可查看顺序。</output
    >
  </div>
</template>
