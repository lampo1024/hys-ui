<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysShortcutHelp, type HysShortcut } from "hys-ui";

const mac = ref(false);
const shortcuts: HysShortcut[] = [
  {
    group: "工作区",
    keys: "Ctrl + K",
    macKeys: "⌘ K",
    description: "搜索命令",
  },
  { group: "工作区", keys: "Esc", description: "关闭浮层" },
  { group: "编辑", keys: "Ctrl + S", macKeys: "⌘ S", description: "保存草稿" },
  { group: "编辑", keys: "Ctrl + Z", macKeys: "⌘ Z", description: "撤销修改" },
];
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="mac" label="显示 macOS 快捷键" />
    <HysShortcutHelp
      :shortcuts="shortcuts"
      :platform="mac ? 'mac' : 'default'"
      searchable
    />
  </div>
</template>
