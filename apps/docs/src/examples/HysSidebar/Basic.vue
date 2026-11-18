<script setup lang="ts">
import { ref } from "vue";
import { HysSidebar, type HysMenuItem } from "hys-ui";
import { Folder, Check } from "hys-ui/icons";
const collapsed = ref(false);
const selected = ref<readonly (string | number)[]>(["待处理"]);
const items: HysMenuItem[] = [{ key: "任务", label: "项目任务", icon: Folder, children: [{ key: "待处理", label: "待处理", badge: 3 }, { key: "已完成", label: "已完成" }] }, { key: "验收", label: "验收记录", icon: Check }];
</script>

<template>
  <div class="demo-stack">
    <HysSidebar v-model:collapsed="collapsed" v-model:selected-keys="selected" :items="items" title="交付工作区">
      <template #footer="{ collapsed: narrow }"><span v-if="!narrow">运营工作区</span></template>
    </HysSidebar>
    <p aria-live="polite">当前菜单 {{ selected[0] }}</p>
  </div>
</template>
