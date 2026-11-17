<script setup lang="ts">
import { ref } from "vue";
import { HysMenu, type HysMenuItem, type HysMenuKey } from "hys-ui";
import { FileText, Settings2 } from "hys-ui/icons";
const selected = ref<readonly HysMenuKey[]>(["overview"]);
const items: HysMenuItem[] = [
  { type: "group", label: "工作区" },
  { key: "overview", label: "项目概况", icon: FileText },
  { key: "files", label: "项目资料", icon: FileText },
  { type: "divider" },
  { key: "settings", label: "设置", icon: Settings2, disabled: true },
  { key: "guide", label: "查看 HysCard 文档", href: "../components/hys-card" },
];
</script>
<template>
  <div class="demo-stack">
    <HysMenu
      v-model:selected-keys="selected"
      :items="items"
      aria-label="项目导航"
      style="max-width: 278px"
    />
    <p class="scenario-note">
      当前页面：{{
        selected[0] === "overview"
          ? "项目概况"
          : selected[0] === "files"
            ? "项目资料"
            : "组件文档"
      }}
    </p>
  </div>
</template>
