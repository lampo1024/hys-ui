<script setup lang="ts">
import { ref } from "vue";
import { HysCommandPalette, type HysCommandAction } from "hys-ui";

const chosen = ref("");
const actions: HysCommandAction[] = [
  {
    id: "files",
    label: "查看项目文件",
    description: "工作区",
    keywords: ["附件", "files"],
  },
  {
    id: "invite",
    label: "邀请成员",
    description: "需要管理员权限",
    disabled: true,
  },
  {
    id: "report",
    label: "打开周报",
    description: "项目进度",
    keywords: ["report"],
  },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCommandPalette
        :actions="actions"
        :hotkey="false"
        placeholder="试搜「附件」"
        @select="
          chosen = actions.find((action) => action.id === $event)?.label ?? ''
        "
      />
    </div>
    <output v-if="chosen" class="state-output" aria-live="polite"
      >已执行 {{ chosen }}</output
    >
  </div>
</template>
