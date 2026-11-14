<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysShortcutHelp, type HysShortcut } from "hys-ui";
const mac = ref(false);
const shortcuts: HysShortcut[] = [
  {
    keys: "Ctrl+K Ctrl+C",
    description: "注释选区",
    group: "编辑",
    sequence: [
      ["Ctrl", "K"],
      ["Ctrl", "C"],
    ],
    macSequence: [
      ["⌘", "K"],
      ["⌘", "C"],
    ],
  },
  {
    keys: "Ctrl+Shift+F",
    description: "全局查找",
    group: "搜索",
    sequence: [["Ctrl", "Shift", "F"]],
    macSequence: [["⌘", "Shift", "F"]],
  },
];
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="mac" label="显示 macOS 按键" />
    <HysShortcutHelp
      :shortcuts="shortcuts"
      :platform="mac ? 'mac' : 'default'"
      searchable
    />
  </div>
</template>
