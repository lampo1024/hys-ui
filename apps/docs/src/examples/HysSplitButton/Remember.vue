<script setup lang="ts">
import { ref } from "vue";
import { HysSplitButton } from "hys-ui";
const last = ref("");
const actions = [{type:"group", label:"导出格式", children:[{key:"csv",label:"导出 CSV"}, {key:"json",label:"导出 JSON"}]}] as const;
</script>

<template>
  <div class="demo-stack">
    <HysSplitButton label="导出文件" :items="actions" remember-selection default-primary-key="csv"
      shortcut="Alt+S" menu-label="更多导出格式" @primary="last = String($event)" @select="last = String($event)" />
    <p role="status">{{ last ? "当前操作 · " + last.toUpperCase() : "请选择导出格式" }}</p>
  </div>
</template>
