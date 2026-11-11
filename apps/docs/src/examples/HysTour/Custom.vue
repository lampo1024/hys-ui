<script setup lang="ts">
import { h, ref } from "vue";
import { HysButton, HysTour, type HysTourStep } from "hys-ui";

const open = ref(false);
const current = ref(0);
const layer = ref<HTMLDivElement>();
const steps: HysTourStep[] = [
  {
    title: () => h("strong", "管理团队权限"),
    description: "只读成员可以查看项目记录。",
    nextButtonProps: { children: "查看可编辑权限" },
  },
  {
    title: "编辑权限",
    description: "编辑者可以修改项目设置和成员权限。",
    nextButtonProps: { children: "了解了" },
  },
];
</script>

<template>
  <div id="tour-custom-layer" ref="layer" class="demo-panel">
    <HysButton @click="current = 0; open = true">查看权限说明</HysButton>
    <HysTour
      v-if="layer"
      v-model="open"
      v-model:current="current"
      :append-to="layer"
      :steps="steps"
      :target-area-clickable="false"
    >
      <template #cover="{ current }">
        <span class="tour-example-permission">{{ current === 0 ? '只读成员' : '编辑者' }}</span>
      </template>
      <template #indicators="{ current, total }">第 {{ current + 1 }} 步，共 {{ total }} 步</template>
    </HysTour>
  </div>
</template>

<style scoped>
.tour-example-permission {
  display: block;
  border-radius: 8px;
  padding: 12px;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
</style>
